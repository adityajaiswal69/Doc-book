import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
// import liveblocks from "@/lib/liveblocks";
import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function POST(req: NextRequest) {
  const user = await currentUser();
      
  if (!user) {
    redirect("/sign-in");
  }

  // const { sessionClaims } = await auth();
  // const { room } = await req.json();

  // const session = liveblocks.prepareSession(sessionClaims?.email!, {
  //   userInfo: {
  //     name: sessionClaims?.fullName!,
  //     email: sessionClaims?.email!,
  //     avatar: sessionClaims?.image!,
  //   },
  // });

  // const supabase = createServerSupabaseClient();

  // // Check if user has access to this room
  // const { data: userRoom, error } = await supabase
  //   .from('user_rooms')
  //   .select('*')
  //   .eq('user_id', sessionClaims?.email)
  //   .eq('room_id', room)
  //   .single();

  // if (error || !userRoom) {
  //   return NextResponse.json(
  //     { message: "You are not allowed to access this room" }, 
  //     { status: 403 }
  //   );
  // }

  // session.allow(room, session.FULL_ACCESS);
  // const { body, status } = await session.authorize();

  // return new Response(body, { status });
  
  // Return a simple response for now
  return NextResponse.json({ message: "Auth endpoint disabled" }, { status: 200 });
}
