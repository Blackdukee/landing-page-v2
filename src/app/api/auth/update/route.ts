import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/apiError";

export async function PUT(req: NextRequest) {
  try {
    // Check admin auth
    const token = req.cookies.get("admin-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tokenUser: { id: string; email: string; role: string };
    try {
      tokenUser = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      if (tokenUser.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { currentPassword, newPassword, newEmail } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 }
      );
    }

    // Find user in DB
    const user = await User.findById(tokenUser.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Update email if provided
    if (newEmail && newEmail.trim()) {
      const trimmedEmail = newEmail.trim().toLowerCase();
      if (trimmedEmail !== user.email) {
        // Check uniqueness
        const existing = await User.findOne({
          email: trimmedEmail,
          _id: { $ne: user._id },
        });
        if (existing) {
          return NextResponse.json(
            { error: "Email already in use" },
            { status: 409 }
          );
        }
        user.email = trimmedEmail;
      }
    }

    // Update password if provided
    if (newPassword && newPassword.trim()) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      user.password = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    // Re-issue cookie with updated info
    const newToken = Buffer.from(
      JSON.stringify({ id: user._id, email: user.email, role: user.role })
    ).toString("base64");

    const response = NextResponse.json({
      message: "Account updated successfully",
      user: { email: user.email, role: user.role },
    });

    response.cookies.set("admin-token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    const details = logError("PUT /api/auth/update", error);
    return NextResponse.json(
      { error: "Failed to update account", details },
      { status: 500 }
    );
  }
}
