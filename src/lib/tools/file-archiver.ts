import { BaseToolExecutor, ToolType } from "./base-executor";
import { z } from "zod";
import archiver from "archiver";
import { PassThrough } from "stream";

const FileArchiverOptionsSchema = z.object({
  filename: z.string().optional().default("archive"),
});

type FileArchiverOptions = z.infer<typeof FileArchiverOptionsSchema>;

export class FileArchiverExecutor extends BaseToolExecutor<FileArchiverOptions> {
  readonly toolId = "file-archiver";
  readonly type: ToolType = "batch";
  readonly inputSchema = FileArchiverOptionsSchema;
  protected readonly processingRate = 0.5; // Estimated 0.5s per MB

  async process(
    input: ReadableStream | FormData,
    options: FileArchiverOptions
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }> {
    if (!(input instanceof FormData)) {
      throw new Error("File Archiver expects FormData input");
    }

    const files: File[] = [];
    for (const [, value] of input.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      throw new Error("No files provided for archiving");
    }

    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });

    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    // Add files to archive
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      archive.append(buffer, { name: file.name });
    }

    // Finalize the archive (this is important!)
    archive.finalize().catch(err => {
        console.error("Archive finalization failed", err);
        passThrough.emit('error', err);
    });

    // Convert Node.js Readable stream (PassThrough) to Web ReadableStream
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

    const filename = options.filename || "archive";
    
    // We can't easily know the final size beforehand with streams without buffering everything,
    // so we might omit outputSize or set it to 0/undefined if allowed.
    // However, the base executor logic doesn't strictly enforce outputSize presence for streaming.
    
    return {
      outputStream,
      metadata: {
        fileCount: files.length,
        fileName: `${filename}.zip`,
        mimeType: "application/zip",
      }
    };
  }
}
