'use client';

import React, { useState } from 'react';
import { X, Printer, Tag, Sparkles } from 'lucide-react';
import { SvgBarcode } from '../printing/SvgBarcode';

export interface BarcodeLabelProduct {
  _id: string;
  name: string;
  price: number;
  barcode?: string;
  category?: string;
}

interface BarcodeLabelModalProps {
  isOpen: boolean;
  product: BarcodeLabelProduct | null;
  storeName?: string;
  onClose: () => void;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  product,
  storeName = 'متجر قويسنا',
  onClose,
}) => {
  const [copies, setCopies] = useState<number>(1);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showStoreName, setShowStoreName] = useState<boolean>(true);

  if (!isOpen || !product) return null;

  const barcodeValue = product.barcode?.trim() || product._id.slice(-8).toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-slate-100">طباعة ملصق الباركود (Price Tag)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label View (Rendered for Print & Live Preview) */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center no-print">
          <p className="text-xs text-slate-400 mb-2 font-medium">معاينة الملصق الحراري (50mm × 30mm):</p>

          <div className="bg-white text-black p-2.5 rounded-lg shadow-md border border-slate-300 w-[200px] flex flex-col items-center justify-center text-center select-none font-sans">
            {showStoreName && (
              <p className="text-[10px] font-bold text-slate-700 tracking-wide truncate max-w-[180px]">
                {storeName}
              </p>
            )}
            <p className="text-xs font-black text-slate-950 line-clamp-1 mt-0.5 max-w-[180px]" title={product.name}>
              {product.name}
            </p>
            <div className="my-1">
              <SvgBarcode value={barcodeValue} width={1.3} height={32} displayValue={true} />
            </div>
            {showPrice && (
              <p className="text-xs font-extrabold text-slate-950 mt-0.5">
                السعر: {product.price.toLocaleString()} ج.م
              </p>
            )}
          </div>
        </div>

        {/* Hidden Printable Container Targeted by @media print */}
        <div
          id="printable-barcode-label"
          className="hidden print:flex flex-col items-center justify-center text-center bg-white text-black font-sans leading-none"
        >
          {showStoreName && (
            <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '2px' }}>
              {storeName}
            </div>
          )}
          <div style={{ fontSize: '10px', fontWeight: '900', maxWidth: '46mm', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
            {product.name}
          </div>
          <SvgBarcode value={barcodeValue} width={1.2} height={28} displayValue={true} />
          {showPrice && (
            <div style={{ fontSize: '10px', fontWeight: '900', marginTop: '2px' }}>
              {product.price.toLocaleString()} EGP
            </div>
          )}
        </div>

        {/* Label Options */}
        <div className="space-y-3 pt-1 text-xs no-print">
          <div className="flex items-center justify-between bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-300 font-medium">عدد النسخ (Copies):</span>
            <div className="flex items-center gap-2">
              {[1, 2, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCopies(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    copies === num
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-slate-200">إظهار السعر</span>
            </label>
            <label className="flex items-center gap-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={(e) => setShowStoreName(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-slate-200">اسم المتجر</span>
            </label>
          </div>
        </div>

        {/* Print Trigger */}
        <div className="flex items-center gap-2 pt-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" /> طباعة الملصق الآن
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
