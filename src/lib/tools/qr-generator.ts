import { BaseToolExecutor, ToolType } from "./base-executor";
import { z } from "zod";
import QRCode from "qrcode";

const QrGeneratorOptionsSchema = z.object({
  text: z.string().min(1, "请输入要编码为二维码的文本或链接"),
  size: z.number().int().min(64).max(1024).default(384),
  margin: z.number().int().min(0).max(16).default(2),
  errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).default("M"),
});

type QrGeneratorOptions = z.infer<typeof QrGeneratorOptionsSchema>;

export class QrGeneratorExecutor extends BaseToolExecutor<QrGeneratorOptions> {
  readonly toolId = "qr-generator";
  readonly type: ToolType = "batch";
  readonly inputSchema = QrGeneratorOptionsSchema;
  protected readonly processingRate = 0.01;

  async process(
    input: ReadableStream | FormData,
    options: QrGeneratorOptions
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }> {
    if (!(input instanceof FormData)) {
      throw new Error("QR Generator expects FormData input");
    }

    const buffer = await QRCode.toBuffer(options.text, {
      type: "png",
      width: options.size,
      margin: options.margin,
      errorCorrectionLevel: options.errorCorrectionLevel,
    });

    const outputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    });

    return {
      outputStream,
      metadata: {
        mimeType: "image/png",
        fileName: "qrcode.png",
        textLength: options.text.length,
        size: options.size,
        margin: options.margin,
        errorCorrectionLevel: options.errorCorrectionLevel,
      },
    };
  }
}

