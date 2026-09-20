import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "rp_session";

function expectedToken() {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  const password = process.env.ADMIN_PASSWORD || "dev-password";
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

export async function isAuthenticated() {
  const store = await cookies();
  const actual = store.get(COOKIE)?.value;
  const expected = expectedToken();
  if (!actual || actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export function sessionToken() {
  return expectedToken();
}

export const sessionCookieName = COOKIE;
