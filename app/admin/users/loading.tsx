export default function UsersLoading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-[#2D2D4E]" />
        <div className="h-5 w-24 rounded bg-[#2D2D4E]" />
      </div>
      <div className="h-10 w-full rounded-xl bg-[#1A1A2E]" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-[#1A1A2E]" />
      ))}
    </div>
  );
}
