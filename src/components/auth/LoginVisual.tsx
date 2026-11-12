import { LogoGlyph } from "@/components/shared/BrandMark";
import { siteConfig } from "@/config/site";

export function LoginVisual() {
  return (
    <div className="auth-visual relative hidden min-h-dvh overflow-hidden bg-accent lg:block">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          color: "var(--accent-foreground)",
        }}
      />
      <div
        aria-hidden
        className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-accent-foreground/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-accent-foreground/10 blur-3xl"
      />

      <div className="auth-enter-delay relative z-10 flex h-full min-h-dvh flex-col justify-between p-12 text-accent-foreground">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-accent-foreground/15">
          <LogoGlyph className="h-5 w-5" />
        </div>

        <div className="max-w-md space-y-4">
          <p className="text-sm font-medium text-accent-foreground/75">
            {siteConfig.name}
          </p>
          <h2 className="text-4xl font-semibold tracking-tight text-balance">
            Ledger clarity for every customer relationship.
          </h2>
          <p className="text-base leading-7 text-accent-foreground/75">
            A calm workspace for Drive workbooks, due ledgers, and day-to-day
            textile accounts.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden
              className="h-16 rounded-[var(--radius-md)] border border-accent-foreground/15 bg-accent-foreground/10"
              style={{ animationDelay: `${120 + index * 80}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
