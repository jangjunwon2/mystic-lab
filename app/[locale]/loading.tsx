export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D1A]">
      {/* Hero skeleton */}
      <div className="h-[60vh] bg-[#1A1A2E] animate-pulse" />
      {/* Featured grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-[#1A1A2E] rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#1A1A2E] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-[#2D2D4E]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[#2D2D4E] rounded w-3/4" />
                <div className="h-3 bg-[#2D2D4E] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
