"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PipelineProgress } from "@/components/pipeline-progress";
import { Upload, X } from "lucide-react";
import type { PipelineStage } from "@/lib/types";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<PipelineStage | null>(null);
  const [error, setError] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      const f = accepted[0];
      if (f.size > 10 * 1024 * 1024) {
        setError("File too large. Max 10MB.");
        return;
      }
      setFile(f);
      setError("");
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
  });

  async function handleAnalyze() {
    if (!file) return;
    setError("");
    setStage("upload");

    try {
      // Stage 1: Upload
      const formData = new FormData();
      formData.append("file", file);

      setStage("extracting");
      const uploadRes = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }

      const { invoiceId } = await uploadRes.json();

      // Stage 2: Analysis (server handles the pipeline)
      setStage("analyzing");
      const analyzeRes = await fetch(`/api/invoices/${invoiceId}/analyze`, {
        method: "POST",
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "Analysis failed");
      }

      // Stage 3: Done
      setStage("correcting");
      await new Promise((r) => setTimeout(r, 500));
      setStage("done");

      // Navigate to results
      router.push(`/dashboard/${invoiceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage(null);
    }
  }

  if (stage) {
    return <PipelineProgress stage={stage} />;
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="Invoice preview"
              className="max-h-48 rounded-md border shadow-sm"
            />
            <p className="text-sm text-muted-foreground">{file?.name}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setPreview(null);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {isDragActive
                  ? "Drop your invoice here"
                  : "Drag & drop your invoice image"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse — JPG, PNG, WebP up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Analyze button */}
      {file && (
        <Button onClick={handleAnalyze} className="w-full" size="lg">
          Analyze Invoice Compliance
        </Button>
      )}
    </div>
  );
}
