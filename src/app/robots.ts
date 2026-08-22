import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: "https://panamespot.fr/sitemap.xml", host: "https://panamespot.fr" }; }
