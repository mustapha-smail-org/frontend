"use client";

import { X } from "lucide-react";
import { CheckboxList, CheckboxListItem } from "@astryxdesign/core/CheckboxList";
import { Badge } from "@astryxdesign/core/Badge";
import { splitPopular } from "@/lib/discoveryFilters";
import type { Facet } from "@/lib/types";

function items(facets: Facet[], format: (value: string) => string) {
  return facets.map((facet) => (
    <CheckboxListItem
      key={facet.value}
      value={facet.value}
      label={format(facet.value)}
      endContent={<Badge label={String(facet.count)} />}
    />
  ));
}

export function FacetMultiSelect({ label, options, selected, onChange, popularCount, formatValue, onApply }: {
  label: string;
  options: Facet[];
  selected: string[];
  onChange: (values: string[]) => void;
  popularCount?: number;
  formatValue?: (value: string) => string;
  onApply?: () => void;
}) {
  const format = formatValue ?? ((value: string) => value);

  if (options.length === 0) {
    return <p className="facet-empty">Aucune option disponible.</p>;
  }

  let body;
  if (popularCount && options.length > popularCount) {
    const { popular, rest } = splitPopular(options, popularCount);
    const popularValues = new Set(popular.map((facet) => facet.value));
    const inPopular = selected.filter((value) => popularValues.has(value));
    const inRest = selected.filter((value) => !popularValues.has(value));

    body = (
      <>
        <p className="facet-group-title">Populaires</p>
        <CheckboxList
          label={`${label} — populaires`}
          isLabelHidden
          value={inPopular}
          onChange={(next) => onChange([...next, ...inRest])}
        >
          {items(popular, format)}
        </CheckboxList>
        <p className="facet-group-title">Toutes les options</p>
        <CheckboxList
          label={`${label} — autres`}
          isLabelHidden
          value={inRest}
          onChange={(next) => onChange([...inPopular, ...next])}
        >
          {items(rest, format)}
        </CheckboxList>
      </>
    );
  } else {
    body = (
      <CheckboxList label={label} isLabelHidden value={selected} onChange={onChange}>
        {items(options, format)}
      </CheckboxList>
    );
  }

  return (
    <div className="filter-panel-body">
      {selected.length > 0 && (
        <div className="facet-header">
          <span>{selected.length} sélectionné{selected.length > 1 ? "s" : ""}</span>
          <button type="button" className="facet-clear" onClick={() => onChange([])}><X size={14} aria-hidden="true" />Réinitialiser</button>
        </div>
      )}
      <div className="facet-scroll">{body}</div>
      {onApply && (
        <button type="button" className="filter-apply" onClick={onApply}>
          Appliquer{selected.length ? ` (${selected.length})` : ""}
        </button>
      )}
    </div>
  );
}
