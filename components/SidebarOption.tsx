'use client'
import { db } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from  "next/link";
import { usePathname } from "next/navigation";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import {  FileText } from "lucide-react";

function SidebarOption({href,id}:{
    href:string,
    id:string   
}){
    const [data,loading,error] = useDocumentData(doc(db,"documents",id));
    const pathname = usePathname();
    const isActive = href.includes(pathname) && pathname !== "/";

    if(!data) return null;
    return (
        <SidebarMenuItem key={data.id} >
                  <SidebarMenuButton asChild>
                    <a href={href}>
                    <FileText/>
                      <span className="truncate">{data.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
    )
}
export default SidebarOption;