'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { FileText } from "lucide-react";
import { useDocument } from "@/hooks/use-documents";

function SidebarOption({href, id}: {
    href: string,
    id: string   
}) {
    const { document, loading, error } = useDocument(id);
    const pathname = usePathname();
    const isActive = href.includes(pathname) && pathname !== "/";

    if (loading) return null;
    if (error || !document) return null;

    return (
        <SidebarMenuItem key={document.id}>
            <SidebarMenuButton asChild>
                <a href={href}>
                    <FileText/>
                    <span className="truncate">{document.title}</span>
                </a>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

export default SidebarOption;