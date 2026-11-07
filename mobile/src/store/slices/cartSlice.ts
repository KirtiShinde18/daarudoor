import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string; // Product ID
  name: string;
  image: string;
  price: number;
  quantity: number;
  volume?: string;
  category?: string;
  brand?: string;
}

interface CartState {
  items: CartItem[];
  lastAddedItem: CartItem | null;
  toastTrigger: number;
  appliedOffer: { code: string; discountAmount: number } | null;
}

const initialState: CartState = {
  items: [],
  lastAddedItem: null,
  toastTrigger: 0,
  appliedOffer: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      state.lastAddedItem = action.payload;
      state.toastTrigger += 1;
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        if (item.quantity <= 0) {
          state.items = state.items.filter(i => i.id !== action.payload.id);
        }
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
      state.appliedOffer = null;
    },
    applyOffer: (state, action: PayloadAction<{ code: string; discountAmount: number }>) => {
      state.appliedOffer = action.payload;
    },
    removeOffer: (state) => {
      state.appliedOffer = null;
    }
  }
});

export const { addToCart, updateQuantity, removeFromCart, clearCart, applyOffer, removeOffer } = cartSlice.actions;
export default cartSlice.reducer;
