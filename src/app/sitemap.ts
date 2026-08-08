import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mohammed-essam.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${BASE_URL}/api/products?limit=0`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const products: Array<{ _id: string; updatedAt?: string }> =
        Array.isArray(data) ? data : (data.products ?? []);

      productEntries = products.map((p) => ({
        url: `${BASE_URL}/products/${p._id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // If fetch fails at build time, sitemap will just include static pages
  }

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...productEntries,
  ];
}
