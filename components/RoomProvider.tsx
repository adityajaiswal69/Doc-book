'use client'
// import { ClientSideSuspense, RoomProvider as RoomProviderWrapper } from "@liveblocks/react";
// import LoadingSpinner from "./ui/LoadingSpinner";
// import LiveCursorProvider from './LiveCursorProvider'
export const RoomProvider = ({roomId, children}:{
    roomId: string;
    children: React.ReactNode
}) => {
  return (
    // <RoomProviderWrapper
    //  id={roomId}
    //  initialPresence={{
    //     cursor: null
    //  }}
    // >
    //     <ClientSideSuspense fallback={<LoadingSpinner/>}>
    //     <LiveCursorProvider>
    //     {children}
    //     </LiveCursorProvider>
    //     </ClientSideSuspense>
    // </RoomProviderWrapper>
    <div>
      {children}
    </div>
  )
}
