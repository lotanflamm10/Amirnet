# Deploying Amirnet Coach to Vercel (free plan)

This is a static-ish Next.js 16 app — no database, no server-side data, no
external APIs. The only server-side code is the login gate (3 routes:
`/login`, `/api/login`, `/api/logout`) and the middleware. Vercel auto-detects
Next.js and runs everything on the free Hobby plan.

The total time is about 5 minutes.

---

## 1. Push the project to GitHub

If the project is not already in a Git repo:

```powershell
cd C:\Lotan\amirnet
git init
git add .
git commit -m "Initial commit"
```

Create a new (private) GitHub repo at <https://github.com/new>, then:

```powershell
git remote add origin https://github.com/<your-user>/amirnet-coach.git
git branch -M main
git push -u origin main
```

> If the repo is already on GitHub, just push the latest changes:
> `git add . && git commit -m "Add login gate + Vercel config" && git push`

---

## 2. Import the repo into Vercel

1. Sign in at <https://vercel.com> with your GitHub account (free Hobby plan).
2. Click **Add New → Project**.
3. Pick the GitHub repo you just pushed.
4. Project name: `amirnet-coach` (this becomes your URL,
   e.g. `https://amirnet-coach.vercel.app`).
5. Framework Preset: **Next.js** (auto-detected — leave defaults).
6. Build Command: leave default (`next build`).
7. Output Directory: leave default.
8. Install Command: leave default (`npm install`).

---

## 3. (Optional) Environment variables

The gate defaults to `admin` / `admin` if no env vars are set, which is what
you asked for. If you want to change the password later **without
redeploying code**, add these env vars in Vercel:

| Variable        | Example | Purpose                                  |
|-----------------|---------|------------------------------------------|
| `GATE_USERNAME` | `admin` | Login username                           |
| `GATE_PASSWORD` | `admin` | Login password                           |
| `ADMIN_ENABLED` | `0`     | Keep `/admin` returning 404 (default)    |

In Vercel: **Project → Settings → Environment Variables** → add each one for
the `Production` environment (and optionally `Preview`), then **Redeploy**.

> The `.env.example` in the repo shows the same variables. Do not commit a
> real `.env` file.

---

## 4. Deploy

Click **Deploy**. The first build takes 1–3 minutes. When it finishes you
get a URL like:

```
https://amirnet-coach.vercel.app
```

Open the URL → the gate redirects you to `/login` → enter `admin` / `admin`
→ you land on the dashboard.

---

## 5. Share with friends

Send them the URL. They open it in Chrome on any device — desktop, laptop,
tablet, Android phone, or iPhone — enter `admin` / `admin`, and they are in.

Their progress lives in **their own browser's localStorage**, so each tester
gets a clean independent profile.

---

## 6. Routing & refresh behavior on Vercel

Nothing special is required — Next.js App Router handles deep links and
refreshes automatically on Vercel. Hard-refreshing `/simulation`, `/vocab`,
or `/app` works out of the box.

The middleware (`src/middleware.ts`) runs on every page navigation and
non-asset request, so an unauthenticated user who pastes
`https://amirnet-coach.vercel.app/simulation` directly into the address bar
is redirected to `/login?from=/simulation`, then bounced back to
`/simulation` after a successful login.

---

## 7. Mobile Chrome notes

- The root layout sets `<meta name="viewport" content="width=device-width,
  initial-scale=1, viewport-fit=cover">` via Next.js `viewport` export, so
  the app fills the screen correctly on iPhone and Android.
- The login form uses `minHeight: 100dvh`, `box-sizing: border-box`,
  `-webkit-tap-highlight-color: transparent`, and `inputMode="text"` so it
  stays usable on small screens and respects the iOS safe area.
- The existing `BottomTabBar` (`< lg`) gives the main app a native-feeling
  bottom nav on phones.
- The session cookie is `httpOnly`, `sameSite=lax`, `secure` in production —
  works on every modern mobile browser.

---

## 8. Updating after deploy

Every `git push` to `main` triggers an automatic Vercel deploy. No manual
step required.

---

## 9. Logging out

There is no logout button in the UI (kept the gate scope tight). To log out:

- Chrome DevTools → Application → Cookies → delete `amirnet-session`, or
- Send `POST /api/logout` (clears the cookie), or
- Sign in again with a different identity (overwrites the cookie).

The cookie expires automatically after 7 days.

---

## 10. Reverting to no gate (later)

To remove the gate entirely:

1. Delete `src/app/login/`, `src/app/api/login/`, `src/app/api/logout/`,
   `src/lib/auth/gate.ts`.
2. Restore `src/middleware.ts` to its original `/admin` 404 stub.
3. Commit and push.

Or, to swap for a real auth provider (NextAuth/Clerk/etc.), replace
`src/lib/auth/gate.ts` and the two `/api/*` routes — the middleware contract
stays the same (`SESSION_COOKIE` present → authenticated).
