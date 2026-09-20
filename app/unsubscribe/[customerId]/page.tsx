import { validCustomerToken } from "@/lib/token";
import { query } from "@/lib/db";

export default async function UnsubscribePage({ params, searchParams }: { params: Promise<{customerId:string}>; searchParams: Promise<{token?:string}> }) {
  const { customerId } = await params;
  const { token = "" } = await searchParams;
  const valid = validCustomerToken(customerId, token);
  if (valid) await query(`UPDATE customers SET email_opt_out=TRUE, updated_at=NOW() WHERE id=$1`, [customerId]);
  return <div className="login"><div className="login-card"><div className="wordmark">RepeatPilot</div><h1>{valid ? "Email reminders stopped" : "Invalid unsubscribe link"}</h1><p className="subtle">{valid ? "This address will no longer receive RepeatPilot reminder emails for this business." : "The link could not be verified."}</p></div></div>;
}
