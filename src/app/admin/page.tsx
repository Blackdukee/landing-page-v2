"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  Settings,
  Globe,
  Phone,
  Lock,
  Mail,
  AlertTriangle,
  Star,
  Search,
  Instagram,
  Twitter,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import type { TranslationKey } from "@/i18n/en";

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

interface PriceRange {
  label: string;
  labelAr: string;
  min: number;
  max: number | null;
}

interface ProductOption {
  _id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const siteSettings = useSiteSettings();
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

  // Delete category dialog state
  const [deleteDialogCatId, setDeleteDialogCatId] = useState<string | null>(null);
  const [deleteDialogCatName, setDeleteDialogCatName] = useState("");

  // Site settings state
  const [siteName, setSiteName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialEmail, setSocialEmail] = useState("");
  const [savingSiteSettings, setSavingSiteSettings] = useState(false);
  const [siteSettingsMsg, setSiteSettingsMsg] = useState("");

  // Price range filter state
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
  const [savingPriceRanges, setSavingPriceRanges] = useState(false);
  const [priceRangesMsg, setPriceRangesMsg] = useState("");

  // Account settings state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState("");
  const [accountError, setAccountError] = useState("");

  // Hero product state
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [heroProductId, setHeroProductId] = useState<string | null>(null);
  const [heroInitialized, setHeroInitialized] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");
  const [savingHero, setSavingHero] = useState(false);
  const [heroMsg, setHeroMsg] = useState("");

