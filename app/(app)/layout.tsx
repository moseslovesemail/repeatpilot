import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getBusiness } from "@/lib/business";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/login");
  const business = await getBusiness();
  return <div className="shell"><Nav businessName={business.name} /><main>{children}</main></div>;
}
