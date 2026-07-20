/** Shared domain types for the 911 Makers Client Communication Center. */

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export type ProjectStatus = "active" | "closed";

export interface Project {
  id: string;
  name: string;
  description: string;
  clientName: string;
  company: string;
  clientEmail: string;
  referenceNumber: string;
  stage: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Communications (official project emails)                            */
/* ------------------------------------------------------------------ */

/** Client approval lifecycle for communications that require sign-off. */
export type ApprovalStatus =
  | "none"
  | "pending"
  | "requested"
  | "approved"
  | "rejected"
  | "needs_revision";

/** Every editable field that defines one communication. */
export interface EmailFields {
  projectId: string | null;
  templateId: string;
  subject: string;
  documentTitle: string;
  documentSubtitle: string;
  clientName: string;
  company: string;
  clientEmail: string;
  projectName: string;
  referenceNumber: string;
  version: string;
  status: string;
  date: string;
  /** Rich-text (TipTap) HTML for the main content area. */
  contentHtml: string;
  approvalHeading: string;
  approvalText: string;
  approvalButtonText: string;
  footerNote: string;
  senderName: string;
  senderTitle: string;
}

export interface VersionSnapshot {
  version: number;
  savedAt: string;
  fields: EmailFields;
}

export interface EmailDocument extends EmailFields {
  id: string;
  createdAt: string;
  updatedAt: string;
  history: VersionSnapshot[];
  approvalStatus: ApprovalStatus;
  sentAt: string | null;
  sentTo: string | null;
}

/* ------------------------------------------------------------------ */
/* Timeline (project communication history)                            */
/* ------------------------------------------------------------------ */

export type TimelineEventType =
  | "project_created"
  | "stage_changed"
  | "email_drafted"
  | "email_sent"
  | "approval_requested"
  | "approval_approved"
  | "approval_rejected"
  | "approval_revision"
  | "note"
  | "checklist_added"
  | "checklist_completed"
  | "project_closed"
  | "project_reopened";

export interface TimelineEvent {
  id: string;
  projectId: string;
  communicationId: string | null;
  type: TimelineEventType;
  description: string;
  at: string;
}

/* ------------------------------------------------------------------ */
/* Approval records (audit trail)                                      */
/* ------------------------------------------------------------------ */

/** Immutable record of every approval decision — who, when, what, why. */
export interface ApprovalRecord {
  id: string;
  communicationId: string;
  projectId: string | null;
  status: ApprovalStatus;
  note: string;
  user: string;
  at: string;
}

/* ------------------------------------------------------------------ */
/* Checklists                                                          */
/* ------------------------------------------------------------------ */

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  projectId: string;
  name: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export const CHECKLIST_PRESETS = [
  "Pages",
  "Features",
  "Forms",
  "Branding",
  "Assets",
  "Timeline",
  "Deliverables",
  "Approval Items",
] as const;

/* ------------------------------------------------------------------ */
/* Application settings                                                */
/* ------------------------------------------------------------------ */

/** Editable sender identity — managed from the Settings page, no code changes. */
export interface AppSettings {
  id: string;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  updatedAt: string;
}

export const SETTINGS_DOC_ID = "main";

/* ------------------------------------------------------------------ */

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  defaults: Partial<EmailFields>;
}

export const STATUS_OPTIONS = [
  "Draft",
  "Awaiting Client Confirmation",
  "Information Requested",
  "Awaiting Approval",
  "In Progress",
  "Testing Complete",
  "Ready for Review",
  "Delivered",
  "Completed",
] as const;
