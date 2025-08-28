import { NextResponse } from "next/server";

export async function POST() {
  // Auth endpoint disabled for now
  return NextResponse.json({ message: "Auth endpoint disabled" }, { status: 200 });
}
