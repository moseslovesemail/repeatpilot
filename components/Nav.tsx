import Link from "next/link";

export function Nav({ businessName }: { businessName: string }) {
  return (
    <aside className="sidebar">
      <div>
        <div className="wordmark">RepeatPilot</div>
        <div className="business-name">{businessName}</div>
      </div>
      <nav>
        <Link href="/">Dashboard</Link>
        <Link href="/customers">Customers</Link>
        <Link href="/import">Import</Link>
        <Link href="/campaigns">Campaigns</Link>
        <Link href="/services">Services</Link>
        <Link href="/settings">Settings</Link>
      </nav>
      <form action="/api/logout" method="post"><button className="link-button">Sign out</button></form>
    </aside>
  );
}
