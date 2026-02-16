"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/shared/header";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, ArrowLeft, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const languages = [
  { value: "auto", label: "Auto detect" },
  { value: "zh", label: "Chinese" },
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "vi", label: "Vietnamese" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

export default function TextTranslatorPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [translatedText2, setTranslatedText2] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [targetLang2, setTargetLang2] = useState("vi");

  const handleApplyTarget1ToSource = () => {
    const currentSource = sourceText;
    const currentResult = translatedText.trim();
    if (!currentResult) return;

    const prevSourceLang = sourceLang;
    const prevTargetLang = targetLang;

    let detected = prevSourceLang;
    if (detected === "auto") {
      const hasCjk = /[\u4e00-\u9fff]/.test(currentSource);
      const hasFrenchChars = /[àâäéèêëîïôöùûüç]/i.test(currentSource);
      const hasVietnameseChars =
        /[ăâêôơưđĂÂÊÔƠƯĐàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(
          currentSource
        );

      if (hasCjk) {
        detected = "zh";
      } else if (hasFrenchChars) {
        detected = "fr";
      } else if (hasVietnameseChars) {
        detected = "vi";
      }
    }

    let newTargetLang: string = prevTargetLang;
    if (detected === "zh" || detected === "fr" || detected === "vi") {
      newTargetLang = detected;
    } else if (prevSourceLang !== "auto") {
      newTargetLang = prevSourceLang;
    }

    setSourceText(currentResult);
    setTranslatedText("");
    setTranslatedText2("");
    setSourceLang(prevTargetLang);
    setTargetLang(newTargetLang);
  };

  const handleApplyTarget2ToSource = () => {
    const currentSource = sourceText;
    const currentResult = translatedText2.trim();
    if (!currentResult || targetLang2 === "none") return;

    const prevSourceLang = sourceLang;
    const prevTargetLang2 = targetLang2;

    let detected = prevSourceLang;
    if (detected === "auto") {
      const hasCjk = /[\u4e00-\u9fff]/.test(currentSource);
      const hasFrenchChars = /[àâäéèêëîïôöùûüç]/i.test(currentSource);
      const hasVietnameseChars =
        /[ăâêôơưđĂÂÊÔƠƯĐàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(
          currentSource
        );

      if (hasCjk) {
        detected = "zh";
      } else if (hasFrenchChars) {
        detected = "fr";
      } else if (hasVietnameseChars) {
        detected = "vi";
      }
    }

    let newTargetLang2: string = prevTargetLang2;
    if (detected === "zh" || detected === "fr" || detected === "vi") {
      newTargetLang2 = detected;
    } else if (prevSourceLang !== "auto") {
      newTargetLang2 = prevSourceLang;
    }

    setSourceText(currentResult);
    setTranslatedText("");
    setTranslatedText2("");
    if (prevTargetLang2 !== "none") {
      setSourceLang(prevTargetLang2);
    }
    setTargetLang2(newTargetLang2);
  };

  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText("");
      setTranslatedText2("");
      return;
    }

    let aborted = false;
    const timer = setTimeout(async () => {
      if (aborted) return;

      try {
        const formData = new FormData();
        formData.append("text", sourceText);
        formData.append(
          "options",
          JSON.stringify({
            sourceLang,
            targetLang,
            targetLang2: targetLang2 === "none" ? undefined : targetLang2,
          })
        );

        const response = await fetch("/api/tools/text-translator", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to translate text");
        }

        const data = (await response.json()) as {
          results?: { lang: string; text: string }[];
        };

        if (aborted) return;

        const results = data.results ?? [];

        const primary = results.find((item) => item.lang === targetLang);
        const secondary = results.find((item) => item.lang === targetLang2);

        setTranslatedText(primary?.text ?? "");
        setTranslatedText2(
          targetLang2 !== "none" ? secondary?.text ?? "" : ""
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(error);
        toast.error(message || "Translation failed, please try again later");
      } finally {
        if (!aborted) {
        }
      }
    }, 600);

    return () => {
      aborted = true;
      clearTimeout(timer);
    };
  }, [sourceText, sourceLang, targetLang, targetLang2]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-8 max-w-5xl space-y-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Link>

          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Languages className="h-8 w-8 text-emerald-500" />
              Text Translator
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Enter text and choose target languages to translate into up to two languages at once.
            </p>
          </div>

        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.75fr)] gap-5 items-start">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Source language</p>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Choose source language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type or paste the text you want to translate here"
              className="resize-none h-60 md:h-72"
            />
          </div>

          <div className="space-y-3.5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Target language 1 (required)</p>
                <div className="flex items-center gap-2">
                  <Select value={targetLang} onValueChange={setTargetLang}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Choose target language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages
                        .filter((lang) => lang.value !== "auto")
                        .map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={handleApplyTarget1ToSource}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    aria-label="Use result of target language 1 as source text"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Target language 2 (optional)
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={targetLang2}
                    onValueChange={setTargetLang2}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Choose target language 2" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not used</SelectItem>
                      {languages
                        .filter(
                          (lang) =>
                            lang.value !== "auto" &&
                            lang.value !== targetLang
                        )
                        .map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={handleApplyTarget2ToSource}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    aria-label="Use result of target language 2 as source text"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Textarea
                value={translatedText}
                readOnly
                placeholder="Translation result will appear here"
                className="resize-none h-60 md:h-72"
              />

              <Textarea
                value={translatedText2}
                readOnly
                placeholder={
                  targetLang2 === "none"
                    ? "After choosing the language on the right, the second translation result will appear here"
                    : "Translation result will appear here"
                }
                className="resize-none h-60 md:h-72"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
