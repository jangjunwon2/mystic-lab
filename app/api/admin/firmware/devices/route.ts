import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getSetting, setSetting } from "@/lib/settings";

export interface FirmwareDevice {
  name: string;   // GitHub 폴더명 & device= 쿼리 값
  label: string;  // 어드민 표시 이름
}

const DEFAULT_DEVICES: FirmwareDevice[] = [
  { name: "nexus_pot", label: "Nexus Pot" },
];

export async function getDevices(supabase: ReturnType<typeof createAdminClient>): Promise<FirmwareDevice[]> {
  try {
    const raw = await getSetting(supabase as any, "firmware_devices", "");
    if (!raw) return DEFAULT_DEVICES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEVICES;
  } catch {
    return DEFAULT_DEVICES;
  }
}

// GET: 장치 목록 조회
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const devices = await getDevices(supabase);
  return NextResponse.json(devices);
}

// PUT: 장치 목록 저장
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!Array.isArray(body)) return NextResponse.json({ error: "배열 형식 필요" }, { status: 400 });

  const devices: FirmwareDevice[] = body
    .filter((d) => d?.name?.trim() && d?.label?.trim())
    .map((d) => ({ name: d.name.trim(), label: d.label.trim() }));

  if (devices.length === 0) return NextResponse.json({ error: "최소 1개 이상 필요" }, { status: 400 });

  const supabase = createAdminClient();
  const ok = await setSetting(supabase as any, "firmware_devices", JSON.stringify(devices));
  if (!ok) return NextResponse.json({ error: "저장 실패" }, { status: 500 });

  return NextResponse.json(devices);
}
