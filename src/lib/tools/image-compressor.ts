import { BaseToolExecutor, ToolType } from "./base-executor";
import { z } from "zod";
import sharp from "sharp";

const ImageCompressorOptionsSchema = z.object({
  quality: z.coerce.number().min(1).max(100).default(80),
  format: z.enum(["jpeg", "png", "webp", "avif"]).default("jpeg"),
  // width: z.coerce.number().optional(), // Reserved for future
});

type ImageCompressorOptions = z.infer<typeof ImageCompressorOptionsSchema>;

export class ImageCompressorExecutor extends BaseToolExecutor<ImageCompressorOptions> {
  readonly toolId = "image-compressor";
  readonly type: ToolType = "batch";
  readonly inputSchema = ImageCompressorOptionsSchema;
  protected readonly processingRate = 2.0; // Estimated 2s per MB

  async process(
    input: ReadableStream | FormData,
    options: ImageCompressorOptions
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }> {
    if (!(input instanceof FormData)) {
      throw new Error("Image Compressor expects FormData input");
    }

    // Extract the file
    // We check for 'files' key first, then iterate if needed.
    // Assuming single file for now.
    const file = input.get("files") as File;
    
    if (!file || !(file instanceof File)) {
      throw new Error("No image file provided");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Invalid file type. Please upload an image.");
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let pipeline = sharp(buffer);

      // Apply compression based on format
      const format = options.format || "jpeg";
      const quality = options.quality || 80;

      switch (format) {
        case "jpeg":
          pipeline = pipeline.jpeg({ quality, mozjpeg: true });
          break;
        case "png":
          // PNG quality in sharp is different (palette quantization usually)
          // For simple compression, we use compressionLevel or palette.
          // sharp's png({ quality }) requires palette: true for 8-bit quantization which saves space
          pipeline = pipeline.png({ quality: Math.min(quality, 100), compressionLevel: 9, palette: true });
          break;
        case "webp":
          pipeline = pipeline.webp({ quality });
          break;
        case "avif":
          pipeline = pipeline.avif({ quality });
          break;
      }

      const outputBuffer = await pipeline.toBuffer();

      const outputStream = new ReadableStream({
        start(controller) {
          controller.enqueue(outputBuffer);
          controller.close();
        }
      });

      const extension = format === "jpeg" ? "jpg" : format;
      const originalName = file.name.replace(/\.[^/.]+$/, "");

      return {
        outputStream,
        metadata: {
          originalName: file.name,
          originalSize: file.size,
          outputSize: outputBuffer.length,
          mimeType: `image/${format}`,
          fileName: `${originalName}-compressed.${extension}`
        }
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Image Compression Error:", error);
      throw new Error(`Failed to compress image: ${message}`);
    }
  }
}
