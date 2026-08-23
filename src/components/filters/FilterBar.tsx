"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Popover } from "@astryxdesign/core/Popover";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { DateFilter } from "@/components/filters/DateFilter";
import { PriceFilter } from "@/components/filters/PriceFilter";
import { FacetMultiSelect } from "@/components/filters/FacetMultiSelect";
import { arrondissementLabel, hasActiveFilters, type DiscoveryFilters } from "@/lib/discoveryFilters";
import type { EventFacets } from "@/lib/types";

const PRESET_LABELS: Record<string, string> = {
  TODAY: "Aujourd’hui", TOMORROW: "Demain", THIS_WEEK: "Cette semaine",
};

function dateSummary(filters: DiscoveryFilters): string | undefined {
  if (filters.date) return new Date(`${filters.date}T00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return filters.preset ? PRESET_LABELS[filters.preset] : undefined;
}

function priceSummary(pricing: string): string | undefined {
  if (pricing === "FREE") return "Gratuit";
  if (pricing === "PAID") return "Payant";
  return undefined;
}

function FilterDropdown({ isMobile, label, summary, active, children }: {
  isMobile: boolean;
  label: string;
  summary?: string;
  active: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const trigger = (
    <button
      type="button"
      className="filter-trigger"
      data-active={active}
      onClick={isMobile ? () => setOpen(true) : undefined}
      aria-expanded={isMobile ? open : undefined}
    >
      <span>{label}</span>
      {summary && <span className="filter-trigger-badge">{summary}</span>}
      <ChevronDown size={15} aria-hidden="true" />
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <BottomSheet label={label} isOpen={open} onOpenChange={setOpen} purpose="info">
          <div className="filter-sheet">
            <p className="filter-sheet-title">{label}</p>
            {children(close)}
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover
      label={label}
      placement="below"
      width={340}
      isOpen={open}
      onOpenChange={setOpen}
      content={<div className="filter-popover">{children(close)}</div>}
    >
      {trigger}
    </Popover>
  );
}

export function FilterBar({ filters, facets, onChange, onReset }: {
  filters: DiscoveryFilters;
  facets: EventFacets;
  onChange: (next: Partial<DiscoveryFilters>) => void;
  onReset: () => void;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <div className="filter-row" aria-label="Filtres">
      <span className="filter-label"><SlidersHorizontal size={16} aria-hidden="true" />Filtres</span>

      <FilterDropdown isMobile={isMobile} label="Date" summary={dateSummary(filters)} active={Boolean(filters.date || filters.preset)}>
        {(close) => <DateFilter date={filters.date} preset={filters.preset} onChange={(next) => onChange(next)} onDone={close} />}
      </FilterDropdown>

      <FilterDropdown
        isMobile={isMobile}
        label="Catégories"
        summary={filters.categories.length ? String(filters.categories.length) : undefined}
        active={filters.categories.length > 0}
      >
        {(close) => (
          <FacetMultiSelect
            label="Catégories"
            options={facets.categories}
            selected={filters.categories}
            popularCount={5}
            onChange={(categories) => onChange({ categories })}
            onApply={isMobile ? close : undefined}
          />
        )}
      </FilterDropdown>

      <FilterDropdown isMobile={isMobile} label="Prix" summary={priceSummary(filters.pricing)} active={Boolean(filters.pricing)}>
        {(close) => <PriceFilter pricing={filters.pricing} onChange={(pricing) => onChange({ pricing })} onDone={close} />}
      </FilterDropdown>

      <FilterDropdown
        isMobile={isMobile}
        label="Où"
        summary={filters.arrondissements.length ? String(filters.arrondissements.length) : undefined}
        active={filters.arrondissements.length > 0}
      >
        {(close) => (
          <FacetMultiSelect
            label="Où"
            options={facets.arrondissements}
            selected={filters.arrondissements}
            formatValue={arrondissementLabel}
            onChange={(arrondissements) => onChange({ arrondissements })}
            onApply={isMobile ? close : undefined}
          />
        )}
      </FilterDropdown>

      {hasActiveFilters(filters) && (
        <button type="button" className="reset-filter" onClick={onReset}><X size={15} aria-hidden="true" />Effacer</button>
      )}
    </div>
  );
}
