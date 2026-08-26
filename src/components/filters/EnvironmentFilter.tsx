"use client";

import { ToggleButton } from "@astryxdesign/core/ToggleButton";

export function EnvironmentFilter({ environment, onChange, onDone }: {
  environment: string;
  onChange: (value: string) => void;
  onDone?: () => void;
}) {
  const pick = (value: string) => { onChange(value); onDone?.(); };

  return (
    <div className="filter-options-vertical">
      <ToggleButton label="Intérieur" isPressed={environment === "INDOOR"} onPressedChange={(pressed) => pick(pressed ? "INDOOR" : "")} />
      <ToggleButton label="Extérieur" isPressed={environment === "OUTDOOR"} onPressedChange={(pressed) => pick(pressed ? "OUTDOOR" : "")} />
    </div>
  );
}
