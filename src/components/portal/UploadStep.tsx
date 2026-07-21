"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Image as ImageIcon, RotateCw, Trash2, UploadCloud } from "lucide-react";
import { DOCUMENT_CATEGORIES, MAX_UPLOAD_MB, validateFile } from "@/lib/domain/portal";
import { portalApi, uploadToStorage, type PortalDocumentView } from "@/lib/portalApi";
import { cn } from "@/lib/utils";
import { PCard, PHeading, PNav } from "./PortalSteps";

interface PendingUpload {
  id: string;
  file: File;
  category: string;
  progress: number;
  status: "uploading" | "failed";
  error?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function UploadStep({
  token,
  documents,
  onDocumentsChange,
  onBack,
  onContinue,
}: {
  token: string;
  documents: PortalDocumentView[];
  onDocumentsChange: (docs: PortalDocumentView[]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [category, setCategory] = useState<string>(DOCUMENT_CATEGORIES[0]);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef(documents);
  docsRef.current = documents;

  const startUpload = useCallback(
    async (file: File, cat: string, retryId?: string) => {
      const localError = validateFile({ filename: file.name, mimeType: file.type, size: file.size });
      if (localError) {
        setNotice(localError);
        return;
      }
      // Duplicate name check.
      if (!retryId && docsRef.current.some((d) => d.originalName === file.name)) {
        if (!window.confirm(`A file named "${file.name}" was already uploaded. Upload this one as well?`)) {
          return;
        }
      }
      setNotice("");
      const id = retryId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setPending((p) => [
        ...p.filter((x) => x.id !== id),
        { id, file, category: cat, progress: 0, status: "uploading" },
      ]);
      try {
        const signed = await portalApi.signUpload(token, {
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          category: cat,
        });
        const { secureUrl } = await uploadToStorage(file, signed, (pct) =>
          setPending((p) => p.map((x) => (x.id === id ? { ...x, progress: pct } : x)))
        );
        const doc = await portalApi.registerDocument(token, {
          category: cat,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          publicId: signed.publicId,
          resourceType: signed.resourceType,
          secureUrl,
        });
        setPending((p) => p.filter((x) => x.id !== id));
        onDocumentsChange([...docsRef.current, doc]);
      } catch (e) {
        setPending((p) =>
          p.map((x) =>
            x.id === id
              ? { ...x, status: "failed", error: e instanceof Error ? e.message : "Upload failed." }
              : x
          )
        );
      }
    },
    [token, onDocumentsChange]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((f) => void startUpload(f, category));
      if (inputRef.current) inputRef.current.value = "";
    },
    [category, startUpload]
  );

  const removeDoc = async (doc: PortalDocumentView) => {
    if (!window.confirm(`Remove "${doc.originalName}"?`)) return;
    try {
      await portalApi.removeDocument(token, doc.id);
      onDocumentsChange(docsRef.current.filter((d) => d.id !== doc.id));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "The file could not be removed.");
    }
  };

  const byCategory = documents.reduce<Record<string, PortalDocumentView[]>>((acc, d) => {
    (acc[d.category] ??= []).push(d);
    return acc;
  }, {});

  const totalSize = documents.reduce((s, d) => s + d.size, 0);

  return (
    <PCard>
      <PHeading
        title="Upload Your Files"
        hint={`Share your logo, brand assets, content, and documents — everything we need in one place. Up to ${MAX_UPLOAD_MB} MB per file.`}
      />

      <div className="mb-4">
        <label className="mb-1 block text-[13px] font-semibold text-neutral-700">
          What are you uploading?
        </label>
        <select
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-[#F2C230] focus:outline-none focus:ring-2 focus:ring-[#F2C230]/40 sm:w-72"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {DOCUMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
          dragOver ? "border-[#F2C230] bg-[#F2C230]/10" : "border-neutral-300 hover:border-neutral-400"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud size={32} className="mb-2 text-neutral-400" />
        <p className="text-sm font-semibold text-neutral-700">
          Drag &amp; drop files here, or <span className="text-[#92660A] underline">browse</span>
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Images, PDF, Word, Excel, TXT, ZIP, RAR
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {notice && <p className="mt-3 text-sm font-medium text-red-600">{notice}</p>}

      {/* In-flight uploads */}
      {pending.length > 0 && (
        <div className="mt-4 space-y-2">
          {pending.map((p) => (
            <div key={p.id} className="rounded-xl border border-neutral-200 p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium">{p.file.name}</span>
                {p.status === "uploading" ? (
                  <span className="shrink-0 text-xs text-neutral-400">{p.progress}%</span>
                ) : (
                  <button
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#92660A]"
                    onClick={() => void startUpload(p.file, p.category, p.id)}
                  >
                    <RotateCw size={12} /> Retry
                  </button>
                )}
              </div>
              {p.status === "uploading" ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full bg-[#F2C230] transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              ) : (
                <p className="mt-1 text-xs text-red-600">{p.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files by category */}
      {documents.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
            <span>
              {documents.length} file{documents.length === 1 ? "" : "s"} uploaded
            </span>
            <span>Total {formatSize(totalSize)}</span>
          </div>
          <div className="space-y-4">
            {Object.entries(byCategory).map(([cat, docs]) => (
              <div key={cat}>
                <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-neutral-400">{cat}</div>
                <div className="space-y-1.5">
                  {docs.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-2.5"
                    >
                      {d.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.thumbnailUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
                          {d.mimeType.startsWith("image/") ? <ImageIcon size={16} /> : <FileText size={16} />}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{d.originalName}</div>
                        <div className="text-xs text-neutral-400">{formatSize(d.size)}</div>
                      </div>
                      <button
                        className="shrink-0 p-1 text-neutral-400 hover:text-red-600"
                        title="Remove file"
                        onClick={() => void removeDoc(d)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PNav
        onBack={onBack}
        onContinue={onContinue}
        continueLabel={documents.length === 0 ? "Skip for Now" : "Continue"}
      />
    </PCard>
  );
}
