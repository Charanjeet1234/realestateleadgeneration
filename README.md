# PropEngine UAE — Lead Generation Platform

Real-estate lead generation site for Dubai & Abu Dhabi with a built-in broker CRM.

- **Public site** — property search, rent benchmarks, developer directory, DLD/DMT fee calculator, AI sales assistant (Gemini). Every form, brochure gate and the chat feed leads into the database.
- **Broker CRM** (`/crm`) — lead inbox with pipeline stages, assignment, follow-up reminders, call/WhatsApp/email log, activity timeline, stats and CSV export.
- **Admin** (`/admin`) — manage listings, developers, rent benchmarks and the sales team. Changes go live immediately.
- **Instant alerts** — email (any SMTP), WhatsApp (Twilio) and an optional webhook (Zapier / Make / another CRM) on every new lead.

**Stack:** React 19 + Vite + Tailwind · Express API · PostgreSQL + Prisma 7 · deployed on Vercel.

---

## How leads are handled

1. A visitor submits a form, requests a brochure, or types their phone + email into the AI chat.
2. The API validates the input, drops bot submissions (hidden honeypot field), and limits each visitor IP to 5 submissions per 15 minutes.
3. Phone numbers are normalised (`050 123 4567` → `+971501234567`). If the same email or phone inquired in the last 72 h, the inquiry is **merged into the existing lead** as a "repeat inquiry" instead of creating a duplicate.
4. Budgets ≥ AED 5M (configurable) are flagged **VIP**.
5. New leads are **auto-assigned round-robin** to active agents.
6. The assigned agent + `LEAD_ALERT_EMAILS` get an email, WhatsApp alerts go out if Twilio is configured, and the webhook fires.
7. UTM tags, `gclid`/`fbclid`, referrer and landing page are stored with the lead so you can see which campaigns produce buyers.

**Roles:** *Agents* see only leads assigned to them. *Admins* see all leads, reassign, delete (for data-deletion requests), manage listings and the team. Deactivating a team member signs them out everywhere and returns their open leads to the unassigned pool.

---

## Deploy to Vercel

### 1. Create a Postgres database
In your Vercel project → **Storage → Create Database → Neon**, and connect it to the project. This adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct, used for migrations) automatically.

Using Supabase, Railway or another Postgres 14+ instead? Set `DATABASE_URL` to the pooled string and `DIRECT_URL` to the direct one.

### 2. Set environment variables
Vercel → Project → **Settings → Environment Variables**. See `.env.example` for all of them. Minimum:

| Variable | Value |
|---|---|
| `JWT_SECRET` | `openssl rand -base64 48` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | your first admin login |
| `APP_URL` | `https://your-domain.ae` |
| `GEMINI_API_KEY` | for the AI assistant (optional) |
| `SMTP_*`, `LEAD_ALERT_EMAILS` | for email alerts (strongly recommended) |

### 3. Deploy
Push to `main` (or redeploy). The build runs `prisma migrate deploy`, then the seed, then the frontend build.

### 4. What the seed does on each build
It fills listings, developers and rent benchmarks **only if that table is empty**, and creates the `ADMIN_EMAIL` account **only if it doesn't exist**. Edits made in the admin panel are never overwritten, and changing your password later is safe. You can remove `ADMIN_PASSWORD` from Vercel once you've signed in.

### 5. Sign in
Go to `https://your-domain.ae/crm` (or "Agent login" in the footer), sign in, change your password, then add your agents under **Admin → Team**. Add each agent's WhatsApp number if you want them to receive WhatsApp alerts.

---

## Local development

```bash
cp .env.example .env         # fill in DATABASE_URL, JWT_SECRET, ADMIN_*
npm install                   # also generates the Prisma client
npm run db:migrate            # create tables
npm run db:seed               # starter listings + admin account (only fills empty tables)
npm run dev                   # http://localhost:3000
```

Other scripts: `npm run lint` (typecheck), `npm run build`, `npm run db:studio` (browse the database).

To change the schema: edit `prisma/schema.prisma`, run `npm run db:migrate -- --name what_changed`, and commit the new folder in `prisma/migrations/`.

---

## API reference

All routes are under `/api`. Staff routes use an httpOnly session cookie set by `/api/auth/login`.

**Public**

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | DB / AI status |
| GET | `/properties` | Published listings. Filters: `category`, `emirate`, `community`, `developer`, `unitType`, `maxPriceAED`, `goldenVisa`, `featured`, `q` |
| GET | `/properties/:id` | One listing |
| GET | `/developers`, `/benchmarks` | Directory & rent index |
| POST | `/leads` | Capture a lead |
| POST | `/brochure-request` | Brochure gate (creates a lead) |
| POST | `/chat` | AI assistant; auto-captures phone + email typed in chat |

**Auth** — `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`

**CRM (signed in)**

| Method | Path | Purpose |
|---|---|---|
| GET | `/leads` | List. Filters: `status` (or `OPEN`), `assignedTo` (`me`/`unassigned`/id), `q`, `source`, `vip`, `overdue`, `from`, `to`, `sort`, `page`, `pageSize` |
| GET | `/leads/export.csv` | Same filters, CSV (Excel-friendly) |
| GET | `/leads/:id` | Detail + activity timeline |
| PATCH | `/leads/:id` | Status, follow-up, VIP, contact fields; `assignedToId` (admin) |
| POST | `/leads/:id/activities` | Log `NOTE` / `CALL` / `WHATSAPP` / `EMAIL` |
| DELETE | `/leads/:id` | Permanent delete (admin) |
| GET | `/stats` | Dashboard numbers |
| GET | `/team` | Active team members |

**Admin** — CRUD on `/admin/properties`, `/admin/developers`, `/admin/benchmarks`; `GET/POST/PATCH /admin/users`.

**Webhook payload** (when `LEAD_WEBHOOK_URL` is set): `POST` JSON `{ "event": "lead.created" | "lead.repeat", "lead": {…} }`. If `LEAD_WEBHOOK_SECRET` is set, verify `X-PropEngine-Signature` = hex HMAC-SHA256 of the raw body.

---

## Security notes

- Lead data is only returned to signed-in staff; the old public `GET /api/leads` is now protected.
- Passwords are bcrypt-hashed; sessions are signed, httpOnly, `SameSite=Strict` cookies that are revoked on password change or deactivation. Sign-in is rate-limited.
- Cross-site writes are rejected; inputs are validated with Zod; email alerts escape visitor-supplied text; CSV export neutralises spreadsheet formulas.
- Visitor IPs are stored only as a salted hash, for abuse throttling.
- Security headers (CSP, HSTS, frame-deny) are set in `vercel.json`.
- The lead form records marketing consent separately from the inquiry, in line with the UAE PDPL.

The per-minute limiters on chat and lead endpoints run per serverless instance; the per-IP lead cap is enforced in the database and holds across instances. If you get targeted by bots, put Vercel's firewall / Cloudflare Turnstile in front of the forms.
