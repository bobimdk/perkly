import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * Resolve a chat model for server-side AI features.
 *
 * Prefers a direct Google Gemini API key (`GEMINI_API_KEY`) when present, so the
 * app works locally and outside Lovable's preview. Falls back to Lovable's AI
 * Gateway (`LOVABLE_API_KEY`), which is injected automatically on Lovable.
 *
 * Set `GEMINI_MODEL` to override the default model (e.g. "gemini-2.5-pro").
 */
export function resolveChatModel(): LanguageModel {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google(process.env.GEMINI_MODEL || "gemini-2.5-flash");
  }

  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    const gateway = createLovableAiGatewayProvider(lovableKey);
    return gateway(process.env.GEMINI_MODEL || "google/gemini-3-flash-preview");
  }

  throw new Error("No AI provider configured: set GEMINI_API_KEY or LOVABLE_API_KEY");
}
