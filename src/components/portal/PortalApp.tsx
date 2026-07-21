"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CloudUpload, Loader2 } from "lucide-react";
import { PORTAL_STEPS, type PortalStepId } from "@/lib/domain/portal";
import {
  portalApi,
  PortalApiError,
  type PortalDocumentView,
  type PortalSession,
} from "@/lib/portalApi";
import type { BusinessInformation, ProjectRequirements, ReferenceWebsite } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  BusinessStep,
  OverviewStep,
  ReferencesStep,
  RequirementsStep,
  ReviewStep,
  SuccessScreen,
  WelcomeStep,
} from "./PortalSteps";
import UploadStep from "./UploadStep";
import SignStep from "./SignStep";

export interface PortalDraft {
  overviewAcknowledged: boolean;
  business: BusinessInformation;
  requirements: ProjectRequirements;
  references: ReferenceWebsite[];
  completedSections: string[];
}

/* ------------------------------------------------------------------ */

function PortalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="border-b border-neutral-200 bg-[#0B0B0B] px-5 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="rounded-md border border-white/70 px-2.5 py-1">
            <span className="font-black tracking-wider text-[#F2C230]">911</span>
            <span className="font-black tracking-wider text-white">MAKERS</span>
          </div>
          <div className="text-xs font-medium tracking-wide text-neutral-400">
            Secure Client Portal
          </div>
        </div>
      </header>
      {children}
      <footer className="px-5 py-6 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} 911 Makers · Web Solutions &amp; AI Automation Division
      </footer>
    </div>
  );
}

function FriendlyError({ title, message }: { title: string; message: string }) {
  return (
    <PortalFrame>
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 text-2xl">
          ✉️
        </div>
        <h1 className="mb-2 text-xl font-bold">{title}</h1>
        <p className="text-sm leading-6 text-neutral-500">{message}</p>
      </div>
    </PortalFrame>
  );
}

/* ------------------------------------------------------------------ */

