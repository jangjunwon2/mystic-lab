import Anthropic from "@anthropic-ai/sdk";

const LOCALES = ["en", "ja", "zh-CN", "es", "fr", "de"] as const;
type Locale = (typeof LOCALES)[number];

// 공지(announcement) — message 단일 필드 번역
export async function translateAnnouncement(koMessage: string): Promise<Record<Locale, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !koMessage.trim()) return {} as Record<Locale, string>;

  const client = new Anthropic({ apiKey });
  const prompt = `Translate the following Korean announcement banner text into these 6 languages: English, Japanese, Simplified Chinese, Spanish, French, German.

Korean: ${koMessage}

Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "en": "...",
  "ja": "...",
  "zh-CN": "...",
  "es": "...",
  "fr": "...",
  "de": "..."
}

Keep the tone concise and punchy — it's a site banner. Preserve any coupon codes or special formatting.`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {} as Record<Locale, string>;
    return JSON.parse(match[0]) as Record<Locale, string>;
  } catch {
    return {} as Record<Locale, string>;
  }
}

interface PromoFields { title: string; subtitle?: string | null; description?: string | null }
type PromoTranslations = Record<Locale, PromoFields>;

// 프로모 페이지 — title·subtitle·description 다중 필드 번역
export async function translatePromoPage(ko: PromoFields): Promise<PromoTranslations> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !ko.title.trim()) return {} as PromoTranslations;

  const client = new Anthropic({ apiKey });
  const prompt = `Translate the following Korean promotional landing page content into 6 languages: English, Japanese, Simplified Chinese, Spanish, French, German.

Korean content:
- Title: ${ko.title}
- Subtitle: ${ko.subtitle || "(empty)"}
- Description: ${ko.description || "(empty)"}

Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "en": { "title": "...", "subtitle": "...", "description": "..." },
  "ja": { "title": "...", "subtitle": "...", "description": "..." },
  "zh-CN": { "title": "...", "subtitle": "...", "description": "..." },
  "es": { "title": "...", "subtitle": "...", "description": "..." },
  "fr": { "title": "...", "subtitle": "...", "description": "..." },
  "de": { "title": "...", "subtitle": "...", "description": "..." }
}

For empty fields, return an empty string "". Maintain professional, exciting marketing tone. Keep titles concise.`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {} as PromoTranslations;
    return JSON.parse(match[0]) as PromoTranslations;
  } catch {
    return {} as PromoTranslations;
  }
}
