import type { FieldRule, ComplianceIssue, ComplianceResult, ExtractedInvoice } from "./types";
import rulesData from "@/rules/vat-invoice-v2481-22.json";

const rules = rulesData as { fields: FieldRule[]; gazette: string };

/**
 * Checks an extracted invoice against the gazetted compliance ruleset.
 * Returns a list of issues with severity and rule references.
 */
export function checkCompliance(extracted: ExtractedInvoice): ComplianceResult {
  const issues: ComplianceIssue[] = [];
  const requiredFields = rules.fields.filter((r) => r.required);
  let checkedRequired = 0;

  for (const rule of rules.fields) {
    const value = extracted[rule.field];
    const hasValue = value !== undefined && value !== null && value !== "";

    if (rule.required) {
      if (!hasValue) {
        issues.push({
          field: rule.field,
          label: rule.label,
          issue: `Missing required field: "${rule.label}". ${rule.description}`,
          severity: "critical",
          ruleReference: `${rules.gazette} — ${rule.field}`,
          suggestion: rule.formatHint
            ? `Expected format: ${rule.formatHint}`
            : undefined,
        });
      } else {
        checkedRequired++;
        // Validate format if a regex pattern is provided
        if (rule.validate && typeof value === "string") {
          const regex = new RegExp(rule.validate);
          if (!regex.test(value)) {
            issues.push({
              field: rule.field,
              label: rule.label,
              issue: `Field "${rule.label}" has an invalid format.`,
              severity: "warning",
              ruleReference: `${rules.gazette} — ${rule.field} format`,
              suggestion: rule.formatHint,
            });
          }
        }
      }
    } else if (hasValue) {
      // Optional field present — validate format if applicable
      if (rule.validate && typeof value === "string") {
        const regex = new RegExp(rule.validate);
        if (!regex.test(value)) {
          issues.push({
            field: rule.field,
            label: rule.label,
            issue: `Optional field "${rule.label}" has an invalid format.`,
            severity: "info",
            ruleReference: `${rules.gazette} — ${rule.field} format`,
            suggestion: rule.formatHint,
          });
        }
      }
    }
  }

  // Score: percentage of required fields that pass without issues
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const score = Math.max(
    0,
    Math.round(
      ((checkedRequired - warningCount * 0.5) / requiredFields.length) * 100
    )
  );

  return {
    issues,
    score,
    status: criticalCount === 0 && warningCount === 0 ? "compliant" : "non_compliant",
  };
}

/**
 * Returns the full ruleset for use in AI prompts.
 */
export function getRulesForPrompt(): string {
  return JSON.stringify(rulesData, null, 2);
}
