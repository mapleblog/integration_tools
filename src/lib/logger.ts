import { Logger } from 'next-axiom';

export const logToolExecution = (toolId: string, duration: number, success: boolean, error?: string) => {
  const logger = new Logger();
  const logData = {
    tool: toolId,
    durationMs: duration,
    status: success ? "SUCCESS" : "FAILED",
    timestamp: new Date().toISOString(),
    ...(error && { error }),
  };
  
  if (success) {
    logger.info("Tool Execution Report", logData);
  } else {
    logger.error("Tool Execution Failed", logData);
  }
  
  // Ensure logs are flushed to Axiom
  logger.flush();
};
