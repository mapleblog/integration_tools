import { ToolMetadata } from "./tools/registry";

export type PlannedToolCall = {
  toolId: string;
};

export function planTool(prompt: string, tools: ToolMetadata[]): PlannedToolCall {
  if (!tools.length) {
    throw new Error("NO_TOOLS_AVAILABLE");
  }

  const lower = prompt.toLowerCase();

  const findByIdOrCategory = (id: string, category?: ToolMetadata["category"]) => {
    const byId = tools.find((tool) => tool.id === id);
    if (byId) return byId.id;
    if (category) {
      const byCategory = tools.find((tool) => tool.category === category);
      if (byCategory) return byCategory.id;
    }
    return tools[0].id;
  };

  if (lower.includes("pdf")) {
    if (lower.includes("合并") || lower.includes("merge") || lower.includes("combine")) {
      return { toolId: findByIdOrCategory("pdf-merger", "pdf") };
    }
    return { toolId: findByIdOrCategory("pdf-merger", "pdf") };
  }

  if (
    lower.includes("背景") ||
    lower.includes("抠图") ||
    lower.includes("remove background") ||
    lower.includes("background remover")
  ) {
    return { toolId: findByIdOrCategory("bg-remover", "image") };
  }

  if (
    lower.includes("水印") ||
    lower.includes("去水印") ||
    lower.includes("remove watermark") ||
    lower.includes("watermark remover")
  ) {
    return { toolId: findByIdOrCategory("watermark-remover", "image") };
  }

  if (
    lower.includes("翻译") ||
    lower.includes("translate") ||
    lower.includes("translation")
  ) {
    return { toolId: findByIdOrCategory("text-translator", "text") };
  }

  if (
    lower.includes("压缩") ||
    lower.includes("缩小") ||
    lower.includes("变小") ||
    lower.includes("compress") ||
    lower.includes("optimize")
  ) {
    if (
      lower.includes("图") ||
      lower.includes("image") ||
      lower.includes("photo") ||
      lower.includes("picture")
    ) {
      return { toolId: findByIdOrCategory("image-compressor", "image") };
    }
  }

  if (
    lower.includes("打包") ||
    lower.includes("压缩包") ||
    lower.includes("zip") ||
    lower.includes("archive")
  ) {
    return { toolId: findByIdOrCategory("file-archiver", "file") };
  }

  if (
    lower.includes("二维码") ||
    lower.includes("qr code") ||
    lower.includes("qrcode")
  ) {
    return { toolId: findByIdOrCategory("qr-generator", "image") };
  }

  const priority = [
    "pdf-merger",
    "image-compressor",
    "bg-remover",
    "file-archiver",
    "watermark-remover",
    "text-translator",
    "qr-generator",
  ];
  for (const id of priority) {
    const exists = tools.find((tool) => tool.id === id);
    if (exists) {
      return { toolId: exists.id };
    }
  }

  return { toolId: tools[0].id };
}
