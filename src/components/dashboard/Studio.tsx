"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Download,
  FilePlus2,
  FolderOpen,
  Link2,
  Moon,
  Save,
  Send,
  Sparkles,
  Sun,
} from "lucide-react";
import { api, type EmailListItem } from "@/lib/api";
import { generateEmail } from "@/lib/email/generator";
import { getTemplate, TEMPLATES } from "@/lib/templates";
import type { Client, EmailFields, Project, VersionSnapshot } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { Button, Card, CardHeader, CardTitle, Select } from "@/components/ui/primitives";
import FieldsPanel from "./FieldsPanel";
import PreviewPane from "./PreviewPane";
import LibraryPanel from "./LibraryPanel";

const RichTextEditor = dynamic(() => import("@/components/editor/RichTextEditor"), { ssr: false });

/* ------------------------------------------------------------------ */

function emptyFields(templateId: string, projectId: string | null = null): EmailFields {
  const t = getTemplate(templateId);
  return {
    projectId,
    templateId,
    subject: "",
    documentTitle: "",
    documentSubtitle: "",
    clientName: "",
    company: "",
    clientEmail: "",
    projectName: "",
    referenceNumber: "",
    version: "v1.0",
    status: "Draft",
    date: formatDisplayDate(),
    contentHtml: "<p></p>",
    approvalHeading: "",
    approvalText: "",
    approvalButtonText: "",
    portalUrl: "",
    footerNote: "",
    senderName: "",
    senderTitle: "",
    ...t.defaults,
  };
}

function projectPrefill(fields: EmailFields, p: Project): EmailFields {
  return {
    ...fields,
    projectId: p.id,
    clientName: p.clientName || fields.clientName,
    company: p.company || fields.company,
    clientEmail: p.clientEmail || fields.clientEmail,
    projectName: p.name,
    referenceNumber: p.referenceNumber,
  };
}

interface Toast {
  id: number;
  kind: "success" | "error";
  message: string;
}

interface StudioProps {
  projectId?: string | null;
  commId?: string | null;
  templateId?: string | null;
}

/* ------------------------------------------------------------------ */

