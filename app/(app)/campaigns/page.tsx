import { getBusiness } from "@/lib/business";
import { query } from "@/lib/db";
import { dateNZ, money } from "@/lib/format";

export default async function CampaignsPage() {
  const business = await getBusiness();
  const result = await query<{
    subscription_id: string;
    full_name: string;
    email: string | null;
    service_name: string;
    next_due_at: string;
    estimated_value_cents: number;
  }>(`
    SELECT s.id AS subscription_id, c.full_name, c.email, v.name AS service_name,
           s.next_due_at::text, s.estimated_value_cents
    FROM service_subscriptions s
    JOIN customers c ON c.id=s.customer_id
    JOIN services v ON v.id=s.service_id
    WHERE s.business_id=$1
      AND s.status='ACTIVE'
      AND c.email IS NOT NULL
      AND c.email_opt_out=FALSE
      AND s.next_due_at BETWEEN CURRENT_DATE + INTERVAL '27 days' AND CURRENT_DATE + INTERVAL '33 days'
      AND NOT EXISTS (
        SELECT 1 FROM messages m
        WHERE m.subscription_id=s.id
          AND m.template_key='due_30'
          AND m.created_at >= NOW()-INTERVAL '45 days'
      )
    ORDER BY s.next_due_at ASC
    LIMIT 100
  `, [business.id]);

  const candidateCount = result.rows.length;
  const candidateValue = result.rows.reduce((sum, row) => sum + Number(row.estimated_value_cents), 0);
  const sample = result.rows[0];
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL);

  return <>
    <div className="eyebrow">Customer recall</div>
    <h1>Campaigns</h1>
    <p className="subtle">Preview the next 30-day reminder cohort before any live messages are enabled.</p>

    <div className="metrics">
      <div className="metric-card"><div className="metric-label">Ready for 30-day reminder</div><div className="metric-value">{candidateCount}</div></div>
      <div className="metric-card"><div className="metric-label">Estimated service value</div><div className="metric-value">{money(candidateValue)}</div></div>
      <div className="metric-card"><div className="metric-label">Booking link</div><div className="metric-value">{business.booking_url ? "Ready" : "Missing"}</div></div>
      <div className="metric-card"><div className="metric-label">Email provider</div><div className="metric-value">{emailConfigured ? "Connected" : "Not connected"}</div></div>
      <div className="metric-card"><div className="metric-label">Live sends</div><div className="metric-value">Off</div><div className="metric-note">No scheduled sender service</div></div>
    </div>

    {!business.booking_url && <div className="notice">Add the business booking URL in Settings before contacting customers.</div>}
    {!emailConfigured && <div className="notice">Email sending is not connected yet. Add a verified sender and Resend credentials in Railway before a controlled pilot.</div>}

    <div className="panel">
      <div className="panel-head"><h2>Message preview</h2></div>
      <div style={{padding:"20px"}}>
        {sample ? <>
          <p><strong>To:</strong> {sample.email}</p>
          <p><strong>Subject:</strong> Your {sample.service_name} is due next month</p>
          <div className="notice">
            <p>Hi {sample.full_name.split(" ")[0]},</p>
            <p>Your {sample.service_name.toLowerCase()} is due next month.</p>
            <p><strong>Book your service</strong></p>
            <p>{business.name}</p>
            <p className="help">The live version uses a tracked booking link and includes an unsubscribe link.</p>
          </div>
        </> : <p className="subtle">No customers currently fall inside the 27–33 day reminder window.</p>}
      </div>
    </div>

    <div className="panel">
      <div className="panel-head"><h2>Next reminder cohort</h2></div>
      <table>
        <thead><tr><th>Customer</th><th>Service</th><th>Due</th><th>Value</th></tr></thead>
        <tbody>
          {result.rows.slice(0, 25).map(row => <tr key={row.subscription_id}>
            <td><strong>{row.full_name}</strong><br/><span className="help">{row.email}</span></td>
            <td>{row.service_name}</td>
            <td>{dateNZ(row.next_due_at)}</td>
            <td>{money(Number(row.estimated_value_cents))}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </>;
}
