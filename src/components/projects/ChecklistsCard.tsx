"use client";

import { useState } from "react";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Checklist } from "@/lib/types";
import { CHECKLIST_PRESETS } from "@/lib/types";
import {
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

interface ChecklistsCardProps {
  projectId: string;
  checklists: Checklist[];
  disabled: boolean;
  onChanged: () => void;
}

/** Reusable project checklists — completion is stored in Firestore. */
export default function ChecklistsCard({ projectId, checklists, disabled, onChanged }: ChecklistsCardProps) {
  const [preset, setPreset] = useState<string>(CHECKLIST_PRESETS[0]);
  const [customName, setCustomName] = useState("");
  const [newItemFor, setNewItemFor] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const create = async () => {
    const name = customName.trim() || preset;
    setBusy(true);
    try {
      await api.checklists.create(projectId, name, []);
      setCustomName("");
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const addItem = async (cl: Checklist) => {
    const text = (newItemFor[cl.id] ?? "").trim();
    if (!text) return;
    await api.checklists.update(cl.id, {
      items: [...cl.items, { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, text, done: false }],
    });
    setNewItemFor((s) => ({ ...s, [cl.id]: "" }));
    onChanged();
  };

  const toggleItem = async (cl: Checklist, itemId: string) => {
    await api.checklists.update(cl.id, {
      items: cl.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
    });
    onChanged();
  };

  const removeItem = async (cl: Checklist, itemId: string) => {
    await api.checklists.update(cl.id, { items: cl.items.filter((i) => i.id !== itemId) });
    onChanged();
  };

  const removeChecklist = async (cl: Checklist) => {
    if (!window.confirm(`Delete checklist "${cl.name}"?`)) return;
    await api.checklists.remove(cl.id);
    onChanged();
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Checklists</CardTitle>
        <ListChecks size={14} className="text-neutral-400" />
      </CardHeader>
      <CardContent className="space-y-4">
        {!disabled && (
          <div className="flex flex-wrap items-center gap-2">
            <Select className="w-44" value={preset} onChange={(e) => setPreset(e.target.value)}>
              {CHECKLIST_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Input
              className="w-52"
              placeholder="…or a custom name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void create()}>
              <Plus size={14} /> Add Checklist
            </Button>
          </div>
        )}

        {checklists.length === 0 && (
          <p className="py-2 text-center text-sm text-neutral-400">
            No checklists yet. Use presets like Pages, Features, Branding, Assets, Deliverables.
          </p>
        )}

        {checklists.map((cl) => {
          const done = cl.items.filter((i) => i.done).length;
          const total = cl.items.length;
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          return (
            <div key={cl.id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-sm">{cl.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">
                    {done}/{total} · {pct}%
                  </span>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      title="Delete checklist"
                      onClick={() => void removeChecklist(cl)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-green-500" : "bg-brand-gold")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <Separator className="my-2" />
              <div className="space-y-1">
                {cl.items.map((item) => (
                  <div key={item.id} className="group flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#F2C230]"
                      checked={item.done}
                      disabled={disabled}
                      onChange={() => void toggleItem(cl, item.id)}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        item.done && "text-neutral-400 line-through"
                      )}
                    >
                      {item.text}
                    </span>
                    {!disabled && (
                      <button
                        className="invisible text-neutral-400 hover:text-red-600 group-hover:visible"
                        title="Remove item"
                        onClick={() => void removeItem(cl, item.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {!disabled && (
                  <div className="mt-1 flex gap-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Add item…"
                      value={newItemFor[cl.id] ?? ""}
                      onChange={(e) => setNewItemFor((s) => ({ ...s, [cl.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && void addItem(cl)}
                    />
                    <Button variant="ghost" size="icon" title="Add item" onClick={() => void addItem(cl)}>
                      <Plus size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
