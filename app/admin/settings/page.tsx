import Link from "next/link";

export const metadata = { title: "Settings — Admin" };

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>설정</h1>
      </div>
      <div className="rounded-xl border p-6 max-w-md" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          포인트 적립률은{" "}
          <Link href="/admin/points" className="underline" style={{ color: "#A855F7" }}>
            포인트 설정
          </Link>
          으로 이동했습니다.
        </p>
      </div>
    </div>
  );
}
