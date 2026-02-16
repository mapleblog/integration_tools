"use client";

import { useState } from "react";
import { Header } from "@/components/shared/header";
import { DropZone } from "@/components/shared/drop-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, ArrowLeft, Scissors } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function PdfSplitterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleSplit = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Splitting PDF...");

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append(
        "options",
        JSON.stringify({
          ranges,
        })
      );

      const response = await fetch("/api/tools/pdf-splitter", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Failed to split PDF";
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            message = errorData.message;
          }
        } catch {
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = String(now.getFullYear());
      a.download = `Pdfsplit_${dd}${mm}${yyyy}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF split successfully!", { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(error);
      toast.error(message || "Something went wrong", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilesAccepted = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-12 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">
            Back to Tools
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Scissors className="h-8 w-8 text-rose-500" />
            PDF Splitter
          </h1>
          <p className="text-muted-foreground text-lg">
            Export each specified page range from a PDF as a separate file inside a ZIP archive.
          </p>
        </div>

        <Card className="border-2 border-dashed shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <DropZone
              key={resetKey}
              onFilesAccepted={handleFilesAccepted}
              maxFiles={1}
              accept={{ "application/pdf": [".pdf"] }}
              description="Drag & drop a PDF here, or click to upload"
            />

            {file && (
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate max-w-[220px] md:max-w-xs">
                    {file.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Remove
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Page ranges to extract</p>
              <Input
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="E.g. 1-3,5,8-10"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to split every page into a separate file. Use 1-based page numbers and separate ranges with
                commas. Each page in the specified ranges will become an individual PDF inside the ZIP file. For
                example: <span className="font-mono">1-3,5,8-10</span>.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                size="lg"
                onClick={handleSplit}
                disabled={!file || isProcessing}
                className="w-full md:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="mr-2 h-4 w-4" />
                    Split PDF
                  </>
                )}
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-xs text-muted-foreground pt-4 border-t">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">Flexible ranges</h3>
                <p>
                  Combine single pages and ranges in any order to build exactly the document you need.
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">Secure processing</h3>
                <p>Files are processed securely and not stored on the server after completion.</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">Clean output</h3>
                <p>
                  Each generated PDF keeps the original page quality and order for its range.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
