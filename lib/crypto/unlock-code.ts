import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// 인증 코드 평문(code_plain) 저장용 대칭 암호화 (AES-256-GCM).
// 인증 자체는 code_hash(SHA-256)로 동작하므로 code_plain은 어드민/회원 재확인 표시용일 뿐.
// DB 단독 유출 시 사용 가능한 코드가 노출되는 위험을 줄인다.
// 키: UNLOCK_CODE_SECRET > SUPABASE_SERVICE_ROLE_KEY > 폴백. (DB에 없는 값에서 파생)

function getKey(): Buffer {
  const secret =
    process.env.UNLOCK_CODE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "ml-unlock-fallback-key";
  return createHash("sha256").update(secret).digest(); // 32 bytes
}

// 평문 → "enc:iv:tag:ciphertext" (각 base64). 실패 시 평문 그대로 반환(가용성 우선).
export function encryptCode(plain: string): string {
  try {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
    const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
  } catch {
    return plain;
  }
}

// 저장값 → 평문. 레거시 평문("enc:" 미접두)은 그대로, 복호화 실패는 null.
export function decryptCode(stored: string | null): string | null {
  if (!stored) return stored;
  if (!stored.startsWith("enc:")) return stored;
  try {
    const [, ivB, tagB, dataB] = stored.split(":");
    const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB, "base64"));
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}
