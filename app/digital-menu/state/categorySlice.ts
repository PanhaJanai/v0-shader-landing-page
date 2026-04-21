import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Categories {
  categories: Category[];
}

interface ActiveCategory {
  activeCategoryId: number | null;
}

const initialState: Categories & ActiveCategory = {
  categories: [],
  activeCategoryId: null,
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setActiveCategory(state, action: PayloadAction<number | null>) {
      state.activeCategoryId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      getCategoryAsync.fulfilled,
      (state, action: PayloadAction<Category[]>) => {
        if (action.payload) {
          action.payload.forEach((category: Category) => {
            if (!state.categories.some((categoryList: Category) => categoryList.id === category.id)) {
              state.categories.push(category);
            }
          });
        }
      }
    );
  }
});

const categoriesBackup = [
  { id: 0, name: "All", icon: "FaFire" },
  { id: 1, name: "Food", icon: "GiHotDog" },
  { id: 2, name: "Drink", icon: "RiDrinks2Line" },
  { id: 3, name: "Dessert", icon: "LuDessert" },
];

export const getCategoryAsync = createAsyncThunk(
  "category/getCategoryAsync",
  async () => {
    try {
      // const res = await fetch(
      //   "https://6815afab32debfe95dbc23e1.mockapi.io/categories",
      //   { cache: "no-store" }
      // );
      // if (!res.ok) throw new Error("Failed to fetch data");
      // return await res.json();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return categoriesBackup;
    } catch (error) {
      return categoriesBackup;
      console.error("Error fetching food data:", error);
    } finally {}
  }
);

export const { setActiveCategory } = categorySlice.actions;
export default categorySlice.reducer;