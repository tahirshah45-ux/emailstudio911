"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "@/lib/api";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui/primitives";

/**
 * Application settings — sender identity used for outgoing email.
 * Administrators can change these without touching code or env vars.
 * Resend transport credentials remain in environment variables only.
 */
export default function SettingsForm() {
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    api.settings
      .get()
      .then((s) => {
        setSenderName(s.senderName);
        setSenderEmail(s.senderEmail);
        setReplyToEmail(s.replyToEmail);
      })
      .catch(() => setMessage({ kind: "err", text: "Could not load settings." }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.settings.update({ senderName, senderEmail, replyToEmail });
      setMessage({ kind: "ok", text: "Settings saved. New emails will use this sender identity." });
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-xl font-bold">Settings</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Sender identity for all outgoing communications. Resend credentials are configured in{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">.env.local</code>{" "}
        and are never stored in the database.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Sender Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="py-4 text-sm text-neutral-400">Loading…</p>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Sender Name</Label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="911 Makers"
                />
                <p className="text-xs text-neutral-400">Shown as the From name in the client&apos;s inbox.</p>
              </div>
              <div className="space-y-1">
                <Label>Sender Email</Label>
                <Input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="projects@911makers.com"
                />
                <p className="text-xs text-neutral-400">
                  Must be a sender address verified in Resend. Leave empty to use the
                  default sender address (EMAIL_FROM).
                </p>
              </div>
              <div className="space-y-1">
                <Label>Reply-To Email</Label>
                <Input
                  type="email"
                  value={replyToEmail}
                  onChange={(e) => setReplyToEmail(e.target.value)}
                  placeholder="support@911makers.com"
                />
                <p className="text-xs text-neutral-400">Where client replies are delivered. Optional.</p>
              </div>
              {message && (
                <p className={`text-sm ${message.kind === "ok" ? "text-green-600" : "text-red-600"}`}>
                  {message.text}
                </p>
              )}
              <Button variant="gold" size="sm" onClick={save} disabled={saving}>
                <Save size={14} /> {saving ? "Saving…" : "Save Settings"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
