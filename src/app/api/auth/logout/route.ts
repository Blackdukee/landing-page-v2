import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  clearAdminCookie(response);
  return response;
}
