export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] animate-pulse">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-4 w-48 bg-[#1A1A2E] rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-[#1A1A2E] rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-[#1A1A2E] rounded" />
            <div className="h-6 w-1/4 bg-[#1A1A2E] rounded" />
            <div className="h-4 w-full bg-[#1A1A2E] rounded" />
            <div className="h-4 w-5/6 bg-[#1A1A2E] rounded" />
            <div className="h-4 w-4/6 bg-[#1A1A2E] rounded" />
            <div className="h-12 w-full bg-[#2D2D4E] rounded-xl mt-6" />
            <div className="h-12 w-full bg-[#1A1A2E] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
