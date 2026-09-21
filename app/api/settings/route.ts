import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getBusiness } from "@/lib/business";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url), 303);

  const business = await getBusiness();
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const bookingUrl = String(form.get("booking_url") || "").trim();
  const interval = Number(form.get("default_interval_months") || 12);

  if (!name || !Number.isInteger(interval) || interval < 1 || interval > 120) {
    return NextResponse.redirect(new URL("/settings?error=1", request.url), 303);
  }

  if (bookingUrl) {
    try {
      const parsed = new URL(bookingUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
    } catch {
      return NextResponse.redirect(new URL("/settings?error=1", request.url), 303);
    }
  }

  await query(
    `UPDATE businesses
     SET name=$1, booking_url=$2, default_interval_months=$3, updated_at=NOW()
     WHERE id=$4`,
    [name, bookingUrl || null, interval, business.id]
  );

  return NextResponse.redirect(new URL("/settings?saved=1", request.url), 303);
}
