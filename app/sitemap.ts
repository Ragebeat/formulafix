import type { MetadataRoute } from "next";
import { seoPages } from "@/lib/seo-pages";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://formulafix.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    ...seoPages.map((p) => ({
      url: `${BASE}/fix/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
