import type { Metadata } from "next";
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
    title: "جميع الأدوات والمنتجات | TOTAL مصر | QuesnaShop",
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
      <ProductsClient />
    </>
  );
}
