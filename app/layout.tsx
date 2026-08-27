import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "InvoQ — AI-Powered VAT E-Invoice Compliance",
  description:
    "Check your invoices against Sri Lanka's mandatory VAT e-invoicing format (Gazette No. 2481/22). AI-powered compliance for SMEs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
              <div className="container">
                InvoQ — Helping Sri Lankan SMEs comply with{" "}
                <span className="font-medium">Gazette No. 2481/22</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
