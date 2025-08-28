import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Preview - Doc Book",
  description: "Preview shared documents from Doc Book",
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

