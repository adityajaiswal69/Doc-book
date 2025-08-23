import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import AppSidebar from "@/components/app-sidebar";
import AuthForm from "@/components/auth/AuthForm";
import { AuthGuard } from "@/components/auth/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Note Forge - Your Notion Alternative",
  description: "A powerful note-taking app built with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system">
            <AuthProvider>
              <AuthGuard>
                <SidebarProvider>
                  <div className="flex h-screen bg-background">
                    {/* Sidebar - hidden on mobile, shown on desktop */}
                    <div className="hidden lg:block">
                      <AppSidebar />
                    </div>
                    {/* Main content - full width on mobile, with sidebar on desktop */}
                    <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
                      {children}
                    </main>
                  </div>
                  {/* Mobile sidebar overlay */}
                  <div className="lg:hidden">
                    <AppSidebar />
                  </div>
                </SidebarProvider>
              </AuthGuard>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
