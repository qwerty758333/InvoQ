import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadInvoiceImage } from "@/lib/storage";

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

    // Upload to Vercel Blob storage
    const fileUrl = await uploadInvoiceImage(file, session.user.id);

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
