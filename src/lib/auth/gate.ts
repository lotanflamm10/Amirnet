/**
 * Auth gate constants — preserved for backwards compatibility.
 *
 * The real session helpers now live in `./session.ts`. This module is kept
 * because a few files still import SESSION_COOKIE from it; we re-export.
 */

export {
  SESSION_COOKIE,
  USER_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "./session";
