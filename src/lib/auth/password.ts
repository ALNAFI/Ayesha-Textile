import "server-only";
import { scryptSync, timingSafeEqual, randomBytes } from "crypto";

/**
 * Password verification.
 * - Prefer APP_PASSWORD_HASH (scrypt) for production.
 * - Fall back to APP_PASSWORD plaintext compare (timing-safe) for current .env.
 *
 * Hash format: scrypt$N$r$p$saltHex$hashHex
 * Generate with: node -e "..." helper documented in .env.example
 */

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

function getUsername(): string {
  const username = process.env.APP_USERNAME?.trim();
  if (!username) {
    throw new Error("APP_USERNAME is not configured.");
  }
  return username;
}

export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still compare equal-length buffers to reduce timing variance on length mismatch path.
    const fill = Buffer.alloc(bufA.length);
    timingSafeEqual(bufA, fill);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

function verifyScryptHash(password: string, encoded: string): boolean {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");

  if (!N || !r || !p || salt.length === 0 || expected.length === 0) {
    return false;
  }

  const derived = scryptSync(password, salt, expected.length, { N, r, p });
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const expectedUsername = getUsername();
  const usernameOk = constantTimeEqual(username.trim(), expectedUsername);

  const passwordHash = process.env.APP_PASSWORD_HASH?.trim();
  let passwordOk = false;

  if (passwordHash) {
    passwordOk = verifyScryptHash(password, passwordHash);
  } else {
    const expectedPassword = process.env.APP_PASSWORD;
    if (!expectedPassword) {
      throw new Error(
        "Neither APP_PASSWORD_HASH nor APP_PASSWORD is configured."
      );
    }
    passwordOk = constantTimeEqual(password, expectedPassword);
  }

  return usernameOk && passwordOk;
}

export function getDisplayName(): string {
  return "Ayesha Textile Staff";
}
