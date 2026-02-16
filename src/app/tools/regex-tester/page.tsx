"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/shared/header";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Braces, ChevronDown, Search } from "lucide-react";

type MatchSegment = {
  key: string;
  text: string;
  matched: boolean;
};

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testText, setTestText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCheatsheet, setShowCheatsheet] = useState(true);

  const { segments, matchCount } = useMemo(() => {
    if (!pattern || !testText) {
      return { segments: [{ key: "all", text: testText, matched: false }], matchCount: 0 };
    }

    try {
      const rawFlags = flags.replace(/[^gimsuy]/gi, "");
      const finalFlags = rawFlags.includes("g") ? rawFlags : `${rawFlags}g`;
      const regex = new RegExp(pattern, finalFlags);

      const parts: MatchSegment[] = [];
      let lastIndex = 0;
      let count = 0;

      let match: RegExpExecArray | null;
      while ((match = regex.exec(testText)) !== null) {
        const matchText = match[0];
        const index = match.index;
        if (matchText === "" && regex.lastIndex === index) {
          regex.lastIndex++;
          continue;
        }

        if (index > lastIndex) {
          parts.push({
            key: `text-${lastIndex}-${index}`,
            text: testText.slice(lastIndex, index),
            matched: false,
          });
        }

        parts.push({
          key: `match-${index}-${index + matchText.length}-${count}`,
          text: matchText,
          matched: true,
        });

        lastIndex = index + matchText.length;
        count++;
      }

      if (lastIndex < testText.length) {
        parts.push({
          key: `tail-${lastIndex}-${testText.length}`,
          text: testText.slice(lastIndex),
          matched: false,
        });
      }

      return { segments: parts.length ? parts : [{ key: "all", text: testText, matched: false }], matchCount: count };
    } catch {
      return { segments: [{ key: "all", text: testText, matched: false }], matchCount: 0 };
    }
  }, [pattern, flags, testText]);

  const handlePatternChange = (value: string) => {
    setPattern(value);
    try {
      if (!value) {
        setError(null);
        return;
      }
      const rawFlags = flags.replace(/[^gimsuy]/gi, "");
      const finalFlags = rawFlags.includes("g") ? rawFlags : `${rawFlags}g`;
      void new RegExp(value, finalFlags);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  };

  const handleFlagsChange = (value: string) => {
    const cleaned = value.replace(/[^gimsuy]/gi, "");
    setFlags(cleaned);

    if (!pattern) {
      setError(null);
      return;
    }

    try {
      const finalFlags = cleaned.includes("g") ? cleaned : `${cleaned}g`;
      void new RegExp(pattern, finalFlags);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-8 max-w-5xl space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">
            Back to Tools
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Braces className="h-8 w-8 text-emerald-500" />
            Regex Tester
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Quickly test regular expression patterns against sample text and inspect all matches.
          </p>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] gap-6 items-start">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  Pattern
                  <span className="text-[11px] rounded-full border px-2 py-0.5 text-muted-foreground">
                    JavaScript RegExp
                  </span>
                </p>
                <Input
                  value={pattern}
                  onChange={(e) => handlePatternChange(e.target.value)}
                  placeholder="e.g. ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  aria-invalid={!!error}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  Flags
                  <span className="text-[11px] text-muted-foreground">g i m s u y</span>
                </p>
                <Input
                  value={flags}
                  onChange={(e) => handleFlagsChange(e.target.value)}
                  placeholder="gim"
                />
                <p className="text-[11px] text-muted-foreground">
                  The global flag (g) is always applied to find all matches.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  Test text
                </p>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Paste or type the text you want to test against the pattern"
                  className="h-48 resize-none"
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              {!error && pattern && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  <span>
                    {matchCount === 0
                      ? "No matches found."
                      : matchCount === 1
                      ? "Found 1 match."
                      : `Found ${matchCount} matches.`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  Match preview
                </p>
                {pattern && !error && (
                  <p className="text-[11px] text-muted-foreground">
                    Pattern: <span className="font-mono">/{pattern}/{flags || "g"}</span>
                  </p>
                )}
              </div>

              <div className="rounded-md border bg-muted/40 p-3 text-sm min-h-[200px] max-h-[360px] overflow-auto">
                {testText ? (
                  <p className="whitespace-pre-wrap break-words">
                    {segments.map((segment) =>
                      segment.matched ? (
                        <mark
                          key={segment.key}
                          className="rounded-[3px] bg-emerald-500/20 px-0.5 py-0.5 text-emerald-900 dark:text-emerald-100"
                        >
                          {segment.text}
                        </mark>
                      ) : (
                        <span key={segment.key}>{segment.text}</span>
                      )
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Matches will be highlighted here once you provide both a pattern and test text.
                  </p>
                )}
              </div>

              <div className="mt-2 rounded-md border bg-muted/40">
                <button
                  type="button"
                  onClick={() => setShowCheatsheet((prev) => !prev)}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60"
                >
                  <span>Common regex symbols</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      showCheatsheet ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
                {showCheatsheet && (
                  <div className="border-t px-3 py-2.5">
                    <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,2.1fr)] gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">.</span>
                      <span>Any single character except newline</span>
                      <span className="font-mono">\d</span>
                      <span>Digit [0-9]</span>
                      <span className="font-mono">\w</span>
                      <span>Word character [A-Za-z0-9_]</span>
                      <span className="font-mono">\s</span>
                      <span>Whitespace (space, tab, newline)</span>
                      <span className="font-mono">^</span>
                      <span>Start of line or string</span>
                      <span className="font-mono">$</span>
                      <span>End of line or string</span>
                      <span className="font-mono">*</span>
                      <span>0 or more repetitions</span>
                      <span className="font-mono">+</span>
                      <span>1 or more repetitions</span>
                      <span className="font-mono">?</span>
                      <span>0 or 1 repetition (optional)</span>
                      <span className="font-mono">{`{n,m}`}</span>
                      <span>Between n and m repetitions</span>
                      <span className="font-mono">[...]</span>
                      <span>Character class, any of the listed chars</span>
                      <span className="font-mono">( )</span>
                      <span>Capturing group</span>
                      <span className="font-mono">A|B</span>
                      <span>Either A or B</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
