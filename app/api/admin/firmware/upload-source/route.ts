import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { unzipSync } from "fflate";

const OWNER = "jangjunwon2";
const REPO  = "nexus-firmware";
const BRANCH = "main";

async function gh(path: string, options?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_PAT}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("zip") as File | null;
  const deviceType = (formData.get("device_type") as string)?.trim();

  if (!file || !deviceType) {
    return NextResponse.json({ error: "zip 파일과 장치 타입 필수" }, { status: 400 });
  }

  // zip 압축 해제
  const buffer = Buffer.from(await file.arrayBuffer());
  let unzipped: ReturnType<typeof unzipSync>;
  try {
    unzipped = unzipSync(new Uint8Array(buffer));
  } catch {
    return NextResponse.json({ error: "zip 파일 압축 해제 실패" }, { status: 400 });
  }

  // 파일 경로 정리: 최상위 폴더 prefix 제거
  const allPaths = Object.keys(unzipped);
  const firstSlash = allPaths[0]?.indexOf("/") ?? -1;
  const prefix = firstSlash > 0 && allPaths.every(p => p.startsWith(allPaths[0].slice(0, firstSlash + 1)))
    ? allPaths[0].slice(0, firstSlash + 1)
    : "";

  // 소스 파일만 추출 (.ino .h .cpp .c .hpp)
  const sourceFiles: Record<string, string> = {};
  for (const [path, data] of Object.entries(unzipped)) {
    const rel = prefix ? path.replace(prefix, "") : path;
    if (!rel || rel.endsWith("/")) continue;
    if (!/\.(ino|h|cpp|c|hpp)$/i.test(rel)) continue;
    sourceFiles[`${deviceType}/${rel}`] = Buffer.from(data).toString("base64");
  }

  if (Object.keys(sourceFiles).length === 0) {
    return NextResponse.json({ error: "zip 안에 소스 파일(.ino .h .cpp .c)이 없습니다" }, { status: 400 });
  }

  // GitHub Tree API — 단일 커밋으로 모든 파일 업로드
  const refData  = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const latestSha = refData.object.sha;

  const commitData = await gh(`/repos/${OWNER}/${REPO}/git/commits/${latestSha}`);
  const baseTree   = commitData.tree.sha;

  // 파일별 blob 생성
  const treeItems = await Promise.all(
    Object.entries(sourceFiles).map(async ([path, content]) => {
      const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "base64" }),
      });
      return { path, mode: "100644", type: "blob", sha: blob.sha };
    })
  );

  const newTree   = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTree, tree: treeItems }),
  });

  const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `[admin] ${deviceType} 소스 업로드 (파일 ${Object.keys(sourceFiles).length}개)`,
      tree: newTree.sha,
      parents: [latestSha],
    }),
  });

  await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return NextResponse.json({
    ok: true,
    commit: newCommit.sha.slice(0, 8),
    files: Object.keys(sourceFiles).length,
  });
}
