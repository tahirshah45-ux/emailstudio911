"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import type { PortalDocumentView, PortalSession } from "@/lib/portalApi";
import type { BusinessInformation, ProjectRequirements, ReferenceWebsite } from "@/lib/types";
import type { PortalStepId } from "@/lib/domain/portal";
import type { PortalDraft } from "./PortalApp";
import { cn, uid } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared portal UI pieces (light theme, client-facing)                */
/* ------------------------------------------------------------------ */

export function PCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8", className)}>
      {children}
    </div>
  );
}

export function PHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
      {hint && <p className="mt-1 text-sm leading-6 text-neutral-500">{hint}</p>}
    </div>
  );
}

export function PButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "gold" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#0B0B0B] text-white hover:bg-neutral-800",
        variant === "gold" && "bg-[#F2C230] text-[#0B0B0B] hover:bg-[#e0b322]",
        variant === "ghost" && "text-neutral-600 hover:bg-neutral-100"
      )}
    >
      {children}
    </button>
  );
}

export function PNav({
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled,
}: {
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      {onBack ? (
        <PButton variant="ghost" onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </PButton>
      ) : (
        <span />
      )}
      <PButton variant="gold" onClick={onContinue} disabled={continueDisabled}>
        {continueLabel} <ArrowRight size={15} />
      </PButton>
    </div>
  );
}

export function PField({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-neutral-700">
        {label}
        {required && <span className="text-[#B45309]"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-neutral-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#F2C230] focus:outline-none focus:ring-2 focus:ring-[#F2C230]/40";

export function PInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function PTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "min-h-[110px] leading-6", props.className)} />;
}

