import { query } from "@/lib/db";

export type DashboardStats = {
  overdue: number;
  due30: number;
  contacted30: number;
  booked30: number;
  recoveredCents30: number;
  opportunityCents: number;
};

export async function getDashboardStats(businessId: string): Promise<DashboardStats> {
  const result = await query<{
    overdue: string;
    due30: string;
    contacted30: string;
    booked30: string;
    recovered_cents30: string;
    opportunity_cents: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM service_subscriptions s
        WHERE s.business_id=$1 AND s.status='ACTIVE' AND s.next_due_at < CURRENT_DATE)::text AS overdue,
      (SELECT COUNT(*) FROM service_subscriptions s
        WHERE s.business_id=$1 AND s.status='ACTIVE' AND s.next_due_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')::text AS due30,
      (SELECT COUNT(DISTINCT m.customer_id) FROM messages m
        WHERE m.business_id=$1 AND m.sent_at >= NOW() - INTERVAL '30 days')::text AS contacted30,
      (SELECT COUNT(*) FROM bookings b
        WHERE b.business_id=$1 AND b.booked_at >= NOW() - INTERVAL '30 days')::text AS booked30,
      (SELECT COALESCE(SUM(b.value_cents),0) FROM bookings b
        WHERE b.business_id=$1 AND b.booked_at >= NOW() - INTERVAL '30 days')::text AS recovered_cents30,
      (SELECT COALESCE(SUM(s.estimated_value_cents),0) FROM service_subscriptions s
        WHERE s.business_id=$1 AND s.status='ACTIVE' AND s.next_due_at <= CURRENT_DATE + INTERVAL '90 days')::text AS opportunity_cents
  `, [businessId]);
  const r = result.rows[0];
  return {
    overdue: Number(r.overdue),
    due30: Number(r.due30),
    contacted30: Number(r.contacted30),
    booked30: Number(r.booked30),
    recoveredCents30: Number(r.recovered_cents30),
    opportunityCents: Number(r.opportunity_cents)
  };
}
