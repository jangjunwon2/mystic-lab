export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] animate-pulse">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-48 bg-[#1A1A2E] rounded" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-[#1A1A2E] rounded-xl" />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-[#1A1A2E] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
