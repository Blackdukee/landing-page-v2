"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
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
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!confirm("Are you sure you want to delete this product?")) return;
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

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-muted mt-1">
            Manage your product catalog
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
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
              {search ? "No products match your search" : "No products yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
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
                        {product.featured ? "Yes" : "No"}
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
                {editing ? "Edit Product" : "New Product"}
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
                  Product Name
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
                  Description
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
                    Price ($)
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
                    Stock
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
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                >
                  {["General", "Kitchen", "Decor", "Lighting", "Textiles", "Furniture", "Garden"].map(
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
                  Image URL
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="url"
                      required
                      value={form.image}
                      onChange={(e) => updateField("image", e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                    />
                  </div>
                  {form.image && (
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-surface shrink-0">
                      <Image
                        src={form.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => updateField("featured", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm">Featured product</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
