import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <p className="text-sm tracking-[0.2em] text-zinc-500 uppercase">
        Module 01
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900">
        {siteConfig.name}
      </h1>
      <p className="mt-3 max-w-md text-center text-base text-zinc-600">
        Project setup is ready. Drive and Excel modules are preserved for later
        integration.
      </p>
    </main>
  );
}
