import { NextRequest, NextResponse } from "next/server";
import { ToolRegistry, initializeTools } from "@/lib/tools/registry";
import { logToolExecution } from "@/lib/logger";

initializeTools();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId } = await params;
  const startTime = Date.now();

  try {
    const tool = ToolRegistry.getExecutor(toolId);

    if (!tool) {
      return NextResponse.json(
        { error: "TOOL_NOT_FOUND", message: `Tool '${toolId}' not found.` },
        { status: 404 }
      );
    }

    let outputStream: ReadableStream;
    let metadata: Record<string, unknown>;
    let fileSizeMb = 0;

    if (tool.type === "batch") {
      const formData = await req.formData();

      for (const value of formData.values()) {
        if (value instanceof File) {
          fileSizeMb += value.size / (1024 * 1024);
        }
      }

      const optionsJson =
        (formData.get("options") as string) ||
        req.nextUrl.searchParams.get("options");
      const rawOptions = optionsJson ? JSON.parse(optionsJson) : {};
      const validatedOptions = await tool.validate(rawOptions);

      const result = await tool.process(formData, validatedOptions);
      outputStream = result.outputStream;
      metadata = result.metadata;
    } else {
      const contentLength = req.headers.get("content-length");
      fileSizeMb = contentLength ? parseInt(contentLength) / (1024 * 1024) : 1;

      const optionsJson = req.nextUrl.searchParams.get("options");
      const rawOptions = optionsJson ? JSON.parse(optionsJson) : {};
      const validatedOptions = await tool.validate(rawOptions);

      if (!req.body) {
        throw new Error("No file stream provided");
      }

      const result = await tool.process(req.body, validatedOptions);
      outputStream = result.outputStream;
      metadata = result.metadata;
    }

    const duration = Date.now() - startTime;
    logToolExecution(toolId, duration, true);

    const toolMeta = ToolRegistry.getMetadata(toolId);

    const contentTypeFromMetadata =
      typeof metadata.mimeType === "string" && metadata.mimeType.length > 0
        ? (metadata.mimeType as string)
        : undefined;

    const headers: Record<string, string> = {
      "Content-Type":
        contentTypeFromMetadata ||
        (toolMeta?.category === "pdf"
          ? "application/pdf"
          : "application/octet-stream"),
      "X-Tool-Metadata": JSON.stringify(metadata),
      "X-Estimated-Duration": tool
        .getEstimatedDuration(fileSizeMb)
        .toString(),
      "X-Content-Type-Options": "nosniff",
    };

    const fileName =
      typeof metadata.fileName === "string" ? metadata.fileName : undefined;

    if (fileName) {
      headers["Content-Disposition"] = `attachment; filename="${fileName}"`;
    }

    return new Response(outputStream, {
      headers,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    logToolExecution(toolId, duration, false, message);

    console.error(`Tool execution failed [${toolId}]:`, error);

    return NextResponse.json(
      {
        error: "PROCESSING_FAILED",
        message: message || "An unexpected error occurred during processing.",
        retryable: true,
      },
      { status: 500 }
    );
  }
}
