import { getBusiness } from "@/lib/business";
import { query } from "@/lib/db";
import { money } from "@/lib/format";
export default async function ServicesPage(){
  const business=await getBusiness();
  const services=await query<{id:string;name:string;default_interval_months:number;default_value_cents:number;customers:string}>(`SELECT v.id,v.name,v.default_interval_months,v.default_value_cents,COUNT(s.id)::text AS customers FROM services v LEFT JOIN service_subscriptions s ON s.service_id=v.id WHERE v.business_id=$1 GROUP BY v.id ORDER BY v.name`,[business.id]);
  return <><div className="eyebrow">Repeat rules</div><h1>Services</h1><p className="subtle">Each service defines the normal return interval and estimated value used by the recovery engine.</p><div className="panel"><table><thead><tr><th>Service</th><th>Interval</th><th>Estimated value</th><th>Customers</th></tr></thead><tbody>{services.rows.map(s=><tr key={s.id}><td>{s.name}</td><td>{s.default_interval_months} months</td><td>{money(s.default_value_cents)}</td><td>{s.customers}</td></tr>)}</tbody></table></div></>;
}
