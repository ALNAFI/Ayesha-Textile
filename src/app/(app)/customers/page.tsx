import type { Metadata } from "next";
import { CustomersView } from "@/components/customers/CustomersView";
import { getCustomersSnapshot } from "@/lib/customers/summary";

export const metadata: Metadata = {
  title: "Customers",
};

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const snapshot = await getCustomersSnapshot(false);

  return <CustomersView initialData={snapshot} />;
}
