"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, Globe, PenLine, Search } from "lucide-react";
import { api, type CollaborationBundle } from "@/lib/api";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Separator } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const PORTAL_STATUS_LABELS: Record<string, string> = {
  created: "Created",
  email_sent: "Email Sent",
  viewed: "Viewed",
  in_progress: "In Progress",
  draft_saved: "Draft Saved",
  submitted: "Submitted",
  approved: "Approved",
  expired: "Expired",
  cancelled: "Cancelled",
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Admin view: client portals, submissions, uploaded documents, signatures. */
export default function CollaborationCard({ projectId }: { projectId: string }) {
  const [bundle, setBundle] = useState<CollaborationBundle | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.collaboration.get(projectId).then(setBundle).catch(() => {});
  }, [projectId]);

  if (!bundle) return null;
  const { portals, submissions, documents, signatures } = bundle;
  if (portals.length === 0 && documents.length === 0) return null;

  const submission = submissions[0];
  const signature = signatures[0];
  const q = search.toLowerCase().trim();
  const filteredDocs = q
    ? documents.filter((d) =>
        [d.originalName, d.category, d.extension].join(" ").toLowerCase().includes(q)
      )
    : documents;

  const byCategory = filteredDocs.reduce<Record<string, typeof documents>>((acc, d) => {
    (acc[d.category] ??= []).push(d);
    return acc;
  }, {});

  return (
    <Card className="mt-6">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Client Collaboration</CardTitle>
        <Globe size={14} className="text-neutral-400" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portals */}
        <div className="space-y-1.5">
          {portals.map((p) => (
            <div
              key={p.tokenHashPrefix}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <div>
                <span className="font-medium">{p.clientName || "Client"}</span>
                <span className="text-neutral-400"> · expires {new Date(p.expiresAt).toLocaleDateString()}</span>
                {p.viewedAt && (
                  <span className="text-neutral-400"> · opened {new Date(p.viewedAt).toLocaleDateString()}</span>
                )}
              </div>
              <Badge gold={p.status === "submitted" || p.status === "in_progress"}>
                {PORTAL_STATUS_LABELS[p.status] ?? p.status}
              </Badge>
            </div>
          ))}
        </div>

        {/* Submission summary */}
        {submission && (
          <>
            <Separator />
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Submission</div>
                <div className="font-medium">
                  {submission.status === "submitted"
                    ? `Completed ${submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : ""}`
                    : `Draft · ${submission.completedSections.length} section(s) completed`}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Business</div>
                <div className="font-medium">
                  {submission.business.businessName || "—"}
                  {submission.business.email ? ` · ${submission.business.email}` : ""}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Scope Confirmed</div>
                <div className={cn("font-medium", submission.scopeConfirmed ? "text-green-600" : "text-neutral-400")}>
                  {submission.scopeConfirmed ? "Yes" : "Not yet"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Checklist Items Confirmed</div>
                <div className="font-medium">{submission.checklistConfirmations.length}</div>
              </div>
              {submission.references.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">References</div>
                  {submission.references.map((r) => (
                    <div key={r.id} className="truncate text-sm">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand-gold-dark hover:underline dark:text-brand-gold"
                      >
                        {r.url}
                      </a>
                      <span className="text-neutral-400"> · {r.priority}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Signature */}
        {signature && (
          <>
            <Separator />
            <div className="flex items-center gap-4">
              <div className="rounded-lg border border-neutral-200 bg-white p-2 dark:border-neutral-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signature.imageDataUrl} alt="Client signature" className="h-14 w-auto" />
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1.5 font-medium">
                  <PenLine size={13} className="text-green-600" /> Signed by {signature.clientName}
                </div>
                <div className="text-xs text-neutral-400">
                  {new Date(signature.signedAt).toLocaleString()} · portal v{signature.portalVersion}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                Documents ({documents.length} · {formatSize(documents.reduce((s, d) => s + d.size, 0))})
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2.5 text-neutral-400" />
                <Input
                  className="h-8 w-44 pl-7 text-xs"
                  placeholder="Search files…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            {Object.entries(byCategory).map(([cat, docs]) => (
              <div key={cat}>
                <div className="mb-1 text-xs font-semibold text-neutral-500">{cat}</div>
                <div className="space-y-1">
                  {docs.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2 dark:border-neutral-800"
                    >
                      {d.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.thumbnailUrl} alt="" className="h-9 w-9 rounded object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                          <FileText size={14} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{d.originalName}</div>
                        <div className="text-[11px] text-neutral-400">
                          {formatSize(d.size)} · {new Date(d.uploadedAt).toLocaleDateString()} · {d.uploadedBy}
                        </div>
                      </div>
                      <a
                        href={d.secureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        title="View"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <a
                        href={d.secureUrl.replace("/upload/", "/upload/fl_attachment/")}
                        className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
