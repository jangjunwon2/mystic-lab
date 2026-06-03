import { createSign } from "crypto";

export function isStreamConfigured(): boolean {
  return !!(
    process.env.CLOUDFLARE_STREAM_KEY_ID &&
    process.env.CLOUDFLARE_STREAM_PRIVATE_KEY
  );
}

export function isUploadConfigured(): boolean {
  return !!(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_STREAM_TOKEN
  );
}

/**
 * Generates a Cloudflare Stream signed playback token (RS256 JWT).
 * Falls back to unsigned direct-embed URL when keys are not configured (dev/mock mode).
 */
export async function generateSignedUrl(
  streamId: string,
  expirySeconds = 3600
): Promise<string> {
  // 임베드 코드/플레이어 URL을 직접 넣은 경우 — 전체 URL을 그대로 사용 (파라미터 보존)
  if (streamId.startsWith("vimeoembed:")) {
    return streamId.slice("vimeoembed:".length);
  }
  // 외부 플랫폼(Vimeo / YouTube)은 서명 없이 임베드 URL로 변환
  if (streamId.startsWith("vimeo:")) {
    // 형식: "vimeo:ID" 또는 "vimeo:ID:HASH" (비공개/링크 전용 영상의 개인정보 해시)
    const rest = streamId.slice("vimeo:".length);
    const [id, hash] = rest.split(":");
    return hash
      ? `https://player.vimeo.com/video/${id}?h=${hash}`
      : `https://player.vimeo.com/video/${id}`;
  }
  if (streamId.startsWith("yt:")) {
    return `https://www.youtube.com/embed/${streamId.slice("yt:".length)}`;
  }

  const keyId = process.env.CLOUDFLARE_STREAM_KEY_ID;
  const rawPem = process.env.CLOUDFLARE_STREAM_PRIVATE_KEY;

  // Mock / development mode — no signing keys present
  if (!keyId || !rawPem) {
    return `https://iframe.cloudflarestream.com/${streamId}`;
  }

  try {
    // .env stores newlines as literal \n — restore them
    const pem = rawPem.includes("\\n") ? rawPem.replace(/\\n/g, "\n") : rawPem;

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", kid: keyId };
    const payload = { sub: streamId, kid: keyId, exp: now + expirySeconds };

    const b64url = (obj: object) =>
      Buffer.from(JSON.stringify(obj))
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const signingInput = `${b64url(header)}.${b64url(payload)}`;
    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    const signature = signer.sign(pem, "base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const token = `${signingInput}.${signature}`;
    return `https://iframe.cloudflarestream.com/${token}`;
  } catch {
    // Signing failed (bad key format etc.) — fall back to unsigned
    return `https://iframe.cloudflarestream.com/${streamId}`;
  }
}

/**
 * Creates a one-time direct upload URL via the Cloudflare Stream API.
 * Returns null when not configured (mock mode).
 */
export async function createDirectUploadUrl(maxDurationSeconds = 3600): Promise<{
  uploadUrl: string;
  streamId: string;
} | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_TOKEN;

  if (!accountId || !token) return null;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxDurationSeconds }),
    }
  );

  if (!res.ok) return null;

  const json = await res.json();
  const result = json.result;
  if (!result?.uploadURL || !result?.uid) return null;

  return { uploadUrl: result.uploadURL, streamId: result.uid };
}
