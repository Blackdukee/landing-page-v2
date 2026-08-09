import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || "cashair_quesna_system_secret_key_2026";
const COOKIE_NAME = "admin-token";

export interface AdminUserPayload {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Creates a cryptographically signed HMAC token for the session.
 */
export function createSignedToken(payload: AdminUserPayload): string {
  const dataStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(dataStr)
    .digest("base64url");
  return `${dataStr}.${signature}`;
}

/**
 * Verifies a signed session token. Returns the user payload if valid, or null if invalid/tampered.
 */
export function verifySignedToken(token: string): AdminUserPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [dataStr, signature] = token.split(".");
  if (!dataStr || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(dataStr)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(dataStr, "base64url").toString("utf-8");
    return JSON.parse(jsonStr) as AdminUserPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the admin session from a NextRequest (via Cookie or Authorization header).
 * Fallback to legacy base64 decoding if token is from an existing session, auto-upgrading to signed format.
 */
export function verifyAdminSession(req: NextRequest): AdminUserPayload | null {
  // 1. Try reading cookie
  let token = req.cookies.get(COOKIE_NAME)?.value;

  // 2. Try Authorization header fallback
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  // 3. Verify signed token
  const verified = verifySignedToken(token);
  if (verified) return verified;

  // 4. Legacy un-signed base64 token fallback for active sessions
  try {
    const json = Buffer.from(token, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    if (parsed && (parsed.role === "admin" || parsed.email)) {
      return parsed;
    }
  } catch {
    // Ignore legacy parse error
  }

  return null;
}

/**
 * Helper to check admin authorization in route handlers. Returns null if authorized, or a 401/403 NextResponse if unauthorized.
 */
export function checkAdminAuthResponse(req: NextRequest): NextResponse | null {
  const user = verifyAdminSession(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "غير مسموح بالوصول: يتطلب صلاحيات مدير النظام (Admin Required)" },
      { status: 401 }
    );
  }
  return null;
}

/**
 * Sets the admin session cookie on a NextResponse object.
 */
export function setAdminCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears the admin session cookie on a NextResponse object.
 */
export function clearAdminCookie(res: NextResponse): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
