import { configureStore } from "@reduxjs/toolkit"
import cartItemReducer from "@/app/digital-menu/state/cartItemSlice"
import cartItemIdReducer from "@/app/digital-menu/state/idArraySlice"
import categoryReducer from "@/app/digital-menu/state/categorySlice"

export const store = configureStore({
  reducer: {
    cartItem: cartItemReducer,
    idArray: cartItemIdReducer,
    category: categoryReducer
  }
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
