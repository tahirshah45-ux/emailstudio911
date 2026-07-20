"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/primitives";

/** Shared application chrome: brand header, navigation, theme toggle. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-md border-2 border-brand-black bg-brand-black px-2.5 py-1 dark:border-white">
              <span className="font-black tracking-wider text-brand-gold">911</span>
              <span className="font-black tracking-wider text-white">MAKERS</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight">Client Communication Center</div>
              <div className="text-[11px] text-neutral-500">Official project documentation</div>
            </div>
          </Link>
          <nav className="ml-4 flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Projects
              </Button>
            </Link>
            <Link href="/compose">
              <Button variant="ghost" size="sm">
                Composer
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                Settings
              </Button>
            </Link>
          </nav>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle dark mode">
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </Button>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
