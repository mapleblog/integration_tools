"use client";

import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DropZoneProps extends DropzoneOptions {
  className?: string;
  onFilesAccepted?: (files: File[]) => void;
  maxFiles?: number;
  title?: string;
  description?: string;
}

export function DropZone({
  className,
  onFilesAccepted,
  maxFiles = 10,
  title = "Upload Files",
  description = "Drag & drop files here, or click to select files",
  ...props
}: DropZoneProps) {
  const [files, setFiles] = React.useState<File[]>([]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      // If maxFiles is 1, replace the file
      if (maxFiles === 1) {
        setFiles(acceptedFiles);
        onFilesAccepted?.(acceptedFiles);
      } else {
        const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
        setFiles(newFiles);
        onFilesAccepted?.(newFiles);
      }
    },
    [files, maxFiles, onFilesAccepted]
  );

  const removeFile = (fileToRemove: File) => {
    const newFiles = files.filter((file) => file !== fileToRemove);
    setFiles(newFiles);
    onFilesAccepted?.(newFiles); // Notify parent about removal if needed
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    ...props,
  });

  return (
    <div className={cn("w-full space-y-4", className)}>
      <motion.div
        {...(getRootProps() as unknown as React.HTMLAttributes<HTMLDivElement>)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "relative cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/5 p-10 transition-colors hover:bg-muted/10",
          isDragActive && "border-primary bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border shadow-sm">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-lg">
              {isDragActive ? "Drop files here" : title}
            </p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <File className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="truncate">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFile(file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
