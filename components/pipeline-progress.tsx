"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { PipelineStage } from "@/lib/types";

const stages: { key: PipelineStage; label: string }[] = [
  { key: "upload", label: "Uploading image..." },
  { key: "extracting", label: "Extracting invoice data with AI..." },
  { key: "analyzing", label: "Checking compliance rules..." },
  { key: "correcting", label: "Generating corrected version..." },
  { key: "done", label: "Analysis complete!" },
];

const stageOrder: PipelineStage[] = [
  "upload",
  "extracting",
  "analyzing",
  "correcting",
  "done",
];

export function PipelineProgress({ stage }: { stage: PipelineStage }) {
  const currentIdx = stageOrder.indexOf(stage);
  const progress = ((currentIdx + 1) / stageOrder.length) * 100;

  return (
    <div className="mx-auto max-w-md py-8 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Analyzing Your Invoice</h3>
        <p className="text-sm text-muted-foreground">
          This usually takes 15-30 seconds
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="space-y-3">
        {stages.map((s, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                isCurrent ? "bg-primary/5 border border-primary/20" : ""
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
              )}
              <span
                className={`text-sm ${
                  isComplete
                    ? "text-muted-foreground line-through"
                    : isCurrent
                    ? "font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
