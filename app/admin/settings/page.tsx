import Link from "next/link";
import SettingsAdminClient from "@/components/admin/SettingsAdminClient";

export const metadata = { title: "Settings — Admin" };

export default function AdminSettingsPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F0E6FF]">설정</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            스토어 전반 및 사업자 고지 정보를 변경합니다.
          </p>
        </div>
        <Link
          href="/admin/points"
          className="inline-flex items-center justify-center px-4 py-2 border border-[#2D2D4E] rounded-xl text-sm font-medium text-[#9CA3AF] hover:text-[#A855F7] hover:border-[#7C3AED] transition-colors"
        >
          포인트 설정으로 이동
        </Link>
      </div>

      <SettingsAdminClient />
    </div>
  );
}
