import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, setAdminCookie, createSignedToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = verifyAdminSession(req);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true, user });

  // Sliding session renewal: refresh cookie with 1-year expiry on active usage
  const token = req.cookies.get("admin-token")?.value;
  if (token) {
    setAdminCookie(response, token, true);
  } else {
    // If authenticated via Bearer header, create and set cookie
    const freshToken = createSignedToken(user);
    setAdminCookie(response, freshToken, true);
  }

  return response;
}
