import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient, { type Product } from "./ProductDetailClient";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mohammed-essam.vercel.app";

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: "المنتج غير موجود | QuesnaShop" };
  }

  const companyName =
    typeof product.company === "object" && product.company !== null
      ? product.company.name
      : undefined;

  const title = companyName
    ? `${product.name} | ${companyName} | QuesnaShop`
    : `${product.name} | QuesnaShop`;

  const description =
    product.description?.slice(0, 155) ||
    `اشتر ${product.name} بأفضل سعر في مصر. توصيل سريع عبر QuesnaShop.`;

  const images = (product.images?.length ? product.images : [product.image])
    .filter(Boolean)
    .slice(0, 1)
    .map((url) => ({ url, width: 800, height: 800, alt: product.name }));

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/products/${product._id}`,
    },
    openGraph: {
      title,
      description,
      images,
      type: "website",
      locale: "ar_EG",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const companyName =
    typeof product.company === "object" && product.company !== null
      ? product.company.name
      : undefined;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.images?.length ? product.images : [product.image],
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "EGP",
        availability:
          product.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        url: `${BASE_URL}/products/${product._id}`,
      },
      ...(companyName && { brand: { "@type": "Brand", name: companyName } }),
    },
    {
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
        {
          "@type": "ListItem",
          position: 3,
          name: product.name,
          item: `${BASE_URL}/products/${product._id}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
