import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { getBusiness } from "@/lib/business";
import { isAuthenticated } from "@/lib/auth";
import { withTransaction } from "@/lib/db";
import { addMonths, parseLooseDate, toIsoDate } from "@/lib/date";

const aliases: Record<string,string[]> = {
  name:["customer","customer_name","name","client","client_name"],
  email:["email","email_address","customer_email"],
  phone:["phone","mobile","telephone"],
  service:["service","service_type","job_type","work_type"],
  last:["last_serviced","last_service","last_service_date","completed_date","completion_date","service_date","date"],
  interval:["interval_months","interval","repeat_months","service_interval_months"],
  value:["service_value","value","price","estimated_value","amount"]
};
function key(s:string){return s.trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");}
function pick(row:Record<string,string>, field:string){ for(const a of aliases[field]) if(row[a] != null && String(row[a]).trim()!=="") return String(row[a]).trim(); return ""; }

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url), 303);
  const business = await getBusiness();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return new NextResponse("CSV file required", {status:400});
  const text = await file.text();
  const rawRows = parse(text, { columns:true, skip_empty_lines:true, trim:true, bom:true }) as Record<string,string>[];
  const rows = rawRows.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [key(k), String(v ?? "")])));
  let imported=0, failed=0; const errors:string[]=[];
  await withTransaction(async client => {
    for (let i=0;i<rows.length;i++) {
      try {
        const row=rows[i]; const name=pick(row,"name"); const serviceName=pick(row,"service"); const lastRaw=pick(row,"last");
        if(!name || !serviceName || !lastRaw) throw new Error("Customer, Service and Last Serviced are required");
        const email=pick(row,"email") || null; const phone=pick(row,"phone") || null;
        const identityRef = email ? `email:${email.toLowerCase()}` : phone ? `phone:${phone.replace(/\D/g, "")}` : `name:${key(name)}`;
        const last=parseLooseDate(lastRaw); const interval=Math.max(1, Number(pick(row,"interval") || business.default_interval_months || 12));
        const moneyRaw=pick(row,"value").replace(/[^0-9.\-]/g,""); const cents=moneyRaw ? Math.max(0, Math.round(Number(moneyRaw)*100)) : 0;
        const service = await client.query<{id:string}>(`INSERT INTO services (business_id,name,default_interval_months,default_value_cents) VALUES ($1,$2,$3,$4) ON CONFLICT (business_id,name) DO UPDATE SET default_interval_months=EXCLUDED.default_interval_months, default_value_cents=CASE WHEN EXCLUDED.default_value_cents > 0 THEN EXCLUDED.default_value_cents ELSE services.default_value_cents END, updated_at=NOW() RETURNING id`, [business.id,serviceName,interval,cents]);
        const customer = await client.query<{id:string}>(`INSERT INTO customers (business_id,external_ref,full_name,email,phone) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (business_id,external_ref) DO UPDATE SET full_name=EXCLUDED.full_name,email=COALESCE(EXCLUDED.email,customers.email),phone=COALESCE(EXCLUDED.phone,customers.phone),updated_at=NOW() RETURNING id`, [business.id,identityRef,name,email,phone]);
        await client.query(`INSERT INTO service_subscriptions (business_id,customer_id,service_id,last_service_at,interval_months,next_due_at,estimated_value_cents) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (customer_id,service_id) DO UPDATE SET last_service_at=EXCLUDED.last_service_at,interval_months=EXCLUDED.interval_months,next_due_at=EXCLUDED.next_due_at,estimated_value_cents=EXCLUDED.estimated_value_cents,updated_at=NOW()`, [business.id,customer.rows[0].id,service.rows[0].id,toIsoDate(last),interval,toIsoDate(addMonths(last,interval)),cents]);
        imported++;
      } catch (e) { failed++; if(errors.length<8) errors.push(`Row ${i+2}: ${e instanceof Error ? e.message : "Import failed"}`); }
    }
    await client.query(`INSERT INTO import_jobs (business_id,filename,rows_total,rows_imported,rows_failed,error_summary) VALUES ($1,$2,$3,$4,$5,$6)`, [business.id,file.name,rows.length,imported,failed,errors.join("\n") || null]);
  });
  return NextResponse.redirect(new URL(`/customers?imported=${imported}&failed=${failed}`, request.url),303);
}
