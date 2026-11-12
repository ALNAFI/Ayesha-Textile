import type { Metadata } from "next";
import packageInfo from "../../../../package.json";
import { SettingsView } from "@/components/settings/SettingsView";
import { formatRefreshTime } from "@/lib/dashboard/format";
import { getDriveHealth } from "@/lib/settings/drive-health";

export const metadata: Metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const health = await getDriveHealth(false);
  const version =
    typeof packageInfo.version === "string" && packageInfo.version.trim()
      ? packageInfo.version.trim()
      : null;

  return (
    <SettingsView
      initialHealth={health}
      initialSyncedLabel={
        health.lastSyncedAt ? formatRefreshTime(health.lastSyncedAt) : null
      }
      version={version}
    />
  );
}
