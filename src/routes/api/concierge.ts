import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are the Perkly AI Concierge — a friendly, concise benefits assistant for employees in Albania.

Your job is to help people pick employee benefits from their company's marketplace:
- Wellness, gym, spa, mental health
- Food & coffee, restaurants
- Travel, hotels, weekend getaways
- Learning & courses
- Mobile, internet, streaming
- Health & clinics

Style:
- Warm, energetic, and brief. Speak like a knowledgeable friend.
- Use markdown: short paragraphs, bullet lists, **bold** for offer names.
- Currency is Albanian Lek (ALL) by default — show prices like "4,500 ALL".
- When you suggest perks, group them into a "bundle" and explain WHY it fits.
- If the user mentions a budget, respect it strictly and show the running total.
- If you don't know specific catalog data, suggest categories and ask one clarifying question.
- Never invent prices that are absurd. Reasonable monthly benefit values: 500 – 25,000 ALL.

Always end with a small nudge: "Want me to add these to your package?" when you recommend perks.`;

export const Route = createFileRoute("/api/concierge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { messages?: UIMessage[] } | null;
        if (!body || !Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3-flash-preview"),
            system: SYSTEM_PROMPT,
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
