import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

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

    // Simple token-based auth (cookie)
    const token = Buffer.from(
      JSON.stringify({ id: user._id, email: user.email, role: user.role })
    ).toString("base64");

    const response = NextResponse.json({
      message: "Login successful",
      user: { email: user.email, role: user.role },
    });

    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
