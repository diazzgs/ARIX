import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  store_id: number;
  store_name: string;
  quantity: number;
  image_url: string | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.product_id === item.product_id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (product_id) => {
        set({ items: get().items.filter((i) => i.product_id !== product_id) });
      },

      updateQuantity: (product_id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.product_id !== product_id) });
        } else {
          set({
            items: get().items.map((i) =>
              i.product_id === product_id ? { ...i, quantity } : i
            ),
          });
        }
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    { name: "arix-cart" }
  )
);