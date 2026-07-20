# 911 Makers — Client Communication Center (CCC)

Enterprise client communication and project documentation platform. Every important client communication is created, sent, and recorded here — making requirements, approvals, scope changes, and confirmations professional, documented, traceable, and defensible across the entire project lifecycle.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, TipTap, Framer Motion, Nodemailer, and **Firebase Firestore**.

## Quick start

```bash
npm install
cp .env.example .env.local   # SMTP credentials (only needed for sending)
npm run dev                  # http://localhost:3000
```

Production: `npm run build && npm start`.

Firestore requires a one-time service-account setup (5 minutes): follow [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md). The app is preconfigured for the `client-communication-center` Firebase project, database `emailsystem911makers`.

## The workflow

1. **Projects** (home page): create a project — it gets an auto reference number (`911M-YYYY-NNN`), starts at the *Scope Confirmation* stage, and its timeline begins.
2. **New Communication**: from the project page, pick a template (12 built in) — the composer opens pre-filled with the project's client details and reference.
3. **Compose**: rich text editor (headings, lists, checklists, tables, links, images) with auto-updating live preview. No HTML editing, ever.
4. **Send**: the communication is saved first, then sent via SMTP, then recorded in the project timeline. Emails with a confirmation block automatically become *Approval Requested*.
5. **Record decisions**: *Approved* / *Needs Revision* / *Rejected* with notes. Each decision writes an immutable audit record (who, when, what, why) to the `approvals` collection AND a timeline event.
6. **Checklists**: add reusable checklists per project (Pages, Features, Forms, Branding, Assets, Timeline, Deliverables, Approval Items, or custom). Completion is stored in Firestore and logged to the timeline.
7. **Advance the stage** (Scope Confirmation → Requirements Collection → Development → Design Review → QA Review → Delivery → Client Acceptance → Closed), add manual notes, and close the project when accepted. The record stays.

The timeline is append-only. Nothing is lost.

## Storage — Firebase Firestore

Firestore is the **only source of truth for production data**. Collections:

| Collection | Contents |
|---|---|
| `clients` | Client database |
| `projects` | Projects (stage, status, reference, client link) |
| `communications` | Emails/documents incl. version history, approval status, send record |
| `timeline_events` | Append-only project history |
| `approvals` | Immutable approval audit records (user, date, note, communication ref) |
| `checklists` | Per-project checklists with completion state |
| `settings` | Application settings (sender identity), doc id `main` |

The storage layer is modular: business logic and API routes depend only on the `Repository` interface (`src/lib/store/repository.ts`). Drivers:

- **`adminRepo`** — production default for ALL API routes. Firebase **Admin SDK** with a service account (named database `emailsystem911makers`); never blocked by Security Rules. Requires `FIREBASE_SERVICE_ACCOUNT_KEY` — see [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md).
- **`firestoreRepo`** — Firebase **Web SDK**, reserved for browser components that may access Firestore directly in the future; subject to Security Rules.
- **`jsonRepo`** — local JSON files, used ONLY for offline development/CI (`STORAGE_DRIVER=json`). Never used in production.

Direct client access to Firestore is locked down by [`firestore.rules`](./firestore.rules) (deny-all) — safe because the Admin SDK bypasses rules and all traffic flows through the API routes.

Adding another backend later (Postgres, KV, …) means implementing one interface — no business logic changes.

## Settings (sender identity)

The **Settings** page lets administrators change the Sender Name, Sender Email, and Reply-To for all outgoing email — stored in Firestore, no code changes. SMTP transport credentials stay in environment variables only and are never written to the database.

## SMTP configuration

Set in `.env.local` / Vercel environment variables:

| Variable | Purpose |
|---|---|
| `SMTP_PROVIDER` | `gmail`, `microsoft`, or `custom` |
| `SMTP_USER` / `SMTP_PASS` | Login credentials (Gmail requires an App Password) |
| `SMTP_FROM_NAME` / `SMTP_FROM_EMAIL` / `SMTP_REPLY_TO` | Fallback sender identity (Settings page takes precedence) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Only for `custom` provider |

## Architecture

```
src/lib/domain/        Project lifecycle, approval statuses, event taxonomy (pure business logic)
src/lib/brand.ts       Brand engine — palette from the 911 Makers logo, single source of truth
src/lib/templates.ts   Template engine — 12 reusable templates, branding never changes
src/lib/email/         Email generator + editor-HTML → email-HTML transformer
src/lib/store/         Repository interface + Firestore/JSON drivers + append-only event log
src/lib/firebase.ts    Firebase app + named Firestore database initialization
src/app/api/           REST API: projects, communications, approvals, checklists, settings, clients, send
src/components/        Projects dashboard, project detail (timeline/checklists), composer, settings
```

Future modules (proposals, quotations, invoices, contracts, client portal, PDF, digital signatures, CRM) plug in as new document types + API routes on top of the same repository, brand engine, and event log.

## Deploying to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add environment variables: `FIREBASE_SERVICE_ACCOUNT_KEY` (see FIRESTORE_SETUP.md) and the SMTP variables. Firestore web config is built in; override with `NEXT_PUBLIC_FIREBASE_*` only if the Firebase project changes.
3. Deploy. All data lives in Firestore, so serverless statelessness is not a problem.

## Notes

- Version history per communication is capped at 10 snapshots (Firestore 1 MB document limit).
- Images in emails must be publicly hosted URLs — email clients cannot load local files.
- The email logo is text-rendered (gold "911" + white "MAKERS") so it displays even when images are blocked.
