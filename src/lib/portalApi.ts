import type { BusinessInformation, ProjectRequirements, ReferenceWebsite } from "./types";

/** Client-side API for the collaboration portal (token-scoped endpoints). */

export interface PortalDocumentView {
  id: string;
  category: string;
  originalName: string;
  size: number;
  mimeType: string;
  thumbnailUrl: string;
  secureUrl: string;
  uploadedAt: string;
}

export interface PortalSession {
  status: string;
  locked: boolean;
  expiresAt: string;
  portalVersion: string;
  project: { name: string; referenceNumber: string; description: string; stage: string };
  client: { name: string; email: string };
  communication: { title: string; subtitle: string; date: string; contentHtml: string; version: string };
  checklist: { id: string; group: string; text: string }[];
  declaration: string[];
  submission: {
    overviewAcknowledged: boolean;
    business: BusinessInformation;
    requirements: ProjectRequirements;
    references: ReferenceWebsite[];
    completedSections: string[];
    scopeConfirmed: boolean;
    checklistConfirmations: string[];
    declarationAccepted: boolean;
    status: "draft" | "submitted";
    submittedAt: string | null;
  };
  documents: PortalDocumentView[];
}

export class PortalApiError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data as { error?: string; code?: string };
    throw new PortalApiError(d.error ?? "Something went wrong. Please try again.", d.code ?? "internal");
  }
  return data as T;
}

export const portalApi = {
  getSession: (token: string) => request<PortalSession>(`/api/portal/${token}`),

  saveDraft: (
    token: string,
    patch: Record<string, unknown>,
    completedSection?: string
  ) =>
    request<{ savedAt: string }>(`/api/portal/${token}/submission`, {
      method: "PUT",
      body: JSON.stringify({ ...patch, completedSection }),
    }),

  signUpload: (token: string, file: { filename: string; mimeType: string; size: number; category: string }) =>
    request<{ uploadUrl: string; fields: Record<string, string>; publicId: string; resourceType: string }>(
      `/api/portal/${token}/documents/sign`,
      { method: "POST", body: JSON.stringify(file) }
    ),

  registerDocument: (
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
  ) =>
    request<PortalDocumentView>(`/api/portal/${token}/documents`, {
      method: "POST",
      body: JSON.stringify(meta),
    }),

  removeDocument: (token: string, docId: string) =>
    request<{ ok: true }>(`/api/portal/${token}/documents/${docId}`, { method: "DELETE" }),

  submit: (
    token: string,
    payload: {
      scopeConfirmed: boolean;
      checklistConfirmations: string[];
      declarationAccepted: boolean;
      signatureDataUrl: string;
    }
  ) =>
    request<{ submittedAt: string; referenceNumber: string }>(`/api/portal/${token}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Uploads a file directly to the storage provider using signed params. */
export function uploadToStorage(
  file: File,
  signed: { uploadUrl: string; fields: Record<string, string> },
  onProgress: (pct: number) => void
): Promise<{ secureUrl: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    Object.entries(signed.fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", signed.uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as { secure_url?: string };
          if (body.secure_url) return resolve({ secureUrl: body.secure_url });
        } catch {
          /* fall through */
        }
        reject(new Error("The upload finished but could not be verified."));
      } else {
        reject(new Error("The upload failed. Please try again."));
      }
    };
    xhr.onerror = () => reject(new Error("The upload failed. Please check your connection and try again."));
    xhr.send(form);
  });
}
