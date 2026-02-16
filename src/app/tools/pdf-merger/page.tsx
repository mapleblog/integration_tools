"use client";

import { useState } from "react";
import { Header } from "@/components/shared/header";
import { DropZone } from "@/components/shared/drop-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function PdfMergerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Please upload at least 2 PDF files.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Merging PDFs...");

    try {
      const formData = new FormData();
      // Append files to FormData
      // Note: We trust the order from DropZone (which is typically insertion order)
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/tools/pdf-merger", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to merge PDFs");
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged-document.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDFs merged successfully!", { id: toastId });
      
      // Clear files
      setFiles([]);
      setResetKey(prev => prev + 1);
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(error);
      toast.error(message || "Something went wrong", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12 max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb / Back */}
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">Back to Tools</Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Layers className="h-8 w-8 text-orange-500" />
            PDF Merger
          </h1>
          <p className="text-muted-foreground text-lg">
            Combine multiple PDF files into a single, organized document in seconds.
          </p>
        </div>

        <Card className="border-2 border-dashed shadow-sm">
          <CardContent className="pt-6">
            <DropZone 
              key={resetKey}
              onFilesAccepted={setFiles} 
              maxFiles={20}
              accept={{ 'application/pdf': ['.pdf'] }}
              description="Drag & drop PDFs here (min 2 files)"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
           <Button 
            size="lg" 
            onClick={handleMerge} 
            disabled={files.length < 2 || isProcessing}
            className="w-full md:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Layers className="mr-2 h-4 w-4" />
                Merge PDFs
              </>
            )}
          </Button>
        </div>

        {/* Tips or Info Section */}
        <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground pt-8 border-t">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Secure & Private</h3>
            <p>Files are processed securely and deleted immediately after processing. No data is stored.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Fast Processing</h3>
            <p>Powered by high-performance edge computing for lightning-fast results.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Free to Use</h3>
            <p>No hidden fees or watermarks. Just a simple, effective tool.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
