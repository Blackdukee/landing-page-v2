"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  RefreshCw,
  PackagePlus,
  Tag,
  Building2,
  DollarSign,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import AddProductModal from "./AddProductModal";

// FontAwesome Barcode Icon SVG
function FontAwesomeBarcodeIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 512 512">
      <path d="M24 32C10.7 32 0 42.7 0 56V456c0 13.3 10.7 24 24 24H64c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H24zM128 56V456c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24zM240 32c-13.3 0-24 10.7-24 24V456c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H240zM352 56V456c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H376c-13.3 0-24 10.7-24 24zM448 32c-13.3 0-24 10.7-24 24V456c0 13.3 10.7 24 24 24h40c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H448z"/>
    </svg>
  );
}

export default function POSProductsTab() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Edit Product state
  const [productToEdit, setProductToEdit] = useState<any | null>(null);

  // Categories & Companies for dropdowns
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>([]);

  // Add/Edit Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المنتج "${name}" نهائياً من الكتالوج وقاعدة البيانات؟`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
      }
    } catch {
      // Ignore error
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/cashair/products?limit=100`;
      if (search.trim()) url += `&q=${encodeURIComponent(search.trim())}`;
      if (categoryFilter !== "all") url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (companyFilter !== "all") url += `&company=${companyFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setTotalCount(data.total || 0);

        // Extract unique categories
        const cats = Array.from(
          new Set((data.products || []).map((p: any) => p.category).filter(Boolean))
        ) as string[];
        setCategoriesList(cats);
      }
    } catch {
      // Ignore error
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCompaniesList(data);
      }
    } catch {
      // Ignore error
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCompanies();
  }, [categoryFilter, companyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            إدارة كتالوج المنتجات والمخزون (Products Catalog)
          </h2>
          <p className="text-xs text-slate-400">
            تصفح وإضافة وتعديل أصناف المتجر الإلكتروني والكاشير ({totalCount} منتج مسجل)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
          >
            <PackagePlus className="w-4 h-4" /> إضافة منتج جديد
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="my-4 flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 no-print">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المنتج أو الكود أو الوصف..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            بحث
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">كافة الأقسام</option>
            {categoriesList.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">كافة الماركات</option>
            {companiesList.map((comp) => (
              <option key={comp._id} value={comp._id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-72 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm font-medium">جاري تحميل الأصناف والمخزون...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 text-slate-500 gap-2">
          <Package className="w-12 h-12 stroke-[1.5]" />
          <p className="text-sm font-semibold">لا توجد منتجات تطابق البحث والفلتر</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400">
                <th className="py-3 px-3">المنتج</th>
                <th className="py-3 px-3">القسم</th>
                <th className="py-3 px-3">الماركة</th>
                <th className="py-3 px-3">سعر البيع</th>
                <th className="py-3 px-3 text-center">المخزون الحالي</th>
                <th className="py-3 px-3 text-center">حالة الصنف</th>
                <th className="py-3 px-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {products.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const isLowStock = prod.stock > 0 && prod.stock <= 5;
                const companyName =
                  typeof prod.company === "object" && prod.company !== null
                    ? prod.company.name
                    : "---";

                return (
                  <tr key={prod._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image || "/placeholder.png"}
                          alt={prod.name}
                          className="w-10 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).setAttribute("style", "display:none;");
                          }}
                        />
                        <div>
                          <p className="font-bold text-slate-100 flex items-center gap-1.5">
                            {prod.name}
                            {prod.featured && (
                              <span title="منتج مميز">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 inline" />
                              </span>
                            )}
                          </p>
                          {prod.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">
                              {prod.description}
                            </p>
                          )}
                          {prod.barcode && (
                            <span className="text-[10px] font-mono text-amber-400/90 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 inline-flex items-center gap-1 mt-0.5 dir-ltr">
                              <FontAwesomeBarcodeIcon className="w-3 h-3 text-amber-400" />
                              <span>{prod.barcode}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-semibold">
                        <Tag className="w-3 h-3 text-cyan-400" />
                        {prod.category || "عام"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">{companyName}</td>
                    <td className="py-3 px-3 font-extrabold text-emerald-400 text-sm">
                      {(prod.price || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-3 text-center font-black text-sm">
                      <span
                        className={
                          isOutOfStock
                            ? "text-rose-400"
                            : isLowStock
                            ? "text-amber-400"
                            : "text-slate-100"
                        }
                      >
                        {prod.stock} قطعة
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> نفد المخزون
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> مخزون منخفض
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> متوفر بالمتجر
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setProductToEdit(prod);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700 transition-colors"
                          title="تعديل بيانات المنتج"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod._id, prod.name)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg border border-slate-700 transition-colors"
                          title="حذف المنتج نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        productToEdit={productToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setProductToEdit(null);
        }}
        onProductAdded={() => {
          fetchProducts();
        }}
      />
    </div>
  );
}
