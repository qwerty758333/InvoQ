import type { FieldRule, ComplianceIssue, ComplianceResult, ExtractedInvoice } from "./types";
import rulesData from "@/rules/vat-invoice-v2481-22.json";

const rules = rulesData as { fields: FieldRule[]; rulesetVersion: string };

/**
 * Checks an extracted invoice against the gazetted compliance ruleset.
 * Returns a list of issues with severity and rule references.
 */
export function checkCompliance(extracted: ExtractedInvoice): ComplianceResult {
  const issues: ComplianceIssue[] = [];
  const mandatoryFields = rules.fields.filter((r) => r.mandatory);
  let checkedMandatory = 0;

  for (const rule of rules.fields) {
    const value = extracted[rule.id];
    const hasValue = value !== undefined && value !== null && value !== "";

    if (rule.mandatory) {
      if (!hasValue) {
        issues.push({
          field: rule.id,
          label: rule.label,
          issue: `Missing mandatory field: "${rule.label}". ${rule.format}`,
          severity: "critical",
          ruleReference: `${rule.sourceReference} — ${rule.id}`,
          suggestion: rule.format,
        });
      } else {
        checkedMandatory++;
      }
    }
  }

  // Score: percentage of mandatory fields present
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const score = mandatoryFields.length > 0
    ? Math.round(((mandatoryFields.length - criticalCount) / mandatoryFields.length) * 100)
    : 100;

  return {
    issues,
    score,
    status: criticalCount === 0 ? "compliant" : "non_compliant",
  };
}

/**
 * Returns the full ruleset for use in AI prompts.
 */
export function getRulesForPrompt(): string {
  return JSON.stringify(rulesData, null, 2);
}
