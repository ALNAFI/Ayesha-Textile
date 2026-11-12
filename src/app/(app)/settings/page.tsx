import type { Metadata } from "next";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <section className="space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Account access for this shared workspace. Drive connection details
          will be configured in a later module.
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <h3 className="text-base font-semibold text-foreground">Account</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-muted">Signed in as</dt>
            <dd className="font-medium text-foreground">
              {session?.displayName ?? "Staff"}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-muted">Username</dt>
            <dd className="font-medium text-foreground">
              {session?.username ?? "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border pt-6">
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}
