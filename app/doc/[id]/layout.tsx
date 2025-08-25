import { RoomProvider } from "@/components/RoomProvider";
import { use } from "react";

export default function Layout({children, params}:{
    children:React.ReactNode
    params: Promise<{ id: string }>
    
}) {
    const { id } = use(params);
  
    return (
      <RoomProvider roomId={id}>
        <div className="flex flex-col h-screen">
          {children}
        </div>
      </RoomProvider>
    )
}