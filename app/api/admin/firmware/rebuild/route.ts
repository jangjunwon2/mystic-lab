import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const device: string | undefined = body.device?.trim() || undefined;

  const res = await fetch(
    "https://api.github.com/repos/jangjunwon2/nexus-firmware/actions/workflows/firmware-deploy.yml/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PAT}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: device ? { device } : {},
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("[firmware/rebuild] GitHub dispatch failed:", text);
    return NextResponse.json({ error: "GitHub 워크플로 트리거에 실패했습니다." }, { status: res.status });
  }
  return NextResponse.json({ ok: true, device: device ?? "all" });
}
