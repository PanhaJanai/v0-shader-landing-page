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

import { getMenuCategories } from "@/app/(admin)/admin/digital-menu/actions";

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
      const dbCategories = await getMenuCategories();
      if (dbCategories && dbCategories.length > 0) {
        return dbCategories.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon
        }));
      }
      return categoriesBackup;
    } catch (error) {
      console.error("Error fetching food data from DB, fallback to mock:", error);
      return categoriesBackup;
    }
  }
);

export const { setActiveCategory } = categorySlice.actions;
export default categorySlice.reducer;