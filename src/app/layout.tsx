import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mohammed-essam.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "QuesnaShop | متجر قصنا الإلكتروني لأدوات TOTAL في مصر",
    template: "%s | QuesnaShop",
  },
  description:
    "متجر قصنا الإلكتروني - أفضل أسعار أدوات ومعدات TOTAL الكهربائية واليدوية في مصر. بضاعة أصلية وتوصيل سريع لكافة المحافظات.",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ar-EG": SITE_URL,
      "ar": SITE_URL,
    },
  },
  openGraph: {
    siteName: "QuesnaShop | متجر قصنا",
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      {
        url: "https://ik.imagekit.io/quesnashop/novashop/products/1000093409_u6nycgY0y.png",
        type: "image/png",
      },
    ],
    shortcut: "https://ik.imagekit.io/quesnashop/novashop/products/1000093409_u6nycgY0y.png",
    apple: "https://ik.imagekit.io/quesnashop/novashop/products/1000093409_u6nycgY0y.png",
  },
  verification: {
    google: "korNU0jPHceVjjKsjIsJiIdtm7YGTU-V2-5_IPhz2Qs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "QuesnaShop",
                alternateName: "متجر قصنا",
                url: SITE_URL,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${SITE_URL}/products?search={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "QuesnaShop",
                alternateName: "متجر قصنا",
                url: SITE_URL,
                logo: "https://ik.imagekit.io/quesnashop/novashop/products/1000093409_u6nycgY0y.png",
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+201203441866",
                  contactType: "customer service",
                  areaServed: "EG",
                  availableLanguage: "Arabic",
                },
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "قويسنا",
                  addressRegion: "المنوفية",
                  addressCountry: "EG",
                },
              },
            ]),
          }}
        />
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
