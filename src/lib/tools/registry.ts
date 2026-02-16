import { BaseToolExecutor } from "./base-executor";
import { PdfMergerExecutor } from "./pdf-merger";
import { PdfSplitterExecutor } from "./pdf-splitter";
import { BgRemoverExecutor } from "./bg-remover";
import { ImageCompressorExecutor } from "./image-compressor";
import { FileArchiverExecutor } from "./file-archiver";
import { WatermarkRemoverExecutor } from "./watermark-remover";
import { TextTranslatorExecutor } from "./text-translator";
import { QrGeneratorExecutor } from "./qr-generator";
import { VideoToGifExecutor } from "./video-to-gif";

type ToolCategory = "pdf" | "image" | "file" | "text" | "utility";

export type ToolMetadata = {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  aiExposed: boolean;
};

type RegisteredTool = {
  executor: BaseToolExecutor<unknown>;
  metadata: ToolMetadata;
};

export class ToolRegistry {
  private static tools: Map<string, RegisteredTool> = new Map();

  static register(tool: BaseToolExecutor<unknown>, metadata: Omit<ToolMetadata, "id">) {
    const entry: RegisteredTool = {
      executor: tool,
      metadata: {
        id: tool.toolId,
        ...metadata,
      },
    };
    this.tools.set(tool.toolId, entry);
  }

  static get(toolId: string): RegisteredTool | undefined {
    return this.tools.get(toolId);
  }

  static getExecutor(toolId: string): BaseToolExecutor<unknown> | undefined {
    return this.tools.get(toolId)?.executor;
  }

  static getMetadata(toolId: string): ToolMetadata | undefined {
    return this.tools.get(toolId)?.metadata;
  }

  static getAllIds(): string[] {
    return Array.from(this.tools.keys());
  }

  static getAllMetadata(): ToolMetadata[] {
    return Array.from(this.tools.values()).map((entry) => entry.metadata);
  }

  static getAiExposedTools(): ToolMetadata[] {
    return Array.from(this.tools.values())
      .map((entry) => entry.metadata)
      .filter((meta) => meta.aiExposed);
  }
}

export function initializeTools() {
  if (ToolRegistry.getAllIds().length === 0) {
    ToolRegistry.register(new PdfMergerExecutor(), {
      name: "PDF merge",
      category: "pdf",
      description: "Merge multiple PDF files into a single document",
      aiExposed: true,
    });

    ToolRegistry.register(new PdfSplitterExecutor(), {
      name: "PDF split",
      category: "pdf",
      description: "Extract specific page ranges into a new PDF document",
      aiExposed: true,
    });

    ToolRegistry.register(new BgRemoverExecutor(), {
      name: "Background remover",
      category: "image",
      description: "Remove image backgrounds and output transparent images",
      aiExposed: true,
    });

    ToolRegistry.register(new ImageCompressorExecutor(), {
      name: "Image compressor",
      category: "image",
      description: "Compress image size while preserving quality as much as possible",
      aiExposed: true,
    });

    ToolRegistry.register(new WatermarkRemoverExecutor(), {
      name: "Watermark remover",
      category: "image",
      description: "Blur and cover specified regions to remove image watermarks",
      aiExposed: true,
    });

    ToolRegistry.register(new FileArchiverExecutor(), {
      name: "File archiver",
      category: "file",
      description: "Bundle multiple files into a single ZIP archive",
      aiExposed: true,
    });

    ToolRegistry.register(new TextTranslatorExecutor(), {
      name: "Text translator",
      category: "text",
      description: "Translate text from one language to another",
      aiExposed: true,
    });

    ToolRegistry.register(new QrGeneratorExecutor(), {
      name: "QR code generator",
      category: "utility",
      description: "Generate a QR code image from text or links",
      aiExposed: true,
    });

    ToolRegistry.register(new VideoToGifExecutor(), {
      name: "Video to GIF",
      category: "image",
      description: "Convert a short video clip into an animated GIF",
      aiExposed: true,
    });
  }
}