export default function PortalApp({ token }: { token: string }) {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [loadError, setLoadError] = useState<{ code: string; message: string } | null>(null);
  const [draft, setDraft] = useState<PortalDraft | null>(null);
  const [documents, setDocuments] = useState<PortalDocumentView[]>([]);
  const [step, setStep] = useState<PortalStepId>("welcome");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ referenceNumber: string; submittedAt: string } | null>(null);
  const dirtyRef = useRef(false);
  const draftRef = useRef<PortalDraft | null>(null);
  draftRef.current = draft;

  /* ---------- load session ---------- */
  useEffect(() => {
    portalApi
      .getSession(token)
      .then((s) => {
        setSession(s);
        setDraft({
          overviewAcknowledged: s.submission.overviewAcknowledged,
          business: s.submission.business,
          requirements: s.submission.requirements,
          references: s.submission.references,
          completedSections: s.submission.completedSections,
        });
        setDocuments(s.documents);
        if (s.locked || s.submission.status === "submitted") {
          setSubmitted({
            referenceNumber: s.project.referenceNumber,
            submittedAt: s.submission.submittedAt ?? "",
          });
        }
      })
      .catch((e) => {
        if (e instanceof PortalApiError) setLoadError({ code: e.code, message: e.message });
        else setLoadError({ code: "internal", message: "Please try again shortly." });
      });
  }, [token]);

  /* ---------- autosave ---------- */
  const persist = useCallback(
    async (completedSection?: string) => {
      const d = draftRef.current;
      if (!d) return;
      setSaveState("saving");
      try {
        const { savedAt } = await portalApi.saveDraft(token, d as unknown as Record<string, unknown>, completedSection);
        setSaveState("saved");
        setLastSaved(savedAt);
        dirtyRef.current = false;
      } catch {
        setSaveState("idle");
      }
    },
    [token]
  );

  useEffect(() => {
    if (!draft || submitted) return;
    dirtyRef.current = true;
    const t = setTimeout(() => void persist(), 1500);
    return () => clearTimeout(t);
  }, [draft, submitted, persist]);

  const patchDraft = useCallback((p: Partial<PortalDraft>) => {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }, []);

  const completeSection = useCallback(
    (section: string, nextStep: PortalStepId) => {
      setDraft((d) =>
        d
          ? {
              ...d,
              completedSections: d.completedSections.includes(section)
                ? d.completedSections
                : [...d.completedSections, section],
            }
          : d
      );
      // Persist with the milestone marker on the next tick (state applied).
      setTimeout(() => void persist(section), 0);
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [persist]
  );

  const goTo = useCallback((s: PortalStepId) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const stepIndex = useMemo(() => PORTAL_STEPS.findIndex((s) => s.id === step), [step]);

  /* ---------- render ---------- */
  if (loadError) {
    const titles: Record<string, string> = {
      invalid: "This link is not valid",
      expired: "This link has expired",
      cancelled: "This request was cancelled",
      submitted: "Already completed",
      internal: "Something went wrong",
    };
    return <FriendlyError title={titles[loadError.code] ?? "Something went wrong"} message={loadError.message} />;
  }

  if (!session || !draft) {
    return (
      <PortalFrame>
        <div className="flex items-center justify-center py-32 text-neutral-400">
          <Loader2 className="mr-2 animate-spin" size={18} /> Loading your project…
        </div>
      </PortalFrame>
    );
  }

  if (submitted) {
    return (
      <PortalFrame>
        <SuccessScreen
          projectName={session.project.name}
          referenceNumber={submitted.referenceNumber || session.project.referenceNumber}
          submittedAt={submitted.submittedAt}
          supportEmail={session.client.email ? undefined : undefined}
        />
      </PortalFrame>
    );
  }

  return (
    <PortalFrame>
      <div className="mx-auto flex max-w-5xl gap-8 px-5 py-8">
        {/* Progress sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-8 space-y-1">
            {PORTAL_STEPS.map((s, i) => {
              const done =
                draft.completedSections.includes(s.id) ||
                i < stepIndex ||
                (s.id === "uploads" && draft.completedSections.includes("uploads"));
              const current = s.id === step;
              return (
                <button
                  key={s.id}
                  onClick={() => (done || i <= stepIndex ? goTo(s.id) : undefined)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    current
                      ? "bg-[#0B0B0B] font-semibold text-white"
                      : done
                        ? "text-neutral-700 hover:bg-neutral-200"
                        : "cursor-default text-neutral-400"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                      current
                        ? "border-[#F2C230] bg-[#F2C230] text-[#0B0B0B]"
                        : done
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-neutral-300 text-neutral-400"
                    )}
                  >
                    {done && !current ? <Check size={11} /> : i + 1}
                  </span>
                  {s.label}
                </button>
              );
            })}
            <div className="pt-4 text-[11px] text-neutral-400">
              {saveState === "saving" && (
                <span className="flex items-center gap-1">
                  <CloudUpload size={11} /> Saving…
                </span>
              )}
              {saveState === "saved" && lastSaved && (
                <span className="flex items-center gap-1 text-green-600">
                  <Check size={11} /> Saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile progress bar */}
        <div className="fixed inset-x-0 top-0 z-40 lg:hidden">
          <div className="h-1 bg-neutral-200">
            <div
              className="h-full bg-[#F2C230] transition-all"
              style={{ width: `${Math.round(((stepIndex + 1) / PORTAL_STEPS.length) * 100)}%` }}
            />
          </div>
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {step === "welcome" && (
                <WelcomeStep session={session} onContinue={() => goTo("overview")} />
              )}
              {step === "overview" && (
                <OverviewStep
                  session={session}
                  acknowledged={draft.overviewAcknowledged}
                  onAcknowledge={(v) => patchDraft({ overviewAcknowledged: v })}
                  onBack={() => goTo("welcome")}
                  onContinue={() => completeSection("overview", "business")}
                />
              )}
              {step === "business" && (
                <BusinessStep
                  business={draft.business}
                  onChange={(b) => patchDraft({ business: b })}
                  onBack={() => goTo("overview")}
                  onContinue={() => completeSection("business", "requirements")}
                />
              )}
              {step === "requirements" && (
                <RequirementsStep
                  requirements={draft.requirements}
                  onChange={(r) => patchDraft({ requirements: r })}
                  onBack={() => goTo("business")}
                  onContinue={() => completeSection("requirements", "references")}
                />
              )}
              {step === "references" && (
                <ReferencesStep
                  references={draft.references}
                  onChange={(r) => patchDraft({ references: r })}
                  onBack={() => goTo("requirements")}
                  onContinue={() => completeSection("references", "uploads")}
                />
              )}
              {step === "uploads" && (
                <UploadStep
                  token={token}
                  documents={documents}
                  onDocumentsChange={setDocuments}
                  onBack={() => goTo("references")}
                  onContinue={() => completeSection("uploads", "review")}
                />
              )}
              {step === "review" && (
                <ReviewStep
                  session={session}
                  draft={draft}
                  documents={documents}
                  onEdit={goTo}
                  onBack={() => goTo("uploads")}
                  onContinue={() => goTo("sign")}
                />
              )}
              {step === "sign" && (
                <SignStep
                  token={token}
                  session={session}
                  onBack={() => goTo("review")}
                  onSubmitted={(r) => setSubmitted(r)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </PortalFrame>
  );
}
