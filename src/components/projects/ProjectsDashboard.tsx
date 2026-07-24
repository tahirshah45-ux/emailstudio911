"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FolderPlus, Search } from "lucide-react";
import { api, type ProjectListItem } from "@/lib/api";
import type { Client } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
} from "@/components/ui/primitives";

export default function ProjectsDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  /**
   * Distinguishes "still loading" / "loaded successfully" / "failed to
   * load" so a fetch error is never rendered as the empty state — a
   * Firestore/API failure must never look identical to "no projects".
   */
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    company: "",
    clientEmail: "",
    description: "",
  });

  const refresh = useCallback(async () => {
    try {
      const data = await api.projects.list();
      setProjects(data);
      setLoadStatus("ready");
      setLoadError("");
    } catch (e) {
      // Do not clear `projects` here — a failed refresh must never wipe
      // out projects already rendered from a prior successful load.
      console.error("Failed to load projects:", e);
      setLoadStatus("error");
      setLoadError(e instanceof Error ? e.message : "Could not load projects.");
    }
  }, []);

  useEffect(() => {
    void refresh();
    api.clients.list().then(setClients).catch(() => {});
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.name, p.clientName, p.company, p.referenceNumber, p.stage].join(" ").toLowerCase().includes(q)
    );
  }, [projects, search]);

  const createProject = async () => {
    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const p = await api.projects.create(form);
      router.push(`/projects/${p.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create project.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Projects</h1>
          <p className="text-sm text-neutral-500">
            Every project keeps a complete, traceable communication record.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-[11px] text-neutral-400" />
            <Input
              className="w-64 pl-8"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="gold" size="sm" onClick={() => setShowForm((s) => !s)}>
            <FolderPlus size={14} /> New Project
          </Button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Project</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label>Project Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Website Development Project"
                />
              </div>
              {clients.length > 0 && (
                <div className="space-y-1 md:col-span-2">
                  <Label>Load client from database</Label>
                  <Select
                    value=""
                    onChange={(e) => {
                      const c = clients.find((x) => x.id === e.target.value);
                      if (c)
                        setForm({ ...form, clientName: c.name, company: c.company, clientEmail: c.email });
                    }}
                  >
                    <option value="">Select a saved client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.company ? ` — ${c.company}` : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label>Client Name</Label>
                <Input
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Client Email</Label>
                <Input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short internal description"
                />
              </div>
              {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
              <div className="flex gap-2 md:col-span-2">
                <Button variant="gold" size="sm" disabled={creating} onClick={createProject}>
                  {creating ? "Creating…" : "Create Project"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {loadStatus === "error" ? (
        <Card>
          <CardContent className="py-16 text-center text-sm">
            <p className="font-medium text-red-600">Could not load projects: {loadError}</p>
            <p className="mt-1 text-neutral-400">
              This is a connection/loading error, not data loss — existing projects are safe in Firestore.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                setLoadStatus("loading");
                void refresh();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-neutral-400">
            {loadStatus === "loading"
              ? "Loading projects…"
              : projects.length === 0
                ? "No projects yet. Create your first project to start the official communication record."
                : "No projects match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button className="w-full text-left" onClick={() => router.push(`/projects/${p.id}`)}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="mt-0.5 truncate text-xs text-neutral-500">
                          {p.clientName || "No client"}
                          {p.company ? ` · ${p.company}` : ""}
                        </div>
                      </div>
                      <Badge gold={p.status === "active"}>{p.status === "active" ? p.stage : "Closed"}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-mono">{p.referenceNumber}</span>
                      <span>
                        {p.communicationCount} communication{p.communicationCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
