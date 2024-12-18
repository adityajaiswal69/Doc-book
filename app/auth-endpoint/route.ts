import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import liveblocks from "@/lib/liveblocks";
import { adminDb } from "@/firebase-admin";
import { redirect } from "next/navigation";

export async function POST(req: NextRequest) {
  const user = await currentUser();
      
      if (!user) {
          redirect("/sign-in");
      }

  const { sessionClaims } = await auth();
  const { room } = await req.json();

  const session = liveblocks.prepareSession(sessionClaims?.email!, {
    userInfo: {
      name: sessionClaims?.fullName!,
      email: sessionClaims?.email!,
      avatar: sessionClaims?.image!,
    },
  });

  const usersInRoom = await adminDb
    .collectionGroup("rooms")
    .where("userId", "==", sessionClaims?.email)
    .get();

  const userInRoom = usersInRoom.docs.find((doc) => doc.id === room);

  if (userInRoom?.exists) {
    session.allow(room, session.FULL_ACCESS);
    const { body, status } = await session.authorize();



    return new Response(body, { status });
  } else{
    return NextResponse.json({message: "You are not allowed to access this room"}, {status: 403});
  }
}
