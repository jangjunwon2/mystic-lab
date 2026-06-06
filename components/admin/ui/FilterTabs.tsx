"use client";

interface Tab {
  key: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export default function FilterTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
          style={{
            background: active === t.key ? "#7C3AED" : "#1A1A2E",
            color: active === t.key ? "#fff" : "#9CA3AF",
            border: "1px solid",
            borderColor: active === t.key ? "#7C3AED" : "#2D2D4E",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
