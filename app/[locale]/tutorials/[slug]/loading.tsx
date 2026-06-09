export default function TutorialLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] animate-pulse">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="h-6 w-32 bg-[#1A1A2E] rounded" />
        <div className="h-10 w-72 bg-[#1A1A2E] rounded" />
        <div className="aspect-video bg-[#1A1A2E] rounded-2xl" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-[#1A1A2E] rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
