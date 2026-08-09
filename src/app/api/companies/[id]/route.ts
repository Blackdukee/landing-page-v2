import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Company from "@/models/Company";
import Product from "@/models/Product";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuthResponse(req);
  if (authError) return authError;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (typeof body.logo === "string" && body.logo.trim()) {
      updateData.logo = body.logo.trim();
    }
    if (typeof body.description === "string") {
      updateData.description = body.description.trim();
    }

    const company = await Company.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json(company);
  } catch (error) {
    const details = logError("PUT /api/companies/[id]", error);
    return NextResponse.json({ error: "Failed to update company", details }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuthResponse(req);
  if (authError) return authError;

  try {
    await dbConnect();
    const { id } = await params;
    const company = await Company.findByIdAndDelete(id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Unlink company from all products referencing it
    await Product.updateMany({ company: id }, { $set: { company: null } });

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    const details = logError("DELETE /api/companies/[id]", error);
    return NextResponse.json({ error: "Failed to delete company", details }, { status: 500 });
  }
}
