export default function ImportPage() {
  return <>
    <div className="eyebrow">Onboarding</div><h1>Import customers</h1>
    <p className="subtle">Upload a CSV. RepeatPilot recognises common customer, service and date column names automatically.</p>
    <div className="stack">
      <div className="notice"><strong>Recommended columns:</strong> Customer, Email, Service, Last Serviced, Interval Months, Service Value. Dates can be DD/MM/YYYY, ISO, or readable dates such as 12 Oct 2025.</div>
      <form className="stack" action="/api/import" method="post" encType="multipart/form-data">
        <div className="field"><label>CSV file</label><input name="file" type="file" accept=".csv,text/csv" required /></div>
        <button className="button" type="submit">Import and calculate due dates</button>
      </form>
    </div>
  </>;
}
