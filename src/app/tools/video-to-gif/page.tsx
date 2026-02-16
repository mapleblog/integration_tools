"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/shared/header";
import { DropZone } from "@/components/shared/drop-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Download, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VideoToGifPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const [start, setStart] = useState("0");
  const [duration, setDuration] = useState("5");
  const [fps, setFps] = useState("10");
  const [width, setWidth] = useState("480");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleConvert = async () => {
    if (!file) {
      toast.error("Please upload a video file first.");
      return;
    }

    const startValue = Number(start) || 0;
    const durationValue = Number(duration) || 5;
    const fpsValue = Number(fps) || 10;
    const widthValue = Number(width) || 480;

    if (durationValue <= 0) {
      toast.error("Duration must be greater than 0 seconds.");
      return;
    }

    if (durationValue > 60) {
      toast.error("Duration cannot exceed 60 seconds.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Converting video to GIF...");

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append(
        "options",
        JSON.stringify({
          start: startValue,
          duration: durationValue,
          fps: fpsValue,
          width: widthValue,
        })
      );

      const response = await fetch("/api/tools/video-to-gif", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Failed to convert video to GIF";
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
      const url = URL.createObjectURL(blob);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(url);
      toast.success("GIF generated successfully!", { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(error);
      toast.error(message || "Something went wrong", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "video.gif";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-8 max-w-5xl space-y-8">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">
            Back to Tools
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Film className="h-8 w-8 text-pink-500" />
            Video to GIF
          </h1>
          <p className="text-muted-foreground text-lg">
            Convert a short video clip into a high-quality animated GIF, perfect for sharing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          <Card className="border-2 border-dashed shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <DropZone
                key={resetKey}
                onFilesAccepted={handleFilesAccepted}
                maxFiles={1}
                accept={{ "video/*": [".mp4", ".mov", ".webm", ".mkv"] }}
                description="Drag & drop a video file here, or click to upload"
              />

              {file && (
                <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate max-w-[220px] md:max-w-xs">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
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

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Start time (seconds)</p>
                  <Input
                    type="number"
                    min={0}
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Duration (seconds)</p>
                  <Input
                    type="number"
                    min={0.1}
                    max={60}
                    step={0.1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Frame rate (FPS)</p>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={fps}
                    onChange={(e) => setFps(e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Width (pixels)</p>
                  <Input
                    type="number"
                    min={64}
                    max={800}
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="480"
                  />
                </div>
              </div>
              {isProcessing && (
                <div className="pt-3 space-y-1.5">
                  <div className="text-xs text-muted-foreground">
                    Processing video, this may take a while…
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-full rounded-full bg-pink-500 animate-pulse" />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  size="lg"
                  onClick={handleConvert}
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
                      <Film className="mr-2 h-4 w-4" />
                      Convert to GIF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="p-5 flex flex-col items-center justify-center gap-4 w-full">
              <div className="w-full aspect-square max-w-xs mx-auto flex items-center justify-center bg-muted rounded-lg border">
                {previewUrl ? (
                  <img src={previewUrl} alt="Generated GIF" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-xs text-muted-foreground text-center px-4">
                    The generated GIF will appear here after conversion. Upload a short video and click the
                    “Convert to GIF” button.
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!previewUrl}
                className="w-full md:w-auto mt-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Download GIF
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
