import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        This route does not exist in {siteConfig.name}.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-accent underline underline-offset-4"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
