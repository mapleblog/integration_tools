"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Header } from "@/components/shared/header";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDiff, ArrowLeft, ArrowRightLeft, Upload, Trash2, Settings2, Columns, RectangleHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import * as Diff from "diff";
import { cn } from "@/lib/utils";

type DiffMode = "lines" | "words" | "chars";
type ViewMode = "split" | "unified";

interface DiffLine {
  leftLineNumber?: number;
  rightLineNumber?: number;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  leftType?: "removed" | "unchanged" | "empty";
  rightType?: "added" | "unchanged" | "empty";
}

export default function FileDiffPage() {
  const [originalText, setOriginalText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [originalFileName, setOriginalFileName] = useState("Original");
  const [modifiedFileName, setModifiedFileName] = useState("Modified");
  const [diffMode, setDiffMode] = useState<DiffMode>("lines");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [diffResult, setDiffResult] = useState<Diff.Change[]>([]);

  const originalFileInputRef = useRef<HTMLInputElement>(null);
  const modifiedFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let result: Diff.Change[] = [];
    try {
      if (diffMode === "lines") {
        result = Diff.diffLines(originalText, modifiedText);
      } else if (diffMode === "words") {
        result = Diff.diffWords(originalText, modifiedText);
      } else {
        result = Diff.diffChars(originalText, modifiedText);
      }
      setDiffResult(result);
    } catch (error) {
      console.error("Diff calculation failed:", error);
    }
  }, [originalText, modifiedText, diffMode]);

  const splitDiffRows = useMemo(() => {
    const rows: DiffLine[] = [];
    if (diffMode !== "lines") return rows; // Split view mainly optimized for lines mode

    let leftLineNum = 1;
    let rightLineNum = 1;
    
    // Helper to process a chunk of changes
    const processChanges = () => {
      let i = 0;
      while (i < diffResult.length) {
        const part = diffResult[i];
        const lines = part.value.replace(/\n$/, "").split("\n");
        
        if (part.removed) {
          // Check if next part is added (modification)
          const nextPart = diffResult[i + 1];
          if (nextPart && nextPart.added) {
            const nextLines = nextPart.value.replace(/\n$/, "").split("\n");
            const maxLines = Math.max(lines.length, nextLines.length);
            
            for (let j = 0; j < maxLines; j++) {
              rows.push({
                leftLineNumber: j < lines.length ? leftLineNum++ : undefined,
                rightLineNumber: j < nextLines.length ? rightLineNum++ : undefined,
                leftContent: j < lines.length ? lines[j] : undefined,
                rightContent: j < nextLines.length ? nextLines[j] : undefined,
                leftType: j < lines.length ? "removed" : "empty",
                rightType: j < nextLines.length ? "added" : "empty",
              });
            }
            i += 2; // Skip next part as we processed it
          } else {
            // Just removed
            lines.forEach(line => {
              rows.push({
                leftLineNumber: leftLineNum++,
                rightLineNumber: undefined,
                leftContent: line,
                rightContent: undefined,
                leftType: "removed",
                rightType: "empty",
              });
            });
            i++;
          }
        } else if (part.added) {
          // Just added (previous wasn't removed, otherwise caught above)
          lines.forEach(line => {
            rows.push({
              leftLineNumber: undefined,
              rightLineNumber: rightLineNum++,
              leftContent: undefined,
              rightContent: line,
              leftType: "empty",
              rightType: "added",
            });
          });
          i++;
        } else {
          // Unchanged
          lines.forEach(line => {
            rows.push({
              leftLineNumber: leftLineNum++,
              rightLineNumber: rightLineNum++,
              leftContent: line,
              rightContent: line,
              leftType: "unchanged",
              rightType: "unchanged",
            });
          });
          i++;
        }
      }
    };

    processChanges();
    return rows;
  }, [diffResult, diffMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "original" | "modified") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (target === "original") {
        setOriginalText(content);
        setOriginalFileName(file.name);
      } else {
        setModifiedText(content);
        setModifiedFileName(file.name);
      }
      toast.success(`${file.name} loaded successfully`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
    
    // Reset file input value so same file can be selected again
    e.target.value = "";
  };

  const handleSwap = () => {
    setOriginalText(modifiedText);
    setModifiedText(originalText);
    const tempName = originalFileName;
    setOriginalFileName(modifiedFileName);
    setModifiedFileName(tempName);
  };

  const handleClear = () => {
    setOriginalText("");
    setModifiedText("");
    setOriginalFileName("Original");
    setModifiedFileName("Modified");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-8 max-w-[90rem] space-y-6 px-4">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">
            Back to Tools
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileDiff className="h-8 w-8 text-blue-500" />
            File Diff
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Compare two files or text snippets to find differences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium truncate max-w-[200px]" title={originalFileName}>
                {originalFileName}
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={originalFileInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "original")}
                  accept=".txt,.js,.ts,.json,.md,.html,.css,.csv,.xml,.java,.py,.c,.cpp,.h"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => originalFileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Load File
                </Button>
              </div>
            </div>
            <Textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste original text here..."
              className="font-mono text-sm h-[200px] resize-none"
            />
          </div>

          {/* Modified Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium truncate max-w-[200px]" title={modifiedFileName}>
                {modifiedFileName}
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={modifiedFileInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "modified")}
                  accept=".txt,.js,.ts,.json,.md,.html,.css,.csv,.xml,.java,.py,.c,.cpp,.h"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => modifiedFileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Load File
                </Button>
              </div>
            </div>
            <Textarea
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              placeholder="Paste modified text here..."
              className="font-mono text-sm h-[200px] resize-none"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 py-2 border-y bg-muted/20 px-4 rounded-md">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Diff Mode:</span>
            <Select value={diffMode} onValueChange={(v) => setDiffMode(v as DiffMode)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lines">Lines</SelectItem>
                <SelectItem value="words">Words</SelectItem>
                <SelectItem value="chars">Characters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-4 w-px bg-border hidden md:block" />

          <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border">
            <Button
              variant={viewMode === "split" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
              className="h-7 px-2 gap-1.5 text-xs"
              disabled={diffMode !== "lines"}
              title={diffMode !== "lines" ? "Split view only available in Lines mode" : "Split View"}
            >
              <Columns className="h-3.5 w-3.5" />
              Split
            </Button>
            <Button
              variant={viewMode === "unified" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("unified")}
              className="h-7 px-2 gap-1.5 text-xs"
              title="Unified View"
            >
              <RectangleHorizontal className="h-3.5 w-3.5" />
              Unified
            </Button>
          </div>

          <div className="flex-1" />

          <Button variant="ghost" size="sm" onClick={handleSwap} className="gap-2 h-8">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Swap
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear} className="gap-2 h-8 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </Button>
        </div>

        {/* Diff Output */}
        <Card>
          <CardContent className="p-0 overflow-hidden">
            {originalText || modifiedText ? (
              <div className="w-full overflow-x-auto">
                {viewMode === "split" && diffMode === "lines" ? (
                  <div className="text-xs md:text-sm font-mono min-w-[800px]">
                    {/* Header */}
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] border-b divide-x bg-muted/30">
                      <div className="p-2 font-medium text-muted-foreground truncate px-4">{originalFileName}</div>
                      <div className="p-2 font-medium text-muted-foreground truncate px-4">{modifiedFileName}</div>
                    </div>
                    {/* Content */}
                    <div className="divide-y">
                      {splitDiffRows.map((row, index) => (
                        <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] divide-x group">
                          {/* Left Side */}
                          <div className={cn(
                            "flex",
                            row.leftType === "removed" ? "bg-red-500/10 dark:bg-red-900/20" : "",
                            row.leftType === "empty" ? "bg-muted/10 diag-stripes" : ""
                          )}>
                            <div className="w-8 md:w-12 shrink-0 select-none text-right pr-3 py-1 text-muted-foreground/50 border-r bg-muted/5 group-hover:bg-muted/20">
                              {row.leftLineNumber}
                            </div>
                            <div className={cn(
                              "flex-1 px-4 py-1 whitespace-pre-wrap break-all",
                              row.leftType === "removed" ? "text-red-900 dark:text-red-100" : "text-foreground/80"
                            )}>
                              {row.leftContent || <span className="invisible">.</span>}
                            </div>
                          </div>
                          
                          {/* Right Side */}
                          <div className={cn(
                            "flex",
                            row.rightType === "added" ? "bg-green-500/10 dark:bg-green-900/20" : "",
                            row.rightType === "empty" ? "bg-muted/10 diag-stripes" : ""
                          )}>
                            <div className="w-8 md:w-12 shrink-0 select-none text-right pr-3 py-1 text-muted-foreground/50 border-r bg-muted/5 group-hover:bg-muted/20">
                              {row.rightLineNumber}
                            </div>
                            <div className={cn(
                              "flex-1 px-4 py-1 whitespace-pre-wrap break-all",
                              row.rightType === "added" ? "text-green-900 dark:text-green-100" : "text-foreground/80"
                            )}>
                              {row.rightContent || <span className="invisible">.</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <pre className="text-sm font-mono p-4 min-w-full">
                    {diffResult.map((part, index) => {
                      const style = part.added
                        ? "bg-green-500/20 text-green-900 dark:text-green-100"
                        : part.removed
                        ? "bg-red-500/20 text-red-900 dark:text-red-100"
                        : "text-foreground/70";
                      
                      return (
                        <span key={index} className={`${style} whitespace-pre-wrap break-all`}>
                          {part.value}
                        </span>
                      );
                    })}
                  </pre>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileDiff className="h-12 w-12 mb-4 opacity-20" />
                <p>Enter text or upload files to see the difference.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <style jsx global>{`
          .diag-stripes {
            background-image: repeating-linear-gradient(
              45deg,
              transparent,
              transparent 5px,
              rgba(0, 0, 0, 0.03) 5px,
              rgba(0, 0, 0, 0.03) 10px
            );
          }
          .dark .diag-stripes {
            background-image: repeating-linear-gradient(
              45deg,
              transparent,
              transparent 5px,
              rgba(255, 255, 255, 0.03) 5px,
              rgba(255, 255, 255, 0.03) 10px
            );
          }
        `}</style>
      </main>
    </div>
  );
}
