"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import type { Language } from "@/lib/types";

const languages: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "si", label: "සිංහල" },
  { code: "ta", label: "தமிழ்" },
];

export function LanguageToggle() {
  const [lang, setLang] = useState<Language>("en");

  function handleChange(newLang: Language) {
    setLang(newLang);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("invoq-language", newLang);
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
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("invoq-language") as Language) || "en";
    }
    return "en";
  });

  function updateLang(newLang: Language) {
    setLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("invoq-language", newLang);
    }
  }

  return [lang, updateLang];
}
