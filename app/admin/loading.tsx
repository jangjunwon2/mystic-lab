export default function AdminLoading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-[#2D2D4E]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#1A1A2E]" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-[#1A1A2E]" />
    </div>
  );
}
