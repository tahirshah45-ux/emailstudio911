import type { Metadata } from "next";
import PortalApp from "@/components/portal/PortalApp";

export const metadata: Metadata = {
  title: "Client Portal — 911 Makers",
  description: "Secure client collaboration portal for your 911 Makers project.",
  robots: { index: false, follow: false },
};

export default function ClientPortalPage({ params }: { params: { token: string } }) {
  return <PortalApp token={params.token} />;
}
