import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Company from "@/models/Company";
import { logError } from "@/lib/apiError";

function checkAdminAuth(req: NextRequest) {
  const token = req.cookies.get("admin-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const user = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  try {
    await dbConnect();
    const companies = await Company.find().sort({ name: 1 }).lean();
    return NextResponse.json(companies);
  } catch (error) {
    const details = logError("GET /api/companies", error);
    return NextResponse.json({ error: "Failed to fetch companies", details }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  try {
    await dbConnect();
    const body = await req.json();

    const { name, logo, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    if (!logo || typeof logo !== "string" || !logo.trim()) {
      return NextResponse.json({ error: "Company logo is required" }, { status: 400 });
    }

    const company = await Company.create({
      name: name.trim(),
      logo: logo.trim(),
      description: typeof description === "string" ? description.trim() : "",
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/companies", error);
    return NextResponse.json({ error: "Failed to create company", details }, { status: 500 });
  }
}
