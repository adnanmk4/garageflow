# garageflow
 
# GarageFlow

Mobile-first workshop management SaaS for auto mechanics and small workshops in Pakistan. Replaces handwritten job cards, notebooks, and manual invoices with a simple digital workflow — a mechanic can create a complete repair job and invoice in under two minutes.

## What it does

**Multi-tenant workshop accounts** — Each workshop registers its own account with an owner and can add employees. All data is fully isolated per workshop.

**Bilingual, RTL-ready** — Full English and Urdu support with an instant language switcher (no page reload) and proper right-to-left layout for Urdu.

**New Job wizard** — A five-step flow (Vehicle → Services → Parts → Labor → Review) built for speed on a phone:
- Look up a vehicle by registration number, with a hint if it has previous job history
- Optional customer details, collapsed by default so nothing slows the mechanic down
- Tap-to-select service chips (Oil Change, Brake Service, AC Service, etc.) plus custom entries that get saved for next time
- Search-as-you-type parts catalog with quantity steppers and live subtotals
- Quick-add labor charges
- Live totals on the review screen — the exact same calculation the server uses, so what the mechanic sees is always what gets saved
- Progress is autosaved locally as you type, so a dropped connection or closed tab never loses a job in progress

**Invoicing** — Generate a professional invoice from any job:
- Sequential, atomic invoice numbering (guaranteed no duplicates even with simultaneous requests)
- A snapshot of workshop/vehicle/customer/job data frozen at invoice time, so later settings changes never rewrite a customer's invoice
- Downloadable PDF, A4 print layout, and an 80mm thermal receipt layout
- A QR code on every invoice linking to a public, no-login page customers can view or download from
- One-tap WhatsApp share with a pre-filled message

**Search & history** — One search box across vehicle reg number, customer name, phone, and invoice number. Every vehicle has a full timeline of past jobs.

**Dashboard** — Today's jobs, pending/completed counts, revenue, and outstanding payments at a glance. Employees see job counts but not revenue figures — only the owner sees the money numbers.

**Settings** — Workshop name, logo, address, invoice prefix, currency, receipt footer, and optional tax. Owners can add and manage employee accounts, and export every job as a CSV spreadsheet at any time.

**Installable & resilient** — Works as an installable app (Add to Home Screen) on Android/Chrome, with rate limiting on sensitive endpoints and structured error logging.

## Tech stack
Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · MongoDB/Mongoose · JWT auth (httpOnly cookies) · next-intl · react-pdf · framer-motion

## Setup

### 1. Install dependencies
```
npm install
```

### 2. Environment variables
Copy the example file and fill in real values:
```
cp .env.example .env.local
```
- `MONGODB_URI` — a MongoDB Atlas connection string (or a local `mongodb://127.0.0.1:27017/garageflow` if you have MongoDB running locally)
- `JWT_SECRET` — any long random string, e.g. generate one with `openssl rand -base64 48`

### 3. Run it
```
npm run dev
```
Then open http://localhost:3000 — it redirects to `/register` on first run.

