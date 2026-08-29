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
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  let pipelineStage = "init";

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

    if (invoice.status !== "pending" && invoice.status !== "failed") {
      return NextResponse.json({ error: "Already analyzed" }, { status: 400 });
    }

    // Step 1: Read the image from disk and convert to base64
    pipelineStage = "read_file";
    const imagePath = join(process.cwd(), "public", invoice.originalFileUrl);
    const imageBuffer = await readFile(imagePath);
    const imageBase64 = imageBuffer.toString("base64");
    console.log("[Analyze] Step 1 complete: file read, image encoded");

    // Step 2: Extract fields using AI (Qwen-VL) — MODEL: qwen-vl-plus
    pipelineStage = "extract";
    const extracted = await extractInvoiceFields(imageBase64);
    console.log("[Analyze] Step 2 complete: qwen-vl-plus returned extracted fields");

    // Step 3: Run rule-based compliance check (local, no AI)
    pipelineStage = "rule_check";
    const ruleResult = checkCompliance(extracted as ExtractedInvoice);
    console.log(`[Analyze] Step 3 complete: rule engine found ${ruleResult.issues.length} issues`);

    // Step 4: AI-enhanced analysis — MODEL: qwen-plus
    pipelineStage = "ai_compliance";
    const allIssues = await analyzeCompliance(
      extracted as ExtractedInvoice,
      ruleResult.issues
    );
    console.log(`[Analyze] Step 4 complete: qwen-plus returned ${allIssues.length} total issues`);

    // Step 5: Generate corrected invoice — MODEL: qwen-plus
    pipelineStage = "ai_correct";
    const corrected = await generateCorrectedInvoice(
      extracted as ExtractedInvoice,
      allIssues
    );
    console.log("[Analyze] Step 5 complete: qwen-plus returned corrected invoice");

    // Step 6: Generate plain-language explanation — MODEL: qwen-plus
    pipelineStage = "ai_explain";
    const explanation = await generateExplanation(
      extracted as ExtractedInvoice,
      allIssues,
      corrected
    );
    console.log("[Analyze] Step 6 complete: qwen-plus returned explanation");

    // Step 7: Calculate compliance score and determine status
    pipelineStage = "save_results";
    const hasCritical = allIssues.some((i) => i.severity === "critical");
    const hasWarning = allIssues.some((i) => i.severity === "warning");
    const status =
      !hasCritical && !hasWarning ? "compliant" : "non_compliant";

    // Score: 100 - (10 per critical) - (5 per warning), clamped to [0, 100]
    const criticalCount = allIssues.filter((i) => i.severity === "critical").length;
    const warningCount = allIssues.filter((i) => i.severity === "warning").length;
    const complianceScore = Math.max(0, Math.min(100, 100 - (criticalCount * 10) - (warningCount * 5)));

    await prisma.invoice.update({
      where: { id: params.id },
      data: {
        extractedData: extracted,
        complianceIssues: allIssues,
        correctedData: corrected,
        complianceScore,
        explanation,
        status,
      },
    });

    console.log(`[Analyze] Pipeline complete: status=${status} score=${complianceScore}`);

    return NextResponse.json({
      success: true,
      status,
      issues: allIssues,
      explanation,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    const errorStatus = (error as any)?.status || (error as any)?.statusCode;
    const errorCode = (error as any)?.error?.code || (error as any)?.code || "";

    console.error(
      `[Analyze API Error] stage=${pipelineStage} status=${errorStatus} code=${errorCode} message=${errorMessage}`
    );

    // Update invoice status to "failed" so it doesn't stay "pending" forever
    try {
      await prisma.invoice.update({
        where: { id: params.id },
        data: { status: "failed" },
      });
    } catch (updateError) {
      console.error("[Analyze API] Failed to update invoice status to failed:", updateError);
    }

    // Detect specific AI provider errors
    if (errorStatus === 403 || errorCode.includes("AccessDenied") || errorMessage.includes("AccessDenied")) {
      return NextResponse.json(
        { error: `AI model access denied at stage "${pipelineStage}". The model may need to be enabled in your Alibaba Model Studio workspace.` },
        { status: 500 }
      );
    }

    if (errorStatus === 401 || errorMessage.includes("invalid_api_key") || errorMessage.includes("Incorrect API key")) {
      return NextResponse.json(
        { error: "AI service authentication failed. Please check the DASHSCOPE_API_KEY configuration." },
        { status: 500 }
      );
    }

    // Provide more specific error messages
    let userError = `Analysis failed at stage "${pipelineStage}". Please try again.`;
    if (errorMessage.includes("ENOENT") || errorMessage.includes("no such file")) {
      userError = "Invoice file not found. Please re-upload the invoice.";
    } else if (errorMessage.includes("JSON")) {
      userError = "Could not parse invoice data. The image may be unclear.";
    } else if (errorStatus === 429) {
      userError = "AI service rate limit reached. Please wait a moment and try again.";
    }

    return NextResponse.json(
      { error: userError },
      { status: 500 }
    );
  }
}
