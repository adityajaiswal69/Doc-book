import Header from "@/components/Header";
import { RoomProvider } from "@/components/RoomProvider";
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { use } from "react";

export default function Layout({children, params}:{
    children:React.ReactNode
    params: Promise<{ id: string }>
    
}) {
    const  userId  = auth();
    const { id } = use(params);

    if (!userId) {
        redirect('/');
    }
  
    return (
      <RoomProvider roomId={id}>
          <Header id={id}/>
          {children}
      </RoomProvider>
    )
}