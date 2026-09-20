import { NextResponse } from "next/server";
import { query } from "@/lib/db";
export async function GET(request:Request,{params}:{params:Promise<{subscriptionId:string}>}){
  const {subscriptionId}=await params;
  const result=await query<{booking_url:string|null}>(`SELECT b.booking_url FROM service_subscriptions s JOIN businesses b ON b.id=s.business_id WHERE s.id=$1`,[subscriptionId]);
  await query(`UPDATE messages SET clicked_at=COALESCE(clicked_at,NOW()),status='CLICKED' WHERE id=(SELECT id FROM messages WHERE subscription_id=$1 ORDER BY created_at DESC LIMIT 1)`,[subscriptionId]);
  const url=result.rows[0]?.booking_url || process.env.APP_BASE_URL || new URL(request.url).origin;
  return NextResponse.redirect(url,302);
}
