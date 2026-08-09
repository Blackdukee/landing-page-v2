import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "M L N TOOLS | متجر M L N TOOLS الإلكتروني - أجهزة وأدوات TOTAL في مصر",
  description:
    "تسوق أفضل المعدات والأدوات الكهربائية واليدوية من TOTAL. بضاعة أصلية، أسعار منافسة، وشحن سريع لجميع المحافظات.",
  openGraph: {
    title: "M L N TOOLS | متجر M L N TOOLS الإلكتروني",
    description:
      "تسوق أفضل المعدات والأدوات الكهربائية واليدوية من TOTAL. بضاعة أصلية وشحن سريع لجميع المحافظات.",
    type: "website",
    images: [
      {
        url: "https://ik.imagekit.io/quesnashop/novashop/products/1000093409_u6nycgY0y.png",
        width: 1200,
        height: 630,
        alt: "M L N TOOLS - متجر M L N TOOLS لأدوات TOTAL في مصر",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://ik.imagekit.io/quesnashop/novashop/products/1000093409_u6nycgY0y.png"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
