"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tag,
  Award,
  Sparkles,
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
  company?: { _id: string; name: string; logo: string } | string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CategoryItem {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
}

interface CompanyItem {
  _id: string;
  name: string;
  logo: string;
  description?: string;
}

const PRODUCTS_PER_PAGE = 12;

export default function ProductsClient() {
  const searchParams = useSearchParams();

  // Read URL params
  const initialCompany = searchParams.get("company") || "All";
  const initialCategory = searchParams.get("category") || "All";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeCompany, setActiveCompany] = useState<string>(initialCompany);
  const [activePriceRange, setActivePriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const { t, locale, dir } = useTranslation();
  const { priceRangeFilters } = useSiteSettings();
  const abortRef = useRef<AbortController | null>(null);

  // Sync state when URL params change
  useEffect(() => {
    const urlCompany = searchParams.get("company") || "All";
    const urlCategory = searchParams.get("category") || "All";
    setActiveCompany(urlCompany);
    setActiveCategory(urlCategory);
    setCurrentPage(1);
  }, [searchParams]);

  // Update URL helper
  const updateUrlParams = useCallback(
    (newCat: string, newComp: string) => {
      const params = new URLSearchParams();
      if (newCat !== "All") params.set("category", newCat);
      if (newComp !== "All") params.set("company", newComp);
      const query = params.toString();
      const newUrl = query ? `/products?${query}` : "/products";
      window.history.replaceState(null, "", newUrl);
    },
    []
  );

  const priceRanges = useMemo(
    () => [
      { label: t("products.allPrices"), min: 0, max: Infinity },
      ...priceRangeFilters.map((f) => ({
        label: locale === "ar" ? f.labelAr : f.label,
        min: f.min,
        max: f.max === null ? Infinity : f.max,
      })),
    ],
    [t, locale, priceRangeFilters]
  );

  // 1. Fetch Categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const normalized = data.map((c) => ({
            ...c,
            name: c.name === "General" || c.name === "general" ? "عام" : c.name,
          }));
          const seen = new Set<string>();
          const unique = normalized.filter((c) => {
            if (seen.has(c.name)) return false;
            seen.add(c.name);
            return true;
          });
          setCategories(unique);
        }
      })
      .catch(console.error);
  }, []);

  // 2. Fetch Companies
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCompanies(data);
        }
      })
      .catch(console.error);
  }, []);

  // 3. Fetch Products based on Category & Company
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (activeCompany !== "All") params.set("company", activeCompany);
    
    // In categorized sections view (browsing all categories), fetch all catalog products (up to 100)
    // so every category displays its complete set of products rather than truncating at page 1
    const isAllCategories = activeCategory === "All";
    const fetchLimit = isAllCategories ? 100 : PRODUCTS_PER_PAGE;
    
    params.set("page", String(currentPage));
    params.set("limit", String(fetchLimit));

    fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          setPagination(data.pagination);
        } else if (Array.isArray(data)) {
          setProducts(data);
          setPagination(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeCategory, activeCompany, currentPage]);

  // Client-side filtering for search, price, and sorting
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    const range = priceRanges[activePriceRange];
    if (range && activePriceRange !== 0) {
      filtered = filtered.filter(
        (p) => p.price >= range.min && p.price < range.max
      );
    }

    if (sortBy === "price-asc") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [products, search, activePriceRange, sortBy, priceRanges]);

  // Group products by category when viewing "All" categories without search/price filters
  const isCategorizedSectionsView =
    activeCategory === "All" &&
    !search &&
    activePriceRange === 0 &&
    sortBy === "default" &&
    currentPage === 1;

  const categorizedGroups = useMemo(() => {
    if (!isCategorizedSectionsView) return [];

    const map = new Map<string, Product[]>();
    for (const p of filteredProducts) {
      let cat = p.category || "عام";
      if (cat === "General" || cat === "general") cat = "عام";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }

    return Array.from(map.entries()).map(([catName, prods]) => ({
      categoryName: catName,
      products: prods,
    }));
  }, [isCategorizedSectionsView, filteredProducts]);

  const categoryIconMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => {
      const name = (cat.name === "General" || cat.name === "general") ? "عام" : cat.name;
      if (name && cat.icon) {
        map.set(name, cat.icon);
        map.set(cat.name, cat.icon);
      }
    });
    return map;
  }, [categories]);

  const activeFiltersCount =
    (activeCategory !== "All" ? 1 : 0) +
    (activeCompany !== "All" ? 1 : 0) +
    (activePriceRange !== 0 ? 1 : 0) +
    (search ? 1 : 0);

  const clearAllFilters = () => {
    setSearch("");
    setActivePriceRange(0);
    setSortBy("default");
    setActiveCategory("All");
    setActiveCompany("All");
    setCurrentPage(1);
    updateUrlParams("All", "All");
  };

  const handleCategoryChange = (cat: string) => {
    if (cat === activeCategory && currentPage === 1) return;
    setActiveCategory(cat);
    setCurrentPage(1);
    updateUrlParams(cat, activeCompany);
  };

  const handleCompanyChange = (comp: string) => {
    if (comp === activeCompany && currentPage === 1) return;
    setActiveCompany(comp);
    setCurrentPage(1);
    updateUrlParams(activeCategory, comp);
  };

  const goToPage = (page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    if (!pagination) return [];
    const { totalPages } = pagination;
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const activeCompanyObj = companies.find((c) => c._id === activeCompany);

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header Title */}
        <div className="mb-10 text-start">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold border border-primary/20">
              <Sparkles className="h-3 w-3" />
              <span>{t("products.title")}</span>
            </span>
            {activeCompanyObj && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-bold text-foreground border border-border">
                {activeCompanyObj.logo && (
                  <Image
                    src={activeCompanyObj.logo}
                    alt={activeCompanyObj.name}
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 object-contain rounded-full mix-blend-multiply"
                    unoptimized
                  />
                )}
                <span>{activeCompanyObj.name}</span>
                <button
                  onClick={() => handleCompanyChange("All")}
                  aria-label="Remove brand filter"
                  className="ms-1 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {activeCategory !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-bold text-foreground border border-border">
                <Tag className="h-3 w-3 text-primary" />
                <span>{activeCategory}</span>
                <button
                  onClick={() => handleCategoryChange("All")}
                  aria-label="Remove category filter"
                  className="ms-1 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-3">
            {activeCompanyObj
              ? `منتجات ${activeCompanyObj.name}`
              : activeCategory !== "All"
              ? `قسم ${activeCategory}`
              : t("products.title")}
          </h1>

          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            {activeCompanyObj?.description || t("products.subtitle")}
          </p>
        </div>

        {/* Search, Sort & Mobile Filters Toggle Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              aria-label={t("products.searchPlaceholder") || "Search products"}
              placeholder={t("products.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface ps-10 pe-10 py-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search input"
                className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <select
                value={sortBy}
                aria-label={t("products.sortBy") || "Sort products"}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none rounded-2xl border border-border bg-surface px-5 py-3 pe-11 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all cursor-pointer"
              >
                <option value="default">{t("products.sortBy")}</option>
                <option value="price-asc">{t("products.priceLowHigh")}</option>
                <option value="price-desc">{t("products.priceHighLow")}</option>
                <option value="name">{t("products.nameAZ")}</option>
              </select>
              <ChevronDown className="absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label={t("products.filters") || "Toggle filters"}
              className="sm:hidden inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("products.filters")}
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ───────────── FILTERS CONTAINER ───────────── */}
        <div
          className={`space-y-6 mb-10 p-6 rounded-3xl bg-surface/50 border border-border/80 ${
            showFilters ? "block" : "hidden sm:block"
          }`}
        >
          {/* 1. Companies / Brands Filter */}
          {companies.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Award className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t("products.company")}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCompanyChange("All")}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeCompany === "All"
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {t("products.allCompanies")}
                </button>
                {companies.map((comp) => (
                  <button
                    key={comp._id}
                    onClick={() => handleCompanyChange(comp._id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      activeCompany === comp._id
                        ? "bg-primary text-white shadow-sm shadow-primary/20 border border-primary"
                        : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {comp.logo && (
                      <Image
                        src={comp.logo}
                        alt={comp.name}
                        width={16}
                        height={16}
                        className={`h-4 w-4 object-contain rounded-full ${
                          activeCompany === comp._id ? "bg-white/90 p-0.5" : "mix-blend-multiply grayscale"
                        }`}
                        unoptimized
                      />
                    )}
                    <span>{comp.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Category Filter */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("products.category")}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange("All")}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeCategory === "All"
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                }`}
              >
                {t("products.allCategories")}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeCategory === cat.name
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {cat.icon && (
                    <Image
                      src={cat.icon}
                      alt={cat.name}
                      width={16}
                      height={16}
                      className={`h-4 w-4 object-contain rounded-full ${
                        activeCategory === cat.name ? "bg-white/90 p-0.5" : "mix-blend-multiply"
                      }`}
                      unoptimized
                    />
                  )}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Price Range Filter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
              {t("products.priceRange")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((range, idx) => (
                <button
                  key={range.label}
                  onClick={() => setActivePriceRange(idx)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activePriceRange === idx
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count & Clear filters bar */}
        {!loading && (
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <p className="text-xs sm:text-sm text-muted font-medium">
              {t("products.productsFound", {
                count: activeCategory === "All" && !search && activePriceRange === 0 && pagination
                  ? pagination.total
                  : filteredProducts.length,
                s:
                  (activeCategory === "All" && !search && activePriceRange === 0 && pagination
                    ? pagination.total
                    : filteredProducts.length) !== 1
                    ? "s"
                    : "",
              })}
              {activeCategory !== "All" && ` · ${activeCategory}`}
              {activeCompanyObj && ` · ${activeCompanyObj.name}`}
              {search && ` · ${t("products.matching", { search })}`}
              {activePriceRange !== 0 &&
                ` · ${priceRanges[activePriceRange].label}`}
            </p>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                aria-label={t("products.clearAllFilters")}
                className="text-xs sm:text-sm font-bold text-primary hover:underline transition-all cursor-pointer"
              >
                {t("products.clearAllFilters")}
              </button>
            )}
          </div>
        )}

        {/* ───────────── PRODUCT DISPLAY ───────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-card border border-border overflow-hidden animate-pulse flex flex-col"
              >
                <div className="aspect-square bg-surface" />
                <div className="p-4 sm:p-5 flex flex-1 flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/20 rounded w-3/4" />
                    <div className="h-3 bg-muted/20 rounded w-full" />
                  </div>
                  <div className="h-4 bg-muted/20 rounded w-1/3" />
                  <div className="h-10 bg-muted/20 rounded-2xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 rounded-3xl bg-surface/40 border border-border">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-surface mb-4">
              <Search className="h-8 w-8 text-muted" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {t("products.noProductsFound")}
            </h3>
            <p className="text-sm text-muted mb-6">
              {t("products.noProductsDesc")}
            </p>
            <button
              onClick={clearAllFilters}
              aria-label={t("products.clearFilters")}
              className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
            >
              {t("products.clearFilters")}
            </button>
          </div>
        ) : isCategorizedSectionsView && categorizedGroups.length > 0 ? (
          /* ───────────── CATEGORY SECTIONS VIEW ───────────── */
          <div className="space-y-16">
            {categorizedGroups.map(({ categoryName, products: catProds }) => {
              const catIcon = categoryIconMap.get(categoryName);
              return (
                <section
                  key={categoryName}
                  className="p-6 sm:p-8 rounded-3xl bg-surface/30 border border-border/80"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/70">
                    <div className="flex items-center gap-3.5">
                      {catIcon ? (
                        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 flex items-center justify-center">
                          <Image
                            src={catIcon}
                            alt={categoryName}
                            width={64}
                            height={64}
                            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 hover:scale-105"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Tag className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                          {categoryName}
                        </h2>
                        <span className="text-xs text-muted font-medium block mt-0.5">
                          ({catProds.length} منتج متوفر)
                        </span>
                      </div>
                    </div>

                  <button
                    onClick={() => handleCategoryChange(categoryName)}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-primary hover:underline cursor-pointer"
                  >
                    <span>عرض المزيد في {categoryName}</span>
                    <ChevronRight
                      className={`h-4 w-4 ${
                        dir === "rtl" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Products Grid for this category (Preview up to 4 items) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {catProds.slice(0, 4).map((p) => (
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
              </section>
            );
          })}
          </div>
        ) : (
          /* ───────────── STANDARD FILTERED PRODUCT GRID ───────────── */
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((p) => (
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

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center">
                <nav
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-card border border-border p-2 shadow-xs"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t("products.firstPage")}
                    aria-label={t("products.firstPage") || "First page"}
                  >
                    <ChevronsLeft
                      className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                    />
                  </button>

                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t("products.previousPage")}
                    aria-label={t("products.previousPage") || "Previous page"}
                  >
                    <ChevronLeft
                      className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                    />
                  </button>

                  {getPageNumbers().map((pageNum, idx) =>
                    pageNum === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="flex h-9 w-9 items-center justify-center text-xs text-muted font-bold"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum as number)}
                        aria-label={`Go to page ${pageNum}`}
                        className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-xl px-2 text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-primary text-white shadow-xs"
                            : "text-muted hover:bg-surface hover:text-foreground"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t("products.nextPage")}
                    aria-label={t("products.nextPage") || "Next page"}
                  >
                    <ChevronRight
                      className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                    />
                  </button>

                  <button
                    onClick={() => goToPage(pagination.totalPages)}
                    disabled={currentPage === pagination.totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t("products.lastPage")}
                    aria-label={t("products.lastPage") || "Last page"}
                  >
                    <ChevronsRight
                      className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                    />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
