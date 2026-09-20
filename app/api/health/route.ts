import { query } from "@/lib/db";
export async function GET(){ try{ await query("SELECT 1"); return Response.json({ok:true}); }catch{ return Response.json({ok:false},{status:503}); } }
