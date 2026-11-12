"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const initialState: LoginState = { ok: false };

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);

  useEffect(() => {
    if (state.error) {
      setErrorVisible(true);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />

      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-foreground"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          disabled={pending}
          className={cn(
            "h-11 w-full rounded-[var(--radius-md)] border border-border bg-background px-3.5 text-sm text-foreground",
            "transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
            "placeholder:text-muted-foreground",
            "hover:border-border-strong",
            "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
          placeholder="Enter your username"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={pending}
            className={cn(
              "h-11 w-full rounded-[var(--radius-md)] border border-border bg-background px-3.5 pr-11 text-sm text-foreground",
              "transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              "placeholder:text-muted-foreground",
              "hover:border-border-strong",
              "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={pending}
            className={cn(
              "absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-muted",
              "transition-[background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              "hover:bg-surface-muted hover:text-foreground active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div
        className="min-h-5"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.error ? (
          <p
            key={state.error}
            role="alert"
            className={cn(
              "text-sm text-danger",
              errorVisible && "auth-error-enter"
            )}
          >
            {state.error}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-semibold text-accent-foreground",
          "transition-[transform,opacity,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
          "hover:opacity-95 active:scale-[0.985]",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
