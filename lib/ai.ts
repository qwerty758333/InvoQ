import OpenAI from "openai";
import { getRulesForPrompt } from "./compliance";
import type { ExtractedInvoice, ComplianceIssue, CorrectedInvoice, Language } from "./types";

const DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

function getClient(): OpenAI {
  const baseURL = process.env.OPEN_AI_COMPATIBLE || DEFAULT_BASE_URL;
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY environment variable is not set");
  }

  return new OpenAI({ baseURL, apiKey });
}

/** Log safe diagnostics (never the key value). */
function logDiagnostics(context: string, model: string) {
  const baseURL = process.env.OPEN_AI_COMPATIBLE || DEFAULT_BASE_URL;
  console.log(
    `[AI ${context}] base=${baseURL} model=${model} key_present=${!!process.env.DASHSCOPE_API_KEY}`
  );
}

/**
 * Normalizes AI-extracted field names to match the ruleset IDs.
 * The AI may return different field names than what the compliance engine expects.
 */
function normalizeExtractedFields(extracted: Record<string, unknown>): Record<string, unknown> {
  const fieldMap: Record<string, string> = {
    invoiceTitle: "title",
    title: "title",
    supplierTin: "supplier_tin",
    supplier_tin: "supplier_tin",
    supplierVatNumber: "supplier_tin",
    supplierName: "supplier_name",
    supplier_name: "supplier_name",
    supplierAddress: "supplier_address",
    supplier_address: "supplier_address",
    supplierTelephone: "supplier_telephone",
    supplier_telephone: "supplier_telephone",
    purchaserTin: "purchaser_tin",
    purchaser_tin: "purchaser_tin",
    customerTin: "purchaser_tin",
    customerVatNumber: "purchaser_tin",
    purchaserName: "purchaser_name",
    purchaser_name: "purchaser_name",
    customerName: "purchaser_name",
    purchaserAddress: "purchaser_address",
    purchaser_address: "purchaser_address",
    customerAddress: "purchaser_address",
    purchaserTelephone: "purchaser_telephone",
    purchaser_telephone: "purchaser_telephone",
    invoiceNumber: "invoice_serial_number",
    invoiceSerialNumber: "invoice_serial_number",
    invoice_serial_number: "invoice_serial_number",
    invoiceDate: "invoice_date",
    invoice_date: "invoice_date",
    supplyDate: "supply_date",
    supply_date: "supply_date",
    placeOfSupply: "place_of_supply",
    place_of_supply: "place_of_supply",
    lineItems: "line_items",
    line_items: "line_items",
    itemDescriptions: "line_items",
    netValue: "net_value",
    net_value: "net_value",
    subtotal: "net_value",
    vatAmount: "vat_amount",
    vat_amount: "vat_amount",
    totalConsideration: "total_consideration",
    total_consideration: "total_consideration",
    totalAmount: "total_consideration",
    totalInWords: "total_in_words",
    total_in_words: "total_in_words",
    modeOfPayment: "mode_of_payment",
    mode_of_payment: "mode_of_payment",
    paymentTerms: "mode_of_payment",
  };

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extracted)) {
    const targetKey = fieldMap[key] || key;
    // Only set if target doesn't already have a value (prefer existing correct keys)
    if (!(targetKey in normalized) || normalized[targetKey] === null || normalized[targetKey] === undefined) {
      normalized[targetKey] = value;
    }
  }
  return normalized;
}

/**
 * Stage 1 — Extract structured fields from an invoice image using Qwen-VL.
 */
export async function extractInvoiceFields(
  imageBase64: string
): Promise<ExtractedInvoice> {
  logDiagnostics("extract", "qwen-vl-plus");
  const response = await getClient().chat.completions.create({
    model: "qwen-vl-plus",
    messages: [
      {
        role: "system",
        content:
          "You are an expert at reading invoices and extracting structured data. " +
          "Return ONLY valid JSON with these EXACT field names (use null if not found): " +
          "title, supplier_tin, supplier_name, supplier_address, supplier_telephone, " +
          "purchaser_tin, purchaser_name, purchaser_address, purchaser_telephone, " +
          "invoice_serial_number, invoice_date, supply_date, place_of_supply, " +
          "line_items (array of objects with description, quantity, unit_price), " +
          "net_value, vat_amount, total_consideration, total_in_words, mode_of_payment. " +
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
  const parsed = JSON.parse(cleaned);
  return normalizeExtractedFields(parsed) as ExtractedInvoice;
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
  logDiagnostics("compliance", "qwen-plus");

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
  logDiagnostics("correct", "qwen-plus");

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
 * Qwen-MT expects the text as a single user message (system messages are
 * rejected with "Role must be in [user, assistant]") and the source/target
 * languages passed via the translation_options parameter.
 * Docs: https://www.alibabacloud.com/help/en/model-studio/machine-translation
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

  logDiagnostics("translate", "qwen-mt-plus");

  // translation_options is a DashScope extension that rides along in the
  // request body next to the standard OpenAI-compatible parameters.
  const request: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming & {
    translation_options: { source_lang: string; target_lang: string };
  } = {
    model: "qwen-mt-plus",
    messages: [{ role: "user", content: text }],
    translation_options: {
      source_lang: "English",
      target_lang: langMap[targetLanguage],
    },
  };

  const response = await getClient().chat.completions.create(request);

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
  logDiagnostics("explain", "qwen-plus");
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
