import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Id {
  cartItemIds: number[];
  selectedItemIds: number[];
}

const initialState: Id = {
  cartItemIds: [],
  selectedItemIds: [],
};

const idSlice = createSlice({
  name: "cartState",
  initialState,
  reducers: {
    // Cart Item Actions
    addToCartItemIds: (state, action: PayloadAction<number>) => {
      state.cartItemIds.push(action.payload);
    },
    removeFromCartItemIds: (state, action: PayloadAction<number>) => {
      state.cartItemIds = state.cartItemIds.filter(
        (id) => id !== action.payload
      );
    },
    clearCartItemIds: (state) => {
      state.cartItemIds = [];
    },

    // Selected Item Actions
    addOrRemoveSelectedItemIds: (
      state,
      action: PayloadAction<{ id: number; type: "add" | "remove" }>
    ) => {
      const { id, type } = action.payload;

      if (type === "add") {
          state.selectedItemIds.push(id);
      } else if (type === "remove") {
        state.selectedItemIds = state.selectedItemIds.filter(
          (selectedId) => selectedId !== id
        );
      }
    },
    
    removeFromSelectedItemIds: (state, action: PayloadAction<number>) => {
      state.selectedItemIds = state.selectedItemIds.filter(
        (id) => id !== action.payload
      );
    },
    clearSelectedItemIds: (state) => {
      state.selectedItemIds = [];
    },
  },
});

export const {
  addToCartItemIds,
  removeFromCartItemIds,
  clearCartItemIds,
  addOrRemoveSelectedItemIds,
  removeFromSelectedItemIds,
  clearSelectedItemIds,
} = idSlice.actions;

export default idSlice.reducer;
