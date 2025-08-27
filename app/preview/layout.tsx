import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Preview - Note Forge",
  description: "Preview shared documents from Note Forge",
};

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-background">
      {children}
    </div>
  );
}

