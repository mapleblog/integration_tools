import { BaseToolExecutor, ToolType } from "./base-executor";
import { z } from "zod";
import { removeBackground } from "@imgly/background-removal-node";

const BgRemoverOptionsSchema = z.object({
  // Future options: output format, quality, etc.
});

type BgRemoverOptions = z.infer<typeof BgRemoverOptionsSchema>;

export class BgRemoverExecutor extends BaseToolExecutor<BgRemoverOptions> {
  readonly toolId = "bg-remover";
  readonly type: ToolType = "batch"; // Still using batch to handle FormData easily, though usually 1 file
  readonly inputSchema = BgRemoverOptionsSchema;
  protected readonly processingRate = 5.0; // Estimated 5s per MB (AI models are slower)

  async process(
    input: ReadableStream | FormData,
    _options: BgRemoverOptions
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }> {
    if (!(input instanceof FormData)) {
      throw new Error("Background Remover expects FormData input");
    }

    // Extract the first image file
    const file = input.get("files") as File;
    if (!file || !(file instanceof File)) {
      throw new Error("No image file provided");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Invalid file type. Please upload an image.");
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      // @imgly/background-removal-node accepts Blob, File, or URL. 
      // In Node environment, passing the ArrayBuffer or Blob usually works best.
      
      const blob = new Blob([arrayBuffer], { type: file.type });
      
      // Perform background removal
      // output is a Blob (PNG)
      const outputBlob = await removeBackground(blob);
      const outputBuffer = await outputBlob.arrayBuffer();
      
      // Create ReadableStream
      const outputStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(outputBuffer));
          controller.close();
        }
      });

      return {
        outputStream,
        metadata: {
          originalName: file.name,
          outputSize: outputBlob.size,
          mimeType: "image/png",
          fileName: `bg-removed-${file.name.replace(/\.[^/.]+$/, "")}.png`
        }
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Background Removal Error:", error);
      throw new Error(`Failed to remove background: ${message}`);
    }
  }
}
