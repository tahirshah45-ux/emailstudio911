"use client";

import { useSearchParams } from "next/navigation";
import Studio from "./Studio";

export default function ComposeClient() {
  const params = useSearchParams();
  return (
    <Studio
      projectId={params.get("project")}
      commId={params.get("comm")}
      templateId={params.get("template")}
    />
  );
}
