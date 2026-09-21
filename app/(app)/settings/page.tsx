import { getBusiness } from "@/lib/business";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const b = await getBusiness();
  const params = await searchParams;
  return <>
    <div className="eyebrow">Business</div>
    <h1>Settings</h1>
    <p className="subtle">Configure the minimum details RepeatPilot needs to calculate return dates and send customers back to your normal booking flow.</p>
    {params.saved && <div className="notice">Settings saved.</div>}
    {params.error && <div className="notice">Could not save those settings. Check the values and try again.</div>}
    <form className="stack" action="/api/settings" method="post">
      <div className="field"><label>Business name</label><input name="name" defaultValue={b.name} required /></div>
      <div className="field"><label>Booking URL</label><input name="booking_url" type="url" defaultValue={b.booking_url || ""} placeholder="https://yourbusiness.co.nz/book" /></div>
      <div className="field"><label>Default return interval</label><input name="default_interval_months" type="number" min="1" max="120" defaultValue={b.default_interval_months} required /></div>
      <button className="button" type="submit">Save settings</button>
      <p className="help">Changing the default interval affects future imports and new services. Existing customer due dates are not rewritten automatically.</p>
    </form>
  </>;
}
