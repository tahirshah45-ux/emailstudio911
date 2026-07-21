import type { ApprovalStatus, TimelineEventType } from "@/lib/types";

/**
 * Project lifecycle definition — the ordered stages every 911 Makers
 * project moves through, plus display metadata for approval statuses
 * and timeline events. Pure business logic: no UI, no storage.
 */

export const PROJECT_STAGES = [
  "Scope Confirmation",
  "Requirements Collection",
  "Development",
  "Design Review",
  "QA Review",
  "Delivery",
  "Client Acceptance",
  "Closed",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  none: "No Approval Needed",
  pending: "Pending",
  requested: "Approval Requested",
  approved: "Approved",
  rejected: "Rejected",
  needs_revision: "Needs Revision",
};

/** Tailwind classes for approval badges (kept here so labels & colors stay in sync). */
export const APPROVAL_STYLES: Record<ApprovalStatus, string> = {
  none: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  pending: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
  requested: "bg-brand-gold/20 text-brand-gold-dark dark:text-brand-gold",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  needs_revision: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};

export const EVENT_LABELS: Record<TimelineEventType, string> = {
  project_created: "Project Created",
  stage_changed: "Stage Changed",
  email_drafted: "Communication Drafted",
  email_sent: "Communication Sent",
  approval_requested: "Approval Requested",
  approval_approved: "Approved",
  approval_rejected: "Rejected",
  approval_revision: "Revision Requested",
  note: "Note",
  checklist_added: "Checklist Added",
  checklist_completed: "Checklist Completed",
  portal_created: "Portal Created",
  portal_opened: "Portal Opened",
  portal_progress: "Portal Progress",
  files_uploaded: "Files Uploaded",
  files_removed: "Files Removed",
  signature_completed: "Signature Completed",
  portal_submitted: "Submission Completed",
  project_closed: "Project Closed",
  project_reopened: "Project Reopened",
};

/** Timeline dot colors per event type. */
export const EVENT_COLORS: Record<TimelineEventType, string> = {
  project_created: "bg-brand-gold",
  stage_changed: "bg-blue-500",
  email_drafted: "bg-neutral-400",
  email_sent: "bg-brand-black dark:bg-white",
  approval_requested: "bg-brand-gold",
  approval_approved: "bg-green-500",
  approval_rejected: "bg-red-500",
  approval_revision: "bg-orange-500",
  note: "bg-neutral-300 dark:bg-neutral-600",
  checklist_added: "bg-brand-gold/70",
  checklist_completed: "bg-green-500",
  portal_created: "bg-brand-gold",
  portal_opened: "bg-blue-500",
  portal_progress: "bg-blue-400",
  files_uploaded: "bg-brand-gold",
  files_removed: "bg-neutral-400",
  signature_completed: "bg-green-600",
  portal_submitted: "bg-green-500",
  project_closed: "bg-neutral-700",
  project_reopened: "bg-blue-400",
};

/** Maps an approval decision to its timeline event type. */
export function approvalEventType(status: ApprovalStatus): TimelineEventType | null {
  switch (status) {
    case "requested":
      return "approval_requested";
    case "approved":
      return "approval_approved";
    case "rejected":
      return "approval_rejected";
    case "needs_revision":
      return "approval_revision";
    default:
      return null;
  }
}
