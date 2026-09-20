import crypto from "crypto";

export function customerToken(customerId: string) {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(`customer:${customerId}`).digest("hex");
}

export function validCustomerToken(customerId: string, token: string) {
  const expected = customerToken(customerId);
  if (!token || token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
