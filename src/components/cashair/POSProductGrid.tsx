"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Search, X, Package, Tag, Building2, Plus, Check, RefreshCw } from "lucide-react";

export interface POSProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  image?: string;
  images?: string[];
  stock: number;
  category: string;
  company?: { _id?: string; name?: string; logo?: string } | string | null;
  barcode?: string;
}

interface POSProductGridProps {
  onAddToCart: (product: POSProduct) => boolean;
  getItemQuantityInCart: (productId: string) => number;
}

// FontAwesome Barcode Icon SVG
function FontAwesomeBarcodeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 512 512">
      <path d="M24 32C10.7 32 0 42.7 0 56V456c0 13.3 10.7 24 24 24H64c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H24zM128 56V456c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24zM240 32c-13.3 0-24 10.7-24 24V456c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H240zM352 56V456c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H376c-13.3 0-24 10.7-24 24zM448 32c-13.3 0-24 10.7-24 24V456c0 13.3 10.7 24 24 24h40c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H448z"/>
    </svg>
  );
}

export default function POSProductGrid({
  onAddToCart,
  getItemQuantityInCart,
}: POSProductGridProps) {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cashair/products?limit=200");
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setError(data.error || "فشل تحميل المنتجات");
      }
    } catch {
      setError("خطأ في شبكة الاتصال أثناء تحميل الكتالوج");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle hardware Barcode Scan submission
  const handleBarcodeScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Search for product by exact barcode match or fallback to name/ID
    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.trim() === code) ||
        p._id === code ||
        p.name.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
      const added = onAddToCart(matched);
      if (added) {
        setScanSuccessMessage(`تمت إضافة "${matched.name}" للسلة تلقائياً عبر الباركود!`);
        setTimeout(() => setScanSuccessMessage(null), 2500);
      }
    } else {
      // Fallback: set search term to show filtered options
      setSearchTerm(code);
    }
    setBarcodeInput("");
  };

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Unique companies / brands
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.company && typeof p.company === "object" && p.company._id && p.company.name) {
        map.set(p.company._id, p.company.name);
      } else if (typeof p.company === "string") {
        map.set(p.company, p.company);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }
      if (selectedCompany !== "all") {
        const compId = typeof p.company === "object" ? p.company?._id : p.company;
        if (compId !== selectedCompany) return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(term);
        const matchesBarcode = p.barcode?.toLowerCase().includes(term);
        const matchesDesc = p.description?.toLowerCase().includes(term);
        const matchesCat = p.category?.toLowerCase().includes(term);
        if (!matchesName && !matchesBarcode && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedCompany, searchTerm]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-2.5 sm:p-4 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Top Search & Filter Toolbar */}
      <div className="space-y-2.5 pb-2.5 sm:pb-3 border-b border-slate-800/70 shrink-0">
        {/* Hardware Barcode Scanner Direct Input */}
        <form onSubmit={handleBarcodeScanSubmit} className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative flex-1">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400">
              <FontAwesomeBarcodeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </span>
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="امسح الباركود بجهاز السكانر للإضافة المباشرة..."
              className="w-full pr-9 sm:pr-10 pl-3 py-1.5 sm:py-2 bg-amber-950/20 border border-amber-500/40 rounded-xl text-amber-300 placeholder-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono text-xs shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <FontAwesomeBarcodeIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إضافة بقارئ الباركود</span>
            <span className="sm:hidden">إضافة</span>
          </button>
        </form>

        {/* Scan Notification Banner */}
        {scanSuccessMessage && (
          <div className="p-2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{scanSuccessMessage}</span>
          </div>
        )}

        {/* Search Input & Refresh Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المنتج، كود الباركود، الوصف، أو القسم..."
              className="w-full pr-10 pl-9 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 text-xs transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-amber-400 font-bold text-xs rounded-xl border border-slate-700/80 hover:border-amber-500/40 transition-all shrink-0 flex items-center gap-1.5 shadow-sm disabled:opacity-50 active:scale-95"
            title="تحديث قائمة المنتجات والأسعار والمخزون"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0 flex-nowrap min-w-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategory === "all"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            جميع الأقسام ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Company / Brand Filter Pills */}
        {companies.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none shrink-0 flex-nowrap min-w-0">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 font-medium ml-1">
              <Building2 className="w-3 h-3 text-amber-400" /> الماركة:
            </span>
            <button
              onClick={() => setSelectedCompany("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedCompany === "all"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950/40 hover:bg-slate-800 text-slate-400 border border-slate-800"
              }`}
            >
              جميع الماركات
            </button>
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCompany(c.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                  selectedCompany === c.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-950/40 hover:bg-slate-800 text-slate-400 border border-slate-800"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700/60 scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium">جاري تحميل الكتالوج...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-rose-400 gap-3">
            <p className="text-xs font-medium">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition-all"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-2">
            <Package className="w-10 h-10 text-slate-600 stroke-[1.5]" />
            <p className="text-xs font-semibold text-slate-300">لا توجد نتائج مطابقة</p>
            <p className="text-[11px] text-slate-500">جرب البحث بكلمات مختلفة أو تغيير الفلاتر</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 pb-20 lg:pb-4">
            {filteredProducts.map((product) => {
              const qtyInCart = getItemQuantityInCart(product._id);
              const companyName =
                typeof product.company === "object" ? product.company?.name : null;
              const remainingStock = Math.max(0, product.stock - qtyInCart);
              const isOutOfStock = product.stock <= 0 || remainingStock <= 0;
              const isLowStock = remainingStock > 0 && remainingStock <= 5;

              return (
                <div
                  key={product._id}
                  className={`group relative bg-slate-950/70 hover:bg-slate-900 border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5 ${
                    qtyInCart > 0
                      ? "border-amber-500/70 ring-1 ring-amber-500/40 bg-slate-900/90"
                      : "border-slate-800/90 hover:border-slate-700"
                  }`}
                >
                  {/* Floating Badges */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-950/90 text-rose-300 border border-rose-800/80 backdrop-blur-md shadow-sm">
                        نفدت الكمية
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-950/90 text-amber-300 border border-amber-800/80 backdrop-blur-md shadow-sm">
                        متبقي {remainingStock}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 backdrop-blur-md shadow-sm">
                        متوفر ({remainingStock})
                      </span>
                    )}
                  </div>

                  {/* Quantity in Cart Badge */}
                  {qtyInCart > 0 && (
                    <div className="absolute top-3 left-3 z-10 bg-amber-500 text-slate-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-amber-400">
                      <Check className="w-3 h-3 stroke-[3]" /> {qtyInCart}
                    </div>
                  )}

                  {/* Soft Integrated Product Image Card */}
                  <div className="relative w-full aspect-square bg-white rounded-xl p-2.5 flex items-center justify-center overflow-hidden shadow-inner border border-slate-200/20 mb-2">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={120}
                        height={120}
                        className="max-h-28 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <Package className="w-10 h-10 text-slate-300" />
                    )}
                  </div>

                  {/* Product Details Area */}
                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      {/* Category & Brand Pills */}
                      <div className="flex items-center gap-1 flex-wrap mb-1 text-[10px]">
                        <span className="text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50 font-medium">
                          {product.category}
                        </span>
                        {companyName && (
                          <span className="text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 font-semibold">
                            {companyName}
                          </span>
                        )}
                      </div>

                      {/* Product Title */}
                      <h3
                        className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors"
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                    </div>

                    {/* Price & Quick Add Button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-medium">السعر</span>
                        <span className="text-sm font-extrabold text-amber-400 tracking-tight">
                          {product.price.toLocaleString()}{" "}
                          <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                        </span>
                      </div>

                      <button
                        onClick={() => onAddToCart(product)}
                        disabled={isOutOfStock || qtyInCart >= product.stock}
                        className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                          isOutOfStock || qtyInCart >= product.stock
                            ? "bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-800"
                            : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold active:scale-95 shadow-md shadow-amber-500/20"
                        }`}
                        title={
                          isOutOfStock
                            ? "غير متوفر بالمخزن"
                            : qtyInCart >= product.stock
                            ? "تمت إضافة كل المتاح"
                            : "إضافة إلى السلة"
                        }
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
