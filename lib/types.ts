export type Severity = "critical" | "warning" | "info";

export type FieldRule = {
  field: string;
  label: string;
  required: boolean;
  description: string;
  formatHint?: string;
  validate?: string; // regex pattern
};

export type ComplianceIssue = {
  field: string;
  label: string;
  issue: string;
  severity: Severity;
  ruleReference: string;
  suggestion?: string;
};

export type ExtractedInvoice = {
  [key: string]: string | number | boolean | null | object;
};

export type ComplianceResult = {
  issues: ComplianceIssue[];
  score: number; // 0-100
  status: "compliant" | "non_compliant";
};

export type CorrectedInvoice = {
  [key: string]: string | number | boolean | null | object | string[] | undefined;
  _corrections?: string[];
};

export type PipelineStage =
  | "upload"
  | "extracting"
  | "analyzing"
  | "correcting"
  | "done";

export type Language = "en" | "si" | "ta";
