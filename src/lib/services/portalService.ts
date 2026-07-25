import "server-only";
import {
  CLIENT_DECLARATION,
  emptyBusinessInformation,
  emptyProjectRequirements,
  PORTAL_VERSION,
  validateFile,
} from "@/lib/domain/portal";
import { generatePortalToken, hashToken, looksLikeToken } from "@/lib/security/tokens";
import { COLLECTIONS, newId, repo } from "@/lib/store";
import { addEvent } from "@/lib/store/events";
import { getStorageProvider } from "@/lib/storage-service";
import type {
  ApprovalRecord,
  Checklist,
  ClientPortal,
  ClientSubmission,
  ElectronicSignature,
  EmailDocument,
  Project,
  ProjectDocument,
} from "@/lib/types";

/**
 * Portal application service — ALL portal business logic lives here.
 * API routes stay thin; UI never touches Firestore.
 *
 * Firestore collections used: client_portals (doc id = token hash),
 * client_submissions, project_documents, electronic_signatures,
 * approvals, timeline_events.
 */

const PORTALS = "client_portals";
const SUBMISSIONS = "client_submissions";
const DOCUMENTS = "project_documents";
const SIGNATURES = "electronic_signatures";

export class PortalError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid"
      | "expired"
      | "cancelled"
      | "submitted"
      | "validation"
      | "storage",
    public readonly httpStatus: number = 400
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------------ */
/* Creation (admin)                                                    */
/* ------------------------------------------------------------------ */

export async function createPortal(opts: {
  projectId: string;
  communicationId: string;
  expiresInDays?: number;
  origin: string;
}): Promise<{ portal: ClientPortal; url: string }> {
  const project = await repo.get<Project>(COLLECTIONS.projects, opts.projectId);
  if (!project) throw new PortalError("Project not found.", "invalid", 404);
  const comm = await repo.get<EmailDocument>(COLLECTIONS.communications, opts.communicationId);
  if (!comm || comm.projectId !== project.id) {
    throw new PortalError("Communication not found for this project.", "invalid", 404);
  }

  const token = generatePortalToken();
  const now = new Date().toISOString();
  const days = opts.expiresInDays && opts.expiresInDays > 0 ? opts.expiresInDays : 30;
  const portal: ClientPortal = {
    id: hashToken(token),
    projectId: project.id,
    communicationId: comm.id,
    clientName: comm.clientName || project.clientName,
    clientEmail: comm.clientEmail || project.clientEmail,
    status: "created",
    expiresAt: new Date(Date.now() + days * 86400_000).toISOString(),
    submissionLocked: false,
    portalVersion: PORTAL_VERSION,
    createdAt: now,
    updatedAt: now,
    viewedAt: null,
    submittedAt: null,
  };
  await repo.set(PORTALS, portal.id, portal);

  // The submission shell is created up front so the client always resumes
  // the same record.
  const submission: ClientSubmission = {
    id: newId(),
    portalId: portal.id,
    projectId: project.id,
    communicationId: comm.id,
    overviewAcknowledged: false,
    business: emptyBusinessInformation(),
    requirements: emptyProjectRequirements(),
    references: [],
    completedSections: [],
    scopeConfirmed: false,
    checklistConfirmations: [],
    declarationAccepted: false,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
  };
  await repo.set(SUBMISSIONS, submission.id, submission);

  await addEvent(
    project.id,
    "portal_created",
    `Client portal created for "${comm.subject || comm.documentTitle}" (expires ${new Date(portal.expiresAt).toLocaleDateString()}).`,
    comm.id
  );

  return { portal, url: `${opts.origin}/client-portal/${token}` };
}

/* ------------------------------------------------------------------ */
/* Resolution & session                                                */
/* ------------------------------------------------------------------ */

async function resolvePortal(token: string): Promise<ClientPortal> {
  if (!looksLikeToken(token)) {
    throw new PortalError("This link is not valid. Please use the link from your email.", "invalid", 404);
  }
  const portal = await repo.get<ClientPortal>(PORTALS, hashToken(token));
  if (!portal) {
    throw new PortalError("This link is not valid. Please use the link from your email.", "invalid", 404);
  }
  if (portal.status === "cancelled") {
    throw new PortalError("This request has been cancelled. Please contact 911 Makers.", "cancelled", 410);
  }
  if (new Date(portal.expiresAt).getTime() < Date.now() && portal.status !== "submitted" && portal.status !== "approved") {
    if (portal.status !== "expired") {
      await repo.set(PORTALS, portal.id, { ...portal, status: "expired", updatedAt: new Date().toISOString() });
    }
    throw new PortalError(
      "This link has expired. Please contact 911 Makers for a new link.",
      "expired",
      410
    );
  }
  return portal;
}

