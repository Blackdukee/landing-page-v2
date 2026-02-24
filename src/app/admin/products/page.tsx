"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Save,
  Package,
  ImageIcon,
  ChevronDown,
  ArrowUpDown,
  Upload,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/en";

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

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const emptyProduct = {
  name: "",
  description: "",
  price: 0,
  image: "",
  stock: 0,
  category: "General",
  featured: false,
};

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  }, []);

  const categoryNames = useMemo(
    () => categories.map((c) => c.name),
    [categories]
  );

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
    }

    return result;
  }, [products, search, filterCategory, sortBy]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setUploadError("");
    setDragOver(false);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      stock: product.stock,
      category: product.category,
      featured: product.featured,
    });
    setUploadError("");
    setDragOver(false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) {
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
        body: JSON.stringify(form),
      });

      if (res.ok) {
        fetchProducts();
        setShowModal(false);
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
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }

      updateField("image", data.url);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleImageUpload(file);
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
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.products.product" as TranslationKey)}
                  </th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.products.category" as TranslationKey)}
                  </th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.products.price" as TranslationKey)}
                  </th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.products.stock" as TranslationKey)}
                  </th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.products.featured" as TranslationKey)}
                  </th>
                  <th className="text-end px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.products.actions" as TranslationKey)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => (
                  <tr key={product._id} className="hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-surface shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[180px] text-foreground">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted">{product.category}</span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      ${product.price.toFixed(2)}
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
                ))}
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
                onClick={() => setShowModal(false)}
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

              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
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
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {t("admin.products.categoryLabel" as TranslationKey)}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                >
                  <option value="General">{t("admin.products.general" as TranslationKey)}</option>
                  {categoryNames.map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {t("admin.products.productImage" as TranslationKey)}
                </label>

                {/* Image preview + editable URL */}
                {form.image && (
                  <div className="space-y-2 mb-3">
                    <div className="relative rounded-xl overflow-hidden border border-border bg-background group">
                      <div className="relative h-44 w-full">
                        <Image
                          src={form.image}
                          alt="Preview"
                          fill
                          className="object-contain"
                          sizes="400px"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => document.getElementById("product-image-input")?.click()}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white/80 hover:bg-primary hover:text-white transition-colors"
                          title="Re-upload image"
                        >
                          <Upload className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField("image", "")}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white/80 hover:bg-red-500 hover:text-white transition-colors"
                          title="Remove image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Editable URL */}
                    <div className="relative">
                      <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <input
                        type="url"
                        value={form.image}
                        onChange={(e) => updateField("image", e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-xs text-muted focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Hidden file input (always in DOM for re-upload) */}
                <input
                  id="product-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={onFileSelect}
                  className="hidden"
                />

                {/* Upload area */}
                {!form.image && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-4 transition-all cursor-pointer ${
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-3">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">{t("admin.products.clickToUpload" as TranslationKey)}</p>
                        <p className="text-xs text-muted">{t("admin.products.imageFormats" as TranslationKey)}</p>
                      </>
                    )}
                  </div>
                )}

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
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                >
                  {t("admin.products.cancel" as TranslationKey)}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
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
