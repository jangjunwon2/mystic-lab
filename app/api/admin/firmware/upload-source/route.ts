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

function isSrcFile(rel: string): boolean {
  return /\.(h|cpp|c|hpp)$/i.test(rel) || rel === "version.txt";
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("zip") as File | null;
  const deviceTypeFromForm = (formData.get("device_type") as string)?.trim();

  if (!file) {
    return NextResponse.json({ error: "zip 파일 필수" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let unzipped: ReturnType<typeof unzipSync>;
  try {
    unzipped = unzipSync(new Uint8Array(buffer));
  } catch {
    return NextResponse.json({ error: "zip 파일 압축 해제 실패" }, { status: 400 });
  }

  // 공통 최상위 폴더 prefix 제거
  const allPaths = Object.keys(unzipped);
  const firstSlash = allPaths[0]?.indexOf("/") ?? -1;
  const prefix =
    firstSlash > 0 && allPaths.every(p => p.startsWith(allPaths[0].slice(0, firstSlash + 1)))
      ? allPaths[0].slice(0, firstSlash + 1)
      : "";

  const entries = allPaths
    .map(orig => ({ orig, rel: prefix ? orig.replace(prefix, "") : orig }))
    .filter(({ rel }) => rel && !rel.endsWith("/"));

  // 단일 vs 다중 장치 감지
  // .ino 파일이 루트에 있으면 단일 장치, 서브폴더에만 있으면 다중 장치
  const hasRootIno = entries.some(({ rel }) => /^[^/]+\.ino$/i.test(rel));

  const sourceFiles: Record<string, string> = {};
  const skippedIno: string[] = [];
  let uploadedDevices: string[] = [];

  if (hasRootIno) {
    // ── 단일 장치 모드 ──────────────────────────────────────────────
    if (!deviceTypeFromForm || deviceTypeFromForm === "auto") {
      return NextResponse.json({ error: "단일 장치 zip은 장치 선택 필수" }, { status: 400 });
    }
    const sketchName = deviceTypeFromForm.split("/").pop()!;
    for (const { orig, rel } of entries) {
      if (rel.toLowerCase().endsWith(".ino")) {
        const base = rel.split("/").pop()!.replace(/\.ino$/i, "");
        if (base !== sketchName) { skippedIno.push(rel); continue; }
      } else if (!isSrcFile(rel)) {
        continue;
      }
      sourceFiles[`${deviceTypeFromForm}/${rel}`] = Buffer.from(unzipped[orig]).toString("base64");
    }
    uploadedDevices = [deviceTypeFromForm];
  } else {
    // ── 다중 장치 모드 ──────────────────────────────────────────────
    // 서브폴더 중 .ino 파일을 포함하는 것을 장치 폴더로 인식
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
          const base = fileRel.split("/").pop()!.replace(/\.ino$/i, "");
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

  // GitHub Tree API — 단일 커밋
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

  const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `[admin] ${deviceLabel} 소스 업로드 (파일 ${Object.keys(sourceFiles).length}개)`,
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
    devices: uploadedDevices,
    skippedIno: skippedIno.length > 0 ? skippedIno : undefined,
  });
}
