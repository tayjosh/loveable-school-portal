import React from "react";
import { PortalShell } from "@/features/layout/PortalShell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
