import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "sonner";
import ConditionalAuthGuard from "@/components/ConditionalAuthGuard";
import ConditionalLayout from "@/components/ConditionalLayout";

export const metadata: Metadata = {
  title: "Doc Book - Your Notion Alternative",
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
              <ConditionalAuthGuard>
                <ConditionalLayout>
                  {children}
                </ConditionalLayout>
              </ConditionalAuthGuard>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
