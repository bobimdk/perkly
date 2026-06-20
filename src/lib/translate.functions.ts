import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const LANG_NAMES: Record<string, string> = {
  sq: "Albanian (shqip)",
  en: "English",
};

const memoryCache = new Map<string, string>();

type Input = { lang: string; texts: string[] };

export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const i = input as Input;
    if (!i || typeof i.lang !== "string" || !Array.isArray(i.texts)) {
      throw new Error("invalid input");
    }
    const texts = i.texts
      .filter((t) => typeof t === "string")
      .map((t) => t.slice(0, 500))
      .slice(0, 200);
    return { lang: i.lang, texts };
  })
  .handler(async ({ data }) => {
    const { lang, texts } = data;
    if (texts.length === 0) {
      return { translations: {} as Record<string, string> };
    }

    const result: Record<string, string> = {};
    const todo: string[] = [];
    for (const t of texts) {
      const key = `${lang}::${t}`;
      const hit = memoryCache.get(key);
      if (hit !== undefined) result[t] = hit;
      else todo.push(t);
    }

    if (todo.length === 0) return { translations: result };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      for (const t of todo) result[t] = t;
      return { translations: result };
    }

    const provider = createLovableAiGatewayProvider(apiKey);
    const langName = LANG_NAMES[lang] ?? lang;

    const numbered = todo.map((t, i) => `${i + 1}. ${JSON.stringify(t)}`).join("\n");

    const system = [
      `You are a professional UI translator. Auto-detect the source language of each string and translate into ${langName}.`,
      `Rules:`,
      `- If a string is already in ${langName}, return it unchanged.`,
      `- Preserve placeholders, numbers, emoji, punctuation, URLs and brand names (Perkly, Tirana, names).`,
      `- Keep the same casing style and trailing/leading whitespace.`,
      `- Return ONLY a JSON object mapping the 1-based index (as string) to the translated string. No prose, no markdown.`,
    ].join("\n");

    const user = `Translate to ${langName}. Return JSON like {"1":"...","2":"..."}.\n\n${numbered}`;

    try {
      const { text } = await generateText({
        model: provider("google/gemini-2.5-flash"),
        system,
        prompt: user,
        temperature: 0,
      });
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const json = jsonStart >= 0 ? text.slice(jsonStart, jsonEnd + 1) : "{}";
      const parsed = JSON.parse(json) as Record<string, string>;
      for (let i = 0; i < todo.length; i++) {
        const src = todo[i];
        const tr = parsed[String(i + 1)];
        const final = typeof tr === "string" && tr.length > 0 ? tr : src;
        result[src] = final;
        memoryCache.set(`${lang}::${src}`, final);
      }
    } catch (err) {
      console.error("translateBatch failed", err);
      for (const t of todo) result[t] = t;
    }

    return { translations: result };
  });
