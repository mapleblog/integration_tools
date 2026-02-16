import { BaseToolExecutor, ToolType } from "./base-executor";
import { z } from "zod";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import { existsSync } from "fs";
import { readFile, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";

let resolvedFfmpegPath: string | null = ffmpegPath || null;

if (resolvedFfmpegPath) {
  if (
    resolvedFfmpegPath.includes("/ROOT/") ||
    resolvedFfmpegPath.startsWith("/ROOT/") ||
    resolvedFfmpegPath.startsWith("\\ROOT\\")
  ) {
    const exeName = resolvedFfmpegPath.split(/[/\\]/).pop() || "ffmpeg.exe";
    const candidate = path.join(process.cwd(), "node_modules", "ffmpeg-static", exeName);
    if (existsSync(candidate)) {
      resolvedFfmpegPath = candidate;
    }
  }
}

if (resolvedFfmpegPath) {
  ffmpeg.setFfmpegPath(resolvedFfmpegPath);
}

const VideoToGifOptionsSchema = z.object({
  start: z.coerce.number().min(0).default(0),
  duration: z.coerce.number().min(0.1).max(60).default(5),
  fps: z.coerce.number().min(1).max(30).default(10),
  width: z.coerce.number().min(64).max(800).default(480),
});

type VideoToGifOptions = z.infer<typeof VideoToGifOptionsSchema>;

export class VideoToGifExecutor extends BaseToolExecutor<VideoToGifOptions> {
  readonly toolId = "video-to-gif";
  readonly type: ToolType = "batch";
  readonly inputSchema = VideoToGifOptionsSchema;
  protected readonly processingRate = 5.0;

  async process(
    input: ReadableStream | FormData,
    options: VideoToGifOptions
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }> {
    if (!(input instanceof FormData)) {
      throw new Error("Video to GIF expects FormData input");
    }

    const files: File[] = [];
    for (const [, value] of input.entries()) {
      if (value instanceof File) {
        if (value.type.startsWith("video/")) {
          files.push(value);
        }
      }
    }

    if (files.length !== 1) {
      throw new Error("Exactly 1 video file is required for conversion");
    }

    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = tmpdir();
    const ext = path.extname(file.name) || ".mp4";
    const tempInputPath = path.join(
      tempDir,
      `video-to-gif-input-${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`
    );
    const tempPalettePath = path.join(
      tempDir,
      `video-to-gif-palette-${Date.now()}-${Math.random().toString(16).slice(2)}.png`
    );
    const tempOutputPath = path.join(
      tempDir,
      `video-to-gif-${Date.now()}-${Math.random().toString(16).slice(2)}.gif`
    );

    await writeFile(tempInputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .setStartTime(options.start)
        .setDuration(options.duration)
        .videoFilters([
          `fps=${options.fps}`,
          `scale=${options.width}:-1:flags=lanczos`,
          "palettegen",
        ])
        .output(tempPalettePath)
        .on("error", (err) => {
          reject(new Error(`Failed to generate GIF palette: ${err.message}`));
        })
        .on("end", () => {
          resolve();
        })
        .run();
    });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .setStartTime(options.start)
        .setDuration(options.duration)
        .input(tempPalettePath)
        .complexFilter([
          `[0:v]fps=${options.fps},scale=${options.width}:-1:flags=lanczos[video];[video][1:v]paletteuse=dither=bayer:bayer_scale=5`,
        ])
        .outputOptions(["-loop", "0"])
        .output(tempOutputPath)
        .on("error", (err) => {
          reject(new Error(`Failed to convert video to GIF: ${err.message}`));
        })
        .on("end", () => {
          resolve();
        })
        .run();
    });

    const gifBuffer = await readFile(tempOutputPath);
    if (!gifBuffer || gifBuffer.length === 0) {
      await unlink(tempOutputPath).catch(() => {});
      await unlink(tempInputPath).catch(() => {});
      await unlink(tempPalettePath).catch(() => {});
      throw new Error("Failed to convert video to GIF: empty output from ffmpeg");
    }

    await unlink(tempOutputPath).catch(() => {});
    await unlink(tempInputPath).catch(() => {});
    await unlink(tempPalettePath).catch(() => {});

    const outputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(gifBuffer);
        controller.close();
      },
    });

    const originalName = file.name.replace(/\.[^/.]+$/, "");

    return {
      outputStream,
      metadata: {
        originalName: file.name,
        mimeType: "image/gif",
        fileName: `${originalName}.gif`,
        start: options.start,
        duration: options.duration,
        fps: options.fps,
        width: options.width,
      },
    };
  }
}
