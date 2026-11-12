import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Account, theme preferences beyond the header toggle, and Drive connection details will be configured here later."
    />
  );
}
