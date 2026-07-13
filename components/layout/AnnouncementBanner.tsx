import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import AnnouncementBannerClient from "./AnnouncementBannerClient";

const getCachedAnnouncement = unstable_cache(
  async () => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (supabase as any)
      .from("announcements")
      .select("id, message, link_url, link_label, coupon_code, translations")
      .eq("is_active", true)
      .or("starts_at.is.null,starts_at.lte.now()")
      .or("ends_at.is.null,ends_at.gt.now()")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return res.data;
  },
  ["global-announcement-banner"],
  { revalidate: 60, tags: ["announcements"] }
);

export default async function AnnouncementBanner({ locale }: { locale: string }) {
  let data = null;
  try {
    data = await getCachedAnnouncement();
  } catch {
    return null;
  }

  return <AnnouncementBannerClient announcement={data ?? null} locale={locale} />;
}