  // Load site settings into local state
  useEffect(() => {
    if (!siteSettings.loading) {
      setSiteName(siteSettings.websiteName);
      setWhatsapp(siteSettings.whatsappNumber);
      setSocialInstagram(siteSettings.socialLinks?.instagram || "");
      setSocialTwitter(siteSettings.socialLinks?.twitter || "");
      setSocialEmail(siteSettings.socialLinks?.email || "");
      setPriceRanges(siteSettings.priceRangeFilters.map((f) => ({ ...f })));
      if (!heroInitialized) {
        setHeroProductId(siteSettings.heroProduct);
        setHeroInitialized(true);
      }
    }
  }, [siteSettings.loading, siteSettings.websiteName, siteSettings.whatsappNumber, siteSettings.priceRangeFilters, siteSettings.heroProduct, heroInitialized]);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ])
      .then(([products, orders]) => {
        const prods = Array.isArray(products) ? products : [];
        const ords = Array.isArray(orders) ? orders : [];

        setAllProducts(prods.map((p: ProductOption) => ({ _id: p._id, name: p.name, image: p.image, price: p.price, category: p.category })));
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

  const openDeleteDialog = (id: string, name: string) => {
    setDeleteDialogCatId(id);
    setDeleteDialogCatName(name);
  };

  const handleDeleteCategory = async (action: "reassign" | "delete") => {
    if (!deleteDialogCatId) return;
    setDeletingCat(deleteDialogCatId);
    setDeleteDialogCatId(null);
    try {
      await fetch(`/api/categories/${deletingCat || deleteDialogCatId}?action=${action}`, {
        method: "DELETE",
      });
      fetchCategories();
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingCat(null);
    }
  };

  // Site settings handlers
  const handleSaveSiteSettings = async () => {
    setSavingSiteSettings(true);
    setSiteSettingsMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteName: siteName,
          whatsappNumber: whatsapp,
          socialLinks: {
            instagram: socialInstagram,
            twitter: socialTwitter,
            email: socialEmail,
          },
        }),
      });
      if (res.ok) {
        setSiteSettingsMsg(t("admin.dashboard.settingsSaved" as TranslationKey));
        siteSettings.refresh();
      } else {
        const data = await res.json();
        setSiteSettingsMsg(data.error || "Failed to save");
      }
    } catch {
      setSiteSettingsMsg("Network error");
    } finally {
      setSavingSiteSettings(false);
    }
  };

  // Price range handlers
  const addPriceRange = () => {
    setPriceRanges([...priceRanges, { label: "", labelAr: "", min: 0, max: null }]);
  };

  const updatePriceRange = (index: number, field: keyof PriceRange, value: string | number | null) => {
    const updated = [...priceRanges];
    updated[index] = { ...updated[index], [field]: value };
    setPriceRanges(updated);
  };

  const removePriceRange = (index: number) => {
    setPriceRanges(priceRanges.filter((_, i) => i !== index));
  };

  const handleSavePriceRanges = async () => {
    setSavingPriceRanges(true);
    setPriceRangesMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceRangeFilters: priceRanges }),
      });
      if (res.ok) {
        setPriceRangesMsg(t("admin.dashboard.settingsSaved" as TranslationKey));
        siteSettings.refresh();
      } else {
        const data = await res.json();
        setPriceRangesMsg(data.error || "Failed to save");
      }
    } catch {
      setPriceRangesMsg("Network error");
    } finally {
      setSavingPriceRanges(false);
    }
  };

  // Account settings handler
  const handleSaveAccount = async () => {
    setAccountError("");
    setAccountMsg("");

    if (!currentPassword) {
      setAccountError(t("admin.dashboard.currentPasswordRequired" as TranslationKey));
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setAccountError(t("admin.dashboard.passwordsMismatch" as TranslationKey));
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setAccountError(t("admin.dashboard.passwordTooShort" as TranslationKey));
      return;
    }

    setSavingAccount(true);
    try {
      const res = await fetch("/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword: newPassword || undefined, newEmail: newEmail || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setAccountMsg(t("admin.dashboard.accountUpdated" as TranslationKey));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setNewEmail("");
      } else {
        setAccountError(data.error || "Failed to update");
      }
    } catch {
      setAccountError("Network error");
    } finally {
      setSavingAccount(false);
    }
  };

  // Hero product handler
  const handleSaveHeroProduct = async () => {
    setSavingHero(true);
    setHeroMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroProduct: heroProductId }),
      });
      const data = await res.json();
      if (res.ok) {
        // Keep the local selection in sync with what the server actually saved
        setHeroProductId(data.heroProduct || null);
        setHeroMsg(t("admin.dashboard.settingsSaved" as TranslationKey));
        siteSettings.refresh();
      } else {
        setHeroMsg(data.error || "Failed to save");
      }
    } catch {
      setHeroMsg("Network error");
    } finally {
      setSavingHero(false);
    }
  };

  const heroProduct = allProducts.find((p) => p._id === heroProductId);
  const filteredHeroProducts = allProducts.filter(
    (p) =>
      !heroSearch ||
      p.name.toLowerCase().includes(heroSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(heroSearch.toLowerCase())
  );

  const statCards = [
    {
      label: t("admin.dashboard.totalProducts" as TranslationKey),
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500/10 text-blue-400",
    },
    {
      label: t("admin.dashboard.totalOrders" as TranslationKey),
      value: stats.totalOrders,
      icon: ClipboardList,
      color: "bg-green-500/10 text-green-400",
    },
    {
      label: t("admin.dashboard.revenue" as TranslationKey),
      value: `EGP ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-amber-500/10 text-amber-400",
    },
    {
      label: t("admin.dashboard.pendingOrders" as TranslationKey),
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

  const inputClass =
    "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all";

  return (
    <div>
      {/* Delete Category Dialog */}
      {deleteDialogCatId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">
                {t("admin.dashboard.deleteCategoryTitle" as TranslationKey)}
              </h3>
            </div>
            <p className="text-sm text-muted mb-6">
              {t("admin.dashboard.deleteCategoryDesc" as TranslationKey, { name: deleteDialogCatName })}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleDeleteCategory("reassign")}
                className="w-full rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-4 py-3 text-sm font-medium transition-colors text-start"
              >
                {t("admin.dashboard.deleteCategoryReassign" as TranslationKey)}
              </button>
              <button
                onClick={() => handleDeleteCategory("delete")}
                className="w-full rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-3 text-sm font-medium transition-colors text-start"
              >
                {t("admin.dashboard.deleteCategoryDeleteProducts" as TranslationKey)}
              </button>
              <button
                onClick={() => setDeleteDialogCatId(null)}
                className="w-full rounded-xl bg-surface hover:bg-card-hover text-muted px-4 py-3 text-sm font-medium transition-colors"
              >
                {t("admin.dashboard.cancel" as TranslationKey)}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.dashboard.title" as TranslationKey)}</h1>
        <p className="text-sm text-muted mt-1">
          {t("admin.dashboard.subtitle" as TranslationKey)}
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
            <h2 className="font-semibold text-sm text-foreground">{t("admin.dashboard.categories" as TranslationKey)}</h2>
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
                  placeholder={t("admin.dashboard.newCatPlaceholder" as TranslationKey)}
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setCatError("");
                  }}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={addingCat || !newCatName.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                {addingCat ? t("admin.dashboard.adding" as TranslationKey) : t("admin.dashboard.add" as TranslationKey)}
              </button>
            </div>
            <div className="max-w-md">
              <input
                type="text"
                placeholder={t("admin.dashboard.descPlaceholder" as TranslationKey)}
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className={inputClass}
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
              {t("admin.dashboard.noCategoriesYet" as TranslationKey)}
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
                          placeholder={t("admin.dashboard.catNamePlaceholder" as TranslationKey)}
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
                        placeholder={t("admin.dashboard.catDescPlaceholder" as TranslationKey)}
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
                          onClick={() => openDeleteDialog(cat._id, cat.name)}
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

      {/* Site Settings */}
      <div className="rounded-2xl bg-card border border-border mb-8">
        <div className="px-6 py-5 border-b border-border flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-3.5 w-3.5" />
          </div>
          <h2 className="font-semibold text-sm text-foreground">{t("admin.dashboard.siteSettings" as TranslationKey)}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                {t("admin.dashboard.websiteName" as TranslationKey)}
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className={inputClass}
                placeholder="QuesnaShop"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                {t("admin.dashboard.whatsappNumber" as TranslationKey)}
              </label>
              <div className="relative">
                <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  placeholder="+201025571092"
                />
              </div>
            </div>
          </div>
          {/* Social Contact Links */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              {t("admin.dashboard.socialLinks" as TranslationKey) || "Social Links (optional)"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  Twitter / X
                </label>
                <div className="relative">
                  <Twitter className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={socialTwitter}
                    onChange={(e) => setSocialTwitter(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="email"
                    value={socialEmail}
                    onChange={(e) => setSocialEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {siteSettingsMsg && (
            <p className="text-xs text-green-400">{siteSettingsMsg}</p>
          )}
          <button
            onClick={handleSaveSiteSettings}
            disabled={savingSiteSettings}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            <Save className="h-4 w-4" />
            {savingSiteSettings ? t("admin.dashboard.saving" as TranslationKey) : t("admin.dashboard.saveSiteSettings" as TranslationKey)}
          </button>
        </div>
      </div>

      {/* Hero Product Picker */}
      <div className="rounded-2xl bg-card border border-border mb-8">
        <div className="px-6 py-5 border-b border-border flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Star className="h-3.5 w-3.5" />
          </div>
          <h2 className="font-semibold text-sm text-foreground">{t("admin.dashboard.heroProduct" as TranslationKey)}</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-muted">{t("admin.dashboard.heroProductDesc" as TranslationKey)}</p>

          {/* Currently selected */}
          {heroProduct ? (
            <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                <Image src={heroProduct.image} alt={heroProduct.name} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{heroProduct.name}</p>
                <p className="text-xs text-muted">{heroProduct.category} · EGP {heroProduct.price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setHeroProductId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted/70 italic">{t("admin.dashboard.noHeroProduct" as TranslationKey)}</p>
          )}

          {/* Search + product list */}
          <div>
            <div className="relative mb-3">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder={t("admin.dashboard.searchProducts" as TranslationKey)}
                className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-border bg-surface p-2">
              {filteredHeroProducts.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">{t("admin.dashboard.noProductsFound" as TranslationKey)}</p>
              ) : (
                filteredHeroProducts.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => setHeroProductId(p._id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors ${
                      heroProductId === p._id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-card-hover"
                    }`}
                  >
                    <div className="relative h-9 w-9 rounded-md overflow-hidden bg-surface flex-shrink-0">
                      <Image src={p.image} alt={p.name} fill className="object-cover" sizes="36px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted">{p.category} · EGP {p.price.toFixed(2)}</p>
                    </div>
                    {heroProductId === p._id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {heroMsg && (
            <p className="text-xs text-green-400">{heroMsg}</p>
          )}
          <button
            onClick={handleSaveHeroProduct}
            disabled={savingHero}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            <Save className="h-4 w-4" />
            {savingHero ? t("admin.dashboard.saving" as TranslationKey) : t("admin.dashboard.saveHeroProduct" as TranslationKey)}
          </button>
        </div>
      </div>

      {/* Price Range Filters */}
      <div className="rounded-2xl bg-card border border-border mb-8">
        <div className="px-6 py-5 border-b border-border flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-3.5 w-3.5" />
          </div>
          <h2 className="font-semibold text-sm text-foreground">{t("admin.dashboard.priceRanges" as TranslationKey)}</h2>
          <span className="text-xs text-muted">({priceRanges.length})</span>
        </div>
        <div className="p-6 space-y-4">
          {priceRanges.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">
              {t("admin.dashboard.noPriceRanges" as TranslationKey)}
            </p>
          ) : (
            <div className="space-y-3">
              {priceRanges.map((range, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface/50 border border-border px-4 py-3">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">
                      {t("admin.dashboard.labelEn" as TranslationKey)}
                    </label>
                    <input
                      type="text"
                      value={range.label}
                      onChange={(e) => updatePriceRange(idx, "label", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      placeholder="e.g. Under $25"
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">
                      {t("admin.dashboard.labelAr" as TranslationKey)}
                    </label>
                    <input
                      type="text"
                      value={range.labelAr}
                      onChange={(e) => updatePriceRange(idx, "labelAr", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      placeholder="مثال: أقل من 25$"
                      dir="rtl"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">
                      {t("admin.dashboard.min" as TranslationKey)}
                    </label>
                    <input
                      type="number"
                      value={range.min}
                      onChange={(e) => updatePriceRange(idx, "min", Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      min="0"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">
                      {t("admin.dashboard.max" as TranslationKey)}
                    </label>
                    <input
                      type="number"
                      value={range.max ?? ""}
                      onChange={(e) => updatePriceRange(idx, "max", e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      min="0"
                      placeholder="∞"
                    />
                  </div>
                  <button
                    onClick={() => removePriceRange(idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors mt-4"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={addPriceRange}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("admin.dashboard.addRange" as TranslationKey)}
            </button>
            <button
              onClick={handleSavePriceRanges}
              disabled={savingPriceRanges}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Save className="h-4 w-4" />
              {savingPriceRanges ? t("admin.dashboard.saving" as TranslationKey) : t("admin.dashboard.saveRanges" as TranslationKey)}
            </button>
          </div>
          {priceRangesMsg && (
            <p className="text-xs text-green-400">{priceRangesMsg}</p>
          )}
        </div>
      </div>

      {/* Account Settings */}
      <div className="rounded-2xl bg-card border border-border mb-8">
        <div className="px-6 py-5 border-b border-border flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <h2 className="font-semibold text-sm text-foreground">{t("admin.dashboard.accountSettings" as TranslationKey)}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                {t("admin.dashboard.currentPassword" as TranslationKey)} *
              </label>
              <div className="relative">
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setAccountError(""); }}
                  className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                {t("admin.dashboard.newEmail" as TranslationKey)}
              </label>
              <div className="relative">
                <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  placeholder={t("admin.dashboard.newEmailPlaceholder" as TranslationKey)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                {t("admin.dashboard.newPassword" as TranslationKey)}
              </label>
              <div className="relative">
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setAccountError(""); }}
                  className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                {t("admin.dashboard.confirmPassword" as TranslationKey)}
              </label>
              <div className="relative">
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setAccountError(""); }}
                  className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          {accountError && (
            <p className="text-xs text-red-400">{accountError}</p>
          )}
          {accountMsg && (
            <p className="text-xs text-green-400">{accountMsg}</p>
          )}
          <button
            onClick={handleSaveAccount}
            disabled={savingAccount || !currentPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            <Save className="h-4 w-4" />
            {savingAccount ? t("admin.dashboard.saving" as TranslationKey) : t("admin.dashboard.saveAccount" as TranslationKey)}
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl bg-card border border-border">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">{t("admin.dashboard.recentOrders" as TranslationKey)}</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-surface rounded animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted">
            {t("admin.dashboard.noOrdersYet" as TranslationKey)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.dashboard.customer" as TranslationKey)}
                  </th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.dashboard.total" as TranslationKey)}
                  </th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.dashboard.status" as TranslationKey)}
                  </th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.dashboard.date" as TranslationKey)}
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
                      EGP {order.totalPrice?.toFixed(2)}
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
