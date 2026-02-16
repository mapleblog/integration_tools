"use client";

import { useState } from "react";
import { Header } from "@/components/shared/header";
import { DropZone } from "@/components/shared/drop-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image as ImageIcon, Loader2, ArrowLeft, Download, RefreshCw, FileImage } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
 

export default function ImageCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultMetadata, setResultMetadata] = useState<{ size: number; type: string; extension: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Options
  const [quality, setQuality] = useState([80]);
  const [format, setFormat] = useState<string>("jpeg");

  const handleFilesAccepted = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResultUrl(null);
      setResultMetadata(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    const toastId = toast.loading("Compressing image...");

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("quality", quality[0].toString());
      formData.append("format", format);

      const response = await fetch("/api/tools/image-compressor", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to compress image");
      }

      // Read headers for metadata if available, or just blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setResultUrl(url);

      // In a real streaming response, metadata might come in headers or a separate channel.
      // For now, we can approximate size from blob.
      setResultMetadata({
        size: blob.size,
        type: blob.type,
        extension: format === "jpeg" ? "jpg" : format
      });

      toast.success("Image compressed successfully!", { id: toastId });
      
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
    const extension = resultMetadata?.extension || "jpg";
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${file?.name.replace(/\.[^/.]+$/, "")}-compressed.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setResultUrl(null);
    setResultMetadata(null);
    setResetKey(prev => prev + 1);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const calculateReduction = (original: number, compressed: number) => {
    const reduction = ((original - compressed) / original) * 100;
    return reduction.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-12 max-w-4xl space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">Back to Tools</Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-blue-500" />
            Image Compressor
          </h1>
          <p className="text-muted-foreground text-lg">
            Smart compression to reduce file size without losing quality.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content - Left 2 cols */}
          <div className="md:col-span-2 space-y-6">
            {!file ? (
              <DropZone
                key={resetKey}
                onFilesAccepted={handleFilesAccepted}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.avif']
                }}
                maxFiles={1}
                title="Drop an image here"
                description="Supports JPG, PNG, WebP, AVIF"
              />
            ) : (
              <div className="space-y-6">
                <Card className="overflow-hidden">
                  <CardContent className="p-0 relative bg-muted/30">
                    <div className="aspect-video relative flex items-center justify-center p-8">
                      {/* Preview Image (Original or Result) */}
                      {/* Note: We show the original file preview until result is ready, 
                          or we could show side-by-side. For simplicity, let's show the file. */}
                      {file && (
                        <img 
                          src={resultUrl || URL.createObjectURL(file)} 
                          alt="Preview" 
                          className="max-h-full max-w-full object-contain rounded shadow-sm"
                        />
                      )}
                    </div>
                    <div className="p-4 border-t flex items-center justify-between bg-card">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <FileImage className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Original: {formatSize(file.size)}
                          </p>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="icon" onClick={handleReset}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {resultUrl && resultMetadata && (
                  <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">Compression Complete!</p>
                        <div className="flex gap-4 text-sm mt-1 text-emerald-600/80 dark:text-emerald-400/80">
                          <span>New Size: <strong>{formatSize(resultMetadata.size)}</strong></span>
                          <span>Saved: <strong>{calculateReduction(file.size, resultMetadata.size)}%</strong></span>
                        </div>
                      </div>
                      <Button onClick={handleDownload} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Right col */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-xs text-muted-foreground">Configure output preferences.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Quality: {quality[0]}%</Label>
                    </div>
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      min={1}
                      max={100}
                      step={1}
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower quality = smaller file size.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select 
                      value={format} 
                      onValueChange={setFormat}
                      disabled={isProcessing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jpeg">JPEG (Best for photos)</SelectItem>
                        <SelectItem value="png">PNG (Best for details)</SelectItem>
                        <SelectItem value="webp">WebP (Modern & efficient)</SelectItem>
                        <SelectItem value="avif">AVIF (Ultra compression)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleProcess}
                    disabled={!file || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Compressing...
                      </>
                    ) : (
                      "Compress Image"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground space-y-2 p-2">
              <p>• Processing happens securely on our cloud servers.</p>
              <p>• Files are automatically deleted after processing.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
