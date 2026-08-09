import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  basePrice?: number;
  image: string;
  quantity: number;
  stock?: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  stacked?: boolean;
}

interface CartState {
  items: CartItem[];
  addItem: (
    item: Omit<CartItem, "quantity">,
    stock?: number,
    qtyToAdd?: number
  ) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    stock?: number
  ) => boolean;
  updateItemOverride: (productId: string, newPrice: number) => void;
  updateItemDiscount: (
    productId: string,
    discountType?: "percentage" | "fixed",
    discountValue?: number
  ) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  getItemQuantity: (productId: string) => number;
  canAddMore: (productId: string, stock: number) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, stock, qtyToAdd = 1) => {
        const effectiveStock =
          stock !== undefined ? stock : (item.stock ?? Infinity);
        if (effectiveStock <= 0) {
          return false;
        }

        const existing = get().items.find((i) => i.productId === item.productId);
        const currentQty = existing ? existing.quantity : 0;
        const newQuantity = currentQty + qtyToAdd;

        // Check if adding would exceed stock
        if (newQuantity > effectiveStock) {
          return false; // Failed to add
        }

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: newQuantity, stock: effectiveStock }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { ...item, quantity: qtyToAdd, stock: effectiveStock },
            ],
          });
        }
        return true; // Successfully added
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity, stock) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
          return true;
        }

        const existing = get().items.find((i) => i.productId === productId);
        const effectiveStock =
          stock !== undefined ? stock : (existing?.stock ?? Infinity);

        // Check if quantity exceeds stock or stock <= 0
        if (quantity > effectiveStock || effectiveStock <= 0) {
          return false; // Failed to update
        }

        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, quantity, stock: effectiveStock }
              : i
          ),
        });
        return true; // Successfully updated
      },

      updateItemOverride: (productId, newPrice) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? {
                  ...i,
                  basePrice: i.basePrice ?? i.price,
                  price: newPrice >= 0 ? newPrice : i.price,
                }
              : i
          ),
        });
      },

      updateItemDiscount: (productId, discountType, discountValue) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? {
                  ...i,
                  discountType,
                  discountValue: discountValue && discountValue > 0 ? discountValue : undefined,
                }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemQuantity: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        return item ? item.quantity : 0;
      },

      canAddMore: (productId, stock) => {
        if (stock <= 0) return false;
        const quantityInCart = get().getItemQuantity(productId);
        return quantityInCart < stock && stock > 0;
      },
    }),
    { name: "cart-storage" }
  )
);
