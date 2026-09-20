export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <div className="login"><div className="login-card">
    <div className="wordmark">RepeatPilot</div>
    <h1>Business dashboard</h1>
    <p className="subtle">Sign in to manage customer return schedules and recovered revenue.</p>
    {params.error && <div className="notice">Incorrect password.</div>}
    <form className="stack" action="/api/login" method="post">
      <div className="field"><label>Password</label><input type="password" name="password" required autoFocus /></div>
      <button className="button" type="submit">Sign in</button>
    </form>
  </div></div>;
}
