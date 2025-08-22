"use client";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import NewDocumentButton from "./NewDocumentButton";
import { useEffect, useState } from "react";
import SidebarOption from "./SidebarOption";
import { useDocuments } from "@/hooks/use-documents";
import { Document, UserRoom } from "@/types/database";

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { user } = useUser();
  const { documents, userRooms, loading, error } = useDocuments();
  const [groupedData, setGroupedData] = useState<{
    owner: (Document & { roomId: string })[];
    editor: (Document & { roomId: string })[];
  }>({
    owner: [],
    editor: [],
  });

  useEffect(() => {
    if (!documents || !userRooms) return;

    const grouped = documents.reduce<{
      owner: (Document & { roomId: string })[];
      editor: (Document & { roomId: string })[];
    }>(
      (acc, document) => {
        const userRoom = userRooms.find(ur => ur.room_id === document.id);
        
        if (userRoom) {
          const docWithRoomId = { ...document, roomId: document.id };
          
          if (userRoom.role === "owner") {
            acc.owner.push(docWithRoomId);
          } else {
            acc.editor.push(docWithRoomId);
          }
        }
        return acc;
      },
      {
        owner: [],
        editor: [],
      }
    );

    setGroupedData(grouped);
  }, [documents, userRooms]);

  if (error) {
    console.error("Error loading documents:", error);
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 flex items-center justify-between">
            {user && (
              <h1 className="text-xl font-bold">
                {user?.firstName}
                {`'s`} Forge
              </h1>
            )}
            <NewDocumentButton />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <div className="p-2 text-sm text-muted-foreground">Loading...</div>
              ) : groupedData.owner.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No documents found</div>
              ) : (
                <>
                  {groupedData.owner.map((doc) => (
                    <SidebarOption
                      key={doc.id}
                      href={`/doc/${doc.roomId}`}
                      id={doc.roomId}
                    />
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
