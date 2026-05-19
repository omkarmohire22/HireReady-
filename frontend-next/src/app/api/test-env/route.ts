import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    secret: process.env.NEXTAUTH_SECRET || "MISSING",
    url: process.env.NEXTAUTH_URL || "MISSING",
    clientId: process.env.GOOGLE_CLIENT_ID || "MISSING"
  });
}
