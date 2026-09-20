import { NextResponse } from "next/server";
import { getBusiness } from "@/lib/business";
import { query } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url), 303);
  const business = await getBusiness();
  const form = await request.formData();
  const subscriptionId = String(form.get("subscription_id") || "");
  const sub = await query<{customer_id:string;estimated_value_cents:number}>(`SELECT customer_id, estimated_value_cents FROM service_subscriptions WHERE id=$1 AND business_id=$2`, [subscriptionId, business.id]);
  if (!sub.rows[0]) return new NextResponse("Not found", { status:404 });
  await query(`INSERT INTO bookings (business_id, subscription_id, customer_id, value_cents, source) VALUES ($1,$2,$3,$4,'MANUAL')`, [business.id, subscriptionId, sub.rows[0].customer_id, sub.rows[0].estimated_value_cents]);
  return NextResponse.redirect(new URL("/customers", request.url), 303);
}
