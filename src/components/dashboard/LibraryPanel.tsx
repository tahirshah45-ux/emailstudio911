"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, History, Search, Trash2, X } from "lucide-react";
import type { EmailListItem } from "@/lib/api";
import type { VersionSnapshot } from "@/lib/types";
import { Badge, Button, Card, CardContent, Input, Separator } from "@/components/ui/primitives";

interface LibraryPanelProps {
  open: boolean;
  emails: EmailListItem[];
  activeId: string | null;
  history: VersionSnapshot[];
  search: string;
  onSearch: (q: string) => void;
  onClose: () => void;
  onOpenEmail: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRestoreVersion: (snapshot: VersionSnapshot) => void;
}

export default function LibraryPanel({
  open,
  emails,
  activeId,
  history,
  search,
  onSearch,
  onClose,
  onOpenEmail,
  onDuplicate,
  onDelete,
  onRestoreVersion,
}: LibraryPanelProps) {
  const [tab, setTab] = useState<"emails" | "history">("emails");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "tween", duration: 0.22 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[400px] max-w-full flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={tab === "emails" ? "default" : "ghost"}
                  onClick={() => setTab("emails")}
                >
                  Saved Emails
                </Button>
                <Button
                  size="sm"
                  variant={tab === "history" ? "default" : "ghost"}
                  onClick={() => setTab("history")}
                >
                  <History size={13} /> Versions
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} title="Close">
                <X size={16} />
              </Button>
            </div>

            {tab === "emails" ? (
              <>
                <div className="relative px-4 pt-3">
                  <Search size={14} className="absolute left-7 top-[22px] text-neutral-400" />
                  <Input
                    className="pl-8"
                    placeholder="Search subject, client, project…"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {emails.length === 0 && (
                    <p className="pt-8 text-center text-sm text-neutral-400">No saved emails yet.</p>
                  )}
                  {emails.map((e) => (
                    <Card
                      key={e.id}
                      className={
                        e.id === activeId ? "border-brand-gold ring-1 ring-brand-gold" : undefined
                      }
                    >
                      <CardContent className="p-3">
                        <button
                          className="w-full text-left"
                          onClick={() => onOpenEmail(e.id)}
                          title="Open this email"
                        >
                          <div className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                            {e.subject || e.documentTitle || "Untitled"}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-neutral-500">
                            {e.clientName || "No client"}
                            {e.projectName ? ` · ${e.projectName}` : ""}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge gold>{e.status}</Badge>
                            <span className="text-[11px] text-neutral-400">
                              {new Date(e.updatedAt).toLocaleString()}
                            </span>
                          </div>
                        </button>
                        <Separator className="my-2" />
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => onDuplicate(e.id)} title="Duplicate">
                            <Copy size={13} /> Duplicate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onDelete(e.id)}
                            title="Delete"
                          >
                            <Trash2 size={13} /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {history.length === 0 && (
                  <p className="pt-8 text-center text-sm text-neutral-400">
                    {activeId
                      ? "No version history for this email yet."
                      : "Save the current email first — versions are recorded on every save."}
                  </p>
                )}
                {[...history].reverse().map((v) => (
                  <Card key={v.version}>
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                          Version {v.version}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {new Date(v.savedAt).toLocaleString()}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => onRestoreVersion(v)}>
                        Restore
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
