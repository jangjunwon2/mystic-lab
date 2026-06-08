import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const OWNER         = "jangjunwon2";
const REPO          = "nexus-firmware";
const BRANCH        = "main";
const WORKFLOW_PATH = ".github/workflows/firmware-deploy.yml";

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

// esp32 core 설치 라인을 단순 설치(핀·재시도 제거)로 교체
// for i in ... done 블록 또는 @버전핀 모두 처리
function patchWorkflow(content: string): string {
  // 패턴 1: retry 루프 전체 → 단순 설치
  const retryPattern = /[ \t]+for i in \d \d \d; do\n.*arduino-cli core install esp32:esp32.*\n.*echo.*\n.*sleep.*\n[ \t]+done/;
  if (retryPattern.test(content)) {
    const indent = content.match(/([ \t]+)for i in \d \d \d; do/)![1];
    return content.replace(retryPattern, `${indent}arduino-cli core install esp32:esp32`);
  }

  // 패턴 2: 버전 핀만 있는 경우 (@2.0.17 등) → 핀 제거
  const pinPattern = /arduino-cli core install esp32:esp32@[^\s\n]+/g;
  if (pinPattern.test(content)) {
    return content.replace(/arduino-cli core install esp32:esp32@[^\s\n]+/g,
      "arduino-cli core install esp32:esp32");
  }

  throw new Error("패치 대상을 찾을 수 없습니다. 이미 수정되었거나 워크플로우 구조가 변경되었습니다.");
}

// GET: 현재 워크플로우 내용 반환 (디버깅용)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  try {
    const file = await gh(`/repos/${OWNER}/${REPO}/contents/${WORKFLOW_PATH}`);
    const content = Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf-8");
    return NextResponse.json({ content, sha: file.sha });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST: Tree API로 워크플로우 패치 (workflow 스코프 없이 repo 스코프만으로 시도)
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  // 현재 파일 내용 조회
  let currentContent: string;
  try {
    const file = await gh(`/repos/${OWNER}/${REPO}/contents/${WORKFLOW_PATH}`);
    currentContent = Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf-8");
  } catch (e) {
    return NextResponse.json({ error: `워크플로우 조회 실패: ${e}` }, { status: 500 });
  }

  // 이미 단순 형태인지 확인
  const alreadySimple =
    !currentContent.includes("for i in") &&
    !(/arduino-cli core install esp32:esp32@/.test(currentContent));
  if (alreadySimple) {
    return NextResponse.json({ ok: true, skipped: true, reason: "이미 단순 설치 형태입니다." });
  }

  // 패치 적용
  let patched: string;
  try {
    patched = patchWorkflow(currentContent);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }

  // Tree API로 커밋 (workflow 스코프 없이 시도)
  try {
    const refData    = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const latestSha  = refData.object.sha;
    const commitData = await gh(`/repos/${OWNER}/${REPO}/git/commits/${latestSha}`);
    const baseTree   = commitData.tree.sha;

    const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: Buffer.from(patched).toString("base64"), encoding: "base64" }),
    });

    const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTree,
        tree: [{ path: WORKFLOW_PATH, mode: "100644", type: "blob", sha: blob.sha }],
      }),
    });

    const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: "[admin] workflow: esp32 설치 단순화 — 재시도 루프·버전 핀 제거",
        tree: newTree.sha,
        parents: [latestSha],
      }),
    });

    await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return NextResponse.json({ ok: true, commit: newCommit.sha.slice(0, 8) });
  } catch (e) {
    return NextResponse.json({ error: `워크플로우 업데이트 실패: ${e}` }, { status: 500 });
  }
}
