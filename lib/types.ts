export type Severity = "critical" | "warning" | "info";

export type FieldRule = {
  id: string;
  label: string;
  mandatory: boolean;
  format: string;
  sourceReference: string;
  example?: string;
  implementationNote?: string;
  commonError?: string;
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
