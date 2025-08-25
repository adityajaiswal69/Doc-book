import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Auth endpoint disabled for now
  return NextResponse.json({ message: "Auth endpoint disabled" }, { status: 200 });
}
