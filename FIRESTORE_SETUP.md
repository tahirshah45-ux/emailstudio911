# Firestore Setup — Service Account & Security Rules

The API routes use the **Firebase Admin SDK**, which authenticates with a service account and is never blocked by Firestore Security Rules. Follow these steps once per environment (local machine, Vercel).

## 1. Generate a service account key

1. Open [Firebase Console](https://console.firebase.google.com/) → project **client-communication-center**.
2. ⚙️ **Project settings** → **Service accounts** tab.
3. Click **Generate new private key** → a JSON file downloads.
4. Treat this file like a password. Never commit it to Git (`.gitignore` already excludes `*.json` service keys via `.env*` guidance — keep the file outside the repo).

## 2. Configure local development

Recommended: base64-encode the key so it fits safely on one `.env.local` line.

PowerShell (Windows):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\serviceAccountKey.json")) | Set-Clipboard
```

Then in `.env.local`:

```
FIREBASE_SERVICE_ACCOUNT_KEY=<paste the base64 string>
```

Alternative A — raw JSON on one line (must stay a single line):

```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"client-communication-center",...}
```

Alternative B — standard Google credentials file path:

```
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccountKey.json
```

Restart `npm run dev` after changing `.env.local`.

## 3. Configure Vercel

Project → **Settings → Environment Variables** → add `FIREBASE_SERVICE_ACCOUNT_KEY` with the same base64 value (all environments). Redeploy.

## 4. Publish Security Rules

Because all app traffic goes through the server (Admin SDK), direct client access should be locked down:

1. Firebase Console → **Firestore Database** → select database **emailsystem911makers** → **Rules**.
2. Paste the contents of [`firestore.rules`](./firestore.rules) → **Publish**.

The deny-all rules do NOT affect the app — the Admin SDK bypasses rules. They protect your data from direct public access via the web config (which is not secret).

## 5. Verify

```bash
npm run dev
```

Open http://localhost:3000, create a test project. If it appears on the dashboard (and in Firebase Console → Firestore → `projects` collection), server access works. The earlier `Missing or insufficient permissions` error is gone because API routes no longer authenticate as an anonymous web client.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Firebase Admin credentials are missing…` | `FIREBASE_SERVICE_ACCOUNT_KEY` not set in `.env.local` / Vercel, or dev server not restarted. |
| `…could not be parsed` | The JSON was mangled (multi-line raw paste). Use the base64 method. |
| `NOT_FOUND` on every request | The named database `emailsystem911makers` does not exist — create it in Firebase Console → Firestore → databases, or set `NEXT_PUBLIC_FIREBASE_DATABASE_ID` to your database id (`(default)` for the default one). |
| `PERMISSION_DENIED: Cloud Firestore API has not been used…` | Enable the Firestore API for the project (the error message contains the direct link). |
