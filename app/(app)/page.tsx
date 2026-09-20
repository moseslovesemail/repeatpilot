import { getBusiness } from "@/lib/business";
import { getDashboardStats } from "@/lib/stats";
import { query } from "@/lib/db";
import { money, dateNZ } from "@/lib/format";
import { MetricCard } from "@/components/MetricCard";

export default async function Dashboard() {
  const business = await getBusiness();
  const stats = await getDashboardStats(business.id);
  const due = await query<{ id:string; full_name:string; service_name:string; next_due_at:string; estimated_value_cents:number; days_until:number }>(`
    SELECT s.id, c.full_name, v.name AS service_name, s.next_due_at::text,
           s.estimated_value_cents,
           (s.next_due_at - CURRENT_DATE) AS days_until
    FROM service_subscriptions s
    JOIN customers c ON c.id=s.customer_id
    JOIN services v ON v.id=s.service_id
    WHERE s.business_id=$1 AND s.status='ACTIVE'
    ORDER BY s.next_due_at ASC
    LIMIT 12`, [business.id]);

  return <>
    <div className="eyebrow">Repeat revenue</div>
    <h1>{money(stats.recoveredCents30)} recovered</h1>
    <p className="subtle">Customers who are due, contacted and booked back in. Values are estimated until an invoice integration is connected.</p>
    <div className="metrics">
      <MetricCard label="Overdue" value={stats.overdue} note="Past their next service date" />
      <MetricCard label="Due next 30 days" value={stats.due30} />
      <MetricCard label="Contacted" value={stats.contacted30} note="Last 30 days" />
      <MetricCard label="Booked back" value={stats.booked30} note="Last 30 days" />
      <MetricCard label="90-day opportunity" value={money(stats.opportunityCents)} />
    </div>
    <div className="panel"><div className="panel-head"><h2>Next customers to recover</h2><a className="button secondary" href="/customers">View all</a></div>
      <table><thead><tr><th>Customer</th><th>Service</th><th>Due</th><th>Status</th><th>Value</th></tr></thead><tbody>
        {due.rows.map(row => <tr key={row.id}><td>{row.full_name}</td><td>{row.service_name}</td><td>{dateNZ(row.next_due_at)}</td><td><span className={`status ${row.days_until < 0 ? "overdue" : ""}`}>{row.days_until < 0 ? `${Math.abs(row.days_until)}d overdue` : `${row.days_until}d`}</span></td><td>{money(row.estimated_value_cents)}</td></tr>)}
      </tbody></table>
    </div>
  </>;
}
