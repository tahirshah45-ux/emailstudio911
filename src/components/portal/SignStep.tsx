"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Loader2, ShieldCheck } from "lucide-react";
import { portalApi, type PortalSession } from "@/lib/portalApi";
import { PButton, PCard, PCheck, PHeading, PNav } from "./PortalSteps";

/* ------------------------------------------------------------------ */
/* Signature pad — pointer-events canvas, works with mouse/touch/pen   */
/* ------------------------------------------------------------------ */

function SignaturePad({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  useEffect(() => {
    setup();
    const onResize = () => setup();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setup]);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasInk.current = true;
  };

  const up = () => {
    drawing.current = false;
    last.current = null;
    if (hasInk.current && canvasRef.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    onChange(null);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border-2 border-neutral-300 bg-white">
        <canvas
          ref={canvasRef}
          className="block h-44 w-full touch-none cursor-crosshair"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
        <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 select-none border-t border-neutral-300 px-10 pt-1 text-[11px] text-neutral-400">
          Sign above
        </span>
      </div>
      <button
        type="button"
        onClick={clear}
        className="mt-2 flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900"
      >
        <Eraser size={13} /> Clear signature
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sign & submit step                                                  */
/* ------------------------------------------------------------------ */

export default function SignStep({
  token,
  session,
  onBack,
  onSubmitted,
}: {
  token: string;
  session: PortalSession;
  onBack: () => void;
  onSubmitted: (r: { referenceNumber: string; submittedAt: string }) => void;
}) {
  const [scopeConfirmed, setScopeConfirmed] = useState(session.submission.scopeConfirmed);
  const [checklist, setChecklist] = useState<string[]>(session.submission.checklistConfirmations);
  const [declarationAccepted, setDeclarationAccepted] = useState(session.submission.declarationAccepted);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleItem = (id: string) =>
    setChecklist((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const canSubmit = scopeConfirmed && declarationAccepted && Boolean(signature) && !submitting;

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const result = await portalApi.submit(token, {
        scopeConfirmed,
        checklistConfirmations: checklist,
        declarationAccepted,
        signatureDataUrl: signature ?? "",
      });
      onSubmitted(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your submission could not be completed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <PCard>
      <PHeading
        title="Confirm & Sign"
        hint="One last step — confirm the scope, accept the declaration, and sign electronically."
      />

      {/* Scope confirmation */}
      <div className="mb-5">
        <PCheck checked={scopeConfirmed} onChange={setScopeConfirmed}>
          <strong>I confirm that the project scope shown in the Project Overview accurately
          represents the work requested.</strong>
        </PCheck>
      </div>

      {/* Checklist confirmation */}
      {session.checklist.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 text-[13px] font-semibold text-neutral-700">
            Please confirm each applicable item:
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {session.checklist.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:border-[#F2C230]"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#F2C230]"
                  checked={checklist.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                />
                <span>
                  <span className="text-neutral-700">{item.text}</span>
                  <span className="block text-[11px] text-neutral-400">{item.group}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Declaration */}
      <div className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-2 text-[13px] font-semibold text-neutral-700">Client Declaration</div>
        <ul className="mb-3 space-y-1 text-sm text-neutral-600">
          {session.declaration.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-[#F2C230]">▪</span> {line}
            </li>
          ))}
        </ul>
        <PCheck checked={declarationAccepted} onChange={setDeclarationAccepted}>
          <strong>I have read and accept this declaration.</strong>
        </PCheck>
      </div>

      {/* Signature */}
      <div className="mb-2 text-[13px] font-semibold text-neutral-700">
        Electronic Signature — {session.client.name || "Client"}
      </div>
      <SignaturePad onChange={setSignature} />

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-500">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-green-600" />
        Your signature, the date, and your confirmation are recorded as part of the official
        project documentation for {session.project.referenceNumber}.
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <PButton variant="ghost" onClick={onBack} disabled={submitting}>
          Back
        </PButton>
        <PButton variant="gold" onClick={submit} disabled={!canSubmit}>
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Submitting…
            </>
          ) : (
            "Submit Project Information"
          )}
        </PButton>
      </div>
    </PCard>
  );
}
