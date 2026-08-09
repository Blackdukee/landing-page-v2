import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/apiError";
import { createSignedToken, setAdminCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ email });

    // Auto-create admin from env vars on first login attempt
    if (!user && email === process.env.ADMIN_EMAIL) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 12);
      user = await User.create({ email, password: hashed, role: "admin" });
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const userId = user._id.toString();
    const userEmail = user.email;
    const userRole = user.role || "admin";

    // Cryptographically signed token-based auth (cookie)
    const token = createSignedToken({
      id: userId,
      _id: userId,
      email: userEmail,
      name: "Admin",
      role: userRole,
    });

    const response = NextResponse.json({
      message: "Login successful",
      user: { email: userEmail, role: userRole },
    });

    setAdminCookie(response, token);

    return response;
  } catch (error) {
    const details = logError("POST /api/auth/login", error);
    return NextResponse.json({ error: "Login failed", details }, { status: 500 });
  }
}
