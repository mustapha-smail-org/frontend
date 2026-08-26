export type PricingCategory = "FREE" | "PAID" | "NOT_SPECIFIED";
export type EventPeriod = "TODAY" | "TOMORROW" | "THIS_WEEK" | "THIS_MONTH";
export type EventEnvironment = "INDOOR" | "OUTDOOR" | "UNKNOWN";
export type EventSort = "START_DATE" | "RELEVANCE";

export interface EventEnrichment {
  categories: string[];
  moodAffinities: string[];
  socialContexts: string[];
  semanticTags: string[];
  energyLevel: string | null;
  environmentFallback: string | null;
  uniquenessScore: number | null;
  qualityScore: number | null;
  rankScore: number | null;
}

export interface EventSchedule {
  startAt: string | null;
  endAt: string | null;
  displayStartAt: string | null;
  displayEndAt: string | null;
  ongoing: boolean;
  scheduleLabel: string | null;
}

export interface EventSummary extends EventSchedule {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  categories: string[];
  pricing: PricingCategory;
  arrondissement: number | null;
  venue: string | null;
  officialUrl: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageCredit: string | null;
  sourceUpdatedAt: string | null;
  environment: EventEnvironment;
  enrichment: EventEnrichment | null;
}

export interface EventDetail extends Omit<EventSchedule, "scheduleLabel"> {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  leadText: string | null;
  dateDescription: string | null;
  categories: string[];
  officialUrl: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageCredit: string | null;
  sourceUpdatedAt: string | null;
  transport: string | null;
  location: {
    name: string | null; street: string | null; zipcode: string | null; city: string | null;
    arrondissement: number | null; latitude: number | null; longitude: number | null;
  } | null;
  accessibility: {
    wheelchairAccessible: boolean | null; blindAccessible: boolean | null; deafAccessible: boolean | null;
    signLanguage: string | null; mentalAccessibility: string | null;
  } | null;
  pricing: {
    type: string | null; detail: string | null; accessType: string | null;
    bookingUrl: string | null; bookingLinkText: string | null;
  } | null;
  occurrences: Array<{ start: string | null; end: string | null }>;
  environment: EventEnvironment;
  enrichment: EventEnrichment | null;
}

export interface EventMapMarker {
  id: string; slug: string; title: string; latitude: number; longitude: number;
  category: string | null; pricing: PricingCategory; arrondissement: number | null;
  startAt: string | null; displayStartAt: string | null; displayEndAt: string | null;
  ongoing: boolean; scheduleLabel: string | null;
}

export interface CursorPage<T> { items: T[]; nextCursor: string | null; hasNext: boolean; }

export type FeedbackType = "GENERAL" | "BUG" | "CONTENT";
export type EventReportType = "INCORRECT_INFORMATION" | "EVENT_CANCELLED" | "BROKEN_LINK" | "INAPPROPRIATE_CONTENT";

export interface FeedbackSubmission {
  id: string; type: FeedbackType; message: string; email: string | null;
  status: string; createdAt: string | null; processedAt: string | null; internalNote: string | null;
}

export interface EventReport {
  id: string; eventId: string; eventSlug: string; eventTitle: string;
  type: EventReportType; message: string | null; email: string | null;
  status: string; createdAt: string | null; processedAt: string | null; internalNote: string | null;
}

export interface Facet { value: string; count: number; }
export interface EventFacets { categories: Facet[]; arrondissements: Facet[]; }

export interface EventSearchOptions {
  period?: EventPeriod; date?: string; query?: string;
  category?: string; categories?: string[];
  arrondissements?: string[]; pricing?: "ALL" | PricingCategory;
  cursor?: string; limit?: number; sort?: EventSort;
}
