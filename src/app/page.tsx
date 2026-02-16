"use client";

import { useState, FormEvent } from "react";
import { Header } from "@/components/shared/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Layers, Scissors, Languages, Sigma, ArrowRight, Search, X, Film } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const tools = [
  {
    name: "PDF Merge",
    keywords: ["pdf", "merge", "combine"],
    href: "/tools/pdf-merger",
  },
  {
    name: "PDF Split",
    keywords: ["pdf", "split", "extract pages"],
    href: "/tools/pdf-splitter",
  },
  {
    name: "Background Remover",
    keywords: ["image", "background", "remove", "bg remover"],
    href: "/tools/bg-remover",
  },
  {
    name: "Image Compressor",
    keywords: ["image", "compress", "image compressor"],
    href: "/tools/image-compressor",
  },
  {
    name: "Watermark Remover",
    keywords: ["image", "watermark", "remove"],
    href: "/tools/watermark-remover",
  },
  {
    name: "Video to GIF",
    keywords: ["video", "gif", "convert", "video to gif"],
    href: "/tools/video-to-gif",
  },
  {
    name: "QR Code Generator",
    keywords: ["qr", "qr code", "code"],
    href: "/tools/qr-generator",
  },
  {
    name: "Regex Tester",
    keywords: ["regex", "regular expression", "pattern", "match"],
    href: "/tools/regex-tester",
  },
  {
    name: "File Archiver",
    keywords: ["file", "archive", "zip", "package"],
    href: "/tools/file-archiver",
  },
  {
    name: "Text Translator",
    keywords: ["translate", "translation", "text"],
    href: "/tools/text-translator",
  },
  {
    name: "Chinese Pinyin Helper",
    keywords: ["chinese", "hanzi", "pinyin", "zh"],
    href: "/tools/hanzi-pinyin",
  },
  {
    name: "Unit Converter",
    keywords: ["unit", "convert", "converter"],
    href: "/tools/unit-converter",
  },
];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [searchHovered, setSearchHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTools = normalizedQuery
    ? tools.filter((tool) => {
        const name = tool.name.toLowerCase();
        if (name.includes(normalizedQuery)) return true;
        return tool.keywords.some((k) => k.toLowerCase().includes(normalizedQuery));
      })
    : [];

  const handleSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!normalizedQuery) {
      setError("");
      return;
    }

    if (filteredTools.length > 0) {
      setError("");
      router.push(filteredTools[0].href);
    } else {
      setError("No matching tool found. Try different keywords.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12 space-y-12">
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Zero-Friction Tools for <span className="text-primary">Everyone</span>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl/relaxed">
            A high-end, modular toolkit designed for speed and simplicity. 
            No ads, no clutter, just tools.
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-2 flex flex-col items-center gap-2"
          >
            <div
              className="relative w-full max-w-md border-0 outline-none"
              onMouseEnter={() => setSearchHovered(true)}
              onMouseLeave={() => setSearchHovered(false)}
            >
              {searchFocused && (
                <div className="pointer-events-none absolute inset-0 rounded-full rainbow-border z-0">
                  <div className="absolute inset-[3px] rounded-full bg-background" />
                </div>
              )}
              <div
                className={`pointer-events-none absolute inset-0 rounded-full border transition-colors z-0 ${
                  searchFocused
                    ? "border-transparent"
                    : searchHovered
                    ? "border-primary/60"
                    : "border-border/60"
                }`}
              />
              <Search
                className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors z-10 ${
                  searchHovered && !searchFocused
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQuery("");
                    setError("");
                  }
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search tools, e.g. PDF, text, units…"
                className={`relative z-10 h-10 rounded-full bg-background/80 pl-9 pr-9 text-sm md:text-base border-0 shadow-sm transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none ${
                  query ? "text-foreground" : "text-foreground/40 placeholder:text-foreground/40"
                } ${searchHovered && !searchFocused ? "bg-muted/70" : ""}`}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setError("");
                  }}
                  className="absolute right-3 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {error && (
              <p className="text-xs text-destructive">
                {error}
              </p>
            )}
            {normalizedQuery && !error && (
              <div className="mt-1 w-full max-w-md text-left">
                {filteredTools.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-popover/95 shadow-sm">
                    {filteredTools.map((tool) => (
                      <button
                        key={tool.href}
                        type="button"
                        onClick={() => {
                          router.push(tool.href);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted/70"
                      >
                        <span>{tool.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No tools match your search. Try different keywords.
                  </p>
                )}
              </div>
            )}
          </form>
        </section>

        <section className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/70 to-background/60 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-lg">
              <CardHeader className="flex flex-row items-start gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">PDF Tools</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Work with and manage your PDF documents.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                <Link
                  href="/tools/pdf-merger"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">PDF Merge</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Combine multiple PDF files into a single document.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500" />
                </Link>
                <Link
                  href="/tools/pdf-splitter"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">PDF Split</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Extract specific page ranges into a new PDF document.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-rose-500" />
                </Link>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/70 to-background/60 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-pink-500/50 hover:shadow-lg">
              <CardHeader className="flex flex-row items-start gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15 text-pink-500">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Image Tools</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Optimize and process your image assets.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                <Link
                  href="/tools/bg-remover"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">Background Remover</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Remove image backgrounds with one click using AI.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-500" />
                </Link>
                <Link
                  href="/tools/image-compressor"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">Image Compressor</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Compress images to smaller size while preserving quality.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-500" />
                </Link>
                <Link
                  href="/tools/watermark-remover"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">Watermark Remover</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Select areas to blur and cover unwanted watermarks.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-500" />
                </Link>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/70 to-background/60 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg">
              <CardHeader className="flex flex-row items-start gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">File Tools</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Efficiently manage different types of files.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                <Link
                  href="/tools/file-archiver"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">File Archiver</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Archive multiple files into a single ZIP package.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
                </Link>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/70 to-background/60 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-rose-500/50 hover:shadow-lg">
              <CardHeader className="flex flex-row items-start gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Video Tools</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Convert and optimize your video clips.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                <Link
                  href="/tools/video-to-gif"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">Video to GIF</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Convert short video clips into animated GIFs.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-rose-500" />
                </Link>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/70 to-background/60 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg">
              <CardHeader className="flex flex-row items-start gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Text Tools</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Quickly translate and process any text content.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                <Link
                  href="/tools/text-translator"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">Text Translator</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Translate between multiple languages for work and daily use.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500" />
                </Link>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/70 to-background/60 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg">
              <CardHeader className="flex flex-row items-start gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <Sigma className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Utility Tools</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    A set of handy tools for units, codes, and numbers.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                <Link
                  href="/tools/unit-converter"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">Unit Converter</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Convert length, weight, temperature, and more in one place.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
                </Link>
                <Link
                  href="/tools/qr-generator"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">QR Code Generator</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Turn text or links into a QR code instantly.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
                </Link>
                <Link
                  href="/tools/regex-tester"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">Regex Tester</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Experiment with regular expressions and visualize matches.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
                </Link>
                <Link
                  href="/tools/hanzi-pinyin"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">Chinese Pinyin Helper</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Lookup Pinyin for Chinese characters or find characters by Pinyin.
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
