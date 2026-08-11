"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/i18n/LanguageContext";

export interface Company {
  _id: string;
  name: string;
  logo: string;
  description?: string;
}

interface BrandHeroSectionProps {
  companies: Company[];
  loading?: boolean;
}

export default function BrandHeroSection({
  companies,
  loading = false,
}: BrandHeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="relative pt-24 sm:pt-28 pb-6 sm:pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0f295a] dark:text-blue-400">
            {t("home.ourBrands")}
          </h2>
        </div>

        {/* Brands Table Grid */}
        {loading ? (
          <div className="rounded-xl border border-border bg-border overflow-hidden shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center bg-white dark:bg-card p-4 sm:p-6 h-28 sm:h-32 md:h-36 animate-pulse"
                >
                  <div className="h-10 w-24 sm:h-12 sm:w-28 bg-slate-200 dark:bg-surface rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ) : companies.length > 0 ? (
          <div className="rounded-xl border border-border bg-border overflow-hidden shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px">
              {companies.map((comp) => (
                <Link
                  key={comp._id}
                  href={`/products?company=${comp._id}`}
                  title={comp.name}
                  className="group relative flex items-center justify-center bg-white dark:bg-card p-4 sm:p-6 h-28 sm:h-32 md:h-36 transition-all duration-300 hover:bg-slate-50/90 dark:hover:bg-surface/80 cursor-pointer"
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={comp.logo}
                      alt={comp.name}
                      width={160}
                      height={70}
                      className="max-h-12 sm:max-h-16 max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl bg-surface/50 border border-border">
            <p className="text-sm text-muted">{t("home.noCompanies")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
