import { NextRequest, NextResponse } from "next/server";
import { ToolRegistry, initializeTools } from "@/lib/tools/registry";
import { planTool } from "@/lib/agent-planner";

initializeTools();

export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const searchParams = url.searchParams;
  const mode = searchParams.get("mode") || (searchParams.get("toolId") ? "manual" : "auto");
  const prompt = searchParams.get("prompt") || "";
  let toolId = searchParams.get("toolId");

  if (mode === "auto") {
    if (!prompt) {
      return NextResponse.json(
        {
          error: "MISSING_PROMPT",
          message: "需要提供 prompt 查询参数用于自动选择工具。",
        },
        { status: 400 }
      );
    }

    const tools = ToolRegistry.getAiExposedTools();

    if (!tools.length) {
      return NextResponse.json(
        {
          error: "NO_TOOLS_AVAILABLE",
          message: "当前没有可供 AI 使用的工具。",
        },
        { status: 503 }
      );
    }

    const planned = planTool(prompt, tools);
    toolId = planned.toolId;
  }

  if (!toolId) {
    return NextResponse.json(
      {
        error: "MISSING_TOOL_ID",
        message: "未指定 toolId，且未启用自动规划模式。",
      },
      { status: 400 }
    );
  }

  const metadata = ToolRegistry.getMetadata(toolId);

  if (!metadata || !metadata.aiExposed) {
    return NextResponse.json(
      {
        error: "TOOL_NOT_AVAILABLE_FOR_AGENT",
        message: `Tool '${toolId}' 不对 AI 代理开放或不存在。`,
      },
      { status: 404 }
    );
  }

  const forwardUrl = new URL(`/api/tools/${toolId}`, url.origin);
  const contentType = req.headers.get("content-type") || undefined;

  const init: RequestInit = {
    method: "POST",
    headers: contentType ? { "content-type": contentType } : undefined,
    body: req.body,
  };

  const forwarded = await fetch(forwardUrl, init);

  if (!forwarded.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await forwarded.json();
    } catch {
      errorBody = null;
    }

    return NextResponse.json(
      {
        error: "TOOL_CALL_FAILED",
        status: forwarded.status,
        toolError: errorBody,
      },
      { status: 502 }
    );
  }

  const body = forwarded.body;
  const headers = new Headers();

  const contentTypeResp =
    forwarded.headers.get("content-type") || "application/octet-stream";
  headers.set("Content-Type", contentTypeResp);

  const toolMetaHeader = forwarded.headers.get("X-Tool-Metadata");
  if (toolMetaHeader) {
    headers.set("X-Tool-Metadata", toolMetaHeader);
  }

  const estimatedDurationHeader = forwarded.headers.get("X-Estimated-Duration");
  if (estimatedDurationHeader) {
    headers.set("X-Estimated-Duration", estimatedDurationHeader);
  }

  headers.set("X-Agent-Tool-Id", toolId);
  headers.set("X-Agent-Mode", mode);

  return new Response(body, {
    status: 200,
    headers,
  });
}
