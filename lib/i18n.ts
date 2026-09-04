import type { Language } from "./types";

type TranslationKeys = {
  // Common
  appName: string;
  tagline: string;
  loading: string;
  save: string;
  cancel: string;
  back: string;
  next: string;
  // Auth
  login: string;
  register: string;
  email: string;
  password: string;
  businessName: string;
  loginTitle: string;
  registerTitle: string;
  noAccount: string;
  hasAccount: string;
  signOut: string;
  // Dashboard
  dashboard: string;
  uploadNew: string;
  recentInvoices: string;
  noInvoices: string;
  status: string;
  date: string;
  view: string;
  // Upload
  uploadTitle: string;
  uploadDescription: string;
  dragDrop: string;
  browseFiles: string;
  supportedFormats: string;
  analyzing: string;
  // Pipeline stages
  stageUploading: string;
  stageExtracting: string;
  stageAnalyzing: string;
  stageCorrecting: string;
  stageDone: string;
  // Results
  results: string;
  complianceScore: string;
  compliant: string;
  nonCompliant: string;
  issues: string;
  original: string;
  corrected: string;
  explanation: string;
  critical: string;
  warning: string;
  info: string;
  field: string;
  issueDescription: string;
  suggestion: string;
  language: string;
  downloadCorrected: string;
  checkAnother: string;
};

const en: TranslationKeys = {
  appName: "InvoQ",
  tagline: "AI-Powered VAT E-Invoice Compliance",
  loading: "Loading...",
  save: "Save",
  cancel: "Cancel",
  back: "Back",
  next: "Next",
  login: "Log In",
  register: "Sign Up",
  email: "Email Address",
  password: "Password",
  businessName: "Business Name",
  loginTitle: "Welcome back",
  registerTitle: "Create your account",
  noAccount: "Don't have an account?",
  hasAccount: "Already have an account?",
  signOut: "Sign Out",
  dashboard: "Dashboard",
  uploadNew: "Check New Invoice",
  recentInvoices: "Recent Invoice Checks",
  noInvoices: "No invoices checked yet. Upload your first invoice to get started.",
  status: "Status",
  date: "Date",
  view: "View",
  uploadTitle: "Upload Your Invoice",
  uploadDescription: "Upload a photo or scan of your current invoice. Our AI will check it against Sri Lanka's mandatory VAT e-invoicing format.",
  dragDrop: "Drag & drop your invoice image here",
  browseFiles: "Browse Files",
  supportedFormats: "Supports JPG, PNG, PDF — max 10MB",
  analyzing: "Analyzing your invoice...",
  stageUploading: "Uploading image...",
  stageExtracting: "Extracting invoice data...",
  stageAnalyzing: "Checking compliance rules...",
  stageCorrecting: "Generating corrected version...",
  stageDone: "Analysis complete!",
  results: "Compliance Results",
  complianceScore: "Compliance Score",
  compliant: "Compliant",
  nonCompliant: "Needs Fixes",
  issues: "Issues Found",
  original: "Original Invoice",
  corrected: "Corrected Version",
  explanation: "Explanation",
  critical: "Critical",
  warning: "Warning",
  info: "Info",
  field: "Field",
  issueDescription: "Issue",
  suggestion: "Suggestion",
  language: "Language",
  downloadCorrected: "Download Corrected Invoice",
  checkAnother: "Check Another Invoice",
};

const si: Partial<TranslationKeys> = {
  appName: "InvoQ",
  tagline: "AI බලගැන්වූ VAT ඊ-ඉන්වොයිස් අනුකූලතාව",
  login: "පිවිසෙන්න",
  register: "ලියාපදිංචි වන්න",
  dashboard: "උපකරණ පුවරුව",
  uploadNew: "නව ඉන්වොයිසය පරීක්ෂා කරන්න",
  compliant: "අනුකූලයි",
  nonCompliant: "නිවැරදි අවශ්‍යයි",
  results: "අනුකූලතා ප්‍රතිඵල",
  explanation: "පැහැදිලි කිරීම",
  original: "මුල් ඉන්වොයිසය",
  corrected: "නිවැරදි කළ අනුවාදය",
  stageExtracting: "ඉන්වොයිස් දත්ත ලබා ගනිමින්...",
  stageAnalyzing: "අනුකූලතා නීති පරීක්ෂා කරමින්...",
  stageCorrecting: "නිවැරදි කළ අනුවාදය සාදමින්...",
  stageDone: "විශ්ලේෂණය සම්පූර්ණයි!",
  checkAnother: "තවත් ඉන්වොයිසයක් පරීක්ෂා කරන්න",
};

const ta: Partial<TranslationKeys> = {
  appName: "InvoQ",
  tagline: "AI இயங்கும் VAT மின்-விலைப்பட்டியல் இணக்கம்",
  login: "உள்நுழை",
  register: "பதிவு செய்",
  dashboard: "கட்டுப்பாட்டு பலகை",
  uploadNew: "புதிய விலைப்பட்டியலை சரிபார்",
  compliant: "இணக்கமானது",
  nonCompliant: "திருத்தங்கள் தேவை",
  results: "இணக்க முடிவுகள்",
  explanation: "விளக்கம்",
  original: "அசல் விலைப்பட்டியல்",
  corrected: "திருத்தப்பட்ட பதிப்பு",
  stageExtracting: "விலைப்பட்டியல் தரவை பிரித்தெடுக்கிறது...",
  stageAnalyzing: "இணக்க விதிகளை சரிபார்க்கிறது...",
  stageCorrecting: "திருத்தப்பட்ட பதிப்பை உருவாக்குகிறது...",
  stageDone: "பகுப்பாய்வு முடிந்தது!",
  checkAnother: "மற்றொரு விலைப்பட்டியலை சரிபார்",
};

const translations: Record<Language, TranslationKeys> = {
  en,
  si: { ...en, ...si } as TranslationKeys,
  ta: { ...en, ...ta } as TranslationKeys,
};

export function t(key: keyof TranslationKeys, lang: Language = "en"): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export function getLanguageName(lang: Language): string {
  const names: Record<Language, string> = { en: "English", si: "සිංහල", ta: "தமிழ்" };
  return names[lang];
}

/** localStorage key that persists the user's selected language. */
export const LANGUAGE_STORAGE_KEY = "invoq-language";

/**
 * Read the selected language from localStorage (client-side only).
 * Only "en", "si", "ta" are accepted; anything else falls back to "en".
 */
export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "si" || stored === "ta" ? stored : "en";
}
