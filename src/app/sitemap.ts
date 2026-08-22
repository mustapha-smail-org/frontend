import type { MetadataRoute } from "next";
import { getEvents } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://panamespot.fr";
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/aujourdhui`, changeFrequency: "daily", priority: .9 },
    { url: `${base}/decouvrir`, changeFrequency: "daily", priority: .8 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: .2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: .2 },
  ];
  try {
    const page = await getEvents({ limit: 100 });
    return [...staticPages, ...page.items.map((event) => ({ url: `${base}/events/${event.slug}`, lastModified: event.sourceUpdatedAt || undefined, changeFrequency: "weekly" as const, priority: .7 }))];
  } catch { return staticPages; }
}
