"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Loader2, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const errorLevels = [
  { value: "L", label: "L (7% error correction)" },
  { value: "M", label: "M (15% error correction)" },
  { value: "Q", label: "Q (25% error correction)" },
  { value: "H", label: "H (30% error correction)" },
];

export default function QrGeneratorPage() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(320);
  const [errorLevel, setErrorLevel] = useState("M");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
    };
  }, [qrUrl]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter the text or link to generate a QR code");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Generating QR code...");

    try {
      const formData = new FormData();
      formData.append(
        "options",
        JSON.stringify({
          text,
          size,
          margin: 2,
          errorCorrectionLevel: errorLevel,
        })
      );

      const response = await fetch("/api/tools/qr-generator", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Failed to generate QR code";
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
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
      setQrUrl(url);

      toast.success("QR code generated", { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "An error occurred while generating the QR code", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-8 max-w-4xl space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">
            Back to Tools
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <QrCode className="h-8 w-8 text-pink-500" />
            QR Code Generator
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Enter any text or link to generate a high-quality QR code and download it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 items-start">
          <Card className="h-full">
            <CardContent className="p-5 space-y-3">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Text or link</p>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="E.g. https://example.com or any text"
                />
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Size</p>
                  <Input
                    type="number"
                    min={64}
                    max={512}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value) || 0)}
                    className="w-28"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Error correction level</p>
                  <Select value={errorLevel} onValueChange={setErrorLevel}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Choose error correction level" />
                    </SelectTrigger>
                    <SelectContent>
                      {errorLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Recommended size 160–384 px; higher error correction levels are more robust to occlusion and damage.
              </p>

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-1">
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isProcessing || !text.trim()}
                  className="w-full md:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate QR code
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="p-5 flex flex-col items-center justify-center gap-4 w-full">
              <div className="w-full aspect-square max-w-xs mx-auto flex items-center justify-center bg-muted rounded-lg border">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Generated QR code"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground text-center px-4">
                    The generated QR code will appear here. Enter text and click the “Generate QR code” button.
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!qrUrl}
                className="w-full md:w-auto mt-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Download PNG
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
