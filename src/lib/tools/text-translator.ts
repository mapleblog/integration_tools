import { BaseToolExecutor, ToolType } from "./base-executor";
import { z } from "zod";

const TextTranslatorOptionsSchema = z.object({
  sourceLang: z.string().default("auto"),
  targetLang: z.string().default("zh"),
  targetLang2: z.string().optional(),
});

type TextTranslatorOptions = z.infer<typeof TextTranslatorOptionsSchema>;

type TranslationResult = {
  lang: string;
  text: string;
};

export class TextTranslatorExecutor extends BaseToolExecutor<TextTranslatorOptions> {
  readonly toolId = "text-translator";
  readonly type: ToolType = "batch";
  readonly inputSchema = TextTranslatorOptionsSchema;
  protected readonly processingRate = 0.1;

  async process(
    input: ReadableStream | FormData,
    options: TextTranslatorOptions
  ): Promise<{ outputStream: ReadableStream; metadata: Record<string, unknown> }> {
    if (!(input instanceof FormData)) {
      throw new Error("Text Translator expects FormData input");
    }

    const textValue = input.get("text");

    if (typeof textValue !== "string" || !textValue.trim()) {
      throw new Error("No text provided");
    }

    const targets = Array.from(
      new Set(
        [options.targetLang, options.targetLang2].filter(
          (lang): lang is string =>
            typeof lang === "string" && lang.trim().length > 0
        )
      )
    );

    if (targets.length === 0) {
      throw new Error("No target language provided");
    }

    const results: TranslationResult[] = [];
    let usedExternal = false;
    let serviceName: string | null = null;

    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    const deepseekBaseUrl =
      process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
    const deepseekModel =
      process.env.DEEPSEEK_TRANSLATE_MODEL || "deepseek-chat";

    if (deepseekApiKey) {
      for (const targetLang of targets) {
        const system = [
          "You are a professional translation engine.",
          "Translate the user content into the target language only.",
          "Do not add explanations or quotes, respond with translated text only.",
        ].join(" ");

        const user = [
          `Source language: ${options.sourceLang || "auto"}`,
          `Target language: ${targetLang || "zh"}`,
          "Text:",
          textValue,
        ].join("\n");

        const response = await fetch(
          `${deepseekBaseUrl}/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${deepseekApiKey}`,
            },
            body: JSON.stringify({
              model: deepseekModel,
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              temperature: 0.2,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("AI translation request failed");
        }

        const data = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
        };

        const content = data.choices?.[0]?.message?.content;
        const translated =
          typeof content === "string" && content.trim().length > 0
            ? content.trim()
            : textValue;

        results.push({ lang: targetLang, text: translated });
        usedExternal = true;
        serviceName = `deepseek:${deepseekModel}`;
      }
    } else {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      const openaiModel =
        process.env.OPENAI_TRANSLATE_MODEL || "gpt-4.1-mini";

      if (openaiApiKey) {
        for (const targetLang of targets) {
          const system = [
            "You are a professional translation engine.",
            "Translate the user content into the target language only.",
            "Do not add explanations or quotes, respond with translated text only.",
          ].join(" ");

          const user = [
            `Source language: ${options.sourceLang || "auto"}`,
            `Target language: ${targetLang || "zh"}`,
            "Text:",
            textValue,
          ].join("\n");

          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiApiKey}`,
              },
              body: JSON.stringify({
                model: openaiModel,
                messages: [
                  { role: "system", content: system },
                  { role: "user", content: user },
                ],
                temperature: 0.2,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("AI translation request failed");
          }

          const data = (await response.json()) as {
            choices?: { message?: { content?: string } }[];
          };

          const content = data.choices?.[0]?.message?.content;
          const translated =
            typeof content === "string" && content.trim().length > 0
              ? content.trim()
              : textValue;

          results.push({ lang: targetLang, text: translated });
          usedExternal = true;
          serviceName = `openai:${openaiModel}`;
        }
      } else {
        const apiUrl = process.env.TRANSLATE_API_URL;
        const apiKey = process.env.TRANSLATE_API_KEY;

        if (apiUrl) {
          for (const targetLang of targets) {
            const payload = {
              q: textValue,
              source: options.sourceLang || "auto",
              target: targetLang || "zh",
              format: "text",
            };

            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            };

            if (apiKey) {
              headers.Authorization = `Bearer ${apiKey}`;
            }

            const response = await fetch(apiUrl, {
              method: "POST",
              headers,
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              throw new Error("Translation service request failed");
            }

            const data = (await response.json()) as {
              translatedText?: string;
            };

            const translated =
              typeof data.translatedText === "string" &&
              data.translatedText.length > 0
                ? data.translatedText
                : textValue;

            results.push({ lang: targetLang, text: translated });
            usedExternal = true;
            serviceName = "custom-api";
          }
        } else {
          for (const targetLang of targets) {
            results.push({ lang: targetLang, text: textValue });
          }
        }
      }
    }

    const responsePayload = JSON.stringify({
      results,
      sourceLang: options.sourceLang || "auto",
    });

    const encoder = new TextEncoder();
    const bytes = encoder.encode(responsePayload);

    const outputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });

    return {
      outputStream,
      metadata: {
        originalTextLength: textValue.length,
        translatedTextLength: results.reduce(
          (sum, item) => sum + item.text.length,
          0
        ),
        sourceLang: options.sourceLang,
        targetLangs: targets,
        mimeType: "application/json; charset=utf-8",
        fileName: "translations.json",
        usedExternalService: usedExternal,
        serviceConfigured: Boolean(serviceName),
        serviceName,
      },
    };
  }
}
