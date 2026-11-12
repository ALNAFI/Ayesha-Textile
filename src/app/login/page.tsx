import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { LoginVisual } from "@/components/auth/LoginVisual";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${siteConfig.name}`,
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeRedirectPath(params.next);

  return (
    <main className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-2">
      <LoginVisual />
      <LoginPanel nextPath={nextPath} />
    </main>
  );
}
