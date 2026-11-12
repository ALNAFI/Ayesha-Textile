/**
 * Preserved session helpers from legacy Ayesha Textile auth.
 * Express middleware was removed for Next.js; jose JWT wiring comes later.
 * Server-only — do not import from client components.
 */

import "server-only";
import crypto from "crypto";

export const COOKIE_NAME = "ayesha_auth_token";

export function getAuthConfig() {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!username || !password || !sessionSecret) {
    throw new Error(
      "APP_USERNAME, APP_PASSWORD, and SESSION_SECRET must be set in server environment variables."
    );
  }

  return { username, password, sessionSecret };
}

export interface AuthSessionPayload {
  username: string;
  displayName: string;
  createdAt: number;
  expiresAt: number;
}

export function createSessionToken(
  username: string,
  displayName: string,
  rememberMe: boolean
): string {
  const { sessionSecret } = getAuthConfig();
  const durationMs = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;
  const now = Date.now();
  const payload: AuthSessionPayload = {
    username,
    displayName,
    createdAt: now,
    expiresAt: now + durationMs,
  };

  const dataStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", sessionSecret)
    .update(dataStr)
    .digest("base64url");

  return `${dataStr}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined
): AuthSessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [dataStr, signature] = parts;
  const { sessionSecret } = getAuthConfig();

  const expectedSignature = crypto
    .createHmac("sha256", sessionSecret)
    .update(dataStr)
    .digest("base64url");

  const bufA = Buffer.from(signature);
  const bufB = Buffer.from(expectedSignature);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(dataStr, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr) as AuthSessionPayload;
    if (Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
