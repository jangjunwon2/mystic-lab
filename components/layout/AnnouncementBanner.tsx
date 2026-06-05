import { createClient } from "@/lib/supabase/server";
import AnnouncementBannerClient from "./AnnouncementBannerClient";

export default async function AnnouncementBanner() {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("announcements")
      .select("id, message, link_url, link_label, coupon_code")
      .eq("is_active", true)
      .or("starts_at.is.null,starts_at.lte.now()")
      .or("ends_at.is.null,ends_at.gt.now()")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return <AnnouncementBannerClient announcement={data ?? null} />;
  } catch {
    return null;
  }
}
