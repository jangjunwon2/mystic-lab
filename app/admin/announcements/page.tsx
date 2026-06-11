import { createAdminClient } from "@/lib/supabase/server";
import AnnouncementsAdminClient from "@/components/admin/AnnouncementsAdminClient";

export const metadata = { title: "Announcements — Admin" };

export default async function AdminAnnouncementsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-8">
      <AnnouncementsAdminClient initialAnnouncements={announcements ?? []} />
    </div>
  );
}
