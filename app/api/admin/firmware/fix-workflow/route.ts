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

// actions/checkout 다음에 캐시 스텝 삽입 (없을 경우에만)
function addCachingIfMissing(content: string): { patched: string; added: boolean } {
  if (content.includes("actions/cache@")) {
    return { patched: content, added: false };
  }

  const checkoutPattern = /( *- uses: actions\/checkout@[^\n]*\n)/;
  if (!checkoutPattern.test(content)) {
    throw new Error("actions/checkout 스텝을 찾을 수 없습니다.");
  }

  const indentMatch = content.match(/( *)- uses: actions\/checkout@/);
  const stepIndent = indentMatch ? indentMatch[1] : "      ";

  const cacheStep = [
    `${stepIndent}- name: Cache Arduino packages`,
    `${stepIndent}  uses: actions/cache@v4`,
    `${stepIndent}  with:`,
    `${stepIndent}    path: |`,
    `${stepIndent}      ~/.arduino15`,
    `${stepIndent}      ~/bin/arduino-cli`,
    `${stepIndent}    key: arduino-cli-esp32-\${{ runner.os }}-v1`,
    `${stepIndent}    restore-keys: |`,
    `${stepIndent}      arduino-cli-esp32-\${{ runner.os }}-`,
    ``,
  ].join("\n");

  const patched = content.replace(checkoutPattern, `$1${cacheStep}`);
  return { patched, added: true };
}

// timeout-minutes 추가 또는 60분 미만이면 업데이트
function addTimeoutIfNeeded(content: string): { patched: string; updated: boolean } {
  const existing = content.match(/timeout-minutes:\s*(\d+)/);
  if (existing) {
    const current = parseInt(existing[1], 10);
    if (current >= 60) return { patched: content, updated: false };
    return {
      patched: content.replace(/timeout-minutes:\s*\d+/, "timeout-minutes: 60"),
      updated: true,
    };
  }

  const runsOnPattern = /( *runs-on: [^\n]*\n)/;
  if (!runsOnPattern.test(content)) {
    throw new Error("runs-on 항목을 찾을 수 없습니다.");
  }

  const indentMatch = content.match(/( *)runs-on:/);
  const indent = indentMatch ? indentMatch[1] : "    ";
  const patched = content.replace(runsOnPattern, `$1${indent}timeout-minutes: 60\n`);
  return { patched, updated: true };
}

// GET: 현재 워크플로우 상태 반환
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  try {
    const file = await gh(`/repos/${OWNER}/${REPO}/contents/${WORKFLOW_PATH}`);
    const content = Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf-8");

    const hasCache = content.includes("actions/cache@");
    const timeoutMatch = content.match(/timeout-minutes:\s*(\d+)/);
    const timeoutValue = timeoutMatch ? parseInt(timeoutMatch[1], 10) : null;

    return NextResponse.json({
      hasCache,
      timeoutMinutes: timeoutValue,
      needsOptimization: !hasCache || !timeoutValue || timeoutValue < 60,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST: 캐시 추가 + 타임아웃 설정 패치 적용
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  let currentContent: string;
  try {
    const file = await gh(`/repos/${OWNER}/${REPO}/contents/${WORKFLOW_PATH}`);
    currentContent = Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf-8");
  } catch (e) {
    return NextResponse.json({ error: `워크플로우 조회 실패: ${e}` }, { status: 500 });
  }

  let patched = currentContent;
  const changes: string[] = [];

  try {
    const cacheResult = addCachingIfMissing(patched);
    if (cacheResult.added) {
      patched = cacheResult.patched;
      changes.push("Arduino 패키지 캐시 스텝 추가");
    }
  } catch (e) {
    return NextResponse.json({ error: `캐시 패치 실패: ${e}` }, { status: 400 });
  }

  try {
    const timeoutResult = addTimeoutIfNeeded(patched);
    if (timeoutResult.updated) {
      patched = timeoutResult.patched;
      changes.push("빌드 타임아웃 60분으로 설정");
    }
  } catch (e) {
    return NextResponse.json({ error: `타임아웃 패치 실패: ${e}` }, { status: 400 });
  }

  if (changes.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: "이미 최적화되어 있습니다." });
  }

  try {
    const refData    = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const latestSha  = refData.object.sha;
    const commitData = await gh(`/repos/${OWNER}/${REPO}/git/commits/${latestSha}`);
    const baseTree   = commitData.tree.sha;

    const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: Buffer.from(patched).toString("base64"),
        encoding: "base64",
      }),
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
        message: `[admin] workflow: 빌드 최적화 — ${changes.join(", ")}`,
        tree: newTree.sha,
        parents: [latestSha],
      }),
    });

    await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return NextResponse.json({ ok: true, commit: newCommit.sha.slice(0, 8), changes });
  } catch (e) {
    return NextResponse.json({ error: `워크플로우 업데이트 실패: ${e}` }, { status: 500 });
  }
}
