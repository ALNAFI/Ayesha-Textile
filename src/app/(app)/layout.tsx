import { AppShell } from "@/components/layout/AppShell";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
