"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  sanitizeRedirectPath,
} from "@/lib/auth/session";
import { getDisplayName, verifyCredentials } from "@/lib/auth/password";
import {
  checkLoginThrottle,
  clearLoginThrottle,
  getClientThrottleKey,
  recordLoginFailure,
} from "@/lib/auth/throttle";

export type LoginState = {
  ok: boolean;
  error?: string;
};

function getRequestIp(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headerStore.get("x-real-ip") || "unknown";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeRedirectPath(String(formData.get("next") ?? "/"));

  if (!username || !password) {
    return { ok: false, error: "Enter your username and password." };
  }

  if (username.length > 128 || password.length > 256) {
    return { ok: false, error: "Invalid username or password." };
  }

  const headerStore = await headers();
  const throttleKey = getClientThrottleKey(getRequestIp(headerStore));
  const throttle = checkLoginThrottle(throttleKey);

  if (!throttle.allowed) {
    return {
      ok: false,
      error: "Too many sign-in attempts. Please try again later.",
    };
  }

  let valid = false;
  try {
    valid = await verifyCredentials(username, password);
  } catch {
    return {
      ok: false,
      error: "Sign-in is temporarily unavailable. Please try again later.",
    };
  }

  if (!valid) {
    recordLoginFailure(throttleKey);
    return { ok: false, error: "Invalid username or password." };
  }

  clearLoginThrottle(throttleKey);

  await createSession({
    username: username.trim(),
    displayName: getDisplayName(),
  });

  redirect(next);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
