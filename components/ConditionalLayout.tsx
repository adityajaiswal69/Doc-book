"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "./app-sidebar";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide sidebar for preview routes
  const isPreviewRoute = pathname.startsWith('/preview/');
  
  if (isPreviewRoute) {
    // For preview routes, just show the children without sidebar
    return <>{children}</>;
  }
  
  // For all other routes, show the normal layout with sidebar
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - hidden on mobile, shown on desktop */}
      <div className="hidden lg:block flex-shrink-0">
        <AppSidebar />
      </div>
      {/* Main content - full width on mobile, with sidebar on desktop */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}
