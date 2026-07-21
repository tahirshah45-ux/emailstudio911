import type { BusinessInformation, ProjectRequirements } from "@/lib/types";

/**
 * Client Collaboration Portal — domain definitions.
 * Pure business logic: no UI, no storage, no framework imports.
 */

export const PORTAL_VERSION = "1.0";

/** Ordered portal steps shown to the client. */
export const PORTAL_STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "overview", label: "Project Overview" },
  { id: "business", label: "Business Information" },
  { id: "requirements", label: "Project Requirements" },
  { id: "references", label: "Reference Websites" },
  { id: "uploads", label: "File Uploads" },
  { id: "review", label: "Review" },
  { id: "sign", label: "Electronic Signature" },
] as const;

export type PortalStepId = (typeof PORTAL_STEPS)[number]["id"];

/** Document categories a client can upload into. */
export const DOCUMENT_CATEGORIES = [
  "Logo",
  "Brand Guidelines",
  "Business Documents",
  "Content",
  "Product Images",
  "Team Photos",
  "Reference Images",
  "Marketing Material",
  "Contracts",
  "Legal Documents",
  "Design Assets",
  "Other",
] as const;

/** Allowed upload types: extension → acceptable MIME types. */
export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  svg: ["image/svg+xml"],
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
  rtf: ["application/rtf", "text/rtf"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  zip: ["application/zip", "application/x-zip-compressed"],
  rar: ["application/vnd.rar", "application/x-rar-compressed", "application/octet-stream"],
};

export const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 25);

export interface FileValidationInput {
  filename: string;
  mimeType: string;
  size: number;
}

/** Returns a client-friendly error message, or null when the file is valid. */
export function validateFile(f: FileValidationInput): string | null {
  const ext = f.filename.split(".").pop()?.toLowerCase() ?? "";
  const allowed = ALLOWED_FILE_TYPES[ext];
  if (!allowed) {
    return `"${f.filename}" is not a supported file type. Supported: ${Object.keys(ALLOWED_FILE_TYPES).join(", ").toUpperCase()}.`;
  }
  if (!allowed.includes(f.mimeType) && f.mimeType !== "application/octet-stream") {
    return `"${f.filename}" does not look like a valid ${ext.toUpperCase()} file.`;
  }
  if (f.size <= 0) {
    return `"${f.filename}" appears to be empty.`;
  }
  if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `"${f.filename}" is larger than the ${MAX_UPLOAD_MB} MB limit.`;
  }
  return null;
}

/** Cloudinary resource type for a MIME type. */
export function resourceTypeFor(mimeType: string): "image" | "video" | "raw" {
  if (mimeType.startsWith("image/") && mimeType !== "image/svg+xml") return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
}

export function emptyBusinessInformation(): BusinessInformation {
  return {
    businessName: "",
    legalName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
    timezone: "",
    preferredContact: "",
    website: "",
    socialLinks: "",
    industry: "",
    description: "",
  };
}

export function emptyProjectRequirements(): ProjectRequirements {
  return {
    goals: "",
    targetAudience: "",
    productsServices: "",
    requiredPages: "",
    specialFeatures: "",
    competitors: "",
    existingProblems: "",
    desiredImprovements: "",
    contentAvailability: "",
    futurePlans: "",
    budgetNotes: "",
    deadlineNotes: "",
    specialInstructions: "",
  };
}

export const CLIENT_DECLARATION = [
  "The information provided is accurate.",
  "The uploaded documents belong to me or my organization.",
  "The references are correct.",
  "The project scope is understood.",
  "The project may proceed using the submitted information.",
];
