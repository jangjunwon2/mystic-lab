"use client";

import { INPUT_STYLE_TABLE } from "./styles";

export const DOMESTIC_CARRIERS = ["CJ대한통운", "한진택배", "롯데택배", "우체국", "로젠"];
export const INTERNATIONAL_CARRIERS = ["DHL", "FedEx", "UPS", "EMS", "우체국EMS"];

interface Props {
  number: string;
  carrier: string;
  saving: boolean;
  btnLabel?: string;
  onNumberChange: (v: string) => void;
  onCarrierChange: (v: string) => void;
  onSave: () => void;
}

export default function TrackingInput({ number, carrier, saving, btnLabel = "발송 처리", onNumberChange, onCarrierChange, onSave }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        placeholder="운송장 번호"
        value={number}
        onChange={(e) => onNumberChange(e.target.value)}
        style={{ ...INPUT_STYLE_TABLE, width: "160px" }}
      />
      <select
        value={carrier}
        onChange={(e) => onCarrierChange(e.target.value)}
        style={{ ...INPUT_STYLE_TABLE, width: "140px", cursor: "pointer" }}
      >
        <option value="">배송사 선택</option>
        <optgroup label="국내">
          {DOMESTIC_CARRIERS.map((c) => <option key={c}>{c}</option>)}
        </optgroup>
        <optgroup label="국제">
          {INTERNATIONAL_CARRIERS.map((c) => <option key={c}>{c}</option>)}
        </optgroup>
      </select>
      <button
        onClick={onSave}
        disabled={!number.trim() || saving}
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ background: "#3B82F622", color: "#3B82F6" }}
      >
        {saving ? "저장 중…" : btnLabel}
      </button>
    </div>
  );
}
