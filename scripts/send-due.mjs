import pg from "pg";
import crypto from "node:crypto";
const {Pool}=pg;
if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:false}:undefined});
const slug=process.env.BUSINESS_SLUG||"demo-heat-pumps";
const {rows:businesses}=await pool.query(`SELECT id,name,booking_url FROM businesses WHERE slug=$1`,[slug]);
if(!businesses[0]) throw new Error(`Business ${slug} not found`);
const business=businesses[0];
const {rows}=await pool.query(`
 SELECT s.id AS subscription_id,c.id AS customer_id,c.full_name,c.email,v.name AS service_name,s.next_due_at::text
 FROM service_subscriptions s JOIN customers c ON c.id=s.customer_id JOIN services v ON v.id=s.service_id
 WHERE s.business_id=$1 AND s.status='ACTIVE' AND c.email IS NOT NULL AND c.email_opt_out=FALSE
 AND s.next_due_at BETWEEN CURRENT_DATE + INTERVAL '27 days' AND CURRENT_DATE + INTERVAL '33 days'
 AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.subscription_id=s.id AND m.template_key='due_30' AND m.created_at >= NOW()-INTERVAL '45 days')
 LIMIT 500`,[business.id]);
for(const row of rows){
  const redirect=`${process.env.APP_BASE_URL}/r/${row.subscription_id}`;
  const unsubscribeToken=crypto.createHmac("sha256",process.env.SESSION_SECRET||"dev-secret").update(`customer:${row.customer_id}`).digest("hex");
  const unsubscribe=`${process.env.APP_BASE_URL}/unsubscribe/${row.customer_id}?token=${unsubscribeToken}`;
  const subject=`Your ${row.service_name} is due next month`;
  const html=`<p>Hi ${row.full_name.split(" ")[0]},</p><p>Your ${row.service_name.toLowerCase()} is due next month.</p><p><a href="${redirect}">Book your service</a></p><p>${business.name}</p><p style="font-size:12px;color:#777"><a href="${unsubscribe}">Stop these reminders</a></p>`;
  let status="SENT",provider=null,error=null;
  if(process.env.RESEND_API_KEY && process.env.FROM_EMAIL){
    try{ const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.FROM_EMAIL,to:[row.email],subject,html})}); const data=await res.json(); if(!res.ok) throw new Error(JSON.stringify(data)); provider=data.id||null; }
    catch(e){ status="FAILED"; error=e instanceof Error?e.message:String(e); }
  } else { status="QUEUED"; console.log(`[DRY RUN] ${row.email}: ${subject}`); }
  await pool.query(`INSERT INTO messages(business_id,subscription_id,customer_id,template_key,sent_at,provider_message_id,status,error_text) VALUES($1,$2,$3,'due_30',CASE WHEN $4='SENT' THEN NOW() ELSE NULL END,$5,$4,$6)`,[business.id,row.subscription_id,row.customer_id,status,provider,error]);
}
console.log(`Processed ${rows.length} customers. ${process.env.RESEND_API_KEY?"Live send enabled.":"Dry run only; add RESEND_API_KEY + FROM_EMAIL to send."}`);
await pool.end();
