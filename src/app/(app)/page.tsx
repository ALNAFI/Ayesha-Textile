import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="Overview metrics and sync status will appear here in a later module. Navigation and theming are ready now."
    />
  );
}
