/**
 * 911 Makers brand palette — extracted from the official logo.
 * These constants are the single source of truth for every generated email.
 */
export const BRAND = {
  black: "#0B0B0B",
  gold: "#F2C230",
  /** Darkened gold for links on white backgrounds (accessible contrast). */
  goldDark: "#92660A",
  white: "#FFFFFF",
  heading: "#111827",
  body: "#374151",
  muted: "#6B7280",
  label: "#9CA3AF",
  border: "#E5E7EB",
  cardBg: "#F9FAFB",
  pageBg: "#F3F4F6",
  divider: "#F3F4F6",
} as const;

export const FONT_STACK =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const COMPANY = {
  name: "911 Makers",
  division: "Web Solutions & AI Automation Division",
  tagline: "NINE ONE ONE MAKERS",
  logoUrl: "https://i.ibb.co/twq99gs1/911-MAKERS.png",
} as const;
