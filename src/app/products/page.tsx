"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import ProductCard from "@/components/ProductCard";

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

const categories = ["All", "Kitchen", "Decor", "Lighting", "Textiles", "Furniture", "Garden", "Electronics", "Fashion"];

const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under $25", min: 0, max: 25 },
  { label: "$25 - $50", min: 25, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "$100 - $200", min: 100, max: 200 },
  { label: "$200+", min: 200, max: Infinity },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activePriceRange, setActivePriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

  // Client-side filtering for search, price, and sorting
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    // Price range filter
    const range = priceRanges[activePriceRange];
    if (range && activePriceRange !== 0) {
      filtered = filtered.filter(
        (p) => p.price >= range.min && p.price < range.max
      );
    }

    // Sorting
    if (sortBy === "price-asc") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [products, search, activePriceRange, sortBy]);

  const activeFiltersCount =
    (activeCategory !== "All" ? 1 : 0) +
    (activePriceRange !== 0 ? 1 : 0) +
    (search ? 1 : 0);

  const clearAllFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setActivePriceRange(0);
    setSortBy("default");
  };

  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            Shop
          </h1>
          <p className="text-muted text-sm max-w-lg">
            Browse our curated collection of quality products. Filter by category,
            price range, or search to find exactly what you need.
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none rounded-xl border border-border bg-surface px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              >
                <option value="default">Sort by</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name">Name: A → Z</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            </div>

            {/* Mobile filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
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
          {/* Category pills */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-md shadow-primary/20"
                      : "glass text-muted hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price range pills */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Price Range
            </h3>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((range, idx) => (
                <button
                  key={range.label}
                  onClick={() => setActivePriceRange(idx)}
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
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
              {activeCategory !== "All" && ` in ${activeCategory}`}
              {search && ` matching "${search}"`}
              {activePriceRange !== 0 && ` · ${priceRanges[activePriceRange].label}`}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface animate-pulse aspect-[3/4]"
              />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
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
          <div className="text-center py-24">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-surface mb-4">
              <Search className="h-8 w-8 text-muted" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-sm text-muted mb-6">
              Try adjusting your search or filters to find what you&apos;re looking
              for.
            </p>
            <button
              onClick={clearAllFilters}
              className="rounded-full glass px-5 py-2 text-sm font-medium text-foreground hover:border-primary/30 transition-all"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
