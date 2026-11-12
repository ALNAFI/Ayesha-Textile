import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDashboardSnapshot } from "@/lib/dashboard/snapshot";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initialData = await getDashboardSnapshot(false);
  return <DashboardView initialData={initialData} />;
}
