import { getBusiness } from "@/lib/business";
import { query } from "@/lib/db";
import { dateNZ, money } from "@/lib/format";

export default async function CustomersPage() {
  const business = await getBusiness();
  const result = await query<{subscription_id:string;full_name:string;email:string|null;service_name:string;last_service_at:string;next_due_at:string;estimated_value_cents:number;days_until:number;booked:boolean}>(`
    SELECT s.id AS subscription_id, c.full_name, c.email, v.name AS service_name,
      s.last_service_at::text, s.next_due_at::text, s.estimated_value_cents,
      (s.next_due_at-CURRENT_DATE) AS days_until,
      EXISTS(SELECT 1 FROM bookings b WHERE b.subscription_id=s.id AND b.booked_at >= s.next_due_at - INTERVAL '90 days') AS booked
    FROM service_subscriptions s
    JOIN customers c ON c.id=s.customer_id
    JOIN services v ON v.id=s.service_id
    WHERE s.business_id=$1 AND s.status='ACTIVE'
    ORDER BY s.next_due_at ASC LIMIT 250`, [business.id]);
  return <>
    <div className="eyebrow">Customer return schedule</div><h1>Customers</h1>
    <p className="subtle">The active repeat-service cycles currently being managed by RepeatPilot.</p>
    <div className="panel"><table><thead><tr><th>Customer</th><th>Service</th><th>Last service</th><th>Next due</th><th>Status</th><th>Value</th><th></th></tr></thead><tbody>
      {result.rows.map(r => <tr key={r.subscription_id}><td><strong>{r.full_name}</strong><br/><span className="help">{r.email || "No email"}</span></td><td>{r.service_name}</td><td>{dateNZ(r.last_service_at)}</td><td>{dateNZ(r.next_due_at)}</td><td><span className={`status ${r.booked ? "booked" : r.days_until<0 ? "overdue":""}`}>{r.booked ? "Booked" : r.days_until<0 ? "Overdue" : "Upcoming"}</span></td><td>{money(r.estimated_value_cents)}</td><td>{!r.booked && <form action="/api/bookings" method="post"><input type="hidden" name="subscription_id" value={r.subscription_id}/><button className="button secondary" type="submit">Mark booked</button></form>}</td></tr>)}
    </tbody></table></div>
  </>;
}
