export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-40 bg-[#1A1A2E] rounded-lg animate-pulse mb-6" />
        <div className="flex gap-2 mb-6 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-[#1A1A2E] rounded-full animate-pulse shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#1A1A2E] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-[#2D2D4E]" />
              <div className="p-3 space-y-2">
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
