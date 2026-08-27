# InvoQ

**AI-Powered VAT E-Invoice Compliance for Sri Lankan SMEs**

InvoQ helps Sri Lankan small and medium businesses prepare for the mandatory VAT e-invoicing format (effective July 1, 2026, per Gazette No. 2481/22). Upload a photo of your invoice, get instant AI analysis, see exactly what's wrong, and receive a corrected compliant version.

---

## How It Works

1. **Upload** — Take a photo or upload a scan of your current invoice
2. **Extract** — AI (Qwen-VL) reads and extracts all structured fields from the image
3. **Analyze** — Rule engine + AI compare every field against the gazetted compliance ruleset
4. **Correct** — AI generates a fully compliant version of your invoice
5. **Explain** — Get a plain-language explanation in English, Sinhala (සිංහල), or Tamil (தமிழ்)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Route Handlers (Node runtime) |
| **Database** | PostgreSQL (Neon / Vercel Postgres) via Prisma ORM |
| **Auth** | NextAuth.js — email/password credentials provider |
| **File Storage** | Vercel Blob |
| **AI Provider** | Alibaba Cloud Model Studio (DashScope) — OpenAI-compatible SDK |
| **Deployment** | Vercel |

### AI Models Used

| Model | Purpose |
|-------|---------|
| `qwen-vl-plus` | Vision: read/extract structured fields from uploaded invoice image |
| `qwen-plus` | Reasoning: compare fields against compliance ruleset, identify gaps, draft corrected invoice |
| `qwen-mt-plus` | Translation: translate explanations into Sinhala/Tamil |

---

## Project Structure

```
InvoQ/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts    # NextAuth handler
│   │   │   └── register/route.ts         # User registration
│   │   └── invoices/
│   │       ├── route.ts                   # List user invoices
│   │       ├── upload/route.ts            # Upload invoice image
│   │       └── [id]/
│   │           ├── route.ts               # Get invoice details
│   │           └── analyze/route.ts       # Run AI analysis pipeline
│   ├── dashboard/
│   │   ├── page.tsx                       # Dashboard with upload + history
│   │   └── [id]/page.tsx                  # Invoice results (comparison view)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Landing page
│   └── globals.css                        # Global styles + CSS variables
├── components/
│   ├── ui/                                # shadcn/ui primitives
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   └── tabs.tsx
│   ├── invoice-comparison.tsx             # Side-by-side original vs corrected
│   ├── language-toggle.tsx                # EN/SI/TA language switcher
│   ├── navbar.tsx                         # App navigation bar
│   ├── pipeline-progress.tsx              # Step-by-step analysis progress
│   ├── providers.tsx                      # Session/Auth provider wrapper
│   └── upload-form.tsx                    # Drag-and-drop upload with preview
├── lib/
│   ├── ai.ts                              # AI pipeline (extract, analyze, correct, translate)
│   ├── auth.ts                            # NextAuth configuration
│   ├── compliance.ts                      # Rule-based compliance engine
│   ├── db.ts                              # Prisma client singleton
│   ├── i18n.ts                            # Internationalization (EN/SI/TA)
│   ├── storage.ts                         # Vercel Blob upload helpers
│   ├── types.ts                           # Shared TypeScript types
│   └── utils.ts                           # Utility functions (cn, formatDate)
├── prisma/
│   └── schema.prisma                      # Database schema (User, Invoice)
├── rules/
│   └── vat-invoice-v2481-22.json          # Versioned compliance ruleset
├── public/
├── .env.example
├── .gitignore
├── components.json                        # shadcn/ui config
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g., [Neon](https://neon.tech) or Vercel Postgres)
- An Alibaba Cloud DashScope API key ([Model Studio](https://dashscope.console.aliyun.com/))
- A Vercel Blob storage token (or deploy on Vercel for automatic setup)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/invoq.git
cd invoq
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Database (Neon or Vercel Postgres)
DATABASE_URL="postgresql://user:password@host:5432/invoq?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Alibaba Cloud DashScope (Model Studio)
DASHSCOPE_API_KEY="your-dashscope-api-key"

# Vercel Blob (file storage)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

### Deploy to Vercel

1. Push this repository to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Set up a Vercel Postgres database (or connect your Neon database)
5. Deploy

After deployment, run the database migration:

```bash
npx vercel env pull .env.production
npx prisma db push
```

---

## Compliance Ruleset

The compliance rules are stored in [`rules/vat-invoice-v2481-22.json`](rules/vat-invoice-v2481-22.json) as a versioned JSON config file — **not** hardcoded in the application. This is intentional because:

- The VAT e-invoice format has already changed twice
- Rules can be updated by editing the JSON file without touching application code
- The AI compliance engine references the ruleset dynamically

### Mandatory Fields (per Gazette No. 2481/22)

| Field | Description |
|-------|-------------|
| Document Title | Must be identified as "Invoice" / "Tax Invoice" / "VAT Invoice" |
| Invoice Number | Unique, sequential identifier |
| Invoice Date | Date of issue |
| Supplier Name & Address | Full legal name and business address |
| Supplier VAT Number | IRD-issued VAT registration number |
| Customer Name & Address | Buyer's details |
| Item Descriptions | Clear description of goods/services |
| Quantities & Unit Prices | Per-item breakdown |
| Subtotal (excl. VAT) | Sum before VAT |
| VAT Rate & Amount | Applicable rate and total VAT |
| Total Amount (incl. VAT) | Grand total payable |
| Currency | ISO currency code or symbol |

---

## AI Pipeline

The analysis pipeline runs as a sequential process:

```
Upload Image
    ↓
[Qwen-VL-Plus] Extract structured fields from image
    ↓
[Rule Engine] Check each field against vat-invoice-v2481-22.json
    ↓
[Qwen-Plus] AI-enhanced analysis — find additional issues
    ↓
[Qwen-Plus] Generate corrected, compliant invoice
    ↓
[Qwen-Plus] Generate plain-language explanation
    ↓
[Qwen-MT-Plus] Translate explanation (if SI/TA selected)
    ↓
Store results → Show comparison view
```

---

## Key Features

- **Field-by-field compliance checking** against the gazetted ruleset
- **Side-by-side comparison** of original vs. corrected invoice
- **Trilingual support** — English, Sinhala (සිංහල), Tamil (தமிழ்)
- **Drag-and-drop upload** with image preview
- **Step-by-step progress** indicator during AI analysis
- **Mobile-responsive** — photograph invoices on your phone
- **Audit history** — track all past compliance checks
- **Versioned ruleset** — easy updates when regulations change

---

## License

MIT
