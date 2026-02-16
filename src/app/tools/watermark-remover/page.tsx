"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/shared/header";
import { DropZone } from "@/components/shared/drop-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eraser, Loader2, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function WatermarkRemoverPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [displayRect, setDisplayRect] = useState<Rect | null>(null);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!file) {
      setNaturalSize(null);
      setDisplayRect(null);
      setSelection(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return url;
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleFilesAccepted = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResultUrl(null);
      setSelection(null);
      setResetKey((prev) => prev + 1);
    }
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDisplayRect({
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !naturalSize) return;
    if (!imageUrl) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    dragStartRef.current = { x, y };
    setIsDragging(true);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current || !naturalSize) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const startX = dragStartRef.current.x;
    const startY = dragStartRef.current.y;

    const left = Math.max(0, Math.min(startX, currentX));
    const top = Math.max(0, Math.min(startY, currentY));
    const width = Math.min(rect.width, Math.max(startX, currentX)) - left;
    const height = Math.min(rect.height, Math.max(startY, currentY)) - top;

    if (width <= 0 || height <= 0) {
      setDisplayRect((prev) =>
        prev
          ? {
              ...prev,
            }
          : prev
      );
      setSelection(null);
      return;
    }

    const scaleX = naturalSize.width / rect.width;
    const scaleY = naturalSize.height / rect.height;

    setDisplayRect({
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
    });

    setSelection({
      x: left * scaleX,
      y: top * scaleY,
      width: width * scaleX,
      height: height * scaleY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleProcess = async () => {
    if (!file) return;
    if (!selection) {
      toast.error("请在图片上拖动选择需要去除水印的区域");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Removing watermark...");

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append(
        "options",
        JSON.stringify({
          x: selection.x,
          y: selection.y,
          width: selection.width,
          height: selection.height,
        })
      );

      const response = await fetch("/api/tools/watermark-remover", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove watermark");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setResultUrl(url);

      toast.success("Watermark removed successfully!", { id: toastId });
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
    a.download = `watermark-removed-${file?.name.replace(/\.[^/.]+$/, "") || "image"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setResultUrl(null);
    setSelection(null);
    setResetKey((prev) => prev + 1);
  };

  const renderSelectionOverlay = () => {
    if (!selection || !naturalSize || !displayRect) return null;

    const scaleX = displayRect.width / naturalSize.width;
    const scaleY = displayRect.height / naturalSize.height;

    const left = selection.x * scaleX;
    const top = selection.y * scaleY;
    const width = selection.width * scaleX;
    const height = selection.height * scaleY;

    return (
      <div
        className="absolute border-2 border-emerald-500 bg-emerald-500/20 pointer-events-none"
        style={{
          left,
          top,
          width,
          height,
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12 max-w-5xl space-y-8">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">
            Back to Tools
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Eraser className="h-8 w-8 text-indigo-500" />
            Watermark Remover
          </h1>
          <p className="text-muted-foreground text-lg">
            Select the watermark area and automatically blur-cover it for a cleaner image.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Original Image</h2>
            <Card className="border-2 border-dashed shadow-sm min-h-[320px] flex flex-col">
              <CardContent className="flex-1 p-6 flex flex-col items-center justify-center">
                {!file ? (
                  <DropZone
                    key={resetKey}
                    onFilesAccepted={handleFilesAccepted}
                    maxFiles={1}
                    accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
                    description="拖拽或点击上传一张图片"
                    className="h-full"
                  />
                ) : (
                  <div
                    ref={containerRef}
                    className="relative w-full h-full min-h-[250px] flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Original"
                        className="max-w-full max-h-[320px] object-contain"
                        onLoad={handleImageLoad}
                      />
                    )}
                    {renderSelectionOverlay()}
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
                  <Eraser className="mr-2 h-4 w-4" />
                  Remove Watermark
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              在左侧图片上拖动鼠标框选水印区域，系统会自动对该区域进行模糊覆盖处理。
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Result</h2>
            <Card className="border shadow-sm min-h-[320px] flex flex-col bg-muted/10">
              <CardContent className="flex-1 p-6 flex items-center justify-center">
                {resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="max-w-full max-h-[320px] object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground text-center">
                    <p>处理后的图片会显示在这里</p>
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
