import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import FirmwareClient from "@/components/admin/FirmwareClient";
import { getDevices } from "@/app/api/admin/firmware/devices/route";

export const metadata = { title: "펌웨어 관리 — Mystic Lab Admin" };

export default async function FirmwarePage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin");

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: releases } = await (supabase as any)
    .from("firmware_releases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const devices = await getDevices(supabase);

  return <FirmwareClient initialReleases={releases ?? []} initialDevices={devices} />;
}
