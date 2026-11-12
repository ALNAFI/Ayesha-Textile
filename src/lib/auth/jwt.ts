import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import {
  SESSION_MAX_AGE_SECONDS,
  type SessionClaims,
} from "@/lib/auth/constants";

type SessionPayload = SessionClaims & JWTPayload;

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  if (process.env.NODE_ENV === "production" && secret.trim().length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters in production.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  claims: SessionClaims,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    username: claims.username,
    displayName: claims.displayName,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + maxAgeSeconds)
    .setSubject(claims.username)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionClaims | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    const data = payload as SessionPayload;
    if (
      typeof data.username !== "string" ||
      typeof data.displayName !== "string" ||
      !data.username
    ) {
      return null;
    }

    return {
      username: data.username,
      displayName: data.displayName,
    };
  } catch {
    return null;
  }
}
