export const AUTH_COOKIE_NAME = "ayesha_session";

/** Default session lifetime: 7 days */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

export type SessionClaims = {
  username: string;
  displayName: string;
};
