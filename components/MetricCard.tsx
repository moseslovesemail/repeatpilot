export function MetricCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className="metric-card"><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{note && <div className="metric-note">{note}</div>}</div>;
}
