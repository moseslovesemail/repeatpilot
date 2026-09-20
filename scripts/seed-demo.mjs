import pg from "pg";
const { Pool }=pg;
if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="require"?{rejectUnauthorized:false}:undefined});
await pool.query(`INSERT INTO businesses(name,slug,booking_url,default_interval_months) VALUES ('Demo Heat Pumps','demo-heat-pumps','https://example.com/book',12) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`);
const {rows:[business]}=await pool.query(`SELECT id FROM businesses WHERE slug='demo-heat-pumps'`);
const {rows:[service]}=await pool.query(`INSERT INTO services(business_id,name,default_interval_months,default_value_cents) VALUES ($1,'Annual Heat Pump Service',12,24900) ON CONFLICT(business_id,name) DO UPDATE SET default_value_cents=EXCLUDED.default_value_cents RETURNING id`,[business.id]);
let seed=918273; const rand=()=>{seed=(seed*48271)%2147483647;return seed/2147483647};
const first=["Jane","John","Sarah","Michael","Aroha","Wiremu","Olivia","Liam","Emma","Noah","Mia","Jack","Sophie","Lucas","Charlotte","Theo"];
const last=["Smith","Brown","Wilson","Taylor","Williams","Ngata","Rangi","Thompson","Anderson","Martin","King","Lee","Walker","Harris","Clark","Roberts"];
for(let i=1;i<=1000;i++){
  const name=`${first[Math.floor(rand()*first.length)]} ${last[Math.floor(rand()*last.length)]}`;
  const email=`demo${i}@example.com`;
  const monthsAgo=Math.floor(rand()*28)+1;
  const lastDate=new Date(); lastDate.setUTCMonth(lastDate.getUTCMonth()-monthsAgo); lastDate.setUTCDate(Math.floor(rand()*26)+1);
  const lastIso=lastDate.toISOString().slice(0,10);
  const nextDate=new Date(lastDate); nextDate.setUTCMonth(nextDate.getUTCMonth()+12); const nextIso=nextDate.toISOString().slice(0,10);
  const {rows:[customer]}=await pool.query(`INSERT INTO customers(business_id,external_ref,full_name,email) VALUES ($1,$2,$3,$4) ON CONFLICT(business_id,external_ref) DO UPDATE SET full_name=EXCLUDED.full_name,email=EXCLUDED.email RETURNING id`,[business.id,`demo-${i}`,name,email]);
  await pool.query(`INSERT INTO service_subscriptions(business_id,customer_id,service_id,last_service_at,interval_months,next_due_at,estimated_value_cents) VALUES($1,$2,$3,$4,12,$5,24900) ON CONFLICT(customer_id,service_id) DO UPDATE SET last_service_at=EXCLUDED.last_service_at,next_due_at=EXCLUDED.next_due_at,estimated_value_cents=EXCLUDED.estimated_value_cents`,[business.id,customer.id,service.id,lastIso,nextIso]);
}
console.log("Seeded 1,000 demo heat-pump customers.");
await pool.end();
