"use client";

import Link from "next/link";
import { ChevronRight, ArrowRight, Tag } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useTranslation } from "@/i18n/LanguageContext";

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  featured: boolean;
  company?: { _id: string; name: string; logo: string } | string | null;
}

interface CategoryProductSectionProps {
  category: Category;
  products: Product[];
  loading?: boolean;
  index: number;
}

export default function CategoryProductSection({
  category,
  products,
  loading = false,
  index,
}: CategoryProductSectionProps) {
  const { t, dir } = useTranslation();
  const isEven = index % 2 === 0;

  // Don't render empty sections if not loading and 0 products
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section
      className={`py-16 sm:py-20 lg:py-24 transition-colors ${
        isEven ? "bg-background" : "bg-surface/50 border-y border-border/70"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold border border-primary/20">
                <Tag className="h-3 w-3" />
                <span>{category.name}</span>
              </span>
              {!loading && products.length > 0 && (
                <span className="text-xs text-muted font-medium">
                  {t("home.productsCount", { count: String(products.length) })}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              {category.name}
            </h2>

            {category.description && (
              <p className="text-xs sm:text-sm text-muted mt-1.5 max-w-xl line-clamp-1">
                {category.description}
              </p>
            )}
          </div>

          <Link
            href={`/products?category=${encodeURIComponent(category.name)}`}
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            <span>
              {t("home.viewAllInCategory", { category: category.name })}
            </span>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                dir === "rtl"
                  ? "rotate-180 group-hover:-translate-x-1"
                  : "group-hover:translate-x-1"
              }`}
            />
          </Link>
        </div>

        {/* Product Grid (4 Items) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card border border-border overflow-hidden animate-pulse flex flex-col"
              >
                <div className="aspect-square bg-surface" />
                <div className="p-3 sm:p-5 flex flex-1 flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/20 rounded w-3/4" />
                    <div className="h-3 bg-muted/20 rounded w-full" />
                  </div>
                  <div className="h-4 bg-muted/20 rounded w-1/3" />
                  <div className="h-9 bg-muted/20 rounded-xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.slice(0, 4).map((p) => (
                <ProductCard
                  key={p._id}
                  id={p._id}
                  name={p.name}
                  description={p.description}
                  price={p.price}
                  image={p.image}
                  category={p.category}
                  company={p.company ?? undefined}
                  stock={p.stock}
                />
              ))}
            </div>

            {/* Bottom Explore Button */}
            <div className="flex justify-center mt-10">
              <Link
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-xs sm:text-sm font-bold text-foreground transition-all duration-300 hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/20"
              >
                <span>
                  {t("home.exploreMoreCategory", { category: category.name })}
                </span>
                <ArrowRight
                  className={`h-4 w-4 transition-transform ${
                    dir === "rtl"
                      ? "rotate-180 group-hover:-translate-x-1"
                      : "group-hover:translate-x-1"
                  }`}
                />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12 rounded-2xl bg-surface/50 border border-border">
            <p className="text-sm text-muted">
              {t("home.noCategoryProducts")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