export default function Studio({ projectId = null, commId = null, templateId = null }: StudioProps) {
  const [fields, setFields] = useState<EmailFields>(() =>
    emptyFields(templateId ?? "scope-confirmation", projectId)
  );
  const [project, setProject] = useState<Project | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<VersionSnapshot[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [emails, setEmails] = useState<EmailListItem[]>([]);
  const [search, setSearch] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const loadedRef = useRef(false);

  const toast = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  /* ---------- theme ---------- */
  useEffect(() => {
    const isDark = localStorage.getItem("ems-theme") === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ems-theme", next ? "dark" : "light");
  };

  /* ---------- initial data ---------- */
  const refreshEmails = useCallback(
    async (q?: string) => {
      try {
        setEmails(await api.emails.list({ q, projectId: projectId ?? undefined }));
      } catch {
        /* non-fatal */
      }
    },
    [projectId]
  );

  useEffect(() => {
    void refreshEmails();
    api.clients.list().then(setClients).catch(() => {});
  }, [refreshEmails]);

  /* Load existing communication OR prefill from project (once). */
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        if (projectId) {
          const bundle = await api.projects.get(projectId);
          setProject(bundle.project);
          if (!commId) {
            setFields((f) => projectPrefill(f, bundle.project));
          }
        }
        if (commId) {
          const doc = await api.emails.get(commId);
          const { id, createdAt, updatedAt, history: h, approvalStatus, sentAt, sentTo, ...f } = doc;
          setFields(f);
          setActiveId(doc.id);
          setHistory(h);
        }
      } catch (e) {
        toast("error", e instanceof Error ? e.message : "Could not load data.");
      }
    })();
  }, [projectId, commId, toast]);

  useEffect(() => {
    const t = setTimeout(() => void refreshEmails(search), 300);
    return () => clearTimeout(t);
  }, [search, refreshEmails]);

  /* ---------- live preview (auto-updating) ---------- */
  useEffect(() => {
    const t = setTimeout(() => setPreviewHtml(generateEmail(fields)), 350);
    return () => clearTimeout(t);
  }, [fields]);

  /* ---------- autosave (2.5s after last change, only for saved docs) ---------- */
  useEffect(() => {
    if (!activeId) return;
    const t = setTimeout(async () => {
      try {
        const doc = await api.emails.update(activeId, fields);
        setHistory(doc.history);
        void refreshEmails(search);
      } catch {
        /* best-effort */
      }
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, activeId]);

  /* ---------- actions ---------- */
  const patch = useCallback((p: Partial<EmailFields>) => {
    setFields((f) => ({ ...f, ...p }));
  }, []);

  const applyTemplate = (tid: string) => {
    const t = getTemplate(tid);
    setActiveId(null);
    setHistory([]);
    setGeneratedHtml("");
    setFields((f) => {
      let next = {
        ...emptyFields(tid, f.projectId),
        clientName: f.clientName,
        company: f.company,
        clientEmail: f.clientEmail,
        projectName: f.projectName,
        referenceNumber: f.referenceNumber,
        date: formatDisplayDate(),
      };
      if (project) next = projectPrefill(next, project);
      return next;
    });
    toast("success", `Template loaded: ${t.name}`);
  };

  const newEmail = () => {
    setActiveId(null);
    setHistory([]);
    setGeneratedHtml("");
    setFields((f) => {
      const base = emptyFields(f.templateId, f.projectId);
      return project ? projectPrefill(base, project) : base;
    });
  };

  const ensureSaved = async (): Promise<string> => {
    if (activeId) {
      const doc = await api.emails.update(activeId, fields);
      setHistory(doc.history);
      return activeId;
    }
    const doc = await api.emails.create(fields);
    setActiveId(doc.id);
    setHistory(doc.history);
    void refreshEmails(search);
    return doc.id;
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await ensureSaved();
      toast("success", "Saved. Every version is kept in the record.");
      void refreshEmails(search);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const generate = () => {
    const html = generateEmail(fields);
    setGeneratedHtml(html);
    setPreviewHtml(html);
    toast("success", "Email generated — ready to copy, export, or send.");
  };

  const copyHtml = async () => {
    const html = generatedHtml || generateEmail(fields);
    setGeneratedHtml(html);
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast("success", "HTML copied to clipboard.");
  };

  const exportHtml = () => {
    const html = generatedHtml || generateEmail(fields);
    setGeneratedHtml(html);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = (fields.subject || fields.documentTitle || "email")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    a.href = url;
    a.download = `911-makers-${name || "email"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendEmail = async () => {
    if (!fields.clientEmail.trim()) {
      toast("error", "Add the client's email address first.");
      return;
    }
    if (!fields.subject.trim()) {
      toast("error", "Add a subject line first.");
      return;
    }
    if (
      !window.confirm(
        `Send "${fields.subject}" to ${fields.clientEmail}?\n\nThe send will be recorded in the project documentation trail.`
      )
    ) {
      return;
    }
    setSending(true);
    try {
      // Documentation-first: the communication is always saved before sending.
      const id = await ensureSaved();
      const html = generateEmail(fields);
      setGeneratedHtml(html);
      await api.send({ to: fields.clientEmail.trim(), subject: fields.subject.trim(), html, emailId: id });
      toast("success", `Sent to ${fields.clientEmail} and recorded in the project timeline.`);
      void refreshEmails(search);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSending(false);
    }
  };

  const attachPortal = async () => {
    if (!fields.projectId) {
      toast("error", "Portals require a project — open this composer from a project page.");
      return;
    }
    try {
      const id = await ensureSaved();
      const { url } = await api.portal.create(fields.projectId, id);
      patch({ portalUrl: url });
      await navigator.clipboard.writeText(url).catch(() => {});
      toast("success", "Secure portal created and attached — the email now includes the portal button.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Portal could not be created.");
    }
  };

  const saveClient = async () => {
    try {
      const c = await api.clients.create({
        name: fields.clientName,
        company: fields.company,
        email: fields.clientEmail,
      });
      setClients(await api.clients.list());
      toast("success", `Client "${c.name}" saved.`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not save client.");
    }
  };

  const openEmail = async (id: string) => {
    try {
      const doc = await api.emails.get(id);
      const { id: _id, createdAt, updatedAt, history: h, approvalStatus, sentAt, sentTo, ...f } = doc;
      setFields(f);
      setActiveId(doc.id);
      setHistory(h);
      setGeneratedHtml("");
      setLibraryOpen(false);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not open email.");
    }
  };

  const duplicateEmail = async (id: string) => {
    try {
      const copy = await api.emails.duplicate(id);
      void refreshEmails(search);
      await openEmail(copy.id);
      toast("success", "Email duplicated.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Duplicate failed.");
    }
  };

  const deleteEmail = async (id: string) => {
    if (!window.confirm("Delete this saved email? This cannot be undone.")) return;
    try {
      await api.emails.remove(id);
      if (id === activeId) newEmail();
      void refreshEmails(search);
      toast("success", "Email deleted.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Delete failed.");
    }
  };

  const restoreVersion = (v: VersionSnapshot) => {
    setFields(v.fields);
    toast("success", `Restored version ${v.version}. Save to keep it.`);
  };

  const templateName = useMemo(() => getTemplate(fields.templateId).name, [fields.templateId]);

  /* ---------- render ---------- */
  return (
    <div className="flex h-screen flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-md border-2 border-brand-black bg-brand-black px-2.5 py-1 dark:border-white">
            <span className="font-black tracking-wider text-brand-gold">911</span>
            <span className="font-black tracking-wider text-white">MAKERS</span>
          </Link>
          <div className="hidden sm:block">
            <div className="text-sm font-bold leading-tight">
              {project ? project.name : "Communication Composer"}
            </div>
            <div className="text-[11px] text-neutral-500">
              {project ? `${project.referenceNumber} · ${templateName}` : templateName}
            </div>
          </div>
          {project && (
            <Link href={`/projects/${project.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={13} /> Project
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            className="w-56"
            value={fields.templateId}
            onChange={(e) => applyTemplate(e.target.value)}
            title="Template"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Button variant="outline" size="sm" onClick={newEmail} title="New email">
            <FilePlus2 size={14} /> New
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)} title="Saved emails & versions">
            <FolderOpen size={14} /> Library
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle dark mode">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </Button>
        </div>
      </header>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white/70 px-4 py-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
        <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving}>
          <Save size={14} /> {saving ? "Saving…" : activeId ? "Save" : "Save Draft"}
        </Button>
        <Button variant="gold" size="sm" onClick={generate}>
          <Sparkles size={14} /> Generate Email
        </Button>
        <Button variant="outline" size="sm" onClick={copyHtml}>
          {copied ? <Check size={14} /> : <ClipboardCopy size={14} />} Copy HTML
        </Button>
        <Button variant="outline" size="sm" onClick={exportHtml}>
          <Download size={14} /> Export HTML
        </Button>
        {fields.projectId && (
          <Button
            variant={fields.portalUrl ? "ghost" : "outline"}
            size="sm"
            onClick={attachPortal}
            title={fields.portalUrl ? "Portal attached — click to create a fresh link" : "Create a secure client portal and attach its button to this email"}
          >
            <Link2 size={14} /> {fields.portalUrl ? "Portal Attached ✓" : "Attach Portal"}
          </Button>
        )}
        <div className="flex-1" />
        {activeId && (
          <span className="text-[11px] text-neutral-400">
            Autosave on · v{history[history.length - 1]?.version ?? 1}
          </span>
        )}
        <Button size="sm" onClick={sendEmail} disabled={sending}>
          <Send size={14} /> {sending ? "Sending…" : "Send Email"}
        </Button>
      </div>

      {/* Workspace */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[320px_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="overflow-y-auto pr-1">
          <FieldsPanel
            fields={fields}
            clients={clients}
            onChange={patch}
            onSaveClient={saveClient}
            onPickClient={(c) => patch({ clientName: c.name, company: c.company, clientEmail: c.email })}
          />
        </div>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Main Content</CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-y-auto">
            <RichTextEditor content={fields.contentHtml} onChange={(html) => patch({ contentHtml: html })} />
          </div>
        </Card>

        <div className="hidden overflow-hidden lg:block">
          <PreviewPane html={previewHtml} />
        </div>
      </div>

      {/* Library slide-over */}
      <LibraryPanel
        open={libraryOpen}
        emails={emails}
        activeId={activeId}
        history={history}
        search={search}
        onSearch={setSearch}
        onClose={() => setLibraryOpen(false)}
        onOpenEmail={openEmail}
        onDuplicate={duplicateEmail}
        onDelete={deleteEmail}
        onRestoreVersion={restoreVersion}
      />

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${
                t.kind === "success" ? "bg-brand-black text-white" : "bg-red-600 text-white"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
