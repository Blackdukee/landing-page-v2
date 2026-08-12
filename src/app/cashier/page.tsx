"use client";

import React, { useState, useEffect } from "react";
import POSProductGrid, { POSProduct } from "@/components/cashair/POSProductGrid";
import POSCartPanel, { CartItemWithOverride } from "@/components/cashair/POSCartPanel";
import ReturnsModal from "@/components/cashair/ReturnsModal";
import ShiftModal from "@/components/cashair/ShiftModal";
import FinancialReportsTab from "@/components/cashair/FinancialReportsTab";
import POSOrdersTab from "@/components/cashair/POSOrdersTab";
import POSReturnsTab from "@/components/cashair/POSReturnsTab";
import POSProductsTab from "@/components/cashair/POSProductsTab";
import { useCartStore } from "@/store/cart";
import {
  Monitor,
  TrendingUp,
  RotateCcw,
  Unlock,
  Lock,
  Globe,
  ShoppingBag,
  Store,
  Sparkles,
  Package,
  ChevronLeft,
  ShoppingCart,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function CashierPOSPage() {
  // Navigation Tabs: "pos" | "orders" | "returns" | "products" | "reports"
  const [activeTab, setActiveTab] = useState<"pos" | "orders" | "returns" | "products" | "reports">("pos");

  // Mobile POS view toggle: "catalog" | "cart"
  const [mobilePosView, setMobilePosView] = useState<"catalog" | "cart">("catalog");

  // Modals state
  const [isReturnsModalOpen, setIsReturnsModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<"start" | "end">("start");

  // Active Shift state from GET /api/cashair/shift
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [loadingShift, setLoadingShift] = useState(true);

  // Cart state & actions from Zustand
  const storeItems = useCartStore((state) => state.items);
  const addItemToStore = useCartStore((state) => state.addItem);
  const removeItemFromStore = useCartStore((state) => state.removeItem);
  const updateQuantityInStore = useCartStore((state) => state.updateQuantity);
  const updateItemOverrideInStore = useCartStore((state) => state.updateItemOverride);
  const updateItemDiscountInStore = useCartStore((state) => state.updateItemDiscount);
  const clearStoreCart = useCartStore((state) => state.clearCart);

  // Totals for mobile floating action bar
  const totalCartItemsCount = storeItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Web Orders pending count state
  const [webOrdersCount, setWebOrdersCount] = useState<number>(0);

  // Fetch Active Shift
  const fetchActiveShift = async () => {
    setLoadingShift(true);
    try {
      const res = await fetch("/api/cashair/shift");
      const data = await res.json();
      if (data.success) {
        setActiveShift(data.shift);
      } else {
        setActiveShift(null);
      }
    } catch {
      setActiveShift(null);
    } finally {
      setLoadingShift(false);
    }
  };

  // Fetch pending web orders count
  const fetchWebOrdersCount = async () => {
    try {
      const res = await fetch("/api/cashair/orders?source=online&status=pending&limit=1");
      const data = await res.json();
      if (data.success && typeof data.total === "number") {
        setWebOrdersCount(data.total);
      }
    } catch {
      // Ignore count error
    }
  };

  useEffect(() => {
    fetchActiveShift();
    fetchWebOrdersCount();
    const interval = setInterval(fetchWebOrdersCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Map store items to CartItemWithOverride format for POSCartPanel
  const cartItemsWithOverrides: CartItemWithOverride[] = storeItems.map((item) => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    basePrice: item.basePrice,
    costPrice: item.costPrice,
    overridePrice: item.basePrice !== undefined ? item.price : undefined,
    quantity: item.quantity,
    stock: item.stock,
    image: item.image,
    itemDiscount:
      item.discountType && item.discountValue
        ? { type: item.discountType, value: item.discountValue }
        : undefined,
  }));

  // Handlers for cart actions
  const handleAddToCart = (product: POSProduct) => {
    const success = addItemToStore(
      {
        productId: product._id,
        name: product.name,
        price: product.price,
        costPrice: product.costPrice,
        image: product.image || "",
      },
      product.stock,
      1
    );
    return success;
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    updateQuantityInStore(productId, newQty);
  };

  const handleUpdatePrice = (productId: string, newPrice: number | undefined) => {
    updateItemOverrideInStore(productId, newPrice ?? -1);
  };

  const handleUpdateItemDiscount = (
    productId: string,
    discount?: { type: "percentage" | "fixed"; value: number }
  ) => {
    updateItemDiscountInStore(productId, discount?.type, discount?.value);
  };

  const handleRemoveItem = (productId: string) => {
    removeItemFromStore(productId);
  };

  const handleClearCart = () => {
    clearStoreCart();
  };

  const getItemQuantityInCart = (productId: string) => {
    const item = storeItems.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const openStartShiftModal = () => {
    setShiftModalMode("start");
    setIsShiftModalOpen(true);
  };

  const openEndShiftModal = () => {
    setShiftModalMode("end");
    setIsShiftModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
      {/* Top POS Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-4 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 backdrop-blur-xl z-30 no-print">
        {/* Top Row on Mobile: Brand & Shift/Actions */}
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          {/* Brand & Terminal Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-1.5 leading-tight">
                كاش إير POS <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden xs:block">
                منظومة كاشير المحل والتقارير
              </p>
            </div>
          </div>

          {/* Quick Header Actions on Mobile */}
          <div className="flex sm:hidden items-center gap-1.5">
            {/* Quick Return Trigger Button */}
            <button
              onClick={() => setIsReturnsModalOpen(true)}
              className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-xl transition-all"
              title="إرجاع سريع"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>

            {/* Active Shift Indicator & Action on Mobile */}
            {loadingShift ? (
              <div className="h-8 w-8 bg-slate-800 animate-pulse rounded-xl"></div>
            ) : activeShift ? (
              <button
                onClick={openEndShiftModal}
                className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-800 px-2.5 py-1.5 rounded-xl text-emerald-300 text-xs font-bold"
                title="إغلاق الوردية"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] truncate max-w-[70px]">{activeShift.cashierName}</span>
                <Lock className="w-3 h-3 text-emerald-400" />
              </button>
            ) : (
              <button
                onClick={openStartShiftModal}
                className="px-2.5 py-1.5 bg-emerald-600 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 shadow-md"
              >
                <Unlock className="w-3.5 h-3.5" /> فتح وردية
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector Buttons: Horizontal scrollable on mobile */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none w-full sm:w-auto shrink-0">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "pos"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>البيع (POS)</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 relative ${
              activeTab === "orders"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>الطلبات</span>
            {webOrdersCount > 0 && (
              <span className="bg-cyan-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {webOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("returns")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "returns"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>المرتجعات</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "products"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>المنتجات</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "reports"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>التقارير</span>
          </button>
        </div>

        {/* Right Header Controls (Desktop Only) */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {/* Web Orders Badge */}
          {webOrdersCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-cyan-900/80 transition-all"
              onClick={() => setActiveTab("orders")}
              title="انقر للانتقال لجدول طلبات الأونلاين"
            >
              <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>طلبات المتجر: {webOrdersCount}</span>
            </div>
          )}

          {/* Quick Return Trigger Button */}
          <button
            onClick={() => setIsReturnsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" /> إرجاع سريع
          </button>

          {/* Active Shift Indicator & Action on Desktop */}
          {loadingShift ? (
            <div className="h-8 w-28 bg-slate-800 animate-pulse rounded-xl"></div>
          ) : activeShift ? (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-300 block leading-tight">
                  {activeShift.cashierName} (مفتوحة)
                </span>
                <span className="text-[9px] text-emerald-400/80 font-medium">
                  {new Date(activeShift.openedAt).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <button
                onClick={openEndShiftModal}
                className="mr-1 p-1 hover:bg-emerald-900/60 rounded text-emerald-400 transition-colors"
                title="إغلاق الوردية"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openStartShiftModal}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Unlock className="w-4 h-4" /> فتح وردية جديدة
            </button>
          )}
        </div>
      </header>

      {/* Main Terminal View Area */}
      <main className="flex-1 p-2 sm:p-3 overflow-hidden min-h-0 relative">
        {activeTab === "pos" ? (
          <div className="h-full flex flex-col min-h-0">
            {/* Mobile View Toggle Bar (Catalog vs Cart) */}
            <div className="lg:hidden flex items-center justify-between gap-2 mb-2 shrink-0 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
              <div className="grid grid-cols-2 gap-1 flex-1">
                <button
                  onClick={() => setMobilePosView("catalog")}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mobilePosView === "catalog"
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>الكتالوج والمنتجات</span>
                </button>

                <button
                  onClick={() => setMobilePosView("cart")}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
                    mobilePosView === "cart"
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>سلة البيع</span>
                  {totalCartItemsCount > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      mobilePosView === "cart" ? "bg-slate-950 text-amber-400" : "bg-amber-500 text-slate-950"
                    }`}>
                      {totalCartItemsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Dual-Pane Grid & Mobile Single-Pane View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full min-h-0">
              {/* Left/Center Catalog Grid Area */}
              <div
                className={`lg:col-span-7 xl:col-span-8 h-full min-h-0 flex flex-col ${
                  mobilePosView === "catalog" ? "flex" : "hidden lg:flex"
                }`}
              >
                <POSProductGrid
                  onAddToCart={handleAddToCart}
                  getItemQuantityInCart={getItemQuantityInCart}
                />
              </div>

              {/* Right Cart Sidebar */}
              <div
                className={`lg:col-span-5 xl:col-span-4 h-full min-h-0 flex flex-col ${
                  mobilePosView === "cart" ? "flex" : "hidden lg:flex"
                }`}
              >
                {/* Back to Catalog button on Mobile Cart View */}
                {mobilePosView === "cart" && (
                  <button
                    onClick={() => setMobilePosView("catalog")}
                    className="lg:hidden mb-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 shrink-0"
                  >
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                    <span>العودة إلى الكتالوج لإضافة منتجات</span>
                  </button>
                )}

                <POSCartPanel
                  items={cartItemsWithOverrides}
                  onUpdateQuantity={handleUpdateQuantity}
                  onUpdatePrice={handleUpdatePrice}
                  onUpdateItemDiscount={handleUpdateItemDiscount}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  activeShiftId={activeShift?._id || null}
                  cashierName={activeShift?.cashierName || "كاشير"}
                  onSaleCompleted={() => {
                    fetchActiveShift();
                    setMobilePosView("catalog");
                  }}
                />
              </div>
            </div>

            {/* Floating Mobile Cart Action Bar when browsing Catalog with items */}
            {mobilePosView === "catalog" && totalCartItemsCount > 0 && (
              <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
                <button
                  onClick={() => setMobilePosView("cart")}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 p-3.5 rounded-2xl font-black text-sm shadow-2xl shadow-amber-500/50 flex items-center justify-between transition-all active:scale-[0.98] border border-amber-300/50 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="bg-slate-950/20 px-2.5 py-1 rounded-xl text-xs font-black">
                      {totalCartItemsCount} {totalCartItemsCount === 1 ? "صنف" : "أصناف"}
                    </div>
                    <span>عرض السلة والدفع</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-base font-black">
                    <span>{totalCartPrice.toLocaleString()}</span>
                    <span className="text-xs font-normal">ج.م</span>
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === "orders" ? (
          <div className="h-full min-h-0 overflow-y-auto">
            <POSOrdersTab />
          </div>
        ) : activeTab === "returns" ? (
          <div className="h-full min-h-0 overflow-y-auto">
            <POSReturnsTab />
          </div>
        ) : activeTab === "products" ? (
          <div className="h-full min-h-0 overflow-y-auto">
            <POSProductsTab />
          </div>
        ) : (
          <div className="h-full min-h-0 overflow-y-auto">
            <FinancialReportsTab />
          </div>
        )}
      </main>

      {/* Modals Container */}
      <ReturnsModal
        isOpen={isReturnsModalOpen}
        onClose={() => setIsReturnsModalOpen(false)}
        activeShiftId={activeShift?._id || null}
        cashierName={activeShift?.cashierName || "كاشير"}
        onReturnCompleted={() => {
          fetchActiveShift();
        }}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        mode={shiftModalMode}
        onClose={() => setIsShiftModalOpen(false)}
        activeShift={activeShift}
        onShiftUpdated={() => {
          fetchActiveShift();
        }}
      />
    </div>
  );
}
