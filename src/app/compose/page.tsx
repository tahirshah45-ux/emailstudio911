import { Suspense } from "react";
import ComposeClient from "@/components/dashboard/ComposeClient";

export default function ComposePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-400">Loading composer…</div>}>
      <ComposeClient />
    </Suspense>
  );
}