async function submissionForPortal(portalId: string): Promise<ClientSubmission> {
  const [found] = await repo.query<ClientSubmission>(SUBMISSIONS, "portalId", portalId);
  if (!found) throw new PortalError("This link is not valid.", "invalid", 404);
  return found;
}

async function documentsForPortal(portalId: string): Promise<ProjectDocument[]> {
  const docs = await repo.query<ProjectDocument>(DOCUMENTS, "portalId", portalId);
  return docs
    .filter((d) => d.status === "uploaded")
    .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
}

/** Full collaboration session — only client-safe fields, no internal ids beyond what the client owns. */
export async function getSession(token: string) {
  const portal = await resolvePortal(token);
  const [project, comm, submission, documents, projectChecklists] = await Promise.all([
    repo.get<Project>(COLLECTIONS.projects, portal.projectId),
    repo.get<EmailDocument>(COLLECTIONS.communications, portal.communicationId),
    submissionForPortal(portal.id),
    documentsForPortal(portal.id),
    repo.query<Checklist>(COLLECTIONS.checklists, "projectId", portal.projectId),
  ]);
  if (!project || !comm) throw new PortalError("This link is not valid.", "invalid", 404);

  // First open: record it.
  if (!portal.viewedAt) {
    const now = new Date().toISOString();
    await repo.set(PORTALS, portal.id, { ...portal, status: "viewed", viewedAt: now, updatedAt: now });
    await addEvent(portal.projectId, "portal_opened", `Client opened the collaboration portal.`, comm.id);
  }

  const checklistItems = projectChecklists.flatMap((c) =>
    c.items.map((i) => ({ id: i.id, group: c.name, text: i.text }))
  );

  return {
    status: portal.submissionLocked ? "submitted" : portal.status,
    locked: portal.submissionLocked,
    expiresAt: portal.expiresAt,
    portalVersion: portal.portalVersion,
    project: {
      name: project.name,
      referenceNumber: project.referenceNumber,
      description: project.description,
      stage: project.stage,
    },
    client: { name: portal.clientName, email: portal.clientEmail },
    communication: {
      title: comm.documentTitle,
      subtitle: comm.documentSubtitle,
      date: comm.date,
      contentHtml: comm.contentHtml,
      version: comm.version,
    },
    checklist: checklistItems,
    declaration: CLIENT_DECLARATION,
    submission: {
      overviewAcknowledged: submission.overviewAcknowledged,
      business: submission.business,
      requirements: submission.requirements,
      references: submission.references,
      completedSections: submission.completedSections,
      scopeConfirmed: submission.scopeConfirmed,
      checklistConfirmations: submission.checklistConfirmations,
      declarationAccepted: submission.declarationAccepted,
      status: submission.status,
      submittedAt: submission.submittedAt,
    },
    documents: documents.map((d) => ({
      id: d.id,
      category: d.category,
      originalName: d.originalName,
      size: d.size,
      mimeType: d.mimeType,
      thumbnailUrl: d.thumbnailUrl,
      secureUrl: d.secureUrl,
      uploadedAt: d.uploadedAt,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Draft saving                                                        */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function saveDraft(
  token: string,
  patch: Partial<
    Pick<
      ClientSubmission,
      | "overviewAcknowledged"
      | "business"
      | "requirements"
      | "references"
      | "completedSections"
      | "scopeConfirmed"
      | "checklistConfirmations"
      | "declarationAccepted"
    >
  >,
  completedSection?: string
) {
  const portal = await resolvePortal(token);
  if (portal.submissionLocked) {
    throw new PortalError("This submission has already been completed.", "submitted", 409);
  }
  if (patch.business?.email && !EMAIL_RE.test(patch.business.email)) {
    throw new PortalError("Please enter a valid email address.", "validation");
  }

  const submission = await submissionForPortal(portal.id);
  const now = new Date().toISOString();
  const next: ClientSubmission = {
    ...submission,
    ...patch,
    business: { ...submission.business, ...(patch.business ?? {}) },
    requirements: { ...submission.requirements, ...(patch.requirements ?? {}) },
    updatedAt: now,
  };
  await repo.set(SUBMISSIONS, next.id, next);

  if (portal.status === "viewed" || portal.status === "created" || portal.status === "email_sent") {
    await repo.set(PORTALS, portal.id, { ...portal, status: "in_progress", updatedAt: now });
  }

  // Milestone events only (no autosave spam).
  if (completedSection) {
    const labels: Record<string, string> = {
      overview: "Project overview reviewed",
      business: "Business information completed",
      requirements: "Project requirements completed",
      references: "Reference websites added",
      uploads: "File uploads completed",
    };
    const label = labels[completedSection];
    if (label && !submission.completedSections.includes(completedSection)) {
      await addEvent(portal.projectId, "portal_progress", `${label} by the client.`, portal.communicationId);
    }
  }

  return { savedAt: now };
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export async function signDocumentUpload(
  token: string,
  file: { filename: string; mimeType: string; size: number; category: string }
) {
  const portal = await resolvePortal(token);
  if (portal.submissionLocked) {
    throw new PortalError("This submission has already been completed.", "submitted", 409);
  }
  const error = validateFile(file);
  if (error) throw new PortalError(error, "validation");

  const storage = getStorageProvider();
  if (!storage.isConfigured()) {
    throw new PortalError(
      "File uploads are not available right now. Please contact 911 Makers.",
      "storage",
      503
    );
  }
  return storage.signUpload({
    projectId: portal.projectId,
    category: file.category,
    filename: file.filename,
    mimeType: file.mimeType,
  });
}

export async function registerDocument(
  token: string,
  meta: {
    category: string;
    originalName: string;
    mimeType: string;
    size: number;
    publicId: string;
    resourceType: string;
    secureUrl: string;
  }
): Promise<ProjectDocument> {
  const portal = await resolvePortal(token);
  if (portal.submissionLocked) {
    throw new PortalError("This submission has already been completed.", "submitted", 409);
  }
  const error = validateFile({ filename: meta.originalName, mimeType: meta.mimeType, size: meta.size });
  if (error) throw new PortalError(error, "validation");
  if (!meta.secureUrl.startsWith("https://res.cloudinary.com/")) {
    throw new PortalError("The uploaded file could not be verified.", "validation");
  }

  const submission = await submissionForPortal(portal.id);
  const storage = getStorageProvider();
  const now = new Date().toISOString();
  const doc: ProjectDocument = {
    id: newId(),
    projectId: portal.projectId,
    communicationId: portal.communicationId,
    portalId: portal.id,
    submissionId: submission.id,
    category: meta.category,
    originalName: meta.originalName,
    storageName: meta.publicId.split("/").pop() ?? meta.publicId,
    extension: meta.originalName.split(".").pop()?.toLowerCase() ?? "",
    mimeType: meta.mimeType,
    size: meta.size,
    publicId: meta.publicId,
    resourceType: meta.resourceType,
    secureUrl: meta.secureUrl,
    thumbnailUrl: storage.thumbnailUrl(meta.secureUrl, meta.resourceType),
    uploadedBy: portal.clientName || "Client",
    uploadedAt: now,
    lastModified: now,
    status: "uploaded",
  };
  await repo.set(DOCUMENTS, doc.id, doc);
  await addEvent(
    portal.projectId,
    "files_uploaded",
    `${doc.category} uploaded: "${doc.originalName}".`,
    portal.communicationId
  );
  return doc;
}

export async function removeDocument(token: string, documentId: string): Promise<void> {
  const portal = await resolvePortal(token);
  if (portal.submissionLocked) {
    throw new PortalError("This submission has already been completed.", "submitted", 409);
  }
  const doc = await repo.get<ProjectDocument>(DOCUMENTS, documentId);
  if (!doc || doc.portalId !== portal.id || doc.status !== "uploaded") {
    throw new PortalError("File not found.", "invalid", 404);
  }
  const storage = getStorageProvider();
  await storage.deleteFile(doc.publicId, doc.resourceType).catch(() => {
    /* metadata removal proceeds; orphan cleanup is a storage-side concern */
  });
  await repo.set(DOCUMENTS, doc.id, { ...doc, status: "deleted", lastModified: new Date().toISOString() });
  await addEvent(portal.projectId, "files_removed", `File removed: "${doc.originalName}".`, portal.communicationId);
}

/* ------------------------------------------------------------------ */
/* Final submission                                                    */
/* ------------------------------------------------------------------ */

export async function submit(
  token: string,
  payload: {
    scopeConfirmed: boolean;
    checklistConfirmations: string[];
    declarationAccepted: boolean;
    signatureDataUrl: string;
    userAgent: string;
  }
) {
  const portal = await resolvePortal(token);
  if (portal.submissionLocked) {
    throw new PortalError("This submission has already been completed.", "submitted", 409);
  }
  const submission = await submissionForPortal(portal.id);

  // Server-side validation — client-side checks are never trusted alone.
  if (!submission.overviewAcknowledged) {
    throw new PortalError("Please review and acknowledge the project overview first.", "validation");
  }
  if (!submission.business.businessName.trim()) {
    throw new PortalError("Please provide your business name before submitting.", "validation");
  }
  if (!submission.business.email.trim() || !EMAIL_RE.test(submission.business.email)) {
    throw new PortalError("Please provide a valid contact email before submitting.", "validation");
  }
  if (!payload.scopeConfirmed) {
    throw new PortalError("Please confirm the project scope.", "validation");
  }
  if (!payload.declarationAccepted) {
    throw new PortalError("Please accept the declaration.", "validation");
  }
  if (!payload.signatureDataUrl.startsWith("data:image/png;base64,") || payload.signatureDataUrl.length < 1000) {
    throw new PortalError("Please draw your signature before submitting.", "validation");
  }

  const now = new Date().toISOString();

  // 1. Immutable signature record.
  const signature: ElectronicSignature = {
    id: newId(),
    projectId: portal.projectId,
    communicationId: portal.communicationId,
    portalId: portal.id,
    submissionId: submission.id,
    clientName: portal.clientName,
    clientEmail: portal.clientEmail,
    imageDataUrl: payload.signatureDataUrl,
    signedAt: now,
    userAgent: payload.userAgent.slice(0, 400),
    portalVersion: portal.portalVersion,
    status: "signed",
  };
  await repo.set(SIGNATURES, signature.id, signature);

  // 2. Immutable approval record (never overwritten).
  const approval: ApprovalRecord = {
    id: newId(),
    communicationId: portal.communicationId,
    projectId: portal.projectId,
    status: "approved",
    note: "Client portal submission: scope confirmed, declaration accepted, electronically signed.",
    user: portal.clientName || "Client",
    at: now,
  };
  await repo.set(COLLECTIONS.approvals, approval.id, approval);

  // 3. Lock the submission.
  await repo.set(SUBMISSIONS, submission.id, {
    ...submission,
    scopeConfirmed: true,
    checklistConfirmations: payload.checklistConfirmations,
    declarationAccepted: true,
    status: "submitted",
    submittedAt: now,
    updatedAt: now,
  });
  await repo.set(PORTALS, portal.id, {
    ...portal,
    status: "submitted",
    submissionLocked: true,
    submittedAt: now,
    updatedAt: now,
  });

  // 4. Communication Center synchronization.
  const comm = await repo.get<EmailDocument>(COLLECTIONS.communications, portal.communicationId);
  if (comm) {
    await repo.set(COLLECTIONS.communications, comm.id, {
      ...comm,
      status: "Client Submitted",
      approvalStatus: "approved",
      updatedAt: now,
    });
  }

  // 5. Timeline.
  await addEvent(portal.projectId, "approval_approved", `Scope confirmed by ${portal.clientName} via the client portal.`, portal.communicationId);
  await addEvent(portal.projectId, "signature_completed", `Electronic signature completed by ${portal.clientName}.`, portal.communicationId);
  await addEvent(portal.projectId, "portal_submitted", `Client submission completed — ready for internal review.`, portal.communicationId);

  return { submittedAt: now, referenceNumber: (await repo.get<Project>(COLLECTIONS.projects, portal.projectId))?.referenceNumber ?? "" };
}

/* ------------------------------------------------------------------ */
/* Admin summary                                                       */
/* ------------------------------------------------------------------ */

export async function collaborationForProject(projectId: string) {
  const [portals, submissions, documents, signatures] = await Promise.all([
    repo.query<ClientPortal>(PORTALS, "projectId", projectId),
    repo.query<ClientSubmission>(SUBMISSIONS, "projectId", projectId),
    repo.query<ProjectDocument>(DOCUMENTS, "projectId", projectId),
    repo.query<ElectronicSignature>(SIGNATURES, "projectId", projectId),
  ]);
  return {
    portals: portals
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ id, ...rest }) => ({ id: id.slice(0, 8), ...rest, tokenHashPrefix: id.slice(0, 8) })),
    submissions: submissions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    documents: documents
      .filter((d) => d.status === "uploaded")
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    signatures: signatures.sort((a, b) => b.signedAt.localeCompare(a.signedAt)),
  };
}
