"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadForm } from "@/components/upload-form";
import { formatDate } from "@/lib/utils";
import { Plus, FileCheck, AlertTriangle, Clock } from "lucide-react";

type Invoice = {
  id: string;
  status: string;
  createdAt: string;
  originalFileUrl: string;
  complianceIssues: { severity: string }[];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/invoices")
        .then((r) => r.json())
        .then((data) => {
          setInvoices(data.invoices || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-40 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session?.user?.name || session?.user?.email}
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Check New Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UploadForm />
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Invoice Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No invoices checked yet.</p>
              <p className="text-sm">
                Upload your first invoice above to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/dashboard/${inv.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {inv.status === "compliant" ? (
                      <FileCheck className="h-5 w-5 text-success" />
                    ) : inv.status === "non_compliant" ? (
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        Invoice #{inv.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(inv.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      inv.status === "compliant"
                        ? "success"
                        : inv.status === "non_compliant"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {inv.status === "compliant"
                      ? "Compliant"
                      : inv.status === "non_compliant"
                      ? "Needs Fixes"
                      : "Pending"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
