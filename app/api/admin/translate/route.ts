import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

import Anthropic from "@anthropic-ai/sdk";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "zh-CN", name: "Simplified Chinese" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
];

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const body = await request.json() as {
    name: string;
    short_description: string;
    description: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are a professional translator specializing in magic product descriptions for an international magic shop.

Translate the following Korean product information into these languages: ${LANGUAGES.map((l) => l.name).join(", ")}.

Korean input:
- Name: ${body.name}
- Short Description: ${body.short_description || "(empty)"}
- Full Description: ${body.description || "(empty)"}

Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "en": { "name": "...", "short_description": "...", "description": "..." },
  "ja": { "name": "...", "short_description": "...", "description": "..." },
  "zh-CN": { "name": "...", "short_description": "...", "description": "..." },
  "es": { "name": "...", "short_description": "...", "description": "..." },
  "fr": { "name": "...", "short_description": "...", "description": "..." },
  "de": { "name": "...", "short_description": "...", "description": "..." }
}

Maintain the professional, mystical tone appropriate for premium magic products. Keep names concise and impactful.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Translation failed — invalid response" }, { status: 500 });
  }

  let translations: Record<string, { name: string; short_description: string; description: string }>;
  try {
    translations = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: "Translation failed — response was too long or malformed" }, { status: 500 });
  }
  return NextResponse.json({ translations });
}
