"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  FilePenLine,
  Lock,
  MailPlus,
  StickyNote,
  Unlock,
  XCircle,
} from "lucide-react";
import { api, type ProjectBundle } from "@/lib/api";
import {
  APPROVAL_LABELS,
  APPROVAL_STYLES,
  EVENT_COLORS,
  EVENT_LABELS,
  PROJECT_STAGES,
} from "@/lib/domain/stages";
import { TEMPLATES } from "@/lib/templates";
import type { ApprovalStatus } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Separator,
} from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import ChecklistsCard from "./ChecklistsCard";

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [note, setNote] = useState("");
  const [templatePick, setTemplatePick] = useState(TEMPLATES[0].id);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setBundle(await api.projects.get(projectId));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load project.");
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        {error}{" "}
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          Back to projects
        </Button>
      </div>
    );
  }
  if (!bundle) {
    return <div className="p-8 text-center text-sm text-neutral-400">Loading project…</div>;
  }

  const { project, events, communications, checklists } = bundle;
  const closed = project.status === "closed";

  const setStage = async (stage: string) => {
    await api.projects.update(project.id, { stage });
    void refresh();
  };

  const toggleClosed = async () => {
    if (
      !window.confirm(
        closed
          ? "Reopen this project?"
          : "Close this project? The communication record is preserved and remains accessible."
      )
    )
      return;
    await api.projects.update(project.id, { status: closed ? "active" : "closed" });
    void refresh();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await api.projects.addNote(project.id, note.trim());
    setNote("");
    void refresh();
  };

  const setApproval = async (commId: string, status: ApprovalStatus) => {
    const label = APPROVAL_LABELS[status];
    const n = window.prompt(`Record "${label}". Optional note (e.g. "Confirmed by client reply on ${new Date().toLocaleDateString()}"):`, "");
    if (n === null) return;
    await api.emails.setApproval(commId, status, n || undefined);
    void refresh();
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push("/")}>
        <ArrowLeft size={14} /> All projects
      </Button>

      {/* Project header */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{project.name}</h1>
                <Badge gold={!closed}>{closed ? "Closed" : project.stage}</Badge>
              </div>
              <div className="mt-1 text-sm text-neutral-500">
                {project.clientName || "No client"}
                {project.company ? ` · ${project.company}` : ""}
                {project.clientEmail ? ` · ${project.clientEmail}` : ""}
              </div>
              <div className="mt-1 font-mono text-xs text-neutral-400">{project.referenceNumber}</div>
              {project.description && (
                <p className="mt-2 max-w-xl text-sm text-neutral-600 dark:text-neutral-300">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Select
                  className="w-52"
                  value={project.stage}
                  disabled={closed}
                  onChange={(e) => void setStage(e.target.value)}
                  title="Project stage"
                >
                  {PROJECT_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <Button variant="outline" size="sm" onClick={toggleClosed}>
                  {closed ? <Unlock size={14} /> : <Lock size={14} />}
                  {closed ? "Reopen" : "Close Project"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select className="w-52" value={templatePick} onChange={(e) => setTemplatePick(e.target.value)}>
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="gold"
                  size="sm"
                  disabled={closed}
                  onClick={() => router.push(`/compose?project=${project.id}&template=${templatePick}`)}
                >
                  <MailPlus size={14} /> New Communication
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Communications */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Communications ({communications.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {communications.length === 0 && (
                <p className="py-6 text-center text-sm text-neutral-400">
                  No communications yet. Start with a Scope Confirmation.
                </p>
              )}
              {communications.map((c) => (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {c.subject || c.documentTitle || "Untitled"}
                        </div>
                        <div className="mt-0.5 text-xs text-neutral-500">
                          {c.sentAt
                            ? `Sent ${new Date(c.sentAt).toLocaleString()} → ${c.sentTo}`
                            : `Draft · updated ${new Date(c.updatedAt).toLocaleString()}`}
                          {" · "}v{c.historyCount}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          APPROVAL_STYLES[c.approvalStatus]
                        )}
                      >
                        {APPROVAL_LABELS[c.approvalStatus]}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/compose?project=${project.id}&comm=${c.id}`)}
                      >
                        <FilePenLine size={13} /> Open
                      </Button>
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-700 dark:text-green-400"
                        title="Record client approval"
                        onClick={() => void setApproval(c.id, "approved")}
                      >
                        <CheckCircle2 size={13} /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-orange-600 dark:text-orange-400"
                        title="Record revision request"
                        onClick={() => void setApproval(c.id, "needs_revision")}
                      >
                        Revision
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 dark:text-red-400"
                        title="Record rejection"
                        onClick={() => void setApproval(c.id, "rejected")}
                      >
                        <XCircle size={13} /> Reject
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <ChecklistsCard
            projectId={project.id}
            checklists={checklists ?? []}
            disabled={closed}
            onChanged={() => void refresh()}
          />
        </div>

        {/* Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <Input
                  placeholder='Add a note, e.g. "Client confirmed scope by phone"'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void addNote()}
                />
                <Button variant="outline" size="sm" onClick={() => void addNote()} title="Add note">
                  <StickyNote size={14} />
                </Button>
              </div>
              <div className="relative space-y-4 pl-5">
                <div className="absolute bottom-1 left-[5px] top-1 w-px bg-neutral-200 dark:bg-neutral-800" />
                {events.map((ev) => (
                  <div key={ev.id} className="relative">
                    <span
                      className={cn(
                        "absolute -left-5 top-1 h-[11px] w-[11px] rounded-full ring-2 ring-white dark:ring-neutral-900",
                        EVENT_COLORS[ev.type]
                      )}
                    />
                    <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                      {EVENT_LABELS[ev.type]}
                    </div>
                    <div className="text-sm text-neutral-700 dark:text-neutral-300">{ev.description}</div>
                    <div className="text-[11px] text-neutral-400">{new Date(ev.at).toLocaleString()}</div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-sm text-neutral-400">No events recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
