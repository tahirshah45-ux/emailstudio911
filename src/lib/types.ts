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
  /** Secure client-portal URL rendered as the email's action button. */
  portalUrl: string;
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
  | "portal_created"
  | "portal_opened"
  | "portal_progress"
  | "files_uploaded"
  | "files_removed"
  | "signature_completed"
  | "portal_submitted"
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
  "Client Submitted",
  "Testing Complete",
  "Ready for Review",
  "Delivered",
  "Completed",
] as const;

/* ------------------------------------------------------------------ */
/* Client Collaboration Portal                                         */
/* ------------------------------------------------------------------ */

export type PortalStatus =
  | "created"
  | "email_sent"
  | "viewed"
  | "in_progress"
  | "draft_saved"
  | "submitted"
  | "approved"
  | "expired"
  | "cancelled";

/**
 * A secure client portal attached to a communication.
 * The document id IS the SHA-256 hash of the secret token — the raw
 * token is returned exactly once at creation and never stored.
 */
export interface ClientPortal {
  id: string;
  projectId: string;
  communicationId: string;
  clientName: string;
  clientEmail: string;
  status: PortalStatus;
  expiresAt: string;
  submissionLocked: boolean;
  portalVersion: string;
  createdAt: string;
  updatedAt: string;
  viewedAt: string | null;
  submittedAt: string | null;
}

export interface ReferenceWebsite {
  id: string;
  url: string;
  reason: string;
  likes: string;
  dislikes: string;
  priority: "High" | "Medium" | "Low";
}

export interface BusinessInformation {
  businessName: string;
  legalName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  timezone: string;
  preferredContact: string;
  website: string;
  socialLinks: string;
  industry: string;
  description: string;
}

export interface ProjectRequirements {
  goals: string;
  targetAudience: string;
  productsServices: string;
  requiredPages: string;
  specialFeatures: string;
  competitors: string;
  existingProblems: string;
  desiredImprovements: string;
  contentAvailability: string;
  futurePlans: string;
  budgetNotes: string;
  deadlineNotes: string;
  specialInstructions: string;
}

export interface ClientSubmission {
  id: string;
  portalId: string;
  projectId: string;
  communicationId: string;
  overviewAcknowledged: boolean;
  business: BusinessInformation;
  requirements: ProjectRequirements;
  references: ReferenceWebsite[];
  completedSections: string[];
  scopeConfirmed: boolean;
  checklistConfirmations: string[];
  declarationAccepted: boolean;
  status: "draft" | "submitted";
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export type DocumentStatus = "uploaded" | "deleted" | "replaced";

export interface ProjectDocument {
  id: string;
  projectId: string;
  communicationId: string;
  portalId: string;
  submissionId: string;
  category: string;
  originalName: string;
  storageName: string;
  extension: string;
  mimeType: string;
  size: number;
  publicId: string;
  resourceType: string;
  secureUrl: string;
  thumbnailUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  status: DocumentStatus;
}

export interface ElectronicSignature {
  id: string;
  projectId: string;
  communicationId: string;
  portalId: string;
  submissionId: string;
  clientName: string;
  clientEmail: string;
  /** PNG data URL of the drawn signature. */
  imageDataUrl: string;
  signedAt: string;
  userAgent: string;
  portalVersion: string;
  status: "signed";
}
