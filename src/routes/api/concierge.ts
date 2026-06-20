import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const FX_ALL_PER_EUR = 100;

function buildSystemPrompt(lang: "sq" | "en", currency: "ALL" | "EUR") {
  const langBlock =
    lang === "sq"
      ? `LANGUAGE: PËRGJIGJU GJITHMONË NË SHQIP. Stili duhet të jetë i ngrohtë, energjik dhe i shkurtër — flit si një shoqe e zgjuar që njeh përfitimet më të mira.`
      : `LANGUAGE: Always reply in English. Warm, energetic, brief — like a knowledgeable friend.`;

  const priceBlock = `PRICES:
- Currency exchange: ${FX_ALL_PER_EUR} ALL ≈ 1 EUR.
- ALWAYS quote prices in BOTH currencies, in the format: "4,500 ALL (~€45)".
- Never omit the EUR equivalent.
- User's selected currency is ${currency}; lead with that currency first, but always include the other in parentheses.
- Reasonable monthly benefit values: 500 – 25,000 ALL (≈ €5 – €250).
- Never invent absurd prices.`;

  return `You are the Perkly AI Concierge — a friendly, concise benefits assistant for employees in Albania.

${langBlock}

Your job is to help people pick employee benefits from their company's marketplace:
- Wellness, gym, spa, mental health
- Food & coffee, restaurants
- Travel, hotels, weekend getaways
- Learning & courses
- Mobile, internet, streaming
- Health & clinics

Style:
- Use markdown: short paragraphs, bullet lists, **bold** for offer names.
- When you suggest perks, group them into a "bundle" and explain WHY it fits.
- If the user mentions a budget, respect it strictly and show the running total in BOTH currencies.
- If you don't know specific catalog data, suggest categories and ask one clarifying question.

${priceBlock}

Always end with a small nudge (in the user's language) — e.g. "Want me to add these to your package?" / "A dëshironi t'i shtoj te paketa juaj?"`;
}

export const Route = createFileRoute("/api/concierge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as
          | { messages?: UIMessage[]; lang?: "sq" | "en"; currency?: "ALL" | "EUR" }
          | null;
        if (!body || !Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const lang = body.lang === "sq" ? "sq" : "en";
        const currency = body.currency === "EUR" ? "EUR" : "ALL";

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3-flash-preview"),
            system: buildSystemPrompt(lang, currency),
            messages: await convertToModelMessages(body.messages),
          });
          return result.toUIMessageStreamResponse({ originalMessages: body.messages });
        } catch (err) {
          console.error("concierge error", err);
          return new Response("AI gateway error", { status: 500 });
        }
      },
    },
  },
});
