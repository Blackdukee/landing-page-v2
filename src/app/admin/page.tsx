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
  Flame,
  Clock,
  Building2,
  Upload,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings, type IDailyOfferItem } from "@/lib/SiteSettingsContext";
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
  icon?: string;
}

interface Company {
  _id: string;
  name: string;
  logo: string;
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

// Helper function to normalize WhatsApp number to +201234567890 format
const normalizeWhatsAppNumber = (input: string): string => {
  let number = input.trim().replace(/\s/g, "");
  
  // Remove + if present
  if (number.startsWith("+")) {
    number = number.substring(1);
  }
  
  // Convert 01234567890 to 201234567890
  if (number.startsWith("0")) {
    number = "2" + number.substring(1);
  }
  
  // Ensure it starts with 20 (Egypt country code)
  if (!number.startsWith("20")) {
    // If it starts with digits but not 20, assume it's from 01X format
    if (number.startsWith("1")) {
      number = "2" + number;
    }
  }
  
  // Add + prefix
  return "+" + number;
};

// Helper function to display WhatsApp number in local format (01234567890)
const displayWhatsAppNumber = (input: string): string => {
  let number = input.trim().replace(/\s/g, "").replace(/\+/g, "");
  
  // Convert 201234567890 to 01234567890
  if (number.startsWith("20")) {
    number = "0" + number.substring(2);
  }
  
  return number;
};

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
  const [newCatIcon, setNewCatIcon] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");
  const [uploadingCatIcon, setUploadingCatIcon] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [catError, setCatError] = useState("");

