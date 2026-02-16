import { BaseToolExecutor } from "./base-executor";
import { PdfMergerExecutor } from "./pdf-merger";
import { BgRemoverExecutor } from "./bg-remover";
import { ImageCompressorExecutor } from "./image-compressor";
import { FileArchiverExecutor } from "./file-archiver";
import { WatermarkRemoverExecutor } from "./watermark-remover";
import { TextTranslatorExecutor } from "./text-translator";
import { QrGeneratorExecutor } from "./qr-generator";

type ToolCategory = "pdf" | "image" | "file" | "text";

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
      name: "PDF 合并",
      category: "pdf",
      description: "将多个 PDF 文件合并为一个文档",
      aiExposed: true,
    });

    ToolRegistry.register(new BgRemoverExecutor(), {
      name: "背景移除",
      category: "image",
      description: "移除图片背景并输出透明背景图像",
      aiExposed: true,
    });

    ToolRegistry.register(new ImageCompressorExecutor(), {
      name: "图片压缩",
      category: "image",
      description: "压缩图片体积并尽量保持画质",
      aiExposed: true,
    });

    ToolRegistry.register(new WatermarkRemoverExecutor(), {
      name: "去除水印",
      category: "image",
      description: "模糊覆盖指定区域以去除图片水印",
      aiExposed: true,
    });

    ToolRegistry.register(new FileArchiverExecutor(), {
      name: "文件打包",
      category: "file",
      description: "将多个文件打包为一个 ZIP 压缩包",
      aiExposed: true,
    });

    ToolRegistry.register(new TextTranslatorExecutor(), {
      name: "文字翻译",
      category: "text",
      description: "将文本从一种语言翻译为另一种语言",
      aiExposed: true,
    });

    ToolRegistry.register(new QrGeneratorExecutor(), {
      name: "二维码生成",
      category: "image",
      description: "将文本或链接生成二维码图片",
      aiExposed: true,
    });
  }
}
