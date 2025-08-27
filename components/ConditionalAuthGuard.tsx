"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "./auth/AuthGuard";

export default function ConditionalAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Skip authentication for preview routes
  if (pathname.startsWith('/preview/')) {
    return <>{children}</>;
  }
  
  // Apply authentication for all other routes
  return <AuthGuard>{children}</AuthGuard>;
}
