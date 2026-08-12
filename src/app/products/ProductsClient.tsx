"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Tag,
  Award,
  Sparkles,
  Loader2,
  CheckCircle2,
  LayoutGrid,
  List,
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // View Mode State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter States
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeCompany, setActiveCompany] = useState<string>(initialCompany);
  const [activePriceRange, setActivePriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [isScrolled, setIsScrolled] = useState(false);

  const { t, locale } = useTranslation();
  const { priceRangeFilters } = useSiteSettings();
  const abortRef = useRef<AbortController | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Track scroll position for sticky toolbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync state when URL params change
  useEffect(() => {
    const urlCompany = searchParams.get("company") || "All";
    const urlCategory = searchParams.get("category") || "All";
    setActiveCompany(urlCompany);
    setActiveCategory(urlCategory);
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

  // 3. Initial Fetch / Refetch when Category or Company changes
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setCurrentPage(1);
    setHasMore(true);

    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (activeCompany !== "All") params.set("company", activeCompany);
    params.set("page", "1");
    params.set("limit", String(PRODUCTS_PER_PAGE));

    fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          setPagination(data.pagination);
          setHasMore(data.pagination ? data.pagination.page < data.pagination.totalPages : false);
        } else if (Array.isArray(data)) {
          setProducts(data);
          setPagination(null);
          setHasMore(false);
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
  }, [activeCategory, activeCompany]);

  // 4. Fetch Next Page on Scroll
  const fetchMoreProducts = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (activeCompany !== "All") params.set("company", activeCompany);
    params.set("page", String(nextPage));
    params.set("limit", String(PRODUCTS_PER_PAGE));

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p._id));
            const uniqueNew = data.products.filter((p: Product) => !existingIds.has(p._id));
            return [...prev, ...uniqueNew];
          });
          setCurrentPage(nextPage);
          setPagination(data.pagination);
          setHasMore(data.pagination ? nextPage < data.pagination.totalPages : false);
        } else {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load more products:", err);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [loading, loadingMore, hasMore, currentPage, activeCategory, activeCompany]);

  // 5. Intersection Observer for Infinite Scrolling
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchMoreProducts();
        }
      },
      { rootMargin: "350px" }
    );

    const target = loadMoreTriggerRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, loadingMore, fetchMoreProducts]);

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
    (activeCompany !== "All" ? 1 : 0) +
    (activePriceRange !== 0 ? 1 : 0) +
    (search ? 1 : 0);

  const clearAllFilters = () => {
    setSearch("");
    setActivePriceRange(0);
    setSortBy("default");
    setActiveCategory("All");
    setActiveCompany("All");
    updateUrlParams("All", "All");
  };

  const handleCategoryChange = (cat: string) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
    updateUrlParams(cat, activeCompany);
  };

  const handleCompanyChange = (comp: string) => {
    if (comp === activeCompany) return;
    setActiveCompany(comp);
    updateUrlParams(activeCategory, comp);
  };

  const activeCompanyObj = companies.find((c) => c._id === activeCompany);

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="mb-6 sm:mb-8 text-start">
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
                  className="ms-1 hover:text-red-500 transition-colors cursor-pointer"
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
                  className="ms-1 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-2 sm:mb-3">
            {activeCompanyObj
              ? `منتجات ${activeCompanyObj.name}`
              : activeCategory !== "All"
              ? `قسم ${activeCategory}`
              : t("products.title")}
          </h1>

          <p className="text-xs sm:text-base text-muted max-w-2xl leading-relaxed">
            {activeCompanyObj?.description || t("products.subtitle")}
          </p>
        </div>

        {/* ───────────── STICKY SEARCH, SORT & FILTERS TOOLBAR ───────────── */}
        <div
          className={`sticky top-[64px] sm:top-[70px] z-30 transition-all duration-300 mb-6 ${
            isScrolled
              ? "bg-background/95 backdrop-blur-xl border-b border-border py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
              : "py-2"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 max-w-7xl mx-auto">
            {/* Search Input (Takes remaining space) */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input
                type="text"
                aria-label={t("products.searchPlaceholder") || "Search products"}
                placeholder={t("products.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 sm:h-11 rounded-2xl border border-border bg-surface ps-9 pe-9 text-xs sm:text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search input"
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-2xl border border-border bg-surface p-1 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Grid View"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="List View"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                aria-label={t("products.sortBy") || "Sort products"}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 sm:h-11 appearance-none rounded-2xl border border-border bg-surface ps-3 pe-8 text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all cursor-pointer max-w-[120px] sm:max-w-none"
              >
                <option value="default">{t("products.sortBy")}</option>
                <option value="price-asc">{t("products.priceLowHigh")}</option>
                <option value="price-desc">{t("products.priceHighLow")}</option>
                <option value="name">{t("products.nameAZ")}</option>
              </select>
              <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label={t("products.filters") || "Toggle filters"}
              className={`h-10 sm:h-11 shrink-0 inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border px-3 sm:px-4 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                showFilters || activeFiltersCount > 0
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-surface text-foreground hover:bg-card-hover"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">{t("products.filters")}</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* ───────────── EXPANDABLE FILTERS PANEL ───────────── */}
          {showFilters && (
            <div className="mt-3 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface border border-border/80 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
                    {t("products.filters")}
                  </h3>
                  {activeFiltersCount > 0 && (
                    <span className="text-xs text-primary font-bold">
                      ({activeFiltersCount})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      {t("products.clearAllFilters")}
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    aria-label="Close filters"
                    className="p-1 rounded-xl text-muted hover:text-foreground hover:bg-card transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 1. Companies / Brands Filter */}
              {companies.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                      {t("products.company")}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCompanyChange("All")}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeCompany === "All"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      {t("products.allCompanies")}
                    </button>
                    {companies.map((comp) => (
                      <button
                        key={comp._id}
                        onClick={() => handleCompanyChange(comp._id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                          activeCompany === comp._id
                            ? "bg-primary text-white shadow-xs border border-primary"
                            : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                        }`}
                      >
                        {comp.logo && (
                          <Image
                            src={comp.logo}
                            alt={comp.name}
                            width={16}
                            height={16}
                            className={`h-3.5 w-3.5 object-contain rounded-full ${
                              activeCompany === comp._id
                                ? "bg-white/90 p-0.5"
                                : "mix-blend-multiply grayscale"
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
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                    {t("products.category")}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategoryChange("All")}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      activeCategory === "All"
                        ? "bg-primary text-white shadow-xs"
                        : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {t("products.allCategories")}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => handleCategoryChange(cat.name)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeCategory === cat.name
                          ? "bg-primary text-white shadow-xs"
                          : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      {cat.icon && (
                        <Image
                          src={cat.icon}
                          alt={cat.name}
                          width={16}
                          height={16}
                          className={`h-3.5 w-3.5 object-contain rounded-full ${
                            activeCategory === cat.name
                              ? "bg-white/90 p-0.5"
                              : "mix-blend-multiply"
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                  {t("products.priceRange")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((range, idx) => (
                    <button
                      key={range.label}
                      onClick={() => setActivePriceRange(idx)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activePriceRange === idx
                          ? "bg-primary text-white shadow-xs"
                          : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results count & Clear filters bar */}
        {!loading && (
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <p className="text-xs sm:text-sm text-muted font-medium">
              {t("products.productsFound", {
                count: pagination ? pagination.total : filteredProducts.length,
                s:
                  (pagination ? pagination.total : filteredProducts.length) !== 1
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
          viewMode === "grid" ? (
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-border/40 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[1px]">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card flex flex-col h-full p-4 sm:p-5 animate-pulse justify-between space-y-3 rounded-none"
                >
                  <div className="aspect-square bg-surface rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted/20 rounded w-3/4 mx-auto" />
                    <div className="h-3 bg-muted/20 rounded w-full" />
                  </div>
                  <div className="h-4 bg-muted/20 rounded w-1/3 mx-auto" />
                  <div className="h-10 bg-muted/20 rounded-lg w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-card border border-border p-4 animate-pulse flex flex-col sm:flex-row gap-4 items-center"
                >
                  <div className="w-full sm:w-48 aspect-square bg-surface rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3 w-full">
                    <div className="h-3 bg-muted/20 rounded w-1/4" />
                    <div className="h-4 bg-muted/20 rounded w-1/2" />
                    <div className="h-3 bg-muted/20 rounded w-3/4" />
                    <div className="h-10 bg-muted/20 rounded-2xl w-32" />
                  </div>
                </div>
              ))}
            </div>
          )
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
        ) : (
          <>
            {/* Products Display */}
            {viewMode === "grid" ? (
              <div className="border border-border/80 rounded-2xl overflow-hidden bg-border/40 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[1px]">
                {filteredProducts.map((p) => (
                  <div key={p._id} className="bg-card flex flex-col h-full">
                    <ProductCard
                      id={p._id}
                      name={p.name}
                      description={p.description}
                      price={p.price}
                      image={p.image}
                      category={p.category}
                      company={p.company ?? undefined}
                      stock={p.stock}
                      viewMode="grid"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
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
                    viewMode="list"
                  />
                ))}
              </div>
            )}

            {/* Loading More Skeletons */}
            {loadingMore && (
              viewMode === "grid" ? (
                <div className="border border-border/80 rounded-2xl overflow-hidden bg-border/40 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[1px] mt-6">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-card flex flex-col h-full p-4 sm:p-5 animate-pulse justify-between space-y-3 rounded-none"
                    >
                      <div className="aspect-square bg-surface rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted/20 rounded w-3/4 mx-auto" />
                        <div className="h-3 bg-muted/20 rounded w-full" />
                      </div>
                      <div className="h-4 bg-muted/20 rounded w-1/3 mx-auto" />
                      <div className="h-10 bg-muted/20 rounded-lg w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-6">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-card border border-border p-4 animate-pulse flex flex-col sm:flex-row gap-4 items-center"
                    >
                      <div className="w-full sm:w-48 aspect-square bg-surface rounded-xl shrink-0" />
                      <div className="flex-1 space-y-3 w-full">
                        <div className="h-3 bg-muted/20 rounded w-1/4" />
                        <div className="h-4 bg-muted/20 rounded w-1/2" />
                        <div className="h-3 bg-muted/20 rounded w-3/4" />
                        <div className="h-10 bg-muted/20 rounded-2xl w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Infinite Scroll Sentinel */}
            <div ref={loadMoreTriggerRef} className="h-10 w-full pointer-events-none" />

            {/* End of list completion indicator */}
            {!hasMore && filteredProducts.length > 0 && (
              <div className="mt-12 mb-6 flex flex-col items-center justify-center text-center py-6 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{t("products.reachedEnd")}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
