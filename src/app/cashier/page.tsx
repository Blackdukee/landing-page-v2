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
  Clock,
  Sparkles,
  Package,
} from "lucide-react";

export default function CashierPOSPage() {
  // Navigation Tabs: "pos" | "orders" | "returns" | "products" | "reports"
  const [activeTab, setActiveTab] = useState<"pos" | "orders" | "returns" | "products" | "reports">("pos");

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
    } catch (err) {
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
      <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 px-4 flex items-center justify-between gap-3 shrink-0 backdrop-blur-xl z-30 no-print">
        {/* Brand & Terminal Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Store className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-100 flex items-center gap-1.5 leading-tight">
              كاش إير POS <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">منظومة كاشير المحل والتقارير المالية</p>
          </div>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "pos"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Monitor className="w-4 h-4" /> شاشة البيع (POS)
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "orders"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> إدارة الطلبات
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "returns"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <RotateCcw className="w-4 h-4" /> سجل المرتجعات
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "products"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Package className="w-4 h-4" /> إدارة المنتجات
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> التقارير المالية
          </button>
        </div>

        {/* Right Header Status & Action Controls */}
        <div className="flex items-center gap-2.5">
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

          {/* Quick Issue Return Trigger Button */}
          <button
            onClick={() => setIsReturnsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" /> إرجاع سريع
          </button>

          {/* Active Shift Indicator & Action */}
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
      <main className="flex-1 p-3 overflow-hidden min-h-0">
        {activeTab === "pos" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full min-h-0">
            {/* Left/Center Grid Area (7 cols on lg, 8 on xl) */}
            <div className="lg:col-span-7 xl:col-span-8 h-full min-h-0 flex flex-col">
              <POSProductGrid
                onAddToCart={handleAddToCart}
                getItemQuantityInCart={getItemQuantityInCart}
              />
            </div>

            {/* Right Cart Sidebar (5 cols on lg, 4 on xl) */}
            <div className="lg:col-span-5 xl:col-span-4 h-full min-h-0 flex flex-col">
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
                }}
              />
            </div>
          </div>
        ) : activeTab === "orders" ? (
          <div className="h-full min-h-0">
            <POSOrdersTab />
          </div>
        ) : activeTab === "returns" ? (
          <div className="h-full min-h-0">
            <POSReturnsTab />
          </div>
        ) : activeTab === "products" ? (
          <div className="h-full min-h-0">
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
