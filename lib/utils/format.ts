export const todayIso = () => new Date().toISOString().slice(0, 10);

export const formatDateKo = (iso: string) => {
  try { return new Date(iso).toLocaleDateString("ko"); }
  catch { return iso.slice(0, 10); }
};

export const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
