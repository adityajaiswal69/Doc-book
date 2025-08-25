"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "./auth/AuthGuard";
import AppSidebar from "./app-sidebar";

interface ConditionalAuthGuardProps {
  children: React.ReactNode;
}

export function ConditionalAuthGuard({ children }: ConditionalAuthGuardProps) {
  const pathname = usePathname();
  
  // Check if the current route is a share route
  const isShareRoute = pathname?.startsWith('/share/');
  
  // If it's a share route, render without authentication
  if (isShareRoute) {
    return <>{children}</>;
  }
  
  // For all other routes, apply authentication protection
  return (
    <AuthGuard>
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
      {/* Mobile sidebar overlay */}
      <div className="lg:hidden">
        <AppSidebar />
      </div>
    </AuthGuard>
  );
}
