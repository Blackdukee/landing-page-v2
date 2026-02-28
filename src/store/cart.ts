import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock?: number; // Product stock to validate against
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, stock?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, stock?: number) => boolean;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, stock = Infinity) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        const newQuantity = existing ? existing.quantity + 1 : 1;

        // Check if adding would exceed stock
        if (newQuantity > stock) {
          return false; // Failed to add
        }

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1, stock }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: 1, stock }] });
        }
        return true; // Successfully added
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity, stock = Infinity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
          return true;
        }

        // Check if quantity exceeds stock
        if (quantity > stock) {
          return false; // Failed to update
        }

        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity, stock } : i
          ),
        });
        return true; // Successfully updated
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
