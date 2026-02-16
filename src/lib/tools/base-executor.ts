import { z } from "zod";

export type ToolType = 'stream' | 'batch';

export abstract class BaseToolExecutor<TInput> {
  abstract readonly toolId: string;
  abstract readonly type: ToolType;
  
  // Zod schema for input validation
  abstract readonly inputSchema: z.ZodSchema<TInput>;

  // Estimated seconds per MB
  protected abstract readonly processingRate: number; 

  async validate(data: unknown): Promise<TInput> {
    return this.inputSchema.parse(data);
  }

  // Abstract process method
  // For 'stream', input is ReadableStream
  // For 'batch', input is FormData (containing files)
  abstract process(
    input: ReadableStream | FormData, 
    options: TInput
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }>;

  getEstimatedDuration(fileSizeInMb: number): number {
    return Math.max(2, fileSizeInMb * this.processingRate);
  }
}
