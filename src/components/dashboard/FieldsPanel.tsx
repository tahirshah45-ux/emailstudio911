"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import type { Client, EmailFields } from "@/lib/types";
import { STATUS_OPTIONS } from "@/lib/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/primitives";

interface FieldsPanelProps {
  fields: EmailFields;
  clients: Client[];
  onChange: (patch: Partial<EmailFields>) => void;
  onSaveClient: () => Promise<void>;
  onPickClient: (client: Client) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function FieldsPanel({
  fields,
  clients,
  onChange,
  onSaveClient,
  onPickClient,
}: FieldsPanelProps) {
  const [savingClient, setSavingClient] = useState(false);

  const saveClient = async () => {
    setSavingClient(true);
    try {
      await onSaveClient();
    } finally {
      setSavingClient(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Client Information</CardTitle>
          <Users size={14} className="text-neutral-400" />
        </CardHeader>
        <CardContent className="space-y-3">
          {clients.length > 0 && (
            <Field label="Load from client database">
              <Select
                value=""
                onChange={(e) => {
                  const c = clients.find((x) => x.id === e.target.value);
                  if (c) onPickClient(c);
                }}
              >
                <option value="">Select a saved client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Client Name">
            <Input
              value={fields.clientName}
              onChange={(e) => onChange({ clientName: e.target.value })}
              placeholder="Jane Smith"
            />
          </Field>
          <Field label="Company">
            <Input
              value={fields.company}
              onChange={(e) => onChange({ company: e.target.value })}
              placeholder="Smith Tax Services LLC"
            />
          </Field>
          <Field label="Email Address">
            <Input
              type="email"
              value={fields.clientEmail}
              onChange={(e) => onChange({ clientEmail: e.target.value })}
              placeholder="client@company.com"
            />
          </Field>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!fields.clientName.trim() || savingClient}
            onClick={saveClient}
          >
            <UserPlus size={14} />
            {savingClient ? "Saving…" : "Save to Client Database"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Subject">
            <Input
              value={fields.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
              placeholder="Email subject line"
            />
          </Field>
          <Field label="Document Title (header)">
            <Input
              value={fields.documentTitle}
              onChange={(e) => onChange({ documentTitle: e.target.value })}
            />
          </Field>
          <Field label="Subtitle">
            <Input
              value={fields.documentSubtitle}
              onChange={(e) => onChange({ documentSubtitle: e.target.value })}
            />
          </Field>
          <Field label="Project Name">
            <Input
              value={fields.projectName}
              onChange={(e) => onChange({ projectName: e.target.value })}
              placeholder="Website Development Project"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reference #">
              <Input
                value={fields.referenceNumber}
                onChange={(e) => onChange({ referenceNumber: e.target.value })}
                placeholder="911M-2026-001"
              />
            </Field>
            <Field label="Version">
              <Input
                value={fields.version}
                onChange={(e) => onChange({ version: e.target.value })}
                placeholder="v1.0"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input value={fields.date} onChange={(e) => onChange({ date: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={fields.status} onChange={(e) => onChange({ status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                {!STATUS_OPTIONS.includes(fields.status as (typeof STATUS_OPTIONS)[number]) && (
                  <option value={fields.status}>{fields.status}</option>
                )}
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmation Block</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Heading">
            <Input
              value={fields.approvalHeading}
              onChange={(e) => onChange({ approvalHeading: e.target.value })}
              placeholder="Project Confirmation"
            />
          </Field>
          <Field label="Text (leave empty to hide the block)">
            <Textarea
              rows={4}
              value={fields.approvalText}
              onChange={(e) => onChange({ approvalText: e.target.value })}
              placeholder="What the client should confirm…"
            />
          </Field>
          <Field label="Button Label">
            <Input
              value={fields.approvalButtonText}
              onChange={(e) => onChange({ approvalButtonText: e.target.value })}
              placeholder="Confirm Project Scope"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Signature &amp; Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Sender Name">
            <Input
              value={fields.senderName}
              onChange={(e) => onChange({ senderName: e.target.value })}
            />
          </Field>
          <Field label="Sender Title">
            <Input
              value={fields.senderTitle}
              onChange={(e) => onChange({ senderTitle: e.target.value })}
            />
          </Field>
          <Field label="Footer Note">
            <Textarea
              rows={3}
              value={fields.footerNote}
              onChange={(e) => onChange({ footerNote: e.target.value })}
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
