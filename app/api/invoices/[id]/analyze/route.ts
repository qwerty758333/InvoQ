import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  extractInvoiceFields,
  analyzeCompliance,
  generateCorrectedInvoice,
  generateExplanation,
} from "@/lib/ai";
import { checkCompliance } from "@/lib/compliance";
import type { ExtractedInvoice } from "@/lib/types";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the invoice
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (invoice.status !== "pending") {
      return NextResponse.json({ error: "Already analyzed" }, { status: 400 });
    }

    // Step 1: Fetch the image and convert to base64
    const imageRes = await fetch(invoice.originalFileUrl);
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const imageBase64 = imageBuffer.toString("base64");

    // Step 2: Extract fields using AI (Qwen-VL)
    const extracted = await extractInvoiceFields(imageBase64);

    // Step 3: Run rule-based compliance check
    const ruleResult = checkCompliance(extracted as ExtractedInvoice);

    // Step 4: AI-enhanced analysis (adds any issues the rules engine missed)
    const allIssues = await analyzeCompliance(
      extracted as ExtractedInvoice,
      ruleResult.issues
    );

    // Step 5: Generate corrected invoice
    const corrected = await generateCorrectedInvoice(
      extracted as ExtractedInvoice,
      allIssues
    );

    // Step 6: Generate plain-language explanation
    const explanation = await generateExplanation(
      extracted as ExtractedInvoice,
      allIssues,
      corrected
    );

    // Step 7: Update the invoice record
    const hasCritical = allIssues.some((i) => i.severity === "critical");
    const hasWarning = allIssues.some((i) => i.severity === "warning");
    const status =
      !hasCritical && !hasWarning ? "compliant" : "non_compliant";

    await prisma.invoice.update({
      where: { id: params.id },
      data: {
        extractedData: extracted,
        complianceIssues: allIssues,
        correctedData: corrected,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      status,
      issues: allIssues,
      explanation,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
