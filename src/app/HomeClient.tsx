"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import {
  ArrowRight,
  Star,
  Package,
  ShieldCheck,
} from "lucide-react";
import BrandHeroSection, { Company } from "@/components/BrandHeroSection";
import CategoryProductSection, {
  Category,
  Product,
} from "@/components/CategoryProductSection";
import DailyOffersSection from "@/components/DailyOffersSection";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

export default function HomeClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const { t, dir } = useTranslation();
  const { websiteName, freeDeliveryMinPrice } = useSiteSettings();

  // 1. Fetch Companies
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch(console.error)
      .finally(() => setLoadingCompanies(false));
  }, []);

  // 2. Fetch Categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error)
      .finally(() => setLoadingCategories(false));
  }, []);

  // 3. Fetch Products for Category Sections
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        else if (Array.isArray(data.products)) setProducts(data.products);
      })
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, []);

  // Group products by category name (max 4 per category for landing page showcase)
  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const p of products) {
      if (!p.category) continue;
      if (!map[p.category]) map[p.category] = [];
      if (map[p.category].length < 4) {
        map[p.category].push(p);
      }
    }
    return map;
  }, [products]);

  return (
    <>
      {/* ───────────── 1. HERO SECTION (BRANDS & SPOTLIGHT) ───────────── */}
      <BrandHeroSection companies={companies} loading={loadingCompanies} />

      {/* ───────────── 2. DAILY OFFERS (FLASH SALE) ───────────── */}
      <DailyOffersSection />

      {/* ───────────── 3. CATEGORIZED PRODUCT SECTIONS (4 ITEMS EACH) ───────────── */}
      {loadingCategories ? (
        // Skeleton loader for 2 initial category sections while fetching
        <div className="py-16 mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
          {[1, 2].map((n) => (
            <div key={n} className="space-y-6 animate-pulse">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <div className="h-5 w-28 bg-surface rounded-full" />
                  <div className="h-8 w-48 bg-surface rounded-xl" />
                </div>
                <div className="h-5 w-32 bg-surface rounded-full" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-surface rounded-2xl border border-border"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : categories.length > 0 ? (
        categories.map((cat, idx) => (
          <CategoryProductSection
            key={cat._id}
            category={cat}
            products={productsByCategory[cat.name] || []}
            loading={loadingProducts}
            index={idx}
          />
        ))
      ) : null}

      {/* ───────────── 4. VALUES / WHY CHOOSE US ───────────── */}
      <section className="py-24 border-y border-border bg-surface/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-foreground">
              {t("home.whyChoose")}{" "}
              <span className="gradient-text">
                {t("home.whyChooseBrand", { shopName: websiteName })}
              </span>
              {t("home.whyChooseSuffix")}
            </h2>
            <p className="text-muted max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
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
                desc: t("home.fastShippingDesc", {
                  price: String(freeDeliveryMinPrice),
                }),
              },
              {
                icon: ShieldCheck,
                title: t("home.secureShopping"),
                desc: t("home.secureShoppingDesc"),
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group relative rounded-3xl glass p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">
                  {title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 5. CTA BANNER ───────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border">
            <Image
              src="https://images.unsplash.com/photo-1676311396794-f14881e9daaa?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Shopping Banner"
              width={1400}
              height={600}
              className="w-full h-72 sm:h-80 lg:h-96 object-cover"
            />
            <div
              className={`absolute inset-0 ${
                dir === "rtl" ? "bg-gradient-to-l" : "bg-gradient-to-r"
              } from-background/95 via-background/80 to-transparent flex items-center`}
            >
              <div className="px-8 sm:px-14 max-w-lg">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground mb-4 leading-tight">
                  {t("home.ctaLine1")}
                  <br />
                  <span className="gradient-text">{t("home.ctaLine2")}</span>{" "}
                  {t("home.ctaLine3")}
                </h2>
                <p className="text-xs sm:text-sm text-muted mb-6 leading-relaxed">
                  {t("home.ctaDesc", { price: String(freeDeliveryMinPrice) })}
                </p>
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-600 px-8 py-3.5 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{t("home.shopNow")}</span>
                  <ArrowRight
                    className={`h-4 w-4 transition-transform ${
                      dir === "rtl"
                        ? "rotate-180 group-hover:-translate-x-1"
                        : "group-hover:translate-x-1"
                    }`}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
