export default function CartLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] animate-pulse">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-32 bg-[#1A1A2E] rounded" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-[#1A1A2E] rounded-2xl" />
          ))}
        </div>
        <div className="h-48 bg-[#1A1A2E] rounded-2xl" />
      </div>
    </div>
  );
}
