"use client";

import { useState } from "react";
import { Header } from "@/components/shared/header";
import { DropZone } from "@/components/shared/drop-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Loader2, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
 

export default function BgRemoverPage() {
  const [file, setFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleFilesAccepted = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResultUrl(null); // Clear previous result
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    const toastId = toast.loading("Removing background... This might take a few seconds.");

    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/tools/bg-remover", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove background");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setResultUrl(url);

      toast.success("Background removed successfully!", { id: toastId });
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(error);
      toast.error(message || "Something went wrong", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `bg-removed-${file?.name.replace(/\.[^/.]+$/, "") || "image"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setResultUrl(null);
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-12 max-w-4xl space-y-8">
        {/* Breadcrumb / Back */}
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">Back to Tools</Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Scissors className="h-8 w-8 text-pink-500" />
            Background Remover
          </h1>
          <p className="text-muted-foreground text-lg">
            Remove image backgrounds automatically with AI precision.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Original Image</h2>
            <Card className="border-2 border-dashed shadow-sm min-h-[300px] flex flex-col">
              <CardContent className="flex-1 p-6 flex flex-col items-center justify-center">
                {!file ? (
                  <DropZone 
                    key={resetKey}
                    onFilesAccepted={handleFilesAccepted} 
                    maxFiles={1}
                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                    description="Drag & drop an image here"
                    className="h-full"
                  />
                ) : (
                  <div className="relative w-full h-full min-h-[250px] flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Original" 
                      className="max-w-full max-h-[300px] object-contain"
                    />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={handleReset}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Button 
              size="lg" 
              onClick={handleProcess} 
              disabled={!file || isProcessing || !!resultUrl}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Scissors className="mr-2 h-4 w-4" />
                  Remove Background
                </>
              )}
            </Button>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Result</h2>
            <Card className="border shadow-sm min-h-[300px] flex flex-col bg-muted/10">
              <CardContent className="flex-1 p-6 flex items-center justify-center relative bg-[url('/transparent-bg.png')] bg-repeat">
                {/* Checkered pattern CSS fallback if image missing */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }} />
                
                {resultUrl ? (
                  <img 
                    src={resultUrl} 
                    alt="Result" 
                    className="max-w-full max-h-[300px] object-contain relative z-10"
                  />
                ) : (
                  <div className="text-muted-foreground text-center relative z-10">
                    <p>Processed image will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              size="lg" 
              variant="outline"
              onClick={handleDownload} 
              disabled={!resultUrl}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
