"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { ComplianceIssue } from "@/lib/types";

const fieldLabels: Record<string, string> = {
  invoiceTitle: "Document Title",
  invoiceNumber: "Invoice Number",
  invoiceDate: "Invoice Date",
  supplierName: "Supplier Name",
  supplierAddress: "Supplier Address",
  supplierVatNumber: "Supplier VAT Number",
  supplierTin: "Supplier TIN",
  customerName: "Customer Name",
  customerAddress: "Customer Address",
  customerVatNumber: "Customer VAT Number",
  itemDescriptions: "Item Descriptions",
  quantities: "Quantities",
  unitPrices: "Unit Prices",
  lineTotals: "Line Totals",
  subtotal: "Subtotal",
  vatRate: "VAT Rate",
  vatAmount: "VAT Amount",
  totalAmount: "Total Amount",
  currency: "Currency",
  discounts: "Discounts",
  paymentTerms: "Payment Terms",
  supplyDate: "Supply Date",
  exportIndicator: "Export Indicator",
};

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

type Props = {
  original: Record<string, unknown>;
  corrected: Record<string, unknown>;
  issues: ComplianceIssue[];
};

export function InvoiceComparison({ original, corrected, issues }: Props) {
  const issueFields = new Set(issues.map((i) => i.field));
  const allFieldsSet = new Set<string>([
    ...Object.keys(original || {}),
    ...Object.keys(corrected || {}),
  ]);

  // Filter out internal fields
  const fields = Array.from(allFieldsSet).filter((f) => !f.startsWith("_"));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Original */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            Original Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.map((field) => {
            const hasIssue = issueFields.has(field);
            const value = original[field];
            const isEmpty = value === null || value === undefined || value === "";

            return (
              <div
                key={field}
                className={`flex items-start justify-between gap-2 rounded p-2 text-sm ${
                  hasIssue
                    ? "bg-destructive/5 border border-destructive/20"
                    : isEmpty
                    ? "bg-muted/30"
                    : ""
                }`}
              >
                <span className="text-muted-foreground shrink-0 min-w-[120px]">
                  {fieldLabels[field] || field}
                </span>
                <span className="text-right font-mono text-xs break-all">
                  {isEmpty ? (
                    <span className="text-destructive italic">Missing</span>
                  ) : (
                    formatValue(value)
                  )}
                </span>
                {hasIssue && (
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                {!hasIssue && !isEmpty && (
                  <CheckCircle2 className="h-4 w-4 text-success/50 shrink-0 mt-0.5" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Corrected */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            Corrected Version
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.map((field) => {
            const wasFixed = issueFields.has(field);
            const value = corrected[field];
            const originalValue = original[field];
            const changed =
              wasFixed &&
              formatValue(value) !== formatValue(originalValue);

            return (
              <div
                key={field}
                className={`flex items-start justify-between gap-2 rounded p-2 text-sm ${
                  changed
                    ? "bg-success/5 border border-success/20"
                    : ""
                }`}
              >
                <span className="text-muted-foreground shrink-0 min-w-[120px]">
                  {fieldLabels[field] || field}
                </span>
                <span className="text-right font-mono text-xs break-all">
                  {formatValue(value)}
                </span>
                {changed && (
                  <Badge variant="success" className="text-[10px] shrink-0">
                    Fixed
                  </Badge>
                )}
                {!changed && value !== null && value !== undefined && value !== "" && (
                  <CheckCircle2 className="h-4 w-4 text-success/50 shrink-0 mt-0.5" />
                )}
              </div>
            );
          })}

          {/* Show corrections list if available */}
          {Array.isArray(corrected._corrections) && (corrected._corrections as string[]).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Corrections Made:
              </p>
              <ul className="space-y-1">
                {(corrected._corrections as string[]).map((c: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground flex gap-1">
                    <span className="text-success">+</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
