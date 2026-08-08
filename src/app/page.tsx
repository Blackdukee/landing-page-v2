import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "QuesnaShop | متجر قصنا الإلكتروني - أجهزة وأدوات TOTAL في مصر",
  description:
    "تسوق أفضل المعدات والأدوات الكهربائية واليدوية من TOTAL. بضاعة أصلية، أسعار منافسة، وشحن سريع لجميع المحافظات.",
  openGraph: {
    title: "QuesnaShop | متجر قصنا الإلكتروني",
    description:
      "تسوق أفضل المعدات والأدوات الكهربائية واليدوية من TOTAL. بضاعة أصلية وشحن سريع لجميع المحافظات.",
    type: "website",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
