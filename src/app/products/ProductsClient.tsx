"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
}

const PRODUCTS_PER_PAGE = 8;

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activePriceRange, setActivePriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const { t, locale } = useTranslation();
  const { priceRangeFilters } = useSiteSettings();
  const abortRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(["All", ...data.map((c: CategoryItem) => c.name)]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    params.set("page", String(currentPage));
    params.set("limit", String(PRODUCTS_PER_PAGE));

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
  }, [activeCategory, currentPage]);

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

  const activeFiltersCount =
    (activeCategory !== "All" ? 1 : 0) +
    (activePriceRange !== 0 ? 1 : 0) +
    (search ? 1 : 0);

  const clearAllFilters = () => {
    setSearch("");
    setActivePriceRange(0);
    setSortBy("default");
    // Only show loading skeleton if a new fetch will actually fire
    if (activeCategory !== "All" || currentPage !== 1) {
      setLoading(true);
      setActiveCategory("All");
      setCurrentPage(1);
    }
  };

  const handleCategoryChange = (cat: string) => {
    if (cat === activeCategory && currentPage === 1) return;
    setLoading(true);
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      setLoading(true);
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

  const getCategoryLabel = (cat: string) =>
    cat === "All" ? t("products.all") : cat;

  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            {t("products.title")}
          </h1>
          <p className="text-muted text-sm max-w-lg">
            {t("products.subtitle")}
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              aria-label={t("products.searchPlaceholder") || "Search products"}
              placeholder={t("products.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search input"
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
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
                className="appearance-none rounded-xl border border-border bg-surface px-4 py-2.5 pe-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              >
                <option value="default">{t("products.sortBy")}</option>
                <option value="price-asc">{t("products.priceLowHigh")}</option>
                <option value="price-desc">{t("products.priceHighLow")}</option>
                <option value="name">{t("products.nameAZ")}</option>
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label={t("products.filters") || "Toggle filters"}
              className="sm:hidden inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
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

        {/* Filters section */}
        <div className={`space-y-6 mb-10 ${showFilters ? "block" : "hidden sm:block"}`}>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              {t("products.category")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  aria-label={`Filter by category: ${getCategoryLabel(cat)}`}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-md shadow-primary/20"
                      : "glass text-muted hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              {t("products.priceRange")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((range, idx) => (
                <button
                  key={range.label}
                  onClick={() => setActivePriceRange(idx)}
                  aria-label={`Filter by price range: ${range.label}`}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    activePriceRange === idx
                      ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-md shadow-primary/20"
                      : "glass text-muted hover:text-foreground hover:border-primary/30"
                  }`} 
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count & Clear filters */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs text-muted">
              {pagination
                ? t("products.showing", {
                    start: Math.min((currentPage - 1) * PRODUCTS_PER_PAGE + 1, pagination.total),
                    end: Math.min(currentPage * PRODUCTS_PER_PAGE, pagination.total),
                    total: pagination.total,
                  })
                : t("products.productsFound", {
                    count: filteredProducts.length,
                    s: filteredProducts.length !== 1 ? "s" : "",
                  })}
              {activeCategory !== "All" && ` ${t("products.inCategory", { category: activeCategory })}`}
              {search && ` ${t("products.matching", { search })}`}
              {activePriceRange !== 0 && ` · ${priceRanges[activePriceRange].label}`}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                aria-label={t("products.clearAllFilters")}
                className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
              >
                {t("products.clearAllFilters")}
              </button>
            )}
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card border border-border overflow-hidden animate-pulse motion-reduce:animate-none flex flex-col"
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
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
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
        ) : (
          <div className="text-center py-24">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-surface mb-4">
              <Search className="h-8 w-8 text-muted" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("products.noProductsFound")}</h3>
            <p className="text-sm text-muted mb-6">
              {t("products.noProductsDesc")}
            </p>
            <button
              onClick={clearAllFilters}
              aria-label={t("products.clearFilters")}
              className="rounded-full glass px-5 py-2 text-sm font-medium text-foreground hover:border-primary/30 transition-all"
            >
              {t("products.clearFilters")}
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && !loading && (
          <div className="mt-12 flex items-center justify-center">
            <nav className="inline-flex items-center gap-1 rounded-2xl bg-card border border-border p-1.5" aria-label="Pagination">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-card-hover hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={t("products.firstPage")}
                aria-label={t("products.firstPage") || "First page"}
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-card-hover hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={t("products.previousPage")}
                aria-label={t("products.previousPage") || "Previous page"}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {getPageNumbers().map((pageNum, idx) =>
                pageNum === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-9 w-9 items-center justify-center text-xs text-muted"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum as number)}
                    aria-label={`Go to page ${pageNum}`}
                    className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-xl px-2 text-xs font-medium transition-all ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-md shadow-primary/20"
                        : "text-muted hover:bg-card-hover hover:text-foreground"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-card-hover hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={t("products.nextPage")}
                aria-label={t("products.nextPage") || "Next page"}
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => goToPage(pagination.totalPages)}
                disabled={currentPage === pagination.totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-card-hover hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={t("products.lastPage")}
                aria-label={t("products.lastPage") || "Last page"}
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
