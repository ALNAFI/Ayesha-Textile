import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        This route does not exist in {siteConfig.name}.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-zinc-900 underline underline-offset-4"
      >
        Back to home
      </Link>
    </main>
  );
}
