"use client";

interface Props { msg: string | null }

export default function FeedbackMsg({ msg }: Props) {
  if (!msg) return null;
  const isError = msg.startsWith("❌");
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm"
      style={{
        background: isError ? "#EF444422" : "#10B98122",
        color: isError ? "#EF4444" : "#10B981",
        border: "1px solid",
        borderColor: isError ? "#EF444444" : "#10B98144",
      }}
    >
      {msg}
    </div>
  );
}
