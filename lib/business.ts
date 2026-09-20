import { query } from "@/lib/db";

export type Business = {
  id: string;
  name: string;
  slug: string;
  booking_url: string | null;
  default_interval_months: number;
};

export async function getBusiness(): Promise<Business> {
  const slug = process.env.BUSINESS_SLUG || "demo-heat-pumps";
  const result = await query<Business>(
    `SELECT id, name, slug, booking_url, default_interval_months
     FROM businesses WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  if (!result.rows[0]) {
    throw new Error(`Business '${slug}' not found. Run npm run db:seed or create the business first.`);
  }
  return result.rows[0];
}
