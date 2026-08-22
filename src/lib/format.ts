import type { EventSchedule, PricingCategory } from "@/lib/types";

const dayTime = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const dayOnly = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
const dayOnlyYear = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
const dayTimeYear = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const shortDay = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

function validDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
export function formatEventDate(value: string | null) {
  const date = validDate(value);
  return date ? dayTime.format(date) : "Date à confirmer";
}
export function formatSchedule(event: Partial<EventSchedule>) {
  const displayStart = validDate(event.displayStartAt);
  const displayEnd = validDate(event.displayEndAt);
  const currentYear = Number(new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: "Europe/Paris" }).format(new Date()));
  if (event.ongoing && displayEnd) return `Jusqu’au ${(displayEnd.getFullYear() === currentYear ? dayOnly : dayOnlyYear).format(displayEnd)}`;
  if (displayStart) return (displayStart.getFullYear() === currentYear ? dayTime : dayTimeYear).format(displayStart);
  const start = validDate(event.startAt);
  if (start) return dayTime.format(start);
  return event.scheduleLabel || "Date à confirmer";
}
export function formatDateRange(startValue: string | null, endValue: string | null) {
  const start = validDate(startValue); const end = validDate(endValue);
  if (!start) return "Horaire à confirmer";
  if (!end) return dayTime.format(start);
  return `${dayTime.format(start)} - ${shortDay.format(end)}`;
}
export function priceLabel(value: PricingCategory | string | null | undefined) {
  const normalized = value?.toUpperCase();
  if (normalized === "FREE" || normalized === "GRATUIT") return "Gratuit";
  if (normalized === "PAID" || normalized === "PAYANT") return "Payant";
  return "Tarif à confirmer";
}
export function arrondissementLabel(value: number | null | undefined) { return value ? `Paris ${value}e` : "Paris"; }