export function PCheck({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 transition-colors hover:border-[#F2C230]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#F2C230]"
      />
      <span className="text-sm leading-6 text-neutral-700">{children}</span>
    </label>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------------ */
/* Welcome                                                             */
/* ------------------------------------------------------------------ */

export function WelcomeStep({ session, onContinue }: { session: PortalSession; onContinue: () => void }) {
  return (
    <PCard className="text-center">
      <div className="mx-auto mb-6 inline-block rounded-lg border-2 border-[#0B0B0B] bg-[#0B0B0B] px-4 py-2">
        <span className="text-xl font-black tracking-wider text-[#F2C230]">911</span>
        <span className="text-xl font-black tracking-wider text-white">MAKERS</span>
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">
        Welcome{session.client.name ? `, ${session.client.name}` : ""}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
        You&apos;ve been invited to collaborate on your project. Review the scope, share your
        business details, and upload your files — all in one secure place. The more you share,
        the better the final result.
      </p>
      <div className="mx-auto mt-6 max-w-sm rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left text-sm">
        <div className="flex justify-between py-1">
          <span className="text-neutral-500">Project</span>
          <span className="font-semibold">{session.project.name}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-neutral-500">Reference</span>
          <span className="font-mono text-xs font-semibold">{session.project.referenceNumber}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-neutral-500">Estimated time</span>
          <span className="font-semibold">15–25 minutes</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-neutral-500">Progress</span>
          <span className="font-semibold">Saved automatically</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        You can close this page at any time — your progress is saved and this link brings you back.
      </p>
      <div className="mt-6">
        <PButton variant="gold" onClick={onContinue}>
          Get Started <ArrowRight size={15} />
        </PButton>
      </div>
    </PCard>
  );
}

/* ------------------------------------------------------------------ */
/* Project overview                                                    */
/* ------------------------------------------------------------------ */

export function OverviewStep({
  session,
  acknowledged,
  onAcknowledge,
  onBack,
  onContinue,
}: {
  session: PortalSession;
  acknowledged: boolean;
  onAcknowledge: (v: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <PCard>
      <PHeading
        title="Project Overview"
        hint="Please review the project details below. This is what 911 Makers will deliver."
      />
      <div className="mb-5 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Project</div>
          <div className="font-semibold">{session.project.name}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Reference</div>
          <div className="font-mono text-xs font-semibold">{session.project.referenceNumber}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Document</div>
          <div className="font-semibold">{session.communication.title}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Date</div>
          <div className="font-semibold">{session.communication.date}</div>
        </div>
      </div>
      {session.project.description && (
        <p className="mb-5 text-sm leading-6 text-neutral-600">{session.project.description}</p>
      )}
      <div
        className="studio-editor mb-6 max-h-[420px] overflow-y-auto rounded-xl border border-neutral-200 p-5 text-[15px]"
        dangerouslySetInnerHTML={{ __html: session.communication.contentHtml }}
      />
      <PCheck checked={acknowledged} onChange={onAcknowledge}>
        <strong>I have reviewed this project overview.</strong> I understand the scope of work
        described above.
      </PCheck>
      <PNav onBack={onBack} onContinue={onContinue} continueDisabled={!acknowledged} />
    </PCard>
  );
}

/* ------------------------------------------------------------------ */
/* Business information                                                */
/* ------------------------------------------------------------------ */

export function BusinessStep({
  business,
  onChange,
  onBack,
  onContinue,
}: {
  business: BusinessInformation;
  onChange: (b: BusinessInformation) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [touched, setTouched] = useState(false);
  const set = (k: keyof BusinessInformation) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...business, [k]: e.target.value });

  const nameError = touched && !business.businessName.trim() ? "Please enter your business name." : undefined;
  const emailError =
    touched && (!business.email.trim() || !EMAIL_RE.test(business.email))
      ? "Please enter a valid email address."
      : undefined;

  const tryContinue = () => {
    setTouched(true);
    if (!business.businessName.trim() || !EMAIL_RE.test(business.email)) return;
    onContinue();
  };

  return (
    <PCard>
      <PHeading
        title="Tell us about your business"
        hint="This information appears on your website and helps us represent your business accurately."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PField label="Business Name" required error={nameError}>
          <PInput value={business.businessName} onChange={set("businessName")} placeholder="Acme Tax Services" />
        </PField>
        <PField label="Legal Business Name">
          <PInput value={business.legalName} onChange={set("legalName")} placeholder="Acme Tax Services LLC" />
        </PField>
        <PField label="Contact Person">
          <PInput value={business.contactPerson} onChange={set("contactPerson")} />
        </PField>
        <PField label="Email" required error={emailError}>
          <PInput type="email" value={business.email} onChange={set("email")} placeholder="you@business.com" />
        </PField>
        <PField label="Phone">
          <PInput type="tel" value={business.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" />
        </PField>
        <PField label="Preferred Contact Method">
          <PInput value={business.preferredContact} onChange={set("preferredContact")} placeholder="Email / Phone / WhatsApp" />
        </PField>
        <PField label="Address">
          <PInput value={business.address} onChange={set("address")} />
        </PField>
        <PField label="City">
          <PInput value={business.city} onChange={set("city")} />
        </PField>
        <PField label="State / Province">
          <PInput value={business.state} onChange={set("state")} />
        </PField>
        <PField label="Postal Code">
          <PInput value={business.postalCode} onChange={set("postalCode")} />
        </PField>
        <PField label="Country">
          <PInput value={business.country} onChange={set("country")} />
        </PField>
        <PField label="Timezone">
          <PInput value={business.timezone} onChange={set("timezone")} placeholder="e.g. Eastern Time (US)" />
        </PField>
        <PField label="Current Website (if any)">
          <PInput type="url" value={business.website} onChange={set("website")} placeholder="https://" />
        </PField>
        <PField label="Industry">
          <PInput value={business.industry} onChange={set("industry")} placeholder="e.g. Tax & Accounting" />
        </PField>
      </div>
      <div className="mt-4 space-y-4">
        <PField label="Social Media Links" hint="One per line.">
          <PTextarea value={business.socialLinks} onChange={set("socialLinks")} placeholder={"https://facebook.com/…\nhttps://instagram.com/…"} />
        </PField>
        <PField label="Business Description" hint="What do you do, and what makes you different?">
          <PTextarea value={business.description} onChange={set("description")} />
        </PField>
      </div>
      <PNav onBack={onBack} onContinue={tryContinue} />
    </PCard>
  );
}

/* ------------------------------------------------------------------ */
/* Project requirements                                                */
/* ------------------------------------------------------------------ */

const REQUIREMENT_FIELDS: { key: keyof ProjectRequirements; label: string; hint?: string }[] = [
  { key: "goals", label: "Business Goals", hint: "What should this project achieve for your business?" },
  { key: "targetAudience", label: "Target Audience", hint: "Who are your customers?" },
  { key: "productsServices", label: "Products & Services", hint: "What do you offer?" },
  { key: "requiredPages", label: "Required Pages", hint: "e.g. Home, About, Services, Contact…" },
  { key: "specialFeatures", label: "Special Features", hint: "Booking, forms, uploads, e-sign…" },
  { key: "competitors", label: "Competitors", hint: "Who competes with you? Links welcome." },
  { key: "existingProblems", label: "Existing Problems", hint: "What isn't working today?" },
  { key: "desiredImprovements", label: "Desired Improvements" },
  { key: "contentAvailability", label: "Content Availability", hint: "Do you have text/images ready, or do you need help?" },
  { key: "futurePlans", label: "Future Plans" },
  { key: "budgetNotes", label: "Budget Notes (optional)" },
  { key: "deadlineNotes", label: "Deadline Notes" },
  { key: "specialInstructions", label: "Special Instructions" },
];

export function RequirementsStep({
  requirements,
  onChange,
  onBack,
  onContinue,
}: {
  requirements: ProjectRequirements;
  onChange: (r: ProjectRequirements) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <PCard>
      <PHeading
        title="Project Requirements"
        hint="The more information you provide, the better the final result. Every field is optional — share what you can."
      />
      <div className="space-y-4">
        {REQUIREMENT_FIELDS.map((f) => (
          <PField key={f.key} label={f.label} hint={f.hint}>
            <PTextarea
              value={requirements[f.key]}
              onChange={(e) => onChange({ ...requirements, [f.key]: e.target.value })}
            />
          </PField>
        ))}
      </div>
      <PNav onBack={onBack} onContinue={onContinue} />
    </PCard>
  );
}

/* ------------------------------------------------------------------ */
/* Reference websites                                                  */
/* ------------------------------------------------------------------ */

export function ReferencesStep({
  references,
  onChange,
  onBack,
  onContinue,
}: {
  references: ReferenceWebsite[];
  onChange: (r: ReferenceWebsite[]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const add = () =>
    onChange([
      ...references,
      { id: uid(), url: "", reason: "", likes: "", dislikes: "", priority: "Medium" },
    ]);
  const update = (id: string, patch: Partial<ReferenceWebsite>) =>
    onChange(references.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => onChange(references.filter((r) => r.id !== id));

  return (
    <PCard>
      <PHeading
        title="Reference Websites"
        hint="Share examples you like. Tell us what you like or dislike about each — this shapes the design direction."
      />
      <div className="space-y-4">
        {references.map((r, i) => (
          <div key={r.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                Reference {i + 1}
              </span>
              <button
                className="text-neutral-400 hover:text-red-600"
                onClick={() => remove(r.id)}
                title="Remove reference"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <PField label="Website URL">
                <PInput
                  type="url"
                  value={r.url}
                  onChange={(e) => update(r.id, { url: e.target.value })}
                  placeholder="https://example.com"
                />
              </PField>
              <PField label="Priority">
                <select
                  className={inputCls}
                  value={r.priority}
                  onChange={(e) => update(r.id, { priority: e.target.value as ReferenceWebsite["priority"] })}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </PField>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <PField label="Why this site?">
                <PTextarea className="min-h-[70px]" value={r.reason} onChange={(e) => update(r.id, { reason: e.target.value })} />
              </PField>
              <PField label="What you like">
                <PTextarea className="min-h-[70px]" value={r.likes} onChange={(e) => update(r.id, { likes: e.target.value })} />
              </PField>
              <PField label="What you dislike">
                <PTextarea className="min-h-[70px]" value={r.dislikes} onChange={(e) => update(r.id, { dislikes: e.target.value })} />
              </PField>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 py-3 text-sm font-semibold text-neutral-500 transition-colors hover:border-[#F2C230] hover:text-neutral-700"
      >
        <Plus size={15} /> Add Reference Website
      </button>
      <PNav onBack={onBack} onContinue={onContinue} />
    </PCard>
  );
}

/* ------------------------------------------------------------------ */
/* Review                                                              */
/* ------------------------------------------------------------------ */

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">{title}</span>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900"
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
      <div className="text-sm leading-6 text-neutral-700">{children}</div>
    </div>
  );
}

function kv(label: string, value: string) {
  if (!value.trim()) return null;
  return (
    <div key={label} className="flex gap-2 py-0.5">
      <span className="w-40 shrink-0 text-neutral-400">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}

export function ReviewStep({
  session,
  draft,
  documents,
  onEdit,
  onBack,
  onContinue,
}: {
  session: PortalSession;
  draft: PortalDraft;
  documents: PortalDocumentView[];
  onEdit: (s: PortalStepId) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const b = draft.business;
  const r = draft.requirements;
  return (
    <PCard>
      <PHeading
        title="Review Your Submission"
        hint="Please check everything below. Use Edit to make changes — nothing can be edited on this page."
      />
      <div className="space-y-4">
        <ReviewBlock title="Project Overview" onEdit={() => onEdit("overview")}>
          {session.project.name} · {session.project.referenceNumber}
          <div className="text-xs text-green-600">✓ Reviewed and acknowledged</div>
        </ReviewBlock>
        <ReviewBlock title="Business Information" onEdit={() => onEdit("business")}>
          {kv("Business", b.businessName)}
          {kv("Legal Name", b.legalName)}
          {kv("Contact", b.contactPerson)}
          {kv("Email", b.email)}
          {kv("Phone", b.phone)}
          {kv("Location", [b.city, b.state, b.country].filter(Boolean).join(", "))}
          {kv("Website", b.website)}
          {kv("Industry", b.industry)}
          {kv("Description", b.description)}
        </ReviewBlock>
        <ReviewBlock title="Project Requirements" onEdit={() => onEdit("requirements")}>
          {REQUIREMENT_FIELDS.map((f) => kv(f.label, r[f.key]))}
          {REQUIREMENT_FIELDS.every((f) => !r[f.key].trim()) && (
            <span className="text-neutral-400">No requirements provided.</span>
          )}
        </ReviewBlock>
        <ReviewBlock title="Reference Websites" onEdit={() => onEdit("references")}>
          {draft.references.length === 0 && <span className="text-neutral-400">No references added.</span>}
          {draft.references.map((ref) => (
            <div key={ref.id} className="py-0.5">
              <span className="font-medium">{ref.url || "(no URL)"}</span>
              <span className="text-neutral-400"> · {ref.priority} priority</span>
            </div>
          ))}
        </ReviewBlock>
        <ReviewBlock title="Uploaded Files" onEdit={() => onEdit("uploads")}>
          {documents.length === 0 && <span className="text-neutral-400">No files uploaded.</span>}
          {documents.map((d) => (
            <div key={d.id} className="py-0.5">
              <span className="font-medium">{d.originalName}</span>
              <span className="text-neutral-400"> · {d.category} · {(d.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          ))}
        </ReviewBlock>
      </div>
      <PNav onBack={onBack} onContinue={onContinue} continueLabel="Continue to Signature" />
    </PCard>
  );
}

/* ------------------------------------------------------------------ */
/* Success                                                             */
/* ------------------------------------------------------------------ */

export function SuccessScreen({
  projectName,
  referenceNumber,
  submittedAt,
}: {
  projectName: string;
  referenceNumber: string;
  submittedAt: string;
  supportEmail?: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <PCard className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Thank You!</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Your submission is complete. The 911 Makers team has received everything and will begin
          the internal review.
        </p>
        <div className="mx-auto mt-6 max-w-xs rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left text-sm">
          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Project</span>
            <span className="font-semibold">{projectName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Reference</span>
            <span className="font-mono text-xs font-semibold">{referenceNumber}</span>
          </div>
          {submittedAt && (
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Submitted</span>
              <span className="font-semibold">{new Date(submittedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
        <p className="mt-6 text-sm leading-6 text-neutral-500">
          <strong>Next steps:</strong> we review your information and files, then contact you with
          the project plan. If anything is missing, we&apos;ll reach out by email.
        </p>
        <p className="mt-4 text-xs text-neutral-400">
          Questions? Simply reply to the email that brought you here.
        </p>
      </PCard>
    </div>
  );
}
