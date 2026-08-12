"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  PackagePlus,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building2,
  DollarSign,
  Layers,
  Sparkles,
} from "lucide-react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  productToEdit?: any | null;
}

// FontAwesome Barcode Icon SVG
function FontAwesomeBarcodeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 512 512">
      <path d="M24 32C10.7 32 0 42.7 0 56V456c0 13.3 10.7 24 24 24H64c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H24zM128 56V456c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24zM240 32c-13.3 0-24 10.7-24 24V456c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H240zM352 56V456c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H376c-13.3 0-24 10.7-24 24zM448 32c-13.3 0-24 10.7-24 24V456c0 13.3 10.7 24 24 24h40c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24H448z"/>
    </svg>
  );
}

export default function AddProductModal({
  isOpen,
  onClose,
  onProductAdded,
  productToEdit,
}: AddProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [category, setCategory] = useState("عام");
  const [companyId, setCompanyId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [barcode, setBarcode] = useState("");
  const [featured, setFeatured] = useState(false);

  // Auto-generate EAN-13 barcode helper
  const generateAutoBarcode = () => {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
    setBarcode(`62910${randomDigits}`);
  };

  // Categories & Companies lists fetched from DB
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>([]);

  // Form submitting state & error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name || "");
        setDescription(productToEdit.description || "");
        setCostPrice(
          productToEdit.costPrice !== undefined ? productToEdit.costPrice.toString() : ""
        );
        setPrice(productToEdit.price !== undefined ? productToEdit.price.toString() : "");
        setStock(productToEdit.stock !== undefined ? productToEdit.stock.toString() : "10");
        setCategory(productToEdit.category || "عام");
        const compId = typeof productToEdit.company === "object" ? productToEdit.company?._id : productToEdit.company;
        setCompanyId(compId || "");
        setImageUrl(productToEdit.image || (productToEdit.images && productToEdit.images[0]) || "");
        setBarcode(productToEdit.barcode || "");
        setFeatured(!!productToEdit.featured);
      } else {
        setName("");
        setDescription("");
        setCostPrice("");
        setPrice("");
        setStock("10");
        setCategory("عام");
        setCompanyId("");
        setImageUrl("");
        setBarcode("");
        setFeatured(false);
      }

      // Fetch existing categories & companies
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setExistingCategories(data.map((c: any) => c.name || c));
          }
        })
        .catch(() => {});

      fetch("/api/companies")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCompaniesList(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  // Handle direct file upload via /api/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("files", files[0]);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.urls && data.urls.length > 0) {
        setImageUrl(data.urls[0]);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError("فشل رفع الصورة إلى المتجر");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("يرجى إدخال اسم المنتج");
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("يرجى إدخال سعر بيع صحيح");
      return;
    }
    const numCostPrice = parseFloat(costPrice) || 0;
    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      setError("يرجى إدخال كمية مخزون صحيحة");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isEditing = !!productToEdit?._id;
      const url = isEditing ? `/api/products/${productToEdit._id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || name.trim(),
          price: numPrice,
          costPrice: numCostPrice,
          stock: numStock,
          category: category.trim() || "عام",
          company: companyId || null,
          image: imageUrl.trim() || "",
          images: imageUrl.trim() ? [imageUrl.trim()] : [],
          barcode: barcode.trim() || undefined,
          featured,
        }),
      });

      if (res.ok) {
        onProductAdded();
        onClose();
      } else {
        const errData = await res.json();
        setError(errData.error || "فشل حفظ بيانات المنتج");
      }
    } catch {
      setError("خطأ في الاتصال بالخادم عند حفظ المنتج");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live profit calculation
  const parsedPrice = parseFloat(price) || 0;
  const parsedCost = parseFloat(costPrice) || 0;
  const expectedProfit = parsedPrice - parsedCost;
  const expectedMargin = parsedPrice > 0 ? ((expectedProfit / parsedPrice) * 100).toFixed(1) : "0";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-extrabold text-slate-100">
              {productToEdit ? `تعديل بيانات: ${productToEdit.name}` : "إضافة منتج جديد للمتجر والكاشير"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Product Name */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">اسم المنتج (*):</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: كشاف توتال 20 فولت 2000 ليومن"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Barcode Field */}
          <div>
            <label className="text-slate-300 font-bold mb-1 flex items-center gap-1.5">
              <FontAwesomeBarcodeIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>رمز الباركود (Barcode):</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="ادخل او امسح كود الباركود..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={generateAutoBarcode}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-[11px] font-bold shrink-0 transition-all"
              >
                توليد باركود تلقائي
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">وصف المنتج:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف أو مواصفات المنتج الفنية..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Price, Cost & Stock Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Cost Price */}
            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" /> سعر الشراء (التكلفة):
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="500"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-extrabold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> سعر البيع (EGP *):
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="750"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-extrabold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> كمية المخزون (*):
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-cyan-300 font-extrabold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Expected Profit & Margin Indicator */}
          {parsedPrice > 0 && parsedCost > 0 && (
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-bold ${
                expectedProfit >= 0
                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/60 border-rose-500/50 text-rose-300"
              }`}
            >
              <span>
                {expectedProfit >= 0 ? "صافي الربح المتوقع للقطعة:" : "⚠️ تحذير: بيع بخسارة!"}
              </span>
              <span className="font-mono font-black">
                {expectedProfit.toLocaleString()} ج.م ({expectedMargin}%)
              </span>
            </div>
          )}

          {/* Category & Brand Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-cyan-400" /> القسم / الفئة:
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="مثال: أدوات كهربائية"
                list="category-suggestions"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <datalist id="category-suggestions">
                {existingCategories.map((cat, idx) => (
                  <option key={idx} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-400" /> الماركة / الشركة:
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">بدون ماركة</option>
                {companiesList.map((comp) => (
                  <option key={comp._id} value={comp._id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URL & Upload */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">صورة المنتج:</label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="رابط الصورة (HTTPS) أو اختر ملفاً للرفع..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>رفع صورة</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {isUploading && (
              <p className="text-[11px] text-amber-400 mt-1 animate-pulse">جاري رفع الصورة للمتجر...</p>
            )}

            {imageUrl && (
              <div className="mt-2 flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <Image
                  src={imageUrl}
                  alt="معاينة"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover rounded-lg"
                  unoptimized
                />
                <span className="text-[11px] text-emerald-400 font-semibold truncate flex-1">
                  تم تعيين الصورة بنجاح
                </span>
              </div>
            )}
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="featured-toggle"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500"
            />
            <label htmlFor="featured-toggle" className="text-xs font-bold text-slate-300 flex items-center gap-1 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> تعيين كمنتج مميز بالصفحة الرئيسية للمتجر
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> حفظ وإضافة المنتج
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
