# Role: Senior Backend Architect & Vibe Code Specialist

# Context:
You are building the "Engine Room" for VersaTools. We need a modular, stream-based backend architecture in Next.js 14+ that handles file processing (PDF merging, Image compression, AI background removal). 

# Constraints & Logic:
1. **The Registry Pattern**:
   - Create a `BaseToolExecutor` abstract class in `src/lib/tools/base-executor.ts`.
   - Each tool must implement `validate(input)`, `process(stream)`, and `estimateDuration()`.
   - Use a `ToolRegistry` to map `toolId` to its specific executor.
2. **Streaming & Memory**:
   - Process files using Node.js/Web Streams to keep memory usage under 30MB for Vercel Serverless Functions.
   - Use `Zod` for strict input validation.
3. **Hybrid Execution**:
   - Use **Route Handlers (API Routes)** for file-heavy processing to support better streaming and error handling.
   - Use **Server Actions** for metadata updates and status polling.
4. **Resilience & Cleanup**:
   - Implement an `asynchronous retry logic` for 3rd-party APIs (like Remove.bg).
   - Use a `try-catch-finally` block to ensure `temp` files or buffers are cleared immediately after processing.
5. **Vibe & Perception**:
   - The backend must return an `estimatedDuration` based on file size so the frontend can show a realistic progress bar.
   - Integrate `Axiom` or a structured `Pino` logger for high-visibility production logs.

# Task:
1. Define the `ToolInterface` and `BaseToolExecutor`.
2. Implement a global `Route Handler` at `app/api/tools/[toolId]/route.ts` that acts as the unified entry point.
3. Set up the `Zod` schemas for tool inputs.
4. Create a "Logger" utility that tracks success rates and execution times.

# Output:
Provide the TypeScript architecture, the unified API route logic, and the error-handling wrapper.
2. Backend Engine ArchitectureTo ensure the "Zero-Friction" philosophy, the backend is designed as a Universal Tool Wrapper.2.1 The Execution FlowThe following table describes how a request travels through the backend:StageLogicComponent1. IngressAuthentication check & IP Rate Limitingmiddleware.ts2. ValidationPayload structure & File size check (30MB)Zod + ToolRegistry3. Stream StartFetch file from Supabase Storage as a StreamSupabase Client4. ProcessingTool-specific logic (e.g., Sharp/PDF-Lib)ToolExecutor5. EgressUpload result & Update DB status to COMPLETEDPrisma + Server Actions6. CleanupRelease memory & Delete local tmp buffersfinally block3. Core Implementation Snippets3.1 The Base Tool Executor (src/lib/tools/base-executor.ts)This ensures every tool you add follows the same professional contract.TypeScriptimport { z } from "zod";

export abstract class BaseToolExecutor<TInput, TOutput> {
  abstract readonly toolId: string;
  
  // Zod schema for input validation
  abstract readonly inputSchema: z.ZodSchema<TInput>;

  // Estimated seconds per MB
  protected abstract readonly processingRate: number; 

  async validate(data: unknown): Promise<TInput> {
    return this.inputSchema.parse(data);
  }

  // Abstract process method using Streams
  abstract process(
    inputStream: ReadableStream, 
    options: TInput
  ): Promise<{ outputStream: ReadableStream; metadata: any }>;

  getEstimatedDuration(fileSizeInMb: number): number {
    return Math.max(2, fileSizeInMb * this.processingRate);
  }
}
3.2 Global Logging Utility (src/lib/logger.ts)We recommend Axiom for Next.js/Vercel to track the "Vibe" of your backend performance.TypeScriptimport { Logger } from 'next-axiom';

export const logToolExecution = (toolId: string, duration: number, success: boolean) => {
  const logger = new Logger();
  logger.info("Tool Execution Report", {
    tool: toolId,
    durationMs: duration,
    status: success ? "SUCCESS" : "FAILED",
    timestamp: new Date().toISOString(),
  });
};
4. Key "Vibe" Features for Backend4.1 "Perception" LogicTo make the UI feel responsive, the backend calculates a "smart" duration:Formula: $T = (S \times R) + L$Where $S$ is file size (MB), $R$ is the tool's processing rate, and $L$ is the network latency constant (~0.5s).This value is sent to the frontend during the PENDING state to sync the progress bar.4.2 Error Handling & ToastsThe backend will return structured JSON errors:JSON{
  "error": "PROCESSING_FAILED",
  "message": "AI background removal failed due to low contrast.",
  "retryable": true
}
The frontend will catch this and trigger a "Haptic-like" shake animation and a Toast notification.