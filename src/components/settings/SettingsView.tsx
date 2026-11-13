"use client";

import { useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { formatRefreshTime } from "@/lib/dashboard/format";
import { fullResync } from "@/hooks/use-synced-data";
import type { DriveHealth } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

type SettingsViewProps = {
  initialHealth: DriveHealth;
  initialSyncedLabel: string | null;
  version: string | null;
};

const STATUS_LABEL = {
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Connection Error",
} as const;

export function SettingsView({
  initialHealth,
  initialSyncedLabel,
  version,
}: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const activeTheme = mounted && theme === "dark" ? "dark" : mounted ? "light" : null;
  const [health, setHealth] = useState(initialHealth);
  const [syncedLabel, setSyncedLabel] = useState(initialSyncedLabel);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkNote, setCheckNote] = useState<string | null>(null);
  const [refreshNote, setRefreshNote] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  function applyHealth(next: DriveHealth) {
    setHealth(next);
    setSyncedLabel(next.lastSyncedAt ? formatRefreshTime(next.lastSyncedAt) : null);
  }

  async function checkConnection() {
    if (checking) return;
    setChecking(true);
    setCheckNote(null);
    try {
      const res = await fetch("/api/settings/drive", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        setCheckNote("The connection check failed.");
        return;
      }
      const next = (await res.json()) as DriveHealth;
      applyHealth(next);
      setCheckNote(
        next.status === "connected"
          ? "Connection check finished."
          : next.message
      );
    } catch {
      setCheckNote("The connection check failed.");
    } finally {
      setChecking(false);
    }
  }

  async function refreshData() {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshNote(null);
    try {
      const { resetOk, result } = await fullResync();
      try {
        const healthRes = await fetch("/api/settings/drive", { cache: "no-store" });
        if (healthRes.ok) {
          const health = (await healthRes.json()) as DriveHealth;
          applyHealth(health);
        }
      } catch {
        // The resync result still stands when the status label cannot be refreshed.
      }
      if (!resetOk || result === "error" || result === "offline") {
        setRefreshNote({
          tone: "error",
          text: "Full resync could not finish. Try again when Drive is reachable.",
        });
        return;
      }
      setRefreshNote({
        tone: "success",
        text: "Full resync finished. Every Excel file was downloaded again.",
      });
    } catch {
      setRefreshNote({
        tone: "error",
        text: "Full resync could not finish.",
      });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="settings-stagger space-y-8">
      <header className="settings-section">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h2>
        <p className="mt-2 text-sm text-muted">
          Manage your preferences and application settings
        </p>
      </header>

      <section className="settings-section space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Appearance</h3>
          <p className="mt-1 text-sm text-muted">Choose a light or dark theme.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
            ] as const
          ).map(([value, label, Icon]) => {
            const selected = activeTheme === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-lg)] border px-4 py-4 text-left",
                  "transition-[background-color,border-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                  "hover:bg-surface-muted active:scale-[0.99]",
                  selected
                    ? "border-accent/40 bg-accent-soft"
                    : "border-border bg-surface"
                )}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-background text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {selected ? "Active" : "Switch theme"}
                  </span>
                </span>
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    selected ? "bg-accent" : "bg-border"
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-section space-y-4 border-t border-border pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Google Drive</h3>
            <p className="mt-1 text-sm text-muted">
              Connection status for the configured Drive folder.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void checkConnection()}
            disabled={checking}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-70"
          >
            {checking ? "Checking…" : "Check Connection"}
          </button>
        </div>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Status</dt>
            <dd className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  health.status === "connected" && "bg-accent",
                  health.status === "disconnected" && "bg-muted",
                  health.status === "error" && "bg-foreground"
                )}
                aria-hidden
              />
              {STATUS_LABEL[health.status]}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Excel files</dt>
            <dd className="mt-2 text-sm font-medium text-foreground">
              {health.fileCount == null ? "—" : health.fileCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Last successful sync</dt>
            <dd className="mt-2 text-sm font-medium text-foreground">
              {syncedLabel || "—"}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-muted">{checkNote || health.message}</p>
      </section>

      <section className="settings-section space-y-4 border-t border-border pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Full resync</h3>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Clears the saved workbook cache on the server and downloads every
              Excel file again. The Refresh button on Dashboard and Customers
              only checks whether Drive changed. Original files stay unchanged.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshData()}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-70"
          >
            {refreshing ? "Resyncing…" : "Full resync"}
          </button>
        </div>
        <p className="text-sm text-muted">
          Last successful refresh {syncedLabel || "—"}
        </p>
        {refreshNote ? (
          <p
            className={cn(
              "text-sm",
              refreshNote.tone === "success" ? "text-foreground" : "text-muted"
            )}
          >
            {refreshNote.text}
          </p>
        ) : null}
      </section>

      <section className="settings-section space-y-4 border-t border-border pt-8">
        <div>
          <h3 className="text-base font-semibold text-foreground">Shared Account</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            This workspace uses one shared sign-in.
          </p>
        </div>
        <LogoutButton />
      </section>

      <section className="settings-section space-y-2 border-t border-border pt-8">
        <h3 className="text-base font-semibold text-foreground">Ayesha Textile</h3>
        <p className="text-sm text-muted">
          Customer accounts and Excel file management.
        </p>
        {version ? <p className="text-xs text-muted">Version {version}</p> : null}
      </section>
    </div>
  );
}
