"use client";

import { useState } from "react";
import { Header } from "@/components/shared/header";
import { DropZone } from "@/components/shared/drop-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, ArrowLeft, Archive, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function FileArchiverPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [filename, setFilename] = useState("archive");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleArchive = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least 1 file.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Creating archive...");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("filename", filename);

      const response = await fetch("/api/tools/file-archiver", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create archive");
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Archive created successfully!", { id: toastId });
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(error);
      toast.error(message || "Something went wrong", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFilesAccepted = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
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
            <Archive className="h-8 w-8 text-emerald-500" />
            File Archiver
          </h1>
          <p className="text-muted-foreground text-lg">
            Compress multiple files into a secure ZIP archive.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
             <Card className="border-2 border-dashed shadow-sm">
              <CardContent className="pt-6">
                <DropZone 
                  key={resetKey}
                  onFilesAccepted={handleFilesAccepted} 
                  maxFiles={50}
                  description="Drag & drop files here"
                  // No accept prop means all files are accepted
                />
              </CardContent>
            </Card>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm text-muted-foreground">Selected Files ({files.length})</h3>
                  <Button variant="ghost" size="sm" onClick={() => { setFiles([]); setResetKey(p => p+1); }} className="text-destructive h-auto p-0 hover:bg-transparent">
                    Clear all
                  </Button>
                </div>
                <div className="bg-card border rounded-lg divide-y">
                  {files.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFile(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Archive Settings</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="filename">Archive Name</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="filename" 
                        value={filename} 
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="archive"
                      />
                      <span className="text-sm text-muted-foreground">.zip</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={handleArchive}
                    disabled={files.length === 0 || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Create ZIP
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
