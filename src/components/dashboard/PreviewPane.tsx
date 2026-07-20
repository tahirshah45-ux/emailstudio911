"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { Button, Card, CardHeader, CardTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface PreviewPaneProps {
  html: string;
}

export default function PreviewPane({ html }: PreviewPaneProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Live Preview</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Desktop width"
            className={cn(device === "desktop" && "bg-brand-gold/20")}
            onClick={() => setDevice("desktop")}
          >
            <Monitor size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Mobile width (375px)"
            className={cn(device === "mobile" && "bg-brand-gold/20")}
            onClick={() => setDevice("mobile")}
          >
            <Smartphone size={14} />
          </Button>
        </div>
      </CardHeader>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-1 justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-950"
      >
        <iframe
          title="Email preview"
          sandbox=""
          srcDoc={html}
          className={cn(
            "h-full border-0 bg-white transition-all duration-300",
            device === "desktop" ? "w-full" : "w-[375px] shadow-xl"
          )}
        />
      </motion.div>
    </Card>
  );
}
