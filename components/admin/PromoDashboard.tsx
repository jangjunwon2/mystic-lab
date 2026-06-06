export interface CouponSourceStat {
  source: string;
  label: string;
  issued: number;
  used: number;
  conversionRate: number;
}

export interface DashboardStats {
  bySource: CouponSourceStat[];
  totalIssued: number;
  totalUsed: number;
  conversionRate: number;
  activeCount: number;
}

const SOURCE_ORDER = ["signup", "bulk", "trigger", "cart_trigger", "newsletter", "referral", "promo", "manual"];

function ConversionBar({ rate }: { rate: number }) {
  const color = rate >= 50 ? "#10B981" : rate >= 20 ? "#F59E0B" : "#6B7280";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: "#2D2D4E" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(rate, 100)}%`, background: color }} />
      </div>
      <span className="text-xs tabular-nums" style={{ color: "#F0E6FF" }}>{rate}%</span>
    </div>
  );
}

export default function PromoDashboard({ stats }: { stats: DashboardStats }) {
  const { bySource, totalIssued, totalUsed, conversionRate, activeCount } = stats;

  const ordered = [...bySource].sort(
    (a, b) => (SOURCE_ORDER.indexOf(a.source) + 1 || 99) - (SOURCE_ORDER.indexOf(b.source) + 1 || 99)
  );

  return (
    <div className="rounded-xl border p-6 mb-8" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
      <h2 className="text-base font-semibold mb-5" style={{ color: "#F0E6FF" }}>프로모션 대시보드</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {([
          { label: "총 발급", value: totalIssued.toLocaleString(), accent: "#A855F7" },
          { label: "총 사용", value: totalUsed.toLocaleString(), accent: "#10B981" },
          { label: "전환율", value: `${conversionRate}%`, accent: "#F59E0B" },
          { label: "활성 쿠폰", value: activeCount.toLocaleString(), accent: "#6B7280" },
        ] as const).map(({ label, value, accent }) => (
          <div key={label} className="rounded-lg p-4" style={{ background: "#13131F", border: "1px solid #2D2D4E" }}>
            <p className="text-xs mb-1" style={{ color: "#6B7280" }}>{label}</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: accent }}>{value}</p>
          </div>
        ))}
      </div>

      {ordered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["소스", "발급", "사용", "전환율"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider" style={{ color: "#6B7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordered.map((s) => (
                <tr key={s.source} className="border-b last:border-0" style={{ borderColor: "#2D2D4E" }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color: "#F0E6FF" }}>{s.label}</td>
                  <td className="px-3 py-2.5 tabular-nums" style={{ color: "#9CA3AF" }}>{s.issued.toLocaleString()}</td>
                  <td className="px-3 py-2.5 tabular-nums" style={{ color: "#10B981" }}>{s.used.toLocaleString()}</td>
                  <td className="px-3 py-2.5"><ConversionBar rate={s.conversionRate} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ordered.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: "#6B7280" }}>발급된 쿠폰이 없습니다.</p>
      )}
    </div>
  );
}
