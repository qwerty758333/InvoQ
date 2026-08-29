import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "invoices");

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPG, PNG, or WebP." },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 10MB." },
        { status: 400 }
      );
    }

    // Generate unique filename to prevent collisions
    const ext = file.name.split(".").pop() || "jpg";
    const uniqueFilename = `${randomUUID()}.${ext}`;
    const userDir = join(UPLOAD_DIR, session.user.id);

    // Ensure directory exists
    await mkdir(userDir, { recursive: true });

    // Write file to disk
    const filePath = join(userDir, uniqueFilename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Store relative path for URL access
    const fileUrl = `/uploads/invoices/${session.user.id}/${uniqueFilename}`;

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        originalFileUrl: fileUrl,
        extractedData: {},
        complianceIssues: [],
        correctedData: {},
        status: "pending",
      },
    });

    return NextResponse.json({ invoiceId: invoice.id, url: fileUrl });
  } catch (error) {
    console.error("[Upload API Error]", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
}
