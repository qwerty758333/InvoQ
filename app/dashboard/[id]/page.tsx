"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceComparison } from "@/components/invoice-comparison";
import { PipelineProgress } from "@/components/pipeline-progress";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
} from "lucide-react";
import Link from "next/link";
import type { PipelineStage, Language } from "@/lib/types";

/** Handles both the structured ComplianceIssue format and the AI-returned {field, reason, original, corrected} format. */
type IssueEntry = {
  field?: string;
  label?: string;
  issue?: string;
  reason?: string;
  severity?: string;
  ruleReference?: string;
  suggestion?: string;
  original?: unknown;
  corrected?: unknown;
};

type InvoiceData = {
  id: string;
  status: string;
  originalFileUrl: string;
  extractedData: Record<string, unknown>;
  complianceIssues: IssueEntry[] | null;
  correctedData: Record<string, unknown>;
  complianceScore: number | null;
  language: Language;
  explanation?: string | null;
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<PipelineStage>("done");
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    if (params.id) {
      fetch(`/api/invoices/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          setInvoice(data);
          setExplanation(data.explanation || "");
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container py-12">
        <PipelineProgress stage="extracting" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const issues: IssueEntry[] = Array.isArray(invoice.complianceIssues) ? invoice.complianceIssues : [];
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const score = invoice.complianceScore ?? (issues.length === 0 ? 0 : Math.max(0, Math.min(100, 100 - (criticalCount * 10) - (warningCount * 5))));
  const isPending = invoice.status === "pending";
  const isFailed = invoice.status === "failed";
  const isCompliant = invoice.status === "compliant";

  return (
    <div className="container py-8 md:py-12 animate-fade-in">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Status header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Compliance Results</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Invoice #{invoice.id.slice(0, 8)}
          </p>
        </div>
        <Badge
          variant={
            isCompliant
              ? "success"
              : isFailed
              ? "destructive"
              : isPending
              ? "secondary"
              : "warning"
          }
          className="text-sm px-4 py-1"
        >
          {isCompliant ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Compliant
            </>
          ) : isFailed ? (
            <>
              <XCircle className="h-4 w-4 mr-1" />
              Analysis Failed
            </>
          ) : isPending ? (
            <>
              <AlertTriangle className="h-4 w-4 mr-1" />
              Pending
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-1" />
              Needs Fixes
            </>
          )}
        </Badge>
      </div>

      {/* Score card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Compliance Score</span>
            <span className="text-2xl font-bold text-primary">
              {isPending || isFailed ? "—" : `${score}%`}
            </span>
          </div>
          <Progress
            value={isPending || isFailed ? 0 : score}
            className="h-3"
          />
          <div className="flex gap-4 mt-4 text-sm">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" />
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <AlertTriangle className="h-4 w-4" />
                {warningCount} warnings
              </span>
            )}
            {issues.length === 0 && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-4 w-4" />
                All checks passed
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Comparison, Issues, Explanation */}
      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="issues">
            Issues ({issues.length})
          </TabsTrigger>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <InvoiceComparison
            original={invoice.extractedData}
            corrected={invoice.correctedData}
            issues={issues}
          />
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardContent className="pt-6">
              {issues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success" />
                  <p>No compliance issues found!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue, idx) => {
                    const field = issue.field ?? "";
                    const label = issue.label ?? field ?? "Unknown field";
                    const description = issue.issue ?? issue.reason ?? "";
                    const severity = issue.severity ?? "";
                    const suggestion = issue.suggestion ?? "";
                    const ruleRef = issue.ruleReference ?? "";

                    return (
                      <div
                        key={`${field}-${idx}`}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {label}
                          </span>
                          {severity && (
                            <Badge
                              variant={
                                severity === "critical"
                                  ? "destructive"
                                  : severity === "warning"
                                  ? "warning"
                                  : "secondary"
                              }
                            >
                              {severity}
                            </Badge>
                          )}
                        </div>
                        {description && (
                          <p className="text-sm text-muted-foreground">
                            {description}
                          </p>
                        )}
                        {suggestion && (
                          <p className="text-xs text-primary">
                            {suggestion}
                          </p>
                        )}
                        {ruleRef && (
                          <p className="text-xs text-muted-foreground/60">
                            Ref: {ruleRef}
                          </p>
                        )}
                        {(issue.original !== undefined || issue.corrected !== undefined) && (
                          <div className="text-xs flex gap-2 mt-1">
                            {issue.original !== undefined && (
                              <span className="text-destructive">
                                Original: <span className="font-mono">{String(issue.original ?? "—")}</span>
                              </span>
                            )}
                            {issue.corrected !== undefined && (
                              <span className="text-success">
                                Corrected: <span className="font-mono">{String(issue.corrected ?? "—")}</span>
                              </span>
                            )}
                          </div>
                        )}
                        {!description && !suggestion && !ruleRef && issue.original === undefined && issue.corrected === undefined && (
                          <p className="text-xs text-muted-foreground italic">
                            Unable to display this issue
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explanation">
          <Card>
            <CardContent className="pt-6">
              {explanation ? (
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {explanation}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Generating explanation...
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button variant="outline" asChild>
          <Link href="/dashboard" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard" className="gap-2">
            Check Another Invoice
          </Link>
        </Button>
      </div>
    </div>
  );
}
