import { BaseToolExecutor, ToolType } from "./base-executor";
import { z } from "zod";
import sharp from "sharp";

const WatermarkRemoverOptionsSchema = z.object({
  x: z.coerce.number().min(0),
  y: z.coerce.number().min(0),
  width: z.coerce.number().min(1),
  height: z.coerce.number().min(1),
});

type WatermarkRemoverOptions = z.infer<typeof WatermarkRemoverOptionsSchema>;

export class WatermarkRemoverExecutor extends BaseToolExecutor<WatermarkRemoverOptions> {
  readonly toolId = "watermark-remover";
  readonly type: ToolType = "batch";
  readonly inputSchema = WatermarkRemoverOptionsSchema;
  protected readonly processingRate = 3.0;

  async process(
    input: ReadableStream | FormData,
    options: WatermarkRemoverOptions
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }> {
    if (!(input instanceof FormData)) {
      throw new Error("Watermark Remover expects FormData input");
    }

    const file = input.get("files") as File;

    if (!file || !(file instanceof File)) {
      throw new Error("No image file provided");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Invalid file type. Please upload an image.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const image = sharp(buffer);
    const metadata = await image.metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0) {
      throw new Error("Unable to read image dimensions");
    }

    const x = Math.max(0, Math.min(options.x, width - 1));
    const y = Math.max(0, Math.min(options.y, height - 1));
    const w = Math.max(1, Math.min(options.width, width - x));
    const h = Math.max(1, Math.min(options.height, height - y));

    const blurredRegion = await sharp(buffer)
      .extract({ left: Math.round(x), top: Math.round(y), width: Math.round(w), height: Math.round(h) })
      .blur(20)
      .toBuffer();

    const resultBuffer = await image
      .composite([
        {
          input: blurredRegion,
          left: Math.round(x),
          top: Math.round(y),
        },
      ])
      .png()
      .toBuffer();

    const outputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(resultBuffer);
        controller.close();
      },
    });

    const originalName = file.name.replace(/\.[^/.]+$/, "");

    return {
      outputStream,
      metadata: {
        originalName: file.name,
        outputSize: resultBuffer.length,
        mimeType: "image/png",
        fileName: `${originalName}-watermark-removed.png`,
        region: { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) },
      },
    };
  }
}

