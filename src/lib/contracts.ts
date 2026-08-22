import { z } from "zod";

const nullableString = z.string().nullable();
const pricing = z.enum(["FREE", "PAID", "NOT_SPECIFIED"]);
const schedule = {
  startAt: nullableString, endAt: nullableString, displayStartAt: nullableString,
  displayEndAt: nullableString, ongoing: z.boolean(), scheduleLabel: nullableString,
};

export const eventSummarySchema = z.object({
  id: z.string(), slug: z.string(), title: z.string(), summary: nullableString,
  categories: z.array(z.string()), pricing, arrondissement: z.number().int().nullable(), venue: nullableString,
  ...schedule, officialUrl: nullableString, imageUrl: nullableString, imageAlt: nullableString,
  imageCredit: nullableString, sourceUpdatedAt: nullableString,
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
});

export const eventSummaryPageSchema = z.object({ items: z.array(eventSummarySchema), nextCursor: nullableString, hasNext: z.boolean() });
export const eventMapPageSchema = z.object({ items: z.array(eventMapMarkerSchema), nextCursor: nullableString, hasNext: z.boolean() });
export const categoriesSchema = z.array(z.string());
