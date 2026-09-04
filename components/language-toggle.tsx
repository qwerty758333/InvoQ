"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { getStoredLanguage, LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
import type { Language } from "@/lib/types";

const languages: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "si", label: "සිංහල" },
  { code: "ta", label: "தமிழ்" },
];

export function LanguageToggle() {
  // Start from "en" so SSR and the first client render match, then sync the
  // persisted language after mount (avoids hydration mismatches).
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    setLang(getStoredLanguage());
    // Stay in sync when the language is changed elsewhere (e.g. another toggle)
    const onLanguageChange = (e: Event) => {
      const next = (e as CustomEvent<Language>).detail;
      if (next === "en" || next === "si" || next === "ta") {
        setLang(next);
      }
    };
    window.addEventListener("language-change", onLanguageChange);
    return () => window.removeEventListener("language-change", onLanguageChange);
  }, []);

  function handleChange(newLang: Language) {
    setLang(newLang);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    }
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(
      new CustomEvent("language-change", { detail: newLang })
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Languages className="h-4 w-4" />
          <span className="text-xs">
            {languages.find((l) => l.code === lang)?.label || "EN"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleChange(l.code)}
            className={`cursor-pointer ${
              lang === l.code ? "font-semibold" : ""
            }`}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Hook to get the current language setting.
 */
export function useLanguage(): [Language, (lang: Language) => void] {
  // Same hydration-safe pattern as LanguageToggle: default to "en" on the
  // server/first render, then sync the persisted value after mount.
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    setLang(getStoredLanguage());
  }, []);

  function updateLang(newLang: Language) {
    setLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    }
    // Keep the rest of the app in sync with this change
    window.dispatchEvent(
      new CustomEvent("language-change", { detail: newLang })
    );
  }

  return [lang, updateLang];
}
