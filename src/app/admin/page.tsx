"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Tag,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Check,
} from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface OrderPreview {
  _id: string;
  customerInfo: { name: string };
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderPreview[]>([]);
  const [loading, setLoading] = useState(true);

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [catError, setCatError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ])
      .then(([products, orders]) => {
        const prods = Array.isArray(products) ? products : [];
        const ords = Array.isArray(orders) ? orders : [];

        setStats({
          totalProducts: prods.length,
          totalOrders: ords.length,
          totalRevenue: ords.reduce(
            (sum: number, o: OrderPreview) => sum + (o.totalPrice || 0),
            0
          ),
          pendingOrders: ords.filter(
            (o: OrderPreview) => o.status === "pending"
          ).length,
        });
        setRecentOrders(ords.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchCategories = () => {
    setCatLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error)
      .finally(() => setCatLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatError("");
    setAddingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() }),
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatDesc("");
        fetchCategories();
      } else {
        const data = await res.json();
        setCatError(data.error || "Failed to add category");
      }
    } catch {
      setCatError("Network error");
    } finally {
      setAddingCat(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    setCatError("");
    setSavingCat(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editCatName.trim(), description: editCatDesc.trim() }),
      });
      if (res.ok) {
        setEditingCat(null);
        setEditCatName("");
        fetchCategories();
      } else {
        const data = await res.json();
        setCatError(data.error || "Failed to update category");
      }
    } catch {
      setCatError("Network error");
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Products using it will keep their current category text."))
      return;
    setDeletingCat(id);
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingCat(null);
    }
  };

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500/10 text-blue-400",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ClipboardList,
      color: "bg-green-500/10 text-green-400",
    },
    {
      label: "Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-amber-500/10 text-amber-400",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: "bg-purple-500/10 text-purple-400",
    },
  ];

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400",
    confirmed: "bg-blue-500/10 text-blue-400",
    shipped: "bg-purple-500/10 text-purple-400",
    delivered: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Overview of your store performance
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl bg-card border border-border p-5 transition-all hover:border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted">{label}</span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Categories Management */}
      <div className="rounded-2xl bg-card border border-border mb-8">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Tag className="h-3.5 w-3.5" />
            </div>
            <h2 className="font-semibold text-sm text-foreground">Categories</h2>
            <span className="text-xs text-muted">({categories.length})</span>
          </div>
        </div>

        <div className="p-6">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="mb-5 space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="New category name..."
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setCatError("");
                  }}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={addingCat || !newCatName.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                {addingCat ? "Adding..." : "Add"}
              </button>
            </div>
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Description (optional)..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
            </div>
          </form>

          {catError && (
            <p className="text-xs text-red-400 mb-4">{catError}</p>
          )}

          {/* Categories List */}
          {catLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-11 bg-surface rounded-xl animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              No categories yet. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface/50 border border-border px-4 py-3 group hover:border-primary/20 transition-all"
                >
                  {editingCat === cat._id ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateCategory(cat._id);
                            if (e.key === "Escape") setEditingCat(null);
                          }}
                          autoFocus
                          placeholder="Category name"
                          className="flex-1 rounded-lg border border-primary/30 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        />
                        <button
                          onClick={() => handleUpdateCategory(cat._id)}
                          disabled={savingCat || !editCatName.trim()}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCat(null)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editCatDesc}
                        onChange={(e) => setEditCatDesc(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateCategory(cat._id);
                          if (e.key === "Escape") setEditingCat(null);
                        }}
                        placeholder="Description (optional)"
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground truncate">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-muted font-mono bg-surface rounded px-1.5 py-0.5">
                            {cat.slug}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-muted mt-0.5 truncate">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCat(cat._id);
                            setEditCatName(cat.name);
                            setEditCatDesc(cat.description || "");
                            setCatError("");
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat._id)}
                          disabled={deletingCat === cat._id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl bg-card border border-border">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">Recent Orders</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-surface rounded animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted">
            No orders yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-card-hover transition-colors">
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      {order.customerInfo?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-3.5 text-foreground">
                      ${order.totalPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                          statusColor[order.status] || "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-muted">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
