import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const OWNER = "jangjunwon2";
const REPO  = "nexus-firmware";

async function gh(path: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_PAT}`,
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function decodeBase64(b64: string) {
  return Buffer.from(b64.replace(/\s/g, ""), "base64").toString("utf-8").trim();
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  // 루트 디렉토리 목록
  const rootContents: Array<{ name: string; type: string; sha: string }> =
    await gh(`/repos/${OWNER}/${REPO}/contents/`);

  const dirs = rootContents.filter(
    (f) => f.type === "dir" && !f.name.startsWith(".")
  );

  const results = await Promise.allSettled(
    dirs.map(async (dir) => {
      // version.txt 읽기
      const versionFile = await gh(
        `/repos/${OWNER}/${REPO}/contents/${dir.name}/version.txt`
      );
      const version = decodeBase64(versionFile.content);

      // .build 타임스탬프 읽기 (없으면 null)
      let uploadedAt: string | null = null;
      try {
        const buildFile = await gh(
          `/repos/${OWNER}/${REPO}/contents/${dir.name}/.build`
        );
        uploadedAt = decodeBase64(buildFile.content);
      } catch {
        // .build 없으면 무시
      }

      return { name: dir.name, version, uploadedAt };
    })
  );

  const devices = results
    .filter((r): r is PromiseFulfilledResult<{ name: string; version: string; uploadedAt: string | null }> =>
      r.status === "fulfilled"
    )
    .map((r) => r.value)
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json(devices);
}
