import type {
  ApprovalStatus,
  Client,
  EmailDocument,
  EmailFields,
  Project,
  TimelineEvent,
} from "./types";

/** Typed client-side wrappers for the internal REST API. */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export type EmailListItem = Omit<EmailDocument, "contentHtml" | "history"> & {
  historyCount: number;
};

export type ProjectListItem = Project & { communicationCount: number };

export interface ProjectBundle {
  project: Project;
  events: TimelineEvent[];
  communications: EmailListItem[];
}

export const api = {
  clients: {
    list: () => request<Client[]>("/api/clients"),
    create: (c: Pick<Client, "name" | "company" | "email">) =>
      request<Client>("/api/clients", { method: "POST", body: JSON.stringify(c) }),
    remove: (id: string) => request<{ ok: true }>(`/api/clients/${id}`, { method: "DELETE" }),
  },
  projects: {
    list: () => request<ProjectListItem[]>("/api/projects"),
    get: (id: string) => request<ProjectBundle>(`/api/projects/${id}`),
    create: (p: Partial<Project>) =>
      request<Project>("/api/projects", { method: "POST", body: JSON.stringify(p) }),
    update: (id: string, p: Partial<Project>) =>
      request<Project>(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(p) }),
    addNote: (id: string, description: string) =>
      request<TimelineEvent>(`/api/projects/${id}/events`, {
        method: "POST",
        body: JSON.stringify({ description }),
      }),
    remove: (id: string) => request<{ ok: true }>(`/api/projects/${id}`, { method: "DELETE" }),
  },
  emails: {
    list: (opts?: { q?: string; projectId?: string }) => {
      const params = new URLSearchParams();
      if (opts?.q) params.set("q", opts.q);
      if (opts?.projectId) params.set("projectId", opts.projectId);
      const qs = params.toString();
      return request<EmailListItem[]>(`/api/emails${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<EmailDocument>(`/api/emails/${id}`),
    create: (fields: EmailFields) =>
      request<EmailDocument>("/api/emails", { method: "POST", body: JSON.stringify(fields) }),
    update: (id: string, fields: EmailFields) =>
      request<EmailDocument>(`/api/emails/${id}`, { method: "PUT", body: JSON.stringify(fields) }),
    duplicate: (id: string) =>
      request<EmailDocument>(`/api/emails/${id}/duplicate`, { method: "POST" }),
    setApproval: (id: string, status: ApprovalStatus, note?: string) =>
      request<EmailDocument>(`/api/emails/${id}/approval`, {
        method: "POST",
        body: JSON.stringify({ status, note }),
      }),
    remove: (id: string) => request<{ ok: true }>(`/api/emails/${id}`, { method: "DELETE" }),
  },
  send: (payload: { to: string; subject: string; html: string; emailId?: string }) =>
    request<{ ok: true; messageId: string }>("/api/send", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