### 4. First smoke test
1. Register a workshop (workshop name, your name, phone, password)
2. You should land on `/dashboard` with all stats at zero
3. Try the language switcher (top right) — the whole UI should flip to Urdu, RTL, instantly
4. Tap "New Job" — enter a reg number, pick a couple of service chips, add a part or two, add a labor charge, review the totals, save
5. You should land on `/jobs` and see the job you just created; tap it to see the read-only breakdown
6. Tap "Generate Invoice" — you should get an invoice number, a QR code, and four action buttons
7. Try "Print (A4)" and "Print Receipt" — each opens a new tab styled for that layout and triggers the browser print dialog
8. Try "Download PDF" — should open a real PDF with your workshop name, the job breakdown, and a scannable QR code in the corner
9. Scan the QR code (or open the link it encodes) on another device / incognito window — it should show the same invoice with no login required
10. Go back to `/dashboard` — "Today's Jobs" and the revenue figures should now reflect the job you just saved
11. On `/jobs`, search the reg number you used — you should see a "View full history" shortcut plus the job itself; tap the shortcut to see the vehicle timeline
12. Try searching by the invoice number you just generated (e.g. `INV-0001`) — the same job should come up
13. Log out, log back in with the same phone/password
14. Go to `/settings` — update the workshop name, upload a small logo, save; refresh the page and confirm it persisted
15. Go to `/settings/users` — add an employee, then log out and log back in as that employee; confirm the dashboard hides revenue figures and `/settings` shows the "owner only" message instead of the form
16. Back as the owner, try `/settings` → "Export All Jobs (CSV)" — should download a spreadsheet with the job(s) you created
17. On a phone browser (Chrome on Android is the most reliable test), open the deployed site and check for an "Add to Home Screen" / install prompt
18. Start a New Job, fill in a reg number and a service or two, then close the tab without saving — reopen `/jobs/new` and confirm the "Resume unsaved job?" banner appears with your progress intact
19. Run the invoice counter load test against your real database (see below) — this is the one check in this README I'd actually call a hard requirement, not a nice-to-have

If anything errors here, it's almost always the `MONGODB_URI` — check your
Atlas IP allowlist includes your current IP (or `0.0.0.0/0` for local dev).
For the QR code to resolve correctly from another device, `localhost` won't
work — you'll need to test that specific step on a deployed URL or a tunnel
(e.g. ngrok) since `localhost` isn't reachable from your phone.

### 5. Load-test the invoice counter
Before trusting this for a paying workshop, verify invoice numbers can never collide under concurrent load:
```
MONGODB_URI="<your real connection string>" node scripts/load-test-invoice-counter.mjs 200
```
This fires 200 concurrent invoice-number requests against a throwaway workshop, checks for duplicates, and cleans up after itself. It should print `✅ PASSED`.

## Important caveats before a real launch
- **Rate limiting is in-memory, not distributed.** It resets on cold start and isn't shared across multiple serverless instances — fine as a floor against casual abuse, not a hard guarantee under real attack. Swap `lib/security/rateLimit.ts`'s internals for Upstash Redis + `@upstash/ratelimit` before a public launch.
- **PWA icons are placeholders** — a generated wrench mark in the brand color, not your real logo. Regenerate with `scripts/generate-pwa-icons.mjs` or drop in your own 192×192 and 512×512 PNGs at `public/icons/`.
- **Workshop logos are stored as data URIs** directly on the database document (capped at 500KB) rather than real object storage. Fine for a pilot, should move to S3/Cloudinary before scaling.
- **No error-monitoring service is wired up** — errors are logged as structured JSON to stderr, which your host will collect, but nothing alerts you automatically. Connecting Sentry or similar is a config step, not a code change.
- **Backups are your responsibility** — turn on MongoDB Atlas's Continuous Backup (or scheduled snapshots) before onboarding a real workshop.
- **Jobs can't be edited or deleted** once created, only viewed and invoiced.
- **Offline support covers draft preservation, not submission** — if a mechanic is genuinely offline, the form won't lose data, but the job still can't be saved to the database until connectivity returns.

## Project structure
- `app/` — Next.js App Router pages and API routes
- `models/` — Mongoose schemas
- `lib/auth/` — JWT + session + RBAC helpers
- `lib/i18n/` — next-intl config (cookie-based locale, no URL routing)
- `locales/en` / `locales/ur` — translation dictionaries
- `components/ui/` — hand-built shadcn-style primitives (Button, Input, Card, Label)
- `components/shared/` — app-specific shared components (nav, language switcher, stat cards)
- `scripts/` — standalone Node scripts (PWA icon generation, invoice counter load test)

## Known limitation from this build
This was built and verified with `tsc --noEmit`, `eslint`, and `next build`
all passing clean, but not run against a live MongoDB instance during
development. Treat the steps above as the real end-to-end test.