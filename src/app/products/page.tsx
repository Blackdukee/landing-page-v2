import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "جميع المنتجات",
  description:
    "تصفح مجموعتنا الكاملة من أدوات TOTAL والمنتجات المميزة. أسعار تنافسية وشحن سريع في مصر.",
  openGraph: {
    title: "جميع المنتجات | QuesnaShop",
    description:
      "تصفح مجموعتنا الكاملة من أدوات TOTAL والمنتجات المميزة. أسعار تنافسية وشحن سريع في مصر.",
    type: "website",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
