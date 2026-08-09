import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || "cashair_quesna_system_secret_key_2026";
const COOKIE_NAME = "admin-token";

/**
 * Lightweight Edge-compatible HMAC-SHA256 signature verifier for Proxy
 */
async function verifyTokenEdge(token: string): Promise<boolean> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }

  const [dataStr, signature] = token.split(".");
  if (!dataStr || !signature) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(JWT_SECRET);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify", "sign"]
    );

    // Compute expected signature
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(dataStr)
    );

    // Convert to base64url
    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    if (signature !== expectedSignature) {
      // Check legacy base64 format fallback
      try {
        const jsonStr = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
        const parsed = JSON.parse(jsonStr);
        return !!(parsed && (parsed.role === "admin" || parsed.email));
      } catch {
        return false;
      }
    }

    // Decode payload and verify role
    const jsonStr = atob(dataStr.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(jsonStr);
    return !!(payload && (payload.role === "admin" || payload.email));
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // 1. Determine if the request requires authentication
  let requiresAuth = false;

  // Protected Admin Pages
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    requiresAuth = true;
  }

  // Protected Cashier / POS Pages
  if (pathname.startsWith("/cashier")) {
    requiresAuth = true;
  }

  // Protected API Routes: All POS endpoints
  if (pathname.startsWith("/api/cashair")) {
    requiresAuth = true;
  }

  // Protected API Routes: Product mutations (POST, PUT, DELETE)
  if (pathname.startsWith("/api/products") && method !== "GET") {
    requiresAuth = true;
  }

  // Protected API Routes: Category mutations (POST, PUT, DELETE)
  if (pathname.startsWith("/api/categories") && method !== "GET") {
    requiresAuth = true;
  }

  // Protected API Routes: Company mutations (POST, PUT, DELETE)
  if (pathname.startsWith("/api/companies") && method !== "GET") {
    requiresAuth = true;
  }

  // Protected API Routes: Order management (GET list, PUT update, DELETE delete)
  // NOTE: POST /api/orders is public storefront checkout!
  if (pathname.startsWith("/api/orders") && (method === "GET" || method === "PUT" || method === "DELETE")) {
    requiresAuth = true;
  }

  // Protected API Routes: File uploads, settings updates, database seeding
  if (pathname.startsWith("/api/upload") || pathname.startsWith("/api/seed")) {
    requiresAuth = true;
  }
  if (pathname.startsWith("/api/settings") && method !== "GET") {
    requiresAuth = true;
  }

  if (!requiresAuth) {
    return NextResponse.next();
  }

  // 2. Extract token from cookie or Authorization header
  let token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // 3. Verify token
  const isValid = token ? await verifyTokenEdge(token) : false;

  if (!isValid) {
    // If API request, return JSON 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "غير مسموح بالوصول: يتطلب صلاحيات مدير النظام (Admin Required)" },
        { status: 401 }
      );
    }
    // If Page request, redirect to /admin/login
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/cashier/:path*",
    "/api/cashair/:path*",
    "/api/products/:path*",
    "/api/categories/:path*",
    "/api/companies/:path*",
    "/api/orders/:path*",
    "/api/upload/:path*",
    "/api/settings/:path*",
    "/api/seed/:path*",
  ],
};
