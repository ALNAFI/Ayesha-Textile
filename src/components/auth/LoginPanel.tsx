import { BrandMark } from "@/components/shared/BrandMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LoginForm } from "@/components/auth/LoginForm";
import { siteConfig } from "@/config/site";

type LoginPanelProps = {
  nextPath: string;
};

export function LoginPanel({ nextPath }: LoginPanelProps) {
  return (
    <div className="relative flex min-h-dvh flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>

      <div className="auth-enter mx-auto w-full max-w-md">
        <BrandMark className="mb-8" />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
            Welcome back
          </h1>
          <p className="text-sm leading-6 text-muted">
            Sign in to continue to {siteConfig.name}.
          </p>
        </div>

        <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-7">
          <LoginForm nextPath={nextPath} />
        </div>
      </div>
    </div>
  );
}
