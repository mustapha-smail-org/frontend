import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Paname Spot", short_name: "Paname Spot", description: "Les sorties et événements à Paris.", start_url: "/", display: "standalone", background_color: "#F8F6F1", theme_color: "#071A33", lang: "fr", icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any" }] }; }
