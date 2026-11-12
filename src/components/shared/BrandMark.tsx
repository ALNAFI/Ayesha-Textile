import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  showWordmark?: boolean;
  collapsed?: boolean;
};

export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-[1.125rem] w-[1.125rem]", className)}
      fill="none"
      aria-hidden
    >
      <path
        d="M4 7.5h16M4 12h16M4 16.5h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8 5v14M12 5v14M16 5v14"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function BrandMark({
  className,
  showWordmark = true,
  collapsed = false,
}: BrandMarkProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span
        aria-hidden
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent text-accent-foreground"
      >
        <LogoGlyph />
      </span>
      {showWordmark && !collapsed ? (
        <span className="truncate text-[0.95rem] font-semibold tracking-tight text-sidebar-foreground">
          Ayesha Textile
        </span>
      ) : null}
      {collapsed ? <span className="sr-only">Ayesha Textile</span> : null}
    </div>
  );
}
