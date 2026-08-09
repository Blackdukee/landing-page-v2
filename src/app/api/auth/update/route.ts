import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/apiError";
import { verifyAdminSession, createSignedToken, setAdminCookie } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    // Check admin auth
    const tokenUser = verifyAdminSession(req);
    if (!tokenUser || tokenUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const user = await User.findById(tokenUser.id || tokenUser._id);
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
    const userId = user._id.toString();
    const userEmail = user.email;
    const userRole = user.role || "admin";

    const newToken = createSignedToken({
      id: userId,
      _id: userId,
      email: userEmail,
      name: "Admin",
      role: userRole,
    });

    const response = NextResponse.json({
      message: "Account updated successfully",
      user: { email: userEmail, role: userRole },
    });

    setAdminCookie(response, newToken);

    return response;
  } catch (error) {
    const details = logError("PUT /api/auth/update", error);
    return NextResponse.json(
      { error: "Failed to update account", details },
      { status: 500 }
    );
  }
}
