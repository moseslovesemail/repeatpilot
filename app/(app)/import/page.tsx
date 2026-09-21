import { getBusiness } from "@/lib/business";
import { query } from "@/lib/db";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ imported?: string; failed?: string }> }) {
  const business = await getBusiness();
  const params = await searchParams;
  const recent = await query<{
    id: string;
    filename: string | null;
    rows_total: number;
    rows_imported: number;
    rows_failed: number;
    created_at: string;
  }>(`
    SELECT id, filename, rows_total, rows_imported, rows_failed, created_at::text
    FROM import_jobs
    WHERE business_id=$1
    ORDER BY created_at DESC
    LIMIT 5
  `, [business.id]);

  return <>
    <div className="eyebrow">Onboarding</div>
    <h1>Import customers</h1>
    <p className="subtle">Upload historic service data. RepeatPilot calculates the next due date and turns the existing customer list into a repeat-revenue schedule.</p>

    {(params.imported || params.failed) && <div className="notice">
      <strong>{Number(params.imported || 0)} rows imported.</strong>
      {Number(params.failed || 0) > 0 && <> {Number(params.failed)} rows could not be imported.</>}
    </div>}

    <div className="notice"><strong>Pilot safeguard:</strong> use synthetic/test data until persistent PostgreSQL storage has been confirmed in Railway. Do not upload a real customer database to temporary storage.</div>

    <div className="stack">
      <div className="notice"><strong>Recommended columns:</strong> Customer, Email, Service, Last Serviced, Interval Months, Service Value. Common variants such as Client, Job Type, Completed Date and Email Address are recognised automatically.</div>
      <form className="stack" action="/api/import" method="post" encType="multipart/form-data">
        <div className="field"><label>CSV file</label><input name="file" type="file" accept=".csv,text/csv" required /></div>
        <button className="button" type="submit">Import and calculate due dates</button>
      </form>
    </div>

    {recent.rows.length > 0 && <div className="panel">
      <div className="panel-head"><h2>Recent imports</h2></div>
      <table>
        <thead><tr><th>File</th><th>Rows</th><th>Imported</th><th>Failed</th></tr></thead>
        <tbody>{recent.rows.map(job => <tr key={job.id}>
          <td>{job.filename || "CSV import"}</td>
          <td>{job.rows_total}</td>
          <td>{job.rows_imported}</td>
          <td>{job.rows_failed}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </>;
}