  const handleCatIconUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCatIcon(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setEditCatIcon(data.url);
        } else {
          setNewCatIcon(data.url);
        }
      } else {
        setCatError("Failed to upload category icon");
      }
    } catch {
      setCatError("Failed to upload category icon");
    } finally {
      setUploadingCatIcon(false);
    }
  };

  // Delete category dialog state
  const [deleteDialogCatId, setDeleteDialogCatId] = useState<string | null>(null);
  const [deleteDialogCatName, setDeleteDialogCatName] = useState("");

  // Company management state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [compLoading, setCompLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyLogo, setNewCompanyLogo] = useState("");
  const [newCompanyDesc, setNewCompanyDesc] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [compError, setCompError] = useState("");
  const [deleteDialogCompId, setDeleteDialogCompId] = useState<string | null>(null);
  const [deleteDialogCompName, setDeleteDialogCompName] = useState("");
  const [deletingComp, setDeletingComp] = useState<string | null>(null);

  // Site settings state
  const [siteName, setSiteName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [freeDeliveryMinPrice, setFreeDeliveryMinPrice] = useState(99);
  const [shippingCost, setShippingCost] = useState(9.99);
  const [returnDays, setReturnDays] = useState(30);
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

  // Daily Offers state
  const [dailyOffers, setDailyOffers] = useState<IDailyOfferItem[]>([]);
  const [selectedOfferProdId, setSelectedOfferProdId] = useState<string>("");
  const [offerDiscount, setOfferDiscount] = useState<number>(20);
  const [offerExpiry, setOfferExpiry] = useState<string>("");
  const [offerSearch, setOfferSearch] = useState<string>("");
  const [savingOffer, setSavingOffer] = useState<boolean>(false);
  const [offerMsg, setOfferMsg] = useState<string>("");
  const [offerError, setOfferError] = useState<string>("");
  const [deleteOfferIndex, setDeleteOfferIndex] = useState<number | null>(null);

  // Load site settings into local state
  useEffect(() => {
    if (!siteSettings.loading) {
      setSiteName(siteSettings.websiteName);
      setWhatsapp(displayWhatsAppNumber(siteSettings.whatsappNumber));
      setFaviconUrl(siteSettings.favicon || "");
      setFreeDeliveryMinPrice(siteSettings.freeDeliveryMinPrice ?? 99);
      setShippingCost(siteSettings.shippingCost ?? 9.99);
      setReturnDays(siteSettings.returnDays ?? 30);
      setSocialInstagram(siteSettings.socialLinks?.instagram || "");
      setSocialTwitter(siteSettings.socialLinks?.twitter || "");
      setSocialEmail(siteSettings.socialLinks?.email || "");
      setPriceRanges(siteSettings.priceRangeFilters.map((f) => ({ ...f })));
      setDailyOffers(siteSettings.dailyOffers || []);
      if (!heroInitialized) {
        setHeroProductId(siteSettings.heroProduct);
        setHeroInitialized(true);
      }
    }
  }, [siteSettings.loading, siteSettings.websiteName, siteSettings.whatsappNumber, siteSettings.favicon, siteSettings.freeDeliveryMinPrice, siteSettings.shippingCost, siteSettings.returnDays, siteSettings.priceRangeFilters, siteSettings.heroProduct, siteSettings.dailyOffers, heroInitialized]);

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

  const fetchCompanies = () => {
    setCompLoading(true);
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch(console.error)
      .finally(() => setCompLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyLogo.trim()) return;
    setCompError("");
    setSavingCompany(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          logo: newCompanyLogo.trim(),
          description: newCompanyDesc.trim(),
        }),
      });
      if (res.ok) {
        setNewCompanyName("");
        setNewCompanyLogo("");
        setNewCompanyDesc("");
        fetchCompanies();
      } else {
        const data = await res.json();
        setCompError(data.error || "Failed to add company");
      }
    } catch {
      setCompError("Network error");
    } finally {
      setSavingCompany(false);
    }
  };

  const openDeleteCompDialog = (id: string, name: string) => {
    setDeleteDialogCompId(id);
    setDeleteDialogCompName(name);
  };

  const handleDeleteCompany = async () => {
    if (!deleteDialogCompId) return;
    setDeletingComp(deleteDialogCompId);
    const idToDelete = deleteDialogCompId;
    setDeleteDialogCompId(null);
    try {
      const res = await fetch(`/api/companies/${idToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCompError(data.error || "Failed to delete company");
      } else {
        fetchCompanies();
      }
    } catch (error) {
      console.error(error);
      setCompError("Network error");
    } finally {
      setDeletingComp(null);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setCompError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setNewCompanyLogo(data.url);
      } else {
        setCompError(data.error || "Failed to upload logo");
      }
    } catch (err) {
      console.error("Logo upload failed", err);
      setCompError("Network error during logo upload");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatError("");
    setAddingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          icon: newCatIcon.trim(),
        }),
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatDesc("");
        setNewCatIcon("");
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
        body: JSON.stringify({
          name: editCatName.trim(),
          description: editCatDesc.trim(),
          icon: editCatIcon.trim(),
        }),
      });
      if (res.ok) {
        setEditingCat(null);
        setEditCatName("");
        setEditCatDesc("");
        setEditCatIcon("");
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
          whatsappNumber: normalizeWhatsAppNumber(whatsapp),
          favicon: faviconUrl,
          freeDeliveryMinPrice,
          shippingCost,
          returnDays,
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

  // Daily offers handlers
  const handleAddDailyOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferError("");
    setOfferMsg("");

    if (!selectedOfferProdId) {
      setOfferError(t("admin.offers.selectProduct" as TranslationKey));
      return;
    }

    const isDuplicate = dailyOffers.some((o) => {
      const pId = typeof o.productId === "object" ? (o.productId as any)?._id : o.productId;
      return String(pId) === String(selectedOfferProdId);
    });

    if (isDuplicate) {
      setOfferError(t("admin.offers.productAlreadyAdded" as TranslationKey));
      return;
    }

    const discountVal = Math.min(90, Math.max(1, Math.round(offerDiscount)));

    const newOffer: IDailyOfferItem = {
      productId: selectedOfferProdId,
      discountPercentage: discountVal,
      active: true,
      expiresAt: offerExpiry ? new Date(offerExpiry).toISOString() : null,
    };

    const updatedOffers = [...dailyOffers, newOffer];
    setSavingOffer(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyOffers: updatedOffers.map((o) => ({
            _id: o._id,
            productId: typeof o.productId === "object" ? (o.productId as any)?._id : o.productId,
            discountPercentage: o.discountPercentage,
            active: o.active,
            expiresAt: o.expiresAt,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOfferMsg(t("admin.dashboard.settingsSaved" as TranslationKey));
        setSelectedOfferProdId("");
        setOfferDiscount(20);
        setOfferExpiry("");
        setOfferSearch("");
        if (Array.isArray(data.dailyOffers)) {
          setDailyOffers(data.dailyOffers);
        } else {
          setDailyOffers(updatedOffers);
        }
        siteSettings.refresh();
      } else {
        setOfferError(data.error || "Failed to add offer");
      }
    } catch {
      setOfferError("Network error");
    } finally {
      setSavingOffer(false);
    }
  };

  const handleToggleOfferActive = async (index: number) => {
    const updated = dailyOffers.map((o, i) =>
      i === index ? { ...o, active: !o.active } : o
    );
    setDailyOffers(updated);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyOffers: updated.map((o) => ({
            _id: o._id,
            productId: typeof o.productId === "object" ? (o.productId as any)?._id : o.productId,
            discountPercentage: o.discountPercentage,
            active: o.active,
            expiresAt: o.expiresAt,
          })),
        }),
      });

      if (res.ok) {
        siteSettings.refresh();
      }
    } catch (err) {
      console.error("Failed to toggle offer active state", err);
    }
  };

  const handleDeleteOffer = async (index: number) => {
    const updated = dailyOffers.filter((_, i) => i !== index);
    setDailyOffers(updated);
    setDeleteOfferIndex(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyOffers: updated.map((o) => ({
            _id: o._id,
            productId: typeof o.productId === "object" ? (o.productId as any)?._id : o.productId,
            discountPercentage: o.discountPercentage,
            active: o.active,
            expiresAt: o.expiresAt,
          })),
        }),
      });

      if (res.ok) {
        siteSettings.refresh();
      }
    } catch (err) {
      console.error("Failed to delete offer", err);
    }
  };

  const selectedOfferProduct = allProducts.find((p) => p._id === selectedOfferProdId);
  const filteredOfferProducts = allProducts.filter(
    (p) =>
      !offerSearch ||
      p.name.toLowerCase().includes(offerSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(offerSearch.toLowerCase())
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

      {/* Delete Company Dialog */}
      {deleteDialogCompId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">
                {t("admin.companies.deleteDialogTitle" as TranslationKey)}
              </h3>
            </div>
            <p className="text-sm text-muted mb-6">
              {t("admin.companies.deleteDialogDesc" as TranslationKey, { name: deleteDialogCompName })}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteCompany}
                className="flex-1 min-h-[44px] rounded-xl bg-red-500 text-white hover:bg-red-600 px-4 py-2.5 text-sm font-medium transition-colors"
              >
                {t("admin.companies.deleteButton" as TranslationKey)}
              </button>
              <button
                type="button"
                onClick={() => setDeleteDialogCompId(null)}
                className="flex-1 min-h-[44px] rounded-xl bg-surface hover:bg-card-hover text-muted px-4 py-2.5 text-sm font-medium transition-colors"
              >
                {t("admin.dashboard.cancel" as TranslationKey)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Offer Dialog */}
      {deleteOfferIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">
                {t("admin.offers.deleteConfirm" as TranslationKey)}
              </h3>
            </div>
            <p className="text-sm text-muted mb-6">
              {t("admin.offers.deleteOfferDialogDesc" as TranslationKey)}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                aria-label={t("admin.offers.deleteOfferButton" as TranslationKey)}
                onClick={() => handleDeleteOffer(deleteOfferIndex)}
                className="flex-1 min-h-[44px] rounded-xl bg-red-500 text-white hover:bg-red-600 px-4 py-2.5 text-sm font-medium transition-colors"
              >
                {t("admin.offers.deleteOfferButton" as TranslationKey)}
              </button>
              <button
                type="button"
                aria-label={t("admin.dashboard.cancel" as TranslationKey)}
                onClick={() => setDeleteOfferIndex(null)}
                className="flex-1 min-h-[44px] rounded-xl bg-surface hover:bg-card-hover text-muted px-4 py-2.5 text-sm font-medium transition-colors"
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
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
              
              {/* Category Icon Uploader */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer rounded-xl bg-surface border border-border hover:border-primary/40 text-foreground px-3 py-2 text-xs font-medium transition-all">
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  <span>{uploadingCatIcon ? "جاري الرفع..." : "أيقونة القسم"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCatIconUpload(e, false)}
                    className="hidden"
                    disabled={uploadingCatIcon}
                  />
                </label>
                {newCatIcon && (
                  <div className="relative group">
                    <Image
                      src={newCatIcon}
                      alt="Category Icon Preview"
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-xl border border-primary/40 bg-surface object-contain p-1 mix-blend-multiply"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setNewCatIcon("")}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
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
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editCatDesc}
                          onChange={(e) => setEditCatDesc(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateCategory(cat._id);
                            if (e.key === "Escape") setEditingCat(null);
                          }}
                          placeholder={t("admin.dashboard.catDescPlaceholder" as TranslationKey)}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        />
                        <label className="flex items-center gap-1 cursor-pointer rounded-lg bg-surface border border-border px-2.5 py-1.5 text-xs text-foreground hover:border-primary/40 transition-all">
                          <Upload className="h-3 w-3 text-primary" />
                          <span>أيقونة</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCatIconUpload(e, true)}
                            className="hidden"
                          />
                        </label>
                        {editCatIcon && (
                          <div className="relative">
                            <Image
                              src={editCatIcon}
                              alt="Cat Icon"
                              width={28}
                              height={28}
                              className="h-7 w-7 rounded border border-primary/40 bg-surface object-contain p-0.5 mix-blend-multiply"
                              unoptimized
                            />
                            <button
                              type="button"
                              onClick={() => setEditCatIcon("")}
                              className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px]"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border overflow-hidden shrink-0">
                          {cat.icon ? (
                            <Image
                              src={cat.icon}
                              alt={cat.name}
                              width={36}
                              height={36}
                              className="h-full w-full object-contain p-1 mix-blend-multiply"
                              unoptimized
                            />
                          ) : (
                            <Tag className="h-4 w-4 text-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
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
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCat(cat._id);
                            setEditCatName(cat.name);
                            setEditCatDesc(cat.description || "");
                            setEditCatIcon(cat.icon || "");
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

      {/* Companies / Brands Management */}
      <div className="rounded-2xl bg-card border border-border mb-8">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <h2 className="font-semibold text-sm text-foreground">
              {t("admin.companies.title" as TranslationKey)}
            </h2>
            <span className="text-xs text-muted">({companies.length})</span>
          </div>
        </div>

        <div className="p-6">
          {/* Add Company Form */}
          <form onSubmit={handleAddCompany} className="mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  {t("admin.companies.name" as TranslationKey)} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("admin.companies.namePlaceholder" as TranslationKey)}
                  value={newCompanyName}
                  onChange={(e) => {
                    setNewCompanyName(e.target.value);
                    setCompError("");
                  }}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  {t("admin.companies.description" as TranslationKey)}
                </label>
                <input
                  type="text"
                  placeholder={t("admin.companies.descPlaceholder" as TranslationKey)}
                  value={newCompanyDesc}
                  onChange={(e) => setNewCompanyDesc(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Logo Upload Section */}
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                {t("admin.companies.logo" as TranslationKey)} <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-4">
                {newCompanyLogo && (
                  <div className="relative h-12 w-12 rounded-xl border border-border bg-surface flex items-center justify-center overflow-hidden shrink-0">
                    <Image src={newCompanyLogo} alt={newCompanyName || "Company Logo"} width={48} height={48} className="object-contain p-1 mix-blend-multiply" />
                    <button
                      type="button"
                      onClick={() => setNewCompanyLogo("")}
                      aria-label={t("admin.companies.removeLogo" as TranslationKey)}
                      className="absolute top-0.5 end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-dashed border-border hover:border-primary/40 bg-surface px-4 py-2.5 text-sm text-muted hover:text-foreground transition-all">
                  {uploadingLogo ? (
                    <span className="animate-pulse">{t("admin.companies.uploadingLogo" as TranslationKey)}</span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {newCompanyLogo ? t("admin.companies.changeLogo" as TranslationKey) : t("admin.companies.uploadLogo" as TranslationKey)}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            {compError && <p className="text-xs text-red-400">{compError}</p>}

            <button
              type="submit"
              disabled={savingCompany || !newCompanyName.trim() || !newCompanyLogo.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              {savingCompany ? t("admin.companies.addingCompany" as TranslationKey) : t("admin.companies.addCompany" as TranslationKey)}
            </button>
          </form>

          {/* Companies List */}
          {compLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              {t("admin.companies.noCompanies" as TranslationKey)}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {companies.map((comp) => (
                <div
                  key={comp._id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface/50 border border-border p-3 group hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white/5 border border-border shrink-0 flex items-center justify-center p-1">
                      {comp.logo ? (
                        <Image src={comp.logo} alt={comp.name} width={36} height={36} className="object-contain max-h-full max-w-full mix-blend-multiply" />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{comp.name}</p>
                      {comp.description && (
                        <p className="text-xs text-muted truncate">{comp.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDeleteCompDialog(comp._id, comp.name)}
                    disabled={deletingComp === comp._id}
                    aria-label={t("admin.companies.deleteAria" as TranslationKey, { name: comp.name })}
                    className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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
                placeholder="M L N TOOLS"
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
                  placeholder="01203441866"
                />
              </div>
            </div>
          </div>
          {/* Website Icon (Favicon) */}
          <div className="pt-2">
            <label className="text-xs font-medium text-muted mb-1.5 block">
              {t("admin.dashboard.favicon" as TranslationKey)}
            </label>
            <div className="flex items-center gap-4">
              {faviconUrl && (
                <div className="shrink-0 h-10 w-10 rounded-lg border border-border bg-surface flex items-center justify-center overflow-hidden">
                  <Image src={faviconUrl} alt="Favicon" width={32} height={32} className="object-contain" />
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-dashed border-border hover:border-primary/40 bg-surface px-4 py-2.5 text-sm text-muted hover:text-foreground transition-all">
                {uploadingFavicon ? (
                  <span className="animate-pulse">{t("admin.dashboard.faviconUploading" as TranslationKey)}</span>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {faviconUrl ? t("admin.dashboard.faviconChange" as TranslationKey) : t("admin.dashboard.faviconUpload" as TranslationKey)}
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/x-icon,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingFavicon}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingFavicon(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const data = await res.json();
                      if (data.url) setFaviconUrl(data.url);
                    } catch (err) {
                      console.error("Favicon upload failed", err);
                    } finally {
                      setUploadingFavicon(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              {faviconUrl && (
                <button
                  type="button"
                  onClick={() => setFaviconUrl("")}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  {t("admin.dashboard.faviconRemove" as TranslationKey)}
                </button>
              )}
            </div>
            <p className="text-xs text-muted/60 mt-1.5">{t("admin.dashboard.faviconHint" as TranslationKey)}</p>
          </div>
          {/* Trust Badge Settings */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              {t("admin.dashboard.trustBadgeSettings" as TranslationKey)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  {t("admin.dashboard.freeDeliveryMinPrice" as TranslationKey)}
                </label>
                <input
                  type="number"
                  min={0}
                  value={freeDeliveryMinPrice}
                  onChange={(e) => setFreeDeliveryMinPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  placeholder="99"
                />
                <p className="text-xs text-muted/60 mt-1">{t("admin.dashboard.freeDeliveryMinPriceHint" as TranslationKey)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  {t("admin.dashboard.shippingCost" as TranslationKey)}
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  placeholder="9.99"
                />
                <p className="text-xs text-muted/60 mt-1">{t("admin.dashboard.shippingCostHint" as TranslationKey)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  {t("admin.dashboard.returnDays" as TranslationKey)}
                </label>
                <input
                  type="number"
                  min={0}
                  value={returnDays}
                  onChange={(e) => setReturnDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  placeholder="30"
                />
                <p className="text-xs text-muted/60 mt-1">{t("admin.dashboard.returnDaysHint" as TranslationKey)}</p>
              </div>
            </div>
          </div>
          {/* Social Contact Links */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              {t("admin.dashboard.socialLinks" as TranslationKey)}
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

      {/* Daily Offers Management */}
      <div className="rounded-2xl bg-card border border-border mb-8">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <Flame className="h-3.5 w-3.5" />
            </div>
            <h2 className="font-semibold text-sm text-foreground">
              {t("admin.offers.title" as TranslationKey)}
            </h2>
            <span className="text-xs text-muted">({dailyOffers.length})</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-xs text-muted">
            {t("admin.offers.subtitle" as TranslationKey)}
          </p>

          <form onSubmit={handleAddDailyOffer} className="space-y-5">
            {/* Product Selector */}
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                {t("admin.offers.selectProduct" as TranslationKey)}
              </label>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={offerSearch}
                    onChange={(e) => setOfferSearch(e.target.value)}
                    placeholder={t("admin.dashboard.searchProducts" as TranslationKey)}
                    className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
                </div>

                <select
                  aria-label={t("admin.offers.selectProduct" as TranslationKey)}
                  value={selectedOfferProdId}
                  onChange={(e) => {
                    setSelectedOfferProdId(e.target.value);
                    setOfferError("");
                  }}
                  className={inputClass}
                >
                  <option value="">
                    {t("admin.offers.selectProduct" as TranslationKey)}
                  </option>
                  {filteredOfferProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.category}) - {p.price.toFixed(2)} EGP
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Product Card Preview */}
              {selectedOfferProduct && (
                <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-3.5 mt-3">
                  <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                    <Image
                      src={selectedOfferProduct.image}
                      alt={selectedOfferProduct.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {selectedOfferProduct.name}
                    </p>
                    <p className="text-xs text-muted">
                      {selectedOfferProduct.category} · EGP {selectedOfferProduct.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Clear selected product"
                    onClick={() => setSelectedOfferProdId("")}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Discount Percentage Slider + Number Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted">
                  {t("admin.offers.discountPercent" as TranslationKey)}
                </label>
                <span className="text-sm font-bold text-primary">
                  {offerDiscount}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={90}
                  value={offerDiscount}
                  onChange={(e) => setOfferDiscount(Number(e.target.value))}
                  aria-label={t("admin.offers.discountPercent" as TranslationKey)}
                  className="flex-1 accent-primary h-2 bg-surface rounded-lg cursor-pointer min-h-[44px]"
                />
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={offerDiscount}
                  onChange={(e) =>
                    setOfferDiscount(Math.min(90, Math.max(1, Number(e.target.value))))
                  }
                  aria-label={t("admin.offers.discountPercent" as TranslationKey)}
                  className="w-24 min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2.5 text-center text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Real-Time Price & Savings Preview */}
            {selectedOfferProduct && (
              <div className="rounded-xl bg-surface/80 border border-border p-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-muted">
                  <span>{t("admin.offers.originalPrice" as TranslationKey)}</span>
                  <span className="line-through">{selectedOfferProduct.price.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-foreground">
                  <span>{t("admin.offers.salePrice" as TranslationKey)}:</span>
                  <span className="text-emerald-400 font-bold text-base">
                    {(selectedOfferProduct.price * (1 - offerDiscount / 100)).toFixed(2)} EGP
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-400/90 font-medium">
                  <span>{t("admin.offers.savings" as TranslationKey)}:</span>
                  <span>
                    {(selectedOfferProduct.price * (offerDiscount / 100)).toFixed(2)} EGP (-{offerDiscount}%)
                  </span>
                </div>
              </div>
            )}

            {/* Expiration Date/Time */}
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                {t("admin.offers.expiryOptional" as TranslationKey)}
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="datetime-local"
                  value={offerExpiry}
                  onChange={(e) => setOfferExpiry(e.target.value)}
                  aria-label={t("admin.offers.expiryOptional" as TranslationKey)}
                  className={`${inputClass} flex-1 min-w-[200px] min-h-[44px]`}
                />
                <button
                  type="button"
                  aria-label={t("admin.offers.endOfDay" as TranslationKey)}
                  onClick={() => {
                    const todayEnd = new Date();
                    todayEnd.setHours(23, 59, 59, 999);
                    const iso = new Date(
                      todayEnd.getTime() - todayEnd.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16);
                    setOfferExpiry(iso);
                  }}
                  className="min-h-[44px] px-4 rounded-xl border border-border bg-surface text-xs font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors flex items-center gap-1.5"
                >
                  <Clock className="h-4 w-4" />
                  {t("admin.offers.endOfDay" as TranslationKey)}
                </button>
              </div>
            </div>

            {offerError && <p className="text-xs text-red-400">{offerError}</p>}
            {offerMsg && <p className="text-xs text-emerald-400">{offerMsg}</p>}

            {/* Add Daily Offer Button */}
            <button
              type="submit"
              disabled={savingOffer || !selectedOfferProdId}
              aria-label={t("admin.offers.addOffer" as TranslationKey)}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              {savingOffer
                ? t("admin.dashboard.saving" as TranslationKey)
                : t("admin.offers.addOffer" as TranslationKey)}
            </button>
          </form>

          {/* Configured Offers Grid */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
              {t("admin.offers.configuredOffers" as TranslationKey)} ({dailyOffers.length})
            </h3>

            {dailyOffers.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">
                {t("admin.offers.noOffers" as TranslationKey)}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dailyOffers.map((offer, idx) => {
                  const prodId = typeof offer.productId === "object" ? (offer.productId as any)?._id : offer.productId;
                  const prod = offer.product || allProducts.find((p) => String(p._id) === String(prodId));
                  const originalPrice = prod?.price || 0;
                  const salePrice = originalPrice * (1 - offer.discountPercentage / 100);

                  return (
                    <div
                      key={offer._id || idx}
                      className={`flex flex-col sm:flex-row items-start gap-4 rounded-xl border p-4 transition-all ${
                        offer.active
                          ? "border-border bg-surface/60 hover:border-primary/30"
                          : "border-border/50 bg-surface/20 opacity-60"
                      }`}
                    >
                      {prod?.image ? (
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                          <Image
                            src={prod.image}
                            alt={prod.name || "Product"}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                          <span className="absolute top-1 start-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            -{offer.discountPercentage}%
                          </span>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 text-muted">
                          <Package className="h-6 w-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {prod?.name || `Product ID: ${typeof offer.productId === "string" ? offer.productId : "Unknown"}`}
                            </h4>
                            {prod?.category && (
                              <p className="text-[11px] text-muted">{prod.category}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-sm font-bold text-emerald-400">
                            {salePrice.toFixed(2)} EGP
                          </span>
                          {originalPrice > 0 && (
                            <span className="text-xs text-muted line-through">
                              {originalPrice.toFixed(2)} EGP
                            </span>
                          )}
                        </div>

                        {offer.expiresAt && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
                            <Clock className="h-3 w-3" />
                            <span>
                              {t("admin.offers.expires" as TranslationKey)} {new Date(offer.expiresAt).toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                          {/* Active Switch Toggle */}
                          <button
                            type="button"
                            aria-label={
                              offer.active
                                ? t("admin.offers.active" as TranslationKey)
                                : t("admin.offers.inactive" as TranslationKey)
                            }
                            onClick={() => handleToggleOfferActive(idx)}
                            className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                              offer.active
                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-surface hover:bg-card-hover text-muted"
                            }`}
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                offer.active ? "bg-emerald-400 animate-pulse" : "bg-muted"
                              }`}
                            />
                            {offer.active
                              ? t("admin.offers.active" as TranslationKey)
                              : t("admin.offers.inactive" as TranslationKey)}
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            aria-label={t("admin.offers.deleteAria" as TranslationKey)}
                            onClick={() => setDeleteOfferIndex(idx)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
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
                        {t(`admin.status.${order.status}` as TranslationKey)}
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
