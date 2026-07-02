import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getSetting, setSetting } from "@/lib/settings";
import { unzipSync } from "fflate";

const OWNER  = "jangjunwon2";
const REPO   = "nexus-firmware";
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

function isSrcFile(rel: string): boolean {
  return /\.(h|cpp|c|hpp)$/i.test(rel);
}

// config.h → config_t.h 순서로 FIRMWARE_VERSION을 찾아 "major.minor" 형식으로 반환
// #define FIRMWARE_VERSION "x.x" 및 constexpr const char* FIRMWARE_VERSION = "x.x" 두 형식 모두 지원
// 첫 번째 파일에서 버전을 못 찾으면 다음 후보 파일을 시도 (config.h에 버전 없고 config_t.h에 있는 경우 대응)
function extractVersion(
  entries: { orig: string; rel: string }[],
  unzipped: Record<string, Uint8Array>,
  device: string,
): string | null {
  const candidates = [`${device}/config.h`, "config.h", `${device}/config_t.h`, "config_t.h"];
  for (const candidate of candidates) {
    const cfgH = entries.find(({ rel }) => rel === candidate);
    if (!cfgH) continue;
    const content = Buffer.from(unzipped[cfgH.orig]).toString("utf-8");
    const match = content.match(
      /(?:#define\s+FIRMWARE_VERSION\s+"|constexpr\s+const\s+char\s*\*\s*FIRMWARE_VERSION\s*=\s*")([^"]+)/,
    );
    if (!match) continue;
    const parts = match[1].trim().split(".");
    if (parts.length >= 2 && parts.slice(0, 2).every((p) => /^\d+$/.test(p))) {
      return `${parts[0]}.${parts[1]}`;
    }
  }
  return null;
}

// "nexus_flux_case" → "Nexus Flux Case"
function deviceNameToLabel(name: string): string {
  return name.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// 감지된 장치 중 site_settings에 없는 것을 자동 등록 (non-fatal)
async function autoRegisterDevices(detected: string[]) {
  try {
    const supabase = createAdminClient();
    const raw = await getSetting(supabase as any, "firmware_devices", "");
    const existing: { name: string; label: string }[] = raw ? JSON.parse(raw) : [];
    const existingNames = new Set(existing.map((d: { name: string }) => d.name));
    const toAdd = detected.filter(n => !existingNames.has(n));
    if (toAdd.length === 0) return;
    const updated = [
      ...existing,
      ...toAdd.map(n => ({ name: n, label: deviceNameToLabel(n) })),
    ];
    await setSetting(supabase as any, "firmware_devices", JSON.stringify(updated));
  } catch {
    // 장치 목록 자동 등록 실패는 업로드 자체를 막지 않음
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("zip") as File | null;
  if (!file) return NextResponse.json({ error: "zip 파일 필수" }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "ZIP 파일은 50MB 이하여야 합니다." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let unzipped: ReturnType<typeof unzipSync>;
  try {
    unzipped = unzipSync(new Uint8Array(buffer));
  } catch {
    return NextResponse.json({ error: "zip 파일 압축 해제 실패" }, { status: 400 });
  }

  // 공통 최상위 폴더 prefix 제거 (예: "nexus_pot-main/" 같은 래퍼 폴더)
  const allPaths = Object.keys(unzipped);
  const firstSlash = allPaths[0]?.indexOf("/") ?? -1;
  const prefix =
    firstSlash > 0 && allPaths.every(p => p.startsWith(allPaths[0].slice(0, firstSlash + 1)))
      ? allPaths[0].slice(0, firstSlash + 1)
      : "";

  const entries = allPaths
    .map(orig => ({ orig, rel: prefix ? orig.replace(prefix, "") : orig }))
    .filter(({ rel }) => rel && !rel.endsWith("/"));

  // ── 장치 감지 ────────────────────────────────────────────────────────────
  // 루트에 .ino → 단일 장치 (파일명 = 장치명)
  // 서브폴더에만 .ino → 다중 장치 (폴더명 = 장치명)
  const hasRootIno = entries.some(({ rel }) => /^[^/]+\.ino$/i.test(rel));

  const sourceFiles: Record<string, string> = {};
  const skippedIno: string[] = [];
  let uploadedDevices: string[] = [];

  if (hasRootIno) {
    // ── 단일 장치 모드 ────────────────────────────────────────────────────
    const rootIno = entries.find(({ rel }) => /^[^/]+\.ino$/i.test(rel))!;
    const device = rootIno.rel.replace(/\.ino$/i, "");

    for (const { orig, rel } of entries) {
      if (rel.toLowerCase().endsWith(".ino")) {
        if (rel.replace(/\.ino$/i, "") !== device) { skippedIno.push(rel); continue; }
      } else if (!isSrcFile(rel)) {
        continue;
      }
      sourceFiles[`${device}/${rel}`] = Buffer.from(unzipped[orig]).toString("base64");
    }
    uploadedDevices = [device];
  } else {
    // ── 다중 장치 모드 ────────────────────────────────────────────────────
    const deviceDirs = new Set<string>();
    for (const { rel } of entries) {
      const slash = rel.indexOf("/");
      if (slash > 0 && /\.ino$/i.test(rel)) deviceDirs.add(rel.slice(0, slash));
    }

    if (deviceDirs.size === 0) {
      return NextResponse.json({ error: "zip 안에 소스 파일(.ino)이 없습니다" }, { status: 400 });
    }

    for (const device of deviceDirs) {
      const sketchName = device.split("/").pop()!;
      for (const { orig, rel } of entries) {
        if (!rel.startsWith(`${device}/`)) continue;
        const fileRel = rel.slice(device.length + 1);
        if (fileRel.toLowerCase().endsWith(".ino")) {
          const base = fileRel.replace(/\.ino$/i, "");
          if (base !== sketchName) { skippedIno.push(rel); continue; }
        } else if (!isSrcFile(fileRel)) {
          continue;
        }
        sourceFiles[`${device}/${fileRel}`] = Buffer.from(unzipped[orig]).toString("base64");
      }
    }
    uploadedDevices = Array.from(deviceDirs).sort();
  }

  if (Object.keys(sourceFiles).length === 0) {
    return NextResponse.json({ error: "zip 안에 소스 파일(.ino .h .cpp .c)이 없습니다" }, { status: 400 });
  }

  // 장치별 버전 추출 (version.txt 우선, 없으면 config.h)
  const detectedVersions: Record<string, string | null> = {};
  for (const device of uploadedDevices) {
    detectedVersions[device] = extractVersion(entries, unzipped, device);
  }

  // 각 장치 폴더에 빌드 타임스탬프 파일 추가 (파일 내용 동일해도 git diff에 잡히도록)
  const ts = new Date().toISOString();
  for (const device of uploadedDevices) {
    sourceFiles[`${device}/.build`] = Buffer.from(ts).toString("base64");
  }

  // GitHub Tree API — 단일 커밋으로 모든 파일 푸시
  const refData    = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const latestSha  = refData.object.sha;
  const commitData = await gh(`/repos/${OWNER}/${REPO}/git/commits/${latestSha}`);
  const baseTree   = commitData.tree.sha;

  const treeItems = await Promise.all(
    Object.entries(sourceFiles).map(async ([path, content]) => {
      const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "base64" }),
      });
      return { path, mode: "100644", type: "blob", sha: blob.sha };
    })
  );

  const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTree, tree: treeItems }),
  });

  const deviceLabel =
    uploadedDevices.length === 1
      ? uploadedDevices[0]
      : `${uploadedDevices.length}개 장치 (${uploadedDevices.join(", ")})`;

  const versionLabel = uploadedDevices
    .map((d) => (detectedVersions[d] ? `${d} v${detectedVersions[d]}` : d))
    .join(", ");

  const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `[admin] ${deviceLabel} 소스 업로드 — ${versionLabel} (파일 ${Object.keys(sourceFiles).length}개)`,
      tree: newTree.sha,
      parents: [latestSha],
    }),
  });

  await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  // 신규 장치는 site_settings에 자동 등록
  await autoRegisterDevices(uploadedDevices);

  // 소스 업로드 즉시 버전을 firmware_releases에 선반영 (빌드 완료 전)
  // INSERT-FIRST: 새 pending 행을 먼저 삽입한 뒤 다른 행을 삭제
  // → DELETE가 먼저 실패하더라도 최신 행이 항상 DB에 존재하여 경쟁 조건 방지
  {
    const supabase = createAdminClient();
    await Promise.allSettled(
      uploadedDevices
        .filter((d) => detectedVersions[d])
        .map(async (d) => {
          // 1. 새 pending 행 삽입 (가장 최신 created_at 확보)
          const { data: inserted, error: insertErr } = await (supabase as any)
            .from("firmware_releases")
            .insert({
              device_type: d,
              version: detectedVersions[d],
              download_url: "",
              storage_path: "",
              notes: "[빌드 대기] GitHub Actions 빌드 완료 후 실제 URL 등록",
              is_active: true,
            })
            .select("id")
            .single();

          if (insertErr || !inserted?.id) {
            console.error("[upload-source] pending 행 삽입 실패:", d, insertErr?.message);
            return;
          }

          // 2. 방금 삽입한 행을 제외하고 나머지 모두 삭제
          await (supabase as any)
            .from("firmware_releases")
            .delete()
            .eq("device_type", d)
            .neq("id", inserted.id);
        })
    );
  }

  return NextResponse.json({
    ok: true,
    commit: newCommit.sha.slice(0, 8),
    files: Object.keys(sourceFiles).length,
    devices: uploadedDevices,
    versions: detectedVersions,
    skippedIno: skippedIno.length > 0 ? skippedIno : undefined,
  });
}
