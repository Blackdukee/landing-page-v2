"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Save,
  Package,
  ChevronDown,
  ArrowUpDown,
  Upload,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/en";

interface Company {
  _id: string;
  name: string;
  logo: string;
  description?: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  image: string;
  images: string[];
  imageFileIds: string[];
  stock: number;
  category: string;
  company?: { _id: string; name: string; logo: string } | string | null;
  featured: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const emptyProduct = {
  name: "",
  description: "",
  price: 0,
  costPrice: 0,
  image: "",
  images: [] as string[],
  imageFileIds: [] as string[],
  stock: 0,
  category: "عام",
  company: "",
  featured: false,
};

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  // Track newly uploaded fileIds for cleanup on cancel
  const newUploadsRef = useRef<{ url: string; fileId: string }[]>([]);
  const originalImagesRef = useRef<string[]>([]);

  const fetchProducts = () => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch(console.error);
  }, []);

  const categoryNames = useMemo(() => {
    const list = categories.map((c) => c.name).filter(Boolean);
    const unique = Array.from(new Set(list));
    if (unique.length === 0) unique.push("عام");
    return unique;
  }, [categories]);

  const filtered = useMemo(() => {
    let result = products;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Category filter
    if (filterCategory !== "All") {
      result = result.filter((p) => p.category === filterCategory);
    }

    // Sort
    if (sortBy === "name-asc") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "stock-asc") {
      result = [...result].sort((a, b) => a.stock - b.stock);
    } else if (sortBy === "stock-desc") {
      result = [...result].sort((a, b) => b.stock - a.stock);
    }

    return result;
  }, [products, search, filterCategory, sortBy]);

  const cleanupUploads = useCallback(async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds }),
      });
    } catch {
      // best-effort cleanup
    }
  }, []);

  const closeModal = useCallback(async (saved: boolean) => {
    if (!saved) {
      // Delete only newly uploaded images that are not part of the original product
      const origSet = new Set(originalImagesRef.current);
      const orphanIds = newUploadsRef.current
        .filter((u) => !origSet.has(u.url))
        .map((u) => u.fileId);
      cleanupUploads(orphanIds);
    }
    newUploadsRef.current = [];
    originalImagesRef.current = [];
    setShowModal(false);
  }, [cleanupUploads]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyProduct,
      category: categories[0]?.name || "عام",
    });
    setUploadError("");
    setDragOver(false);
    newUploadsRef.current = [];
    originalImagesRef.current = [];
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    const imgs = product.images || (product.image ? [product.image] : []);
    const fileIds = product.imageFileIds || [];
    const companyId =
      typeof product.company === "object" && product.company !== null
        ? product.company._id
        : typeof product.company === "string"
        ? product.company
        : "";
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice || 0,
      image: product.image,
      images: imgs,
      imageFileIds: fileIds,
      stock: product.stock,
      category: product.category === "General" ? "عام" : (product.category || "عام"),
      company: companyId,
      featured: product.featured,
    });
    setUploadError("");
    setDragOver(false);
    newUploadsRef.current = [];
    originalImagesRef.current = [...imgs];
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.images.length === 0) {
      setUploadError(t("admin.products.uploadImage" as TranslationKey));
      return;
    }
    setSaving(true);

    try {
      const url = editing
        ? `/api/products/${editing._id}`
        : "/api/products";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          company: form.company || null,
          image: form.images[0] || form.image,
          imageFileIds: form.imageFileIds,
        }),
      });

      if (res.ok) {
        fetchProducts();
        closeModal(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.products.deleteConfirm" as TranslationKey))) return;
    setDeleting(id);
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      fetchProducts();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  // filtered is now computed via useMemo above

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }

      // Track this upload for potential cleanup
      if (data.fileId) {
        newUploadsRef.current.push({ url: data.url, fileId: data.fileId });
      }

      setForm((prev) => {
        const newImages = [...prev.images, data.url];
        const newFileIds = [...prev.imageFileIds, data.fileId || ""];
        return { ...prev, images: newImages, imageFileIds: newFileIds, image: newImages[0] };
      });
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const removedUrl = prev.images[index];
      // If this was a newly uploaded image, delete it from ImageKit immediately
      const uploadEntry = newUploadsRef.current.find((u) => u.url === removedUrl);
      if (uploadEntry) {
        cleanupUploads([uploadEntry.fileId]);
        newUploadsRef.current = newUploadsRef.current.filter((u) => u.url !== removedUrl);
      }
      const newImages = prev.images.filter((_, i) => i !== index);
      const newFileIds = prev.imageFileIds.filter((_, i) => i !== index);
      return { ...prev, images: newImages, imageFileIds: newFileIds, image: newImages[0] || "" };
    });
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => handleImageUpload(file));
    }
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .forEach((file) => handleImageUpload(file));
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.products.title" as TranslationKey)}</h1>
          <p className="text-sm text-muted mt-1">
            {t("admin.products.subtitle" as TranslationKey)}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          {t("admin.products.addProduct" as TranslationKey)}
        </button>
      </div>

      {/* Search, Filter & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder={t("admin.products.searchPlaceholder" as TranslationKey)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none rounded-xl border border-border bg-surface text-foreground px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all capitalize"
          >
            <option value="All">{t("admin.products.allCategories" as TranslationKey)}</option>
            {categoryNames.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-xl border border-border bg-surface text-foreground px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          >
            <option value="default">{t("admin.products.sortDefault" as TranslationKey)}</option>
            <option value="name-asc">{t("admin.products.sortNameAZ" as TranslationKey)}</option>
            <option value="name-desc">{t("admin.products.sortNameZA" as TranslationKey)}</option>
            <option value="price-asc">{t("admin.products.sortPriceLow" as TranslationKey)}</option>
            <option value="price-desc">{t("admin.products.sortPriceHigh" as TranslationKey)}</option>
            <option value="stock-asc">{t("admin.products.sortStockLow" as TranslationKey)}</option>
            <option value="stock-desc">{t("admin.products.sortStockHigh" as TranslationKey)}</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-surface rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">
              {search ? t("admin.products.noMatch" as TranslationKey) : t("admin.products.noProducts" as TranslationKey)}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-start font-medium text-muted">
                    {t("admin.products.product" as TranslationKey)}
                  </th>
                  <th className="px-5 py-3 text-start font-medium text-muted">
                    {t("admin.products.category" as TranslationKey)} / {t("admin.products.brand" as TranslationKey)}
                  </th>
                  <th className="px-5 py-3 text-start font-medium text-muted">
                    سعر الشراء
                  </th>
                  <th className="px-5 py-3 text-start font-medium text-muted">
                    {t("admin.products.price" as TranslationKey)}
                  </th>
                  <th className="px-5 py-3 text-start font-medium text-muted">
                    الربح المتوقع
                  </th>
                  <th className="px-5 py-3 text-start font-medium text-muted">
                    {t("admin.products.stock" as TranslationKey)}
                  </th>
                  <th className="px-5 py-3 text-start font-medium text-muted">
                    {t("admin.products.featured" as TranslationKey)}
                  </th>
                  <th className="px-5 py-3 text-end font-medium text-muted">
                    {t("admin.products.actions" as TranslationKey)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => {
                  const cost = product.costPrice || 0;
                  const profit = product.price - cost;
                  const margin = product.price > 0 ? ((profit / product.price) * 100).toFixed(0) : "0";

                  return (
                  <tr key={product._id} className="hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-background border border-border">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[180px] text-foreground">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted">{product.category}</span>
                        {(() => {
                          const compObj =
                            typeof product.company === "object" && product.company !== null
                              ? product.company
                              : companies.find((c) => c._id === product.company);
                          if (!compObj) return null;
                          return (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
                              {compObj.logo && (
                                <Image
                                  src={compObj.logo}
                                  alt={compObj.name}
                                  width={14}
                                  height={14}
                                  className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                                  unoptimized
                                />
                              )}
                              <span>{compObj.name}</span>
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-amber-500 text-xs">
                      {cost > 0 ? `EGP ${cost.toFixed(2)}` : "---"}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-foreground">
                      EGP {product.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold">
                      {cost > 0 ? (
                        <span className={profit >= 0 ? "text-emerald-500 font-bold" : "text-danger font-black"}>
                          {profit > 0 ? "+" : ""}EGP {profit.toFixed(2)} ({margin}%)
                        </span>
                      ) : (
                        <span className="text-muted">---</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-medium ${
                          product.stock === 0
                            ? "text-danger"
                            : product.stock <= 5
                            ? "text-accent"
                            : "text-foreground"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          product.featured
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {product.featured ? t("admin.products.yes" as TranslationKey) : t("admin.products.no" as TranslationKey)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={deleting === product._id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-base text-foreground">
                {editing ? t("admin.products.editProduct" as TranslationKey) : t("admin.products.newProduct" as TranslationKey)}
              </h2>
              <button
                onClick={() => closeModal(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {t("admin.products.productName" as TranslationKey)}
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {t("admin.products.description" as TranslationKey)}
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-amber-400 mb-1.5">
                    سعر الشراء (التكلفة)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPrice ?? 0}
                    onChange={(e) => updateField("costPrice", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-amber-400 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    {t("admin.products.priceLabel" as TranslationKey)}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    {t("admin.products.stockLabel" as TranslationKey)}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.stock}
                    onChange={(e) => updateField("stock", parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
                </div>
              </div>

              {/* Expected Profit Indicator */}
              {form.price > 0 && (form.costPrice ?? 0) > 0 && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                    form.price >= (form.costPrice ?? 0)
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-danger/10 border-danger/30 text-danger font-bold"
                  }`}
                >
                  <span>
                    {form.price >= (form.costPrice ?? 0)
                      ? "صافي الربح المتوقع للقطعة:"
                      : "⚠️ تحذير: سعر البيع أقل من سعر الشراء (بيع بخسارة!)"}
                  </span>
                  <span className="font-mono font-bold">
                    EGP {(form.price - (form.costPrice ?? 0)).toFixed(2)} (
                    {form.price > 0
                      ? (((form.price - (form.costPrice ?? 0)) / form.price) * 100).toFixed(1)
                      : 0}
                    %)
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {t("admin.products.categoryLabel" as TranslationKey)}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                >
                  {categoryNames.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {t("admin.companies.name" as TranslationKey)}
                </label>
                <select
                  value={form.company}
                  onChange={(e) => updateField("company", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                >
                  <option value="">{t("admin.companies.none" as TranslationKey)}</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {t("admin.products.productImage" as TranslationKey)}
                </label>

                {/* Image thumbnails grid */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-border bg-background group aspect-square">
                        <Image
                          src={img}
                          alt={`Image ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="150px"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1.5 start-1.5 rounded-full bg-primary/80 px-2 py-0.5 text-[9px] font-semibold text-white">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 end-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hidden file input (always in DOM for re-upload) */}
                <input
                  id="product-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  multiple
                  onChange={onFileSelect}
                  className="hidden"
                />

                {/* Upload area — always visible to allow adding more */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-6 px-4 transition-all cursor-pointer ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-card-hover"
                  } ${uploading ? "pointer-events-none opacity-60" : ""}`}
                  onClick={() => document.getElementById("product-image-input")?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                      <p className="text-sm text-muted">{t("admin.products.uploading" as TranslationKey)}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
                        <Upload className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-0.5">
                        {form.images.length > 0 ? "Add more images" : t("admin.products.clickToUpload" as TranslationKey)}
                      </p>
                      <p className="text-xs text-muted">{t("admin.products.imageFormats" as TranslationKey)}</p>
                    </>
                  )}
                </div>

                {uploadError && (
                  <p className="text-xs text-red-400 mt-1.5">{uploadError}</p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => updateField("featured", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm">{t("admin.products.featuredProduct" as TranslationKey)}</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => closeModal(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                >
                  {t("admin.products.cancel" as TranslationKey)}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? t("admin.products.saving" as TranslationKey) : editing ? t("admin.products.update" as TranslationKey) : t("admin.products.create" as TranslationKey)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
