import type { Metadata } from "next";
import { CustomersView } from "@/components/customers/CustomersView";

export const metadata: Metadata = {
  title: "Customers",
};

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return <CustomersView />;
}
