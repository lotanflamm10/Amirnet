/**
 * TEMPORARY shared-credential gate for the friends-testing build.
 *
 * NOT production auth. Replace this module (and the /api/login + /api/logout
 * routes + middleware check) with a real auth provider when shipping.
 *
 * Credentials can be overridden per environment via:
 *   GATE_USERNAME
 *   GATE_PASSWORD
 * If unset, defaults to admin / admin.
 */

export const SESSION_COOKIE = "amirnet-session";
export const SESSION_VALUE = "ok";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function getExpectedCredentials(): { username: string; password: string } {
  return {
    username: process.env.GATE_USERNAME ?? "admin",
    password: process.env.GATE_PASSWORD ?? "admin",
  };
}

export function checkCredentials(username: string, password: string): boolean {
  const expected = getExpectedCredentials();
  return username === expected.username && password === expected.password;
}

/** Returns true if the request cookie matches the expected session value. */
export function isAuthCookieValid(cookieValue: string | undefined): boolean {
  return cookieValue === SESSION_VALUE;
}
