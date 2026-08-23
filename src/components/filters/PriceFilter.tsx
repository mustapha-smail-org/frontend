"use client";

import { ToggleButton } from "@astryxdesign/core/ToggleButton";

export function PriceFilter({ pricing, onChange, onDone }: {
  pricing: string;
  onChange: (value: string) => void;
  onDone?: () => void;
}) {
  const pick = (value: string) => { onChange(value); onDone?.(); };

  return (
    <div className="filter-options-vertical">
      <ToggleButton label="Gratuit" isPressed={pricing === "FREE"} onPressedChange={(pressed) => pick(pressed ? "FREE" : "")} />
      <ToggleButton label="Payant" isPressed={pricing === "PAID"} onPressedChange={(pressed) => pick(pressed ? "PAID" : "")} />
    </div>
  );
}
