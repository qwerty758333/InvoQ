import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileCheck,
  Upload,
  ShieldCheck,
  Globe,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Gazette No. 2481/22 — Effective July 1, 2026
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            VAT E-Invoice{" "}
            <span className="text-primary">Compliance</span>
            <br />
            Made Simple
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your invoice, get instant AI-powered analysis against Sri
            Lanka&apos;s mandatory e-invoicing format. Know exactly what&apos;s
            missing, get it fixed, and stay compliant.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-secondary/30 py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  1. Upload Invoice
                </h3>
                <p className="text-muted-foreground text-sm">
                  Take a photo or upload a scan of your current invoice.
                  Supports JPG, PNG, and PDF.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  2. AI Analysis
                </h3>
                <p className="text-muted-foreground text-sm">
                  Our AI extracts every field and checks it against the
                  official VAT compliance ruleset — field by field.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <FileCheck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  3. Get Compliant
                </h3>
                <p className="text-muted-foreground text-sm">
                  See exactly what needs fixing, download a corrected version,
                  and get explanations in English, Sinhala, or Tamil.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built for Sri Lankan SMEs
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: CheckCircle2,
                title: "Field-by-Field Check",
                desc: "Every mandatory field from the gazette is verified — supplier details, VAT numbers, line items, totals.",
              },
              {
                icon: Globe,
                title: "Trilingual Support",
                desc: "Explanations in English, සිංහල, or தமிழ் — so every business owner understands their compliance status.",
              },
              {
                icon: ShieldCheck,
                title: "Ruleset Versioning",
                desc: "Compliance rules are versioned and sourced from the official gazette. When regulations change, we update instantly.",
              },
              {
                icon: FileCheck,
                title: "Corrected Invoices",
                desc: "Get an AI-generated compliant version of your invoice with all issues resolved.",
              },
              {
                icon: Upload,
                title: "Mobile Friendly",
                desc: "Snap a photo of your invoice on your phone — our AI handles the rest. No scanner needed.",
              },
              {
                icon: ArrowRight,
                title: "Audit History",
                desc: "Keep a record of all compliance checks. Track your progress toward full compliance.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5 py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to check your invoices?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            The mandatory VAT e-invoicing format takes effect July 1, 2026.
            Don&apos;t wait — check your compliance today.
          </p>
          <Button size="lg" asChild>
            <Link href="/register" className="gap-2">
              Start Free — No Credit Card
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
