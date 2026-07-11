import Anthropic from "@anthropic-ai/sdk";

const LOCALES = ["en", "ja", "zh-CN", "es", "fr", "de"] as const;
type Locale = (typeof LOCALES)[number];

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}

function extractJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]) as T; }
  catch { return null; }
}

async function callLlm(prompt: string, maxTokens: number): Promise<string> {
  const client = getClient();
  if (!client) return "";
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content[0].type === "text" ? msg.content[0].text : "";
}

// 공지(announcement) — message 단일 필드 번역
export async function translateAnnouncement(koMessage: string): Promise<Record<Locale, string>> {
  if (!koMessage.trim()) return {} as Record<Locale, string>;
  const safeMessage = koMessage.replace(/\n/g, "\\n");
  const prompt = `Translate the following Korean announcement banner text into these 6 languages: English, Japanese, Simplified Chinese, Spanish, French, German.

Korean: ${safeMessage}

Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "en": "...",
  "ja": "...",
  "zh-CN": "...",
  "es": "...",
  "fr": "...",
  "de": "..."
}

IMPORTANT: The \\n in the text represents a line break. Preserve them in the exact same positions in every translation.
Keep the tone concise and punchy — it's a site banner. Preserve any coupon codes or special formatting.`;

  try {
    const text = await callLlm(prompt, 2048);
    return extractJson<Record<Locale, string>>(text) ?? ({} as Record<Locale, string>);
  } catch {
    return {} as Record<Locale, string>;
  }
}

// 해법영상 챕터 설명 — message 단일 필드 번역
export async function translateVideoChapter(koDescription: string): Promise<Record<Locale, string>> {
  if (!koDescription.trim()) return {} as Record<Locale, string>;
  const prompt = `Translate the following Korean magic tutorial video chapter description into these 6 languages: English, Japanese, Simplified Chinese, Spanish, French, German.

Korean: ${koDescription}

Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "en": "...",
  "ja": "...",
  "zh-CN": "...",
  "es": "...",
  "fr": "...",
  "de": "..."
}

Keep it short and clear — it's a clickable chapter label shown next to a timestamp.`;

  try {
    const text = await callLlm(prompt, 2048);
    return extractJson<Record<Locale, string>>(text) ?? ({} as Record<Locale, string>);
  } catch {
    return {} as Record<Locale, string>;
  }
}

interface PromoFields { title: string; subtitle?: string | null; description?: string | null }
type PromoTranslations = Record<Locale, PromoFields>;

// 프로모 페이지 — title·subtitle·description 다중 필드 번역
export async function translatePromoPage(ko: PromoFields): Promise<PromoTranslations> {
  if (!ko.title.trim()) return {} as PromoTranslations;
  const safe = (s?: string | null) => (s ?? "").replace(/\n/g, "\\n");
  const prompt = `Translate the following Korean promotional landing page content into 6 languages: English, Japanese, Simplified Chinese, Spanish, French, German.

Korean content:
- Title: ${safe(ko.title)}
- Subtitle: ${safe(ko.subtitle) || "(empty)"}
- Description: ${safe(ko.description) || "(empty)"}

Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "en": { "title": "...", "subtitle": "...", "description": "..." },
  "ja": { "title": "...", "subtitle": "...", "description": "..." },
  "zh-CN": { "title": "...", "subtitle": "...", "description": "..." },
  "es": { "title": "...", "subtitle": "...", "description": "..." },
  "fr": { "title": "...", "subtitle": "...", "description": "..." },
  "de": { "title": "...", "subtitle": "...", "description": "..." }
}

IMPORTANT: The \\n in the text represents a line break. Preserve them in the exact same positions in every translation.
For empty fields, return an empty string "". Maintain professional, exciting marketing tone. Keep titles concise.`;

  try {
    const text = await callLlm(prompt, 4096);
    return extractJson<PromoTranslations>(text) ?? ({} as PromoTranslations);
  } catch {
    return {} as PromoTranslations;
  }
}
