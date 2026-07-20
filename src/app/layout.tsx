import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "911 Makers — Client Email Studio",
  description:
    "Internal tool for creating, previewing, and sending branded 911 Makers client emails.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
