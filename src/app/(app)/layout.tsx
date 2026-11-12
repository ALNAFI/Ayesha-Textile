import { AppShell } from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
