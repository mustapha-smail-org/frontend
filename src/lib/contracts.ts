import { z } from "zod";

const nullableString = z.string().nullable();
const pricing = z.enum(["FREE", "FREE_CONDITIONAL", "PAID", "NOT_SPECIFIED"]);
const environment = z.enum(["INDOOR", "OUTDOOR", "UNKNOWN"]);
const enrichment = z.object({
  categories: z.array(z.string()), moodAffinities: z.array(z.string()),
  socialContexts: z.array(z.string()), semanticTags: z.array(z.string()),
  energyLevel: nullableString, environmentFallback: nullableString,
  uniquenessScore: z.number().int().nullable(), qualityScore: z.number().int().nullable(),
  rankScore: z.number().nullable(),
}).nullable();
const schedule = {
  startAt: nullableString, endAt: nullableString, displayStartAt: nullableString,
  displayEndAt: nullableString, ongoing: z.boolean(), scheduleLabel: nullableString,
};

export const eventSummarySchema = z.object({
  id: z.string(), slug: z.string(), title: z.string(), summary: nullableString,
  categories: z.array(z.string()), pricing, arrondissement: z.number().int().nullable(), venue: nullableString,
  ...schedule, officialUrl: nullableString, imageUrl: nullableString, imageAlt: nullableString,
  imageCredit: nullableString, sourceUpdatedAt: nullableString, environment, enrichment,
});

export const eventMapMarkerSchema = z.object({
  id: z.string(), slug: z.string(), title: z.string(), latitude: z.number(), longitude: z.number(),
  category: nullableString, pricing, arrondissement: z.number().int().nullable(), startAt: nullableString,
  displayStartAt: nullableString, displayEndAt: nullableString, ongoing: z.boolean(), scheduleLabel: nullableString,
});

export const eventDetailSchema = z.object({
  id: z.string(), slug: z.string(), title: z.string(), description: nullableString, leadText: nullableString,
  dateDescription: nullableString, categories: z.array(z.string()), officialUrl: nullableString,
  imageUrl: nullableString, imageAlt: nullableString, imageCredit: nullableString,
  startAt: nullableString, endAt: nullableString, displayStartAt: nullableString, displayEndAt: nullableString,
  ongoing: z.boolean(), sourceUpdatedAt: nullableString, transport: nullableString,
  location: z.object({ name: nullableString, street: nullableString, zipcode: nullableString, city: nullableString,
    arrondissement: z.number().int().nullable(), latitude: z.number().nullable(), longitude: z.number().nullable() }).nullable(),
  accessibility: z.object({ wheelchairAccessible: z.boolean().nullable(), blindAccessible: z.boolean().nullable(),
    deafAccessible: z.boolean().nullable(), signLanguage: nullableString, mentalAccessibility: nullableString }).nullable(),
  pricing: z.object({ type: nullableString, detail: nullableString, accessType: nullableString,
    bookingUrl: nullableString, bookingLinkText: nullableString }).nullable(),
  occurrences: z.array(z.object({ start: nullableString, end: nullableString })),
  environment, enrichment,
});

export const feedbackSubmissionSchema = z.object({
  id: z.string(), type: z.enum(["GENERAL", "BUG", "CONTENT"]), message: z.string(),
  email: nullableString, status: z.string(), createdAt: nullableString,
  processedAt: nullableString, internalNote: nullableString,
});
export const eventReportSchema = z.object({
  id: z.string(), eventId: z.string(), eventSlug: z.string(), eventTitle: z.string(),
  type: z.enum(["INCORRECT_INFORMATION", "EVENT_CANCELLED", "BROKEN_LINK", "INAPPROPRIATE_CONTENT"]),
  message: nullableString, email: nullableString, status: z.string(),
  createdAt: nullableString, processedAt: nullableString, internalNote: nullableString,
});
export const feedbackPageSchema = z.object({ items: z.array(feedbackSubmissionSchema), nextCursor: nullableString, hasNext: z.boolean() });
export const eventReportPageSchema = z.object({ items: z.array(eventReportSchema), nextCursor: nullableString, hasNext: z.boolean() });

export const eventSummaryPageSchema = z.object({ items: z.array(eventSummarySchema), nextCursor: nullableString, hasNext: z.boolean() });
export const eventMapPageSchema = z.object({ items: z.array(eventMapMarkerSchema), nextCursor: nullableString, hasNext: z.boolean() });
export const categoriesSchema = z.array(z.string());
export const facetCountSchema = z.object({ value: z.string(), count: z.number().int().nonnegative() });
export const eventFacetsSchema = z.object({ categories: z.array(facetCountSchema), arrondissements: z.array(facetCountSchema) });
