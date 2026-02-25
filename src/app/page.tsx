"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Star,
  ChevronRight,
  Sparkles,
  Package,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  featured: boolean;
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, dir } = useTranslation();
  const { websiteName, freeDeliveryMinPrice, returnDays } = useSiteSettings();

  useEffect(() => {
    fetch("/api/products?featured=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFeatured(data.slice(0, 4));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8 pt-32 pb-20">
          <div className="flex items-center justify-center">
            <div className="max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-medium text-primary-light mb-8">
                <Sparkles className="h-3.5 w-3.5" />
                {t("home.badge")}
              </span>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6">
                {t("home.heroLine1")}
                <br />
                <span className="gradient-text">{t("home.heroLine2")}</span> {t("home.heroLine3")}
                <br />
                {t("home.heroLine4")}
              </h1>

              <p className="text-lg text-muted max-w-lg leading-relaxed mb-10 mx-auto">
                {t("home.heroDesc")}
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 px-8 py-4 text-sm font-semibold text-white transition-all hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {t("home.explore")}
                  <ArrowRight className={`h-4 w-4 transition-transform ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
                </Link>
                <a
                  href="#featured"
                  className="inline-flex items-center gap-2 rounded-full glass px-8 py-4 text-sm font-medium text-foreground transition-all hover:bg-glass-border"
                >
                  {t("home.seeFeatured")}
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-8 mt-14 pt-8 border-t border-border">
                {[
                  { icon: Truck, text: t("home.freeDelivery"), sub: t("home.freeDeliverySub", { price: String(freeDeliveryMinPrice) }) },
                  { icon: ShieldCheck, text: t("home.easyReturns"), sub: t("home.easyReturnsSub", { days: String(returnDays) }) },
                  { icon: Headphones, text: t("home.support"), sub: t("home.supportSub") },
                ].map(({ icon: Icon, text, sub }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{text}</p>
                      <p className="text-[11px] text-muted">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="text-[10px] uppercase tracking-widest text-muted">
              {t("home.scroll")}
            </span>
            <div className="h-8 w-px bg-gradient-to-b from-primary/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* ───────────── FEATURED ───────────── */}
      <section id="featured" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
                {t("home.handpicked")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {t("home.featuredProducts")}
              </h2>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              {t("home.viewAll")}
              <ChevronRight className={`h-4 w-4 transition-transform ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-surface animate-pulse aspect-[3/4]"
                />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {featured.map((p) => (
                <ProductCard
                  key={p._id}
                  id={p._id}
                  name={p.name}
                  description={p.description}
                  price={p.price}
                  image={p.image}
                  category={p.category}
                  stock={p.stock}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted">
                {t("home.noProducts")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ───────────── VALUES / FEATURES ───────────── */}
      <section className="py-24 border-y border-border bg-surface/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t("home.whyChoose")} <span className="gradient-text">{t("home.whyChooseBrand", { shopName: websiteName })}</span>{t("home.whyChooseSuffix")}
            </h2>
            <p className="text-muted max-w-2xl mx-auto text-sm leading-relaxed">
              {t("home.whyChooseDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Star,
                title: t("home.premiumQuality"),
                desc: t("home.premiumQualityDesc"),
              },
              {
                icon: Package,
                title: t("home.fastShipping"),
                desc: t("home.fastShippingDesc"),
              },
              {
                icon: ShieldCheck,
                title: t("home.secureShopping"),
                desc: t("home.secureShoppingDesc"),
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group relative rounded-2xl glass p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-foreground">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA BANNER ───────────── */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1400&h=600&fit=crop"
              alt="Shopping"
              width={1400}
              height={600}
              className="w-full h-64 sm:h-80 lg:h-96 object-cover"
            />
            <div className={`absolute inset-0 ${dir === "rtl" ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-background/95 via-background/70 to-transparent flex items-center`}>
              <div className="px-8 sm:px-14 max-w-lg">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
                  {t("home.ctaLine1")}
                  <br />
                  <span className="gradient-text">{t("home.ctaLine2")}</span> {t("home.ctaLine3")}
                </h2>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  {t("home.ctaDesc")}
                </p>
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25"
                >
                  {t("home.shopNow")}
                  <ArrowRight className={`h-4 w-4 transition-transform ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
