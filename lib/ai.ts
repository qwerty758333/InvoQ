import OpenAI from "openai";
import { getRulesForPrompt } from "./compliance";
import type { ExtractedInvoice, ComplianceIssue, CorrectedInvoice, Language } from "./types";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      apiKey: process.env.DASHSCOPE_API_KEY,
    });
  }
  return _client;
}

/**
 * Stage 1 — Extract structured fields from an invoice image using Qwen-VL.
 */
export async function extractInvoiceFields(
  imageBase64: string
): Promise<ExtractedInvoice> {
  const response = await getClient().chat.completions.create({
    model: "qwen-vl-plus",
    messages: [
      {
        role: "system",
        content:
          "You are an expert at reading invoices and extracting structured data. " +
          "Return ONLY valid JSON with these fields (use null if not found): " +
          "invoiceTitle, invoiceNumber, invoiceDate, supplierName, supplierAddress, " +
          "supplierVatNumber, supplierTin, customerName, customerAddress, customerVatNumber, " +
          "itemDescriptions (array of strings), quantities (array of numbers), " +
          "unitPrices (array of numbers), lineTotals (array of numbers), " +
          "subtotal, vatRate, vatAmount, totalAmount, currency, discounts, " +
          "paymentTerms, supplyDate, exportIndicator. " +
          "Return a single JSON object, no markdown.",
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
          { type: "text", text: "Extract all invoice fields from this image as JSON." },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  // Strip any markdown fences
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

/**
 * Stage 2 — AI-enhanced compliance analysis (supplements the rule engine).
 * Uses the rule-based engine first, then asks AI to identify additional issues.
 */
export async function analyzeCompliance(
  extracted: ExtractedInvoice,
  ruleIssues: ComplianceIssue[]
): Promise<ComplianceIssue[]> {
  const ruleset = getRulesForPrompt();

  const response = await getClient().chat.completions.create({
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content:
          "You are a Sri Lankan VAT compliance expert. Given extracted invoice data " +
          "and the official compliance ruleset, identify ALL compliance issues. " +
          "The rule engine already found these issues:\n" +
          JSON.stringify(ruleIssues) +
          "\n\nYour job: review and add any ADDITIONAL issues the rule engine may have missed " +
          "(e.g., calculation errors, inconsistent data, missing context). " +
          "Return a JSON array of issue objects with: field, label, issue, severity (critical/warning/info), " +
          "ruleReference, suggestion. Return ONLY the JSON array.",
      },
      {
        role: "user",
        content: `Ruleset:\n${ruleset}\n\nExtracted invoice:\n${JSON.stringify(extracted, null, 2)}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 2048,
  });

  const text = response.choices[0]?.message?.content ?? "[]";
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  try {
    const aiIssues = JSON.parse(cleaned) as ComplianceIssue[];
    // Merge: AI issues + rule issues, dedup by field
    const seen = new Set(ruleIssues.map((i) => i.field));
    const merged = [...ruleIssues];
    for (const ai of aiIssues) {
      if (!seen.has(ai.field)) {
        merged.push(ai);
        seen.add(ai.field);
      }
    }
    return merged;
  } catch {
    return ruleIssues;
  }
}

/**
 * Stage 3 — Generate a corrected, compliant version of the invoice.
 */
export async function generateCorrectedInvoice(
  extracted: ExtractedInvoice,
  issues: ComplianceIssue[]
): Promise<CorrectedInvoice> {
  const ruleset = getRulesForPrompt();

  const response = await getClient().chat.completions.create({
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content:
          "You are a Sri Lankan VAT compliance expert. Given the extracted invoice data, " +
          "the list of compliance issues, and the official ruleset, generate a CORRECTED " +
          "and fully compliant version of the invoice. " +
          "Fix all issues, fill in missing required fields with reasonable placeholder values " +
          "(marked with [REQUIRED: description]), and ensure all calculations are correct. " +
          "Include a '_corrections' array listing each change made. " +
          "Return ONLY valid JSON.",
      },
      {
        role: "user",
        content:
          `Ruleset:\n${ruleset}\n\n` +
          `Extracted invoice:\n${JSON.stringify(extracted, null, 2)}\n\n` +
          `Issues found:\n${JSON.stringify(issues, null, 2)}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 2048,
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

/**
 * Translate an explanation into the target language using Qwen-MT.
 */
export async function translateExplanation(
  text: string,
  targetLanguage: Language
): Promise<string> {
  if (targetLanguage === "en") return text;

  const langMap: Record<Language, string> = {
    en: "English",
    si: "Sinhala",
    ta: "Tamil",
  };

  const response = await getClient().chat.completions.create({
    model: "qwen-mt-plus",
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the following text into ${langMap[targetLanguage]}. Preserve all formatting, field names, and technical terms. Return ONLY the translated text.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.3,
    max_tokens: 2048,
  });

  return response.choices[0]?.message?.content ?? text;
}

/**
 * Generate a plain-language explanation of the compliance results.
 */
export async function generateExplanation(
  extracted: ExtractedInvoice,
  issues: ComplianceIssue[],
  corrected: CorrectedInvoice
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content:
          "You are a friendly compliance advisor for Sri Lankan small businesses. " +
          "Explain the invoice compliance results in plain, simple English. " +
          "Structure: 1) Summary of what's good, 2) What needs fixing (each issue), " +
          "3) What was corrected. Keep it professional but accessible. " +
          "Reference the Gazette No. 2481/22 where relevant.",
      },
      {
        role: "user",
        content:
          `Original data:\n${JSON.stringify(extracted, null, 2)}\n\n` +
          `Issues:\n${JSON.stringify(issues, null, 2)}\n\n` +
          `Corrections made:\n${JSON.stringify(corrected._corrections ?? [], null, 2)}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 1536,
  });

  return response.choices[0]?.message?.content ?? "Analysis complete.";
}
