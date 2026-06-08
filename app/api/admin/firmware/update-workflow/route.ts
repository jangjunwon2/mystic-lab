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

// "arduino-cli core install esp32:esp32" 한 줄을 재시도 루프로 교체
function patchWorkflow(content: string): string {
  const ORIGINAL = "          arduino-cli core install esp32:esp32";
  const PATCHED = [
    "          for i in 1 2 3; do",
    "            arduino-cli core install esp32:esp32 && break",
    "            echo \"툴체인 다운로드 실패 (시도 ${i}/3), 20초 후 재시도...\"",
    "            sleep 20",
    "          done",
  ].join("\n");

  if (!content.includes(ORIGINAL)) {
    throw new Error("패치 대상 라인을 찾을 수 없습니다. 이미 패치되었거나 워크플로우가 변경되었습니다.");
  }
  return content.replace(ORIGINAL, PATCHED);
}

// POST: 워크플로우에 재시도 로직 패치 후 푸시
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  // 현재 파일 내용 + SHA 조회
  let currentSha: string;
  let currentContent: string;
  try {
    const file = await gh(`/repos/${OWNER}/${REPO}/contents/${WORKFLOW_PATH}`);
    currentSha = file.sha;
    currentContent = Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf-8");
  } catch (e) {
    return NextResponse.json({ error: `워크플로우 조회 실패: ${e}` }, { status: 500 });
  }

  // 이미 패치됐는지 확인
  if (currentContent.includes("for i in 1 2 3")) {
    return NextResponse.json({ ok: true, skipped: true, reason: "이미 재시도 로직이 적용되어 있습니다." });
  }

  // 패치 적용
  let patched: string;
  try {
    patched = patchWorkflow(currentContent);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }

  // 패치된 파일 푸시
  try {
    const result = await gh(`/repos/${OWNER}/${REPO}/contents/${WORKFLOW_PATH}`, {
      method: "PUT",
      body: JSON.stringify({
        message: "[admin] workflow: esp32 설치 재시도 로직 추가 (504 타임아웃 대응)",
        content: Buffer.from(patched).toString("base64"),
        sha: currentSha,
        branch: BRANCH,
      }),
    });

    return NextResponse.json({ ok: true, commit: result.commit.sha.slice(0, 8) });
  } catch (e) {
    return NextResponse.json({ error: `워크플로우 업데이트 실패: ${e}` }, { status: 500 });
  }
}
