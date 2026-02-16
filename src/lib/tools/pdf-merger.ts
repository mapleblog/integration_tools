import { BaseToolExecutor, ToolType } from "./base-executor";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";

const PdfMergerOptionsSchema = z.object({
  // Placeholder for future options like page ranges, rotation, etc.
});

type PdfMergerOptions = z.infer<typeof PdfMergerOptionsSchema>;

export class PdfMergerExecutor extends BaseToolExecutor<PdfMergerOptions> {
  readonly toolId = "pdf-merger";
  readonly type: ToolType = "batch";
  readonly inputSchema = PdfMergerOptionsSchema;
  protected readonly processingRate = 0.5; // Estimated 0.5s per MB

  async process(
    input: ReadableStream | FormData,
    _options: PdfMergerOptions
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }> {
    if (!(input instanceof FormData)) {
      throw new Error("PDF Merger expects FormData input");
    }

    // Extract files from FormData
    // We assume the client appends files with key 'files' or just appends them in order
    // We'll collect all files found in the FormData
    const files: File[] = [];
    for (const [, value] of input.entries()) {
      if (value instanceof File) {
        // Simple validation: check if it looks like a PDF
        if (value.type === "application/pdf" || value.name.toLowerCase().endsWith(".pdf")) {
          files.push(value);
        }
      }
    }

    if (files.length < 2) {
      throw new Error("At least 2 PDF files are required for merging");
    }

    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true }); 
        // Note: encrypted PDFs might fail here without password. 
        // For now, we assume unencrypted or we'd need to pass passwords in options.
        
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      
      // Create a ReadableStream from the bytes
      const outputStream = new ReadableStream({
        start(controller) {
          controller.enqueue(pdfBytes);
          controller.close();
        }
      });

      return {
        outputStream,
        metadata: {
          fileCount: files.length,
          outputSize: pdfBytes.length,
          fileName: "merged-document.pdf"
        }
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("PDF Merge Error:", error);
      throw new Error(`Failed to merge PDFs: ${message}`);
    }
  }
}
