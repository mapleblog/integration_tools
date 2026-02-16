import { BaseToolExecutor, ToolType } from "./base-executor";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import archiver from "archiver";
import { PassThrough } from "stream";

const PdfSplitterOptionsSchema = z.object({
  ranges: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (value) => value === "" || /^[0-9,\-\s]+$/.test(value),
      "Invalid page ranges format. Use numbers, commas, and dashes only (e.g. 1-3,5,8-10)."
    ),
});

type PdfSplitterOptions = z.infer<typeof PdfSplitterOptionsSchema>;

export class PdfSplitterExecutor extends BaseToolExecutor<PdfSplitterOptions> {
  readonly toolId = "pdf-splitter";
  readonly type: ToolType = "batch";
  readonly inputSchema = PdfSplitterOptionsSchema;
  protected readonly processingRate = 0.5;

  async process(
    input: ReadableStream | FormData,
    options: PdfSplitterOptions
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }> {
    if (!(input instanceof FormData)) {
      throw new Error("PDF Splitter expects FormData input");
    }

    const files: File[] = [];
    for (const [, value] of input.entries()) {
      if (value instanceof File) {
        if (value.type === "application/pdf" || value.name.toLowerCase().endsWith(".pdf")) {
          files.push(value);
        }
      }
    }

    if (files.length !== 1) {
      throw new Error("Exactly 1 PDF file is required for splitting");
    }

    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    const totalPages = pdf.getPageCount();
    const ranges = this.parseRanges(options.ranges ?? "", totalPages);

    if (!ranges.length) {
      throw new Error("No valid page ranges found");
    }

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    let fileIndex = 0;

    for (const [startPage, endPage] of ranges) {
      const indices: number[] = [];
      for (let i = startPage; i <= endPage; i += 1) {
        indices.push(i - 1);
      }

      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(pdf, indices);
      copiedPages.forEach((page) => splitPdf.addPage(page));

      const pdfBytes = await splitPdf.save();

      fileIndex += 1;
      const filename = `page_${fileIndex}.pdf`;

      archive.append(Buffer.from(pdfBytes), { name: filename });
    }

    archive.finalize().catch((err) => {
      passThrough.emit("error", err);
    });

    const outputStream = new ReadableStream({
      start(controller) {
        passThrough.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        passThrough.on("end", () => {
          controller.close();
        });
        passThrough.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    const zipFileName = `Pdfsplit_${dd}${mm}${yyyy}.zip`;

    return {
      outputStream,
      metadata: {
        originalName: file.name,
        pageCount: totalPages,
        extractedRanges: ranges,
        fileCount: ranges.length,
        mimeType: "application/zip",
        fileName: zipFileName,
      },
    };
  }

  private parseRanges(raw: string, totalPages: number): [number, number][] {
    const trimmed = raw.trim();

    if (!trimmed) {
      const ranges: [number, number][] = [];
      for (let i = 1; i <= totalPages; i += 1) {
        ranges.push([i, i]);
      }
      return ranges;
    }

    const parts = trimmed
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    const ranges: [number, number][] = [];

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((p) => p.trim());
        let start = Number(startStr);
        let end = Number(endStr);

        if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
        if (start < 1 || end < 1) continue;
        if (start > end) {
          const tmp = start;
          start = end;
          end = tmp;
        }

        if (start > totalPages) continue;
        if (end > totalPages) end = totalPages;

        for (let page = start; page <= end; page += 1) {
          ranges.push([page, page]);
        }
      } else {
        const page = Number(part);
        if (!Number.isFinite(page)) continue;
        if (page < 1 || page > totalPages) continue;
        ranges.push([page, page]);
      }
    }

    return ranges;
  }
}
