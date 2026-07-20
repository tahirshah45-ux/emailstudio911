# 911 Makers — Client Communication Center (CCC)

Enterprise client communication and project documentation platform. Every important client communication is created, sent, and recorded here — making requirements, approvals, scope changes, and confirmations professional, documented, traceable, and defensible across the entire project lifecycle.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, TipTap, Framer Motion, and Nodemailer.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in SMTP credentials (only needed for sending)
npm run dev                  # http://localhost:3000
```

Production build: `npm run build && npm start`.

## The workflow

1. **Projects** (home page): create a project — it gets an auto reference number (`911M-YYYY-NNN`), starts at the *Scope Confirmation* stage, and its timeline begins.
2. **New Communication**: from the project page, pick a template (Scope Confirmation, Requirements Collection, Information Request, Missing Asset Request, Change Request, Design Approval, Development Update, QA Report, Client Review, Project Handoff, Final Acceptance, General) and the composer opens pre-filled with the project's client details and reference.
3. **Compose**: edit content in the rich text editor (headings, lists, checklists, tables, links, images). The live preview updates automatically. No HTML editing, ever.
4. **Send**: the communication is saved first, then sent via SMTP, then recorded — `Sent to … ` appears in the project timeline. If the email contains a confirmation block, approval status automatically becomes *Approval Requested*.
5. **Record decisions**: when the client responds, record *Approved*, *Needs Revision*, or *Rejected* on the communication (with an optional note like "Confirmed by client reply on …"). Each decision becomes a permanent timeline event.
6. **Advance the stage** as the project moves (Scope Confirmation → Requirements Collection → Development → Design Review → QA Review → Delivery → Client Acceptance → Closed), add manual notes for anything that happened outside the system, and **close** the project when accepted. The record stays.

The timeline is append-only. Nothing is lost.

## Architecture (modular by design)

| Layer | Location | Notes |
|---|---|---|
| Business logic | `src/lib/domain/` | Project stages, approval lifecycle, event taxonomy — pure TS, no UI/storage |
| Brand engine | `src/lib/brand.ts` | Palette extracted from the 911 Makers logo; single source of truth |
| Template engine | `src/lib/templates.ts` | 12 reusable templates; only content changes, branding never does |
| Email generation | `src/lib/email/generator.ts` | Branded document frame — table layout, inline CSS, 640px, email-client safe |
| Content transform | `src/lib/email/transform.ts` | Editor HTML → email-safe inline-styled HTML |
| Storage | `src/lib/store/jsonStore.ts` | The ONLY module touching disk; swap here for a database |
| Event log | `src/lib/store/events.ts` | Append-only project timeline |
| SMTP | `src/app/api/send/route.ts` | Gmail / Microsoft / custom presets, env-driven |
| Preview engine | `src/components/dashboard/PreviewPane.tsx` | Sandboxed iframe, desktop + mobile |
| API | `src/app/api/` | Projects, communications, approvals, events, clients, send |
| UI | `src/app/`, `src/components/` | Projects dashboard, project detail + timeline, composer |

Future modules (proposals, quotations, invoices, contracts, client portal, PDF, signatures, CRM) plug in as new document types + API routes: the domain layer, brand engine, template engine, and event log are already generic. None are implemented now, by design.

## Approval statuses

`Pending` → `Approval Requested` (set automatically on send when a confirmation block exists) → `Approved` / `Rejected` / `Needs Revision`. Every transition is written to the project timeline with a timestamp and optional note.

## SMTP configuration

Set in `.env.local` (never committed):

| Variable | Purpose |
|---|---|
| `SMTP_PROVIDER` | `gmail`, `microsoft`, or `custom` |
| `SMTP_USER` / `SMTP_PASS` | Login credentials (Gmail requires an App Password) |
| `SMTP_FROM_NAME` / `SMTP_FROM_EMAIL` | Sender identity clients see |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Only for `custom` provider |

Credentials are read server-side only — they never reach the browser.

## Data storage

Records live in JSON files under `DATA_DIR` (default `./data`): `projects.json`, `emails.json`, `events.json`, `clients.json`. Every save appends a version snapshot (capped at 25 per communication); the event log is append-only.

**Vercel note:** Vercel's serverless filesystem is ephemeral — the app deploys and runs there (generate/copy/export/send work), but saved records will not persist. For persistent storage host on a VPS/Docker, or replace `jsonStore.ts` with Vercel Postgres/KV — it is the only module that touches disk.

## Deploying to Vercel

1. Push this folder to a Git repository and import it in Vercel.
2. Add the SMTP environment variables in Project Settings → Environment Variables.
3. Deploy. (See storage note above.)

## Design notes

- Emails are official project documents: black header with the text-rendered logo (renders even when images are blocked), document details card (client, company, project, reference, date, version, status pill), content, optional confirmation block, signature, and a legal documentation footer.
- Editor → email mapping: H2 = section heading, H3 = small-caps label, quote = gold-edged info card, checklist = branded checkbox card, bullets = gold square markers.
- Images must be publicly hosted URLs — email clients cannot load local files.
