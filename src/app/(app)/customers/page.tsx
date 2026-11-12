import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersPage() {
  return (
    <PagePlaceholder
      title="Customers"
      description="Customer ledger views will live here once Excel parsing is connected. No customer data is loaded yet."
    />
  );
}
