# Deploying Amirnet Coach to Vercel

Already live at: <https://amirnet-coach.vercel.app>

This document covers the post-friends-testing deploy. The app is a Next.js 16
project on the free Vercel Hobby plan — no database, no external services
beyond Vercel itself.

---

## 1. Redeploy after pulling changes

Every push to GitHub `main` auto-deploys on Vercel. To trigger a redeploy
manually after env-var changes:

```powershell
cd C:\Lotan\amirnet
git add .
git commit -m "Your message"
git push origin master
```

Vercel picks up the push and builds in 1–3 minutes. The live URL stays the
same: <https://amirnet-coach.vercel.app>.

To redeploy WITHOUT a new commit (e.g. just to pick up new env vars):
Vercel dashboard → project → **Deployments** → latest deployment → ⋯ menu
→ **Redeploy**.

---

## 2. Required env vars on Vercel

`AUTH_SECRET` is **required** in production — the auth layer fails closed
at the first request when `NODE_ENV=production` and `AUTH_SECRET` is
missing. The other vars are optional.

| Variable | Required? | Purpose |
|---|---|---|
| `AUTH_SECRET` | **Required** | HMAC key that signs the session and password-override cookies. The first authenticated request will throw a descriptive error if this is unset on a production build. Local dev (`npm run dev`) keeps a fallback so setup is not blocked. |
| `ADMIN_SEED_PASSWORD` | Optional | Overrides the baked-in admin seed password. Default: `tsnhi5326`. |
| `GILI_SEED_PASSWORD` | Optional | Overrides the baked-in גילי seed password. Default: `גילי7369!`. |
| `ADMIN_ENABLED` | Optional | Set to `1` to expose `/admin/*` routes. Default: `0` (returns 404). |

Generate a strong `AUTH_SECRET` locally and paste it into Vercel:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Vercel: **Project → Settings → Environment Variables** → add for the
`Production` environment (and `Preview` if you want PRs to use the same
key), then click **Redeploy** on the latest deployment.

---

## 3. Routing & refresh

Nothing special required. Next.js App Router handles deep links and hard
refreshes out of the box on Vercel. Middleware (`src/middleware.ts`) runs
on every page request and redirects unauthenticated users to `/login`,
preserving the original path as `?from=...`.

The middleware matcher excludes:

- `/api/login`, `/api/logout`, `/api/me`, `/api/change-password`
- `/_next/static`, `/_next/image`, `/favicon.ico`, `/robots.txt`,
  `/sitemap.xml`
- `/manifest.webmanifest`
- any path ending in a common static-asset extension
  (`.png`, `.svg`, `.css`, `.js`, fonts, etc.)

So the PWA manifest and icons load without an auth check.

---

## 4. Mobile / Chrome / PWA

- `<meta name="viewport">` is set via Next.js `viewport` export
  (`width=device-width, initial-scale=1, viewport-fit=cover`).
- `theme-color` matches dark/light scheme.
- `manifest.webmanifest` lets the app be installed (Add to Home Screen)
  on Chrome Android and Safari iOS.
- The login form and account page use ≥16px input font (no iOS focus
  zoom), 44–48px tap targets, and `safe-area-inset-*` padding.

---

## 5. Users

Two seed users are baked in. They are NOT removable without a code change.

| Username (typed at login) | Password | Role |
|---|---|---|
| `admin` | `tsnhi5326` | admin |
| `גילי` | `גילי7369!` | student |

Username matching is case-insensitive for ASCII (`admin` = `Admin`) and
literal for Hebrew.

### Password change persistence

Each user can change their own password via `/account`. **Because there
is no database, changes are stored as an HMAC-signed HttpOnly cookie
scoped to the browser** (`amirnet-pw-<userId>`).

- The change persists on this browser/device only.
- Other devices keep the seed password until they too change it.
- Clearing cookies reverts to the seed password.
- The other user is never affected by your change.

This is documented in the UI on the account page.

---

## 6. Per-user data isolation

Every per-user localStorage key (progress, vocab, simulation, history,
learning-engine, credits, entitlements) is namespaced as
`amirnet:user:<userId>:<originalKey>`. Theme + language are intentionally
kept device-global.

On the first login as `admin`, a one-time migration copies any pre-existing
legacy singleton keys into `amirnet:user:admin:*`, so an admin who used the
app before this update keeps their progress. The legacy values are left in
place as a safety net.

`גילי` always starts fresh — by design (the migration is admin-only).

---

## 7. Local dev

```powershell
npm install
npm run dev
```

Local cookies are `Secure` only in production builds, so HTTP localhost
works. To override credentials locally, create `.env.local`:

```
AUTH_SECRET=local-dev-secret
ADMIN_SEED_PASSWORD=tsnhi5326
GILI_SEED_PASSWORD=גילי7369!
```

---

## 8. Logging out

`/account` has a **Log out** button. It calls `POST /api/logout` which
clears the session and companion cookies (and the per-user pw-override
cookie is NOT cleared — re-login restores the override).

Logout does NOT delete progress data.

---

## 9. Security limitations (still not production)

What this build IS:
- Multi-user gate with HMAC-signed session cookies (Edge-verifiable)
- Per-user localStorage isolation
- Input validation + constant-time password comparison
- HttpOnly + SameSite=Lax + Secure (prod) + Path=/ + 30-day maxAge

What this build is **NOT**:
- It's not a real authentication system.
- There is no database, no server-side password store, no hashing at
  rest (passwords live as plaintext in `src/lib/auth/users.ts`, which is
  not shipped to the client but IS in the deployment image).
- Password changes persist only in the browser cookie. There is no
  cross-device sync, no account recovery, no admin reset.
- No rate limiting. Brute-forcing the two known accounts is trivial at
  scale — fine for friends testing, not for the open internet.
- No audit log, no CSRF token (we rely on SameSite=Lax — adequate for
  this scope but not for production).
- Anyone who knows the seed credentials can log in from any browser.

For production: replace this gate with a proper auth provider
(NextAuth / Clerk / Supabase), use bcrypt/argon2 in a real DB, add rate
limiting, add CSRF tokens, log auth events server-side.
