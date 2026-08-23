"use client";

import { Calendar } from "@astryxdesign/core/Calendar";
import type { ISODateString } from "@astryxdesign/core/Calendar";
import { ToggleButton } from "@astryxdesign/core/ToggleButton";
import { parisTodayISO } from "@/lib/discoveryFilters";

const PRESETS = [
  { label: "Aujourd’hui", value: "TODAY" },
  { label: "Demain", value: "TOMORROW" },
  { label: "Cette semaine", value: "THIS_WEEK" },
];

export function DateFilter({ date, preset, onChange, onDone }: {
  date: string;
  preset: string;
  onChange: (next: { date: string; preset: string }) => void;
  onDone?: () => void;
}) {
  const today = parisTodayISO() as ISODateString;
  const pick = (next: { date: string; preset: string }) => { onChange(next); onDone?.(); };

  return (
    <div className="filter-panel-body">
      <div className="filter-presets">
        {PRESETS.map((item) => (
          <ToggleButton
            key={item.value}
            label={item.label}
            isPressed={!date && preset === item.value}
            onPressedChange={(pressed) => pick({ date: "", preset: pressed ? item.value : "" })}
          />
        ))}
      </div>
      <div className="filter-calendar">
        <Calendar
          mode="single"
          min={today}
          weekStartsOn="mon"
          value={(date || undefined) as ISODateString | undefined}
          onChange={(value) => pick({ date: value, preset: "" })}
        />
      </div>
    </div>
  );
}
