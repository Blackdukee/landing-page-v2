import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsClient from "./ProductsClient";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mohammed-essam.vercel.app";

export const metadata: Metadata = {
  title: "جميع الأدوات والمنتجات | TOTAL مصر",
  description:
    "تصفح مجموعتنا الكاملة من معدات وأدوات TOTAL الكهربائية واليدوية. أحدث الموديلات بأفضل الأسعار وتوصيل سريع لكافة المحافظات.",
  alternates: {
    canonical: `${BASE_URL}/products`,
  },
  openGraph: {
    title: "جميع الأدوات والمنتجات | TOTAL مصر | M L N TOOLS",
    description:
      "تصفح مجموعتنا الكاملة من معدات وأدوات TOTAL الكهربائية واليدوية. أفضل الأسعار وشحن سريع لكافة المحافظات.",
    type: "website",
    locale: "ar_EG",
  },
};

export default function ProductsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "جميع المنتجات",
        item: `${BASE_URL}/products`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen pt-32 pb-20 mx-auto max-w-7xl px-6 lg:px-8 animate-pulse">
            <div className="h-10 w-48 bg-surface rounded-2xl mb-4" />
            <div className="h-4 w-72 bg-surface rounded-xl mb-10" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-surface rounded-2xl border border-border"
                />
              ))}
            </div>
          </div>
        }
      >
        <ProductsClient />
      </Suspense>
    </>
  );
}

