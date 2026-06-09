export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] animate-pulse">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-40 bg-[#1A1A2E] rounded" />
        <div className="h-64 bg-[#1A1A2E] rounded-2xl" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1A1A2E] rounded-xl" />
          ))}
        </div>
        <div className="h-14 bg-[#1A1A2E] rounded-xl" />
      </div>
    </div>
  );
}
