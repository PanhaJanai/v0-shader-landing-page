import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Item {
  id: number;
  name: string;
  price: number;
  discounted_price: number;
  category: number;
  cover: string;
  isShown: boolean;
}

interface Order {
  itemId: number;
  quantity: number;
  price: number;
  discounted_price: number;
}

interface CartItem {
  items: Item[];
  selectedItems: Item[];
  searchedItems: Item[];
  orders?: Order[];
  isShowingAllItem: boolean;
  loading: boolean;
  fetched: boolean;
  isSearching: boolean;
  searchValue: string;
  searchTimeout: NodeJS.Timeout;
  isItemDrawerOpen: boolean;
  itemForDrawer: Item;
}

const initialState: CartItem = {
  items: [],
  selectedItems: [],
  searchedItems: [],
  orders: [],
  isShowingAllItem: false,
  loading: false,
  fetched: false,
  isSearching: false,
  searchValue: "",
  searchTimeout: undefined as unknown as NodeJS.Timeout,
  isItemDrawerOpen: false,
  itemForDrawer: undefined as unknown as Item,
};

// const covers = [
//   "/images/pizza.avif",
//   "/images/sundae.webp",
//   "/images/matcha-latte.webp",
// ]

export const getItemAsync = createAsyncThunk(
  "cart/getItemAsync",
  async ({ itemList, type }: { itemList: number[]; type: string }) => {
    try {
      // const lol = (i: number) => {
      //   if (i % 3 == 1) {
      //     return 1;
      //   } else if (i % 3 == 2) {
      //     return 2;
      //   } else {
      //     return 3;
      //   }
      // };
      // var items: Item[] = Array.from({ length: 1000 }, (_, index) => ({
      //   id: index,
      //   name: `Item ${index + 1}`,
      //   price: Math.floor(Math.random() * 100) + 1,
      //   discounted_price: Math.floor(Math.random() * 100) + 1,
      //   category: lol(index),
      //   cover: covers[lol(index) - 1],
      //   isShown: true,
      // }));

      // itemsBackup = items;

    // return { items, type: "full" };
      // await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!itemList?.length && type === "full") {
        return { items: itemsBackup, type: "full" };
      }

      if (type === "filtered") {
        const filteredItems = itemsBackup.filter((item) =>
          itemList.includes(item.id)
        );
        return { items: filteredItems, type: "filtered" };
      } else if (type === "search") {
        const searchedItems = itemsBackup.filter((item) =>
          itemList.includes(item.id)
        );
        return { items: searchedItems, type: "search" };
      }


    } catch (error) {
      console.error("Error fetching food data:", error);

      if (!itemList?.length) {
        return { items: itemsBackup, type: "full" };
      } else {
        const filteredItems = itemsBackup.filter((item) =>
          itemList.includes(item.id)
        );
        return { items: filteredItems, type: "filtered" };
      }
    }
  }
);

const cartItemSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    emptySelectedItem: (state) => {
      state.selectedItems = [];
    },

    setIsShowingAllItem: (state, action: PayloadAction<boolean>) => {
      state.isShowingAllItem = action.payload;
    },

    setSearchValue: (state, action: PayloadAction<string>) => {
      state.searchValue = action.payload;
    },

    // make an addOrRemoveOrder that will add an order to the orders array
    addOrRemoveOrder: (state, action: PayloadAction<Order>) => {
      const existingOrder = state.orders?.find(
        (order) => order.itemId === action.payload.itemId
      );

      if (existingOrder) {
        state.orders = state.orders?.filter(
          (order) => order.itemId !== action.payload.itemId
        );
      } else {
        state.orders?.push(action.payload);
      }
    },

    setOrderQuantity: (
      state,
      action: PayloadAction<{ itemId: number; newQuantity: number }>
    ) => {
      state.orders = state.orders?.map((order) => {
        if (order.itemId === action.payload.itemId) {
          return { ...order, quantity: action.payload.newQuantity };
        }
        return order;
      });
    },

    setIsSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },

    setSearchTimeout: (state, action: PayloadAction<NodeJS.Timeout>) => {
      state.searchTimeout = action.payload;
    },

    setIsItemDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isItemDrawerOpen = action.payload;
    },

    setItemForDrawer: (state, action: PayloadAction<Item>) => {
      state.itemForDrawer = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getItemAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        getItemAsync.fulfilled,
        (state, action: PayloadAction<{ items: Item[]; type: string } | undefined>) => {
          state.loading = false;
          if (action.payload) {
            if (action.payload.type === "full") {
              state.fetched = true;
              state.items = action.payload.items;
            } else if (action.payload.type === "filtered") {
              state.selectedItems = action.payload.items;
              state.orders = state.orders?.map((order) => {
                if (action.payload) {
                  const item = action.payload.items.find(
                    (item) => item.id === order.itemId
                  );
                  if (item) {
                    return {
                      ...order,
                      price: item.price,
                      discounted_price: item.discounted_price,
                    };
                  }
                }
                return order;
              });
            } else if (action.payload.type === "search") {
              state.searchedItems = action.payload.items;
              state.isSearching = true;
            }

            console.log(`Fetched ${action.payload.type} items`);
          } else {
            console.error("No payload received in fulfilled case");
          }
        }
      );
  },
});

const foodPath = [
  "avocado-toast.avif",
  "meat-platter.avif",
  "salad.avif",
  "pizza.avif",
  "grilled-salmon.avif",
  "hamburgers.webp",
  "sushi.webp",
  "taco.webp",
  "blueberry-pancake.avif",
];

const drinksPath = [
  "iced-tea.avif",
  "lemonade.avif",
  "margarita.avif",
  "matcha-latte.webp",
  "thai tea.webp",
  "orange-juice.avif",
  "rose-wine.avif",
  "coffee.webp",
  "hot-chocolate.webp",
];

const dessertPath = [
  "sundae.webp",
  "cake.avif",
  "macarons.avif",
  "creme-brulee.webp",
  "cheesecake.webp",
  "cinnamon-rolls.webp",
  "donut.avif",
  "blueberry-pie.avif",
  "ice-cream.avif",
];

const itemsPath = [
  ...foodPath,
  ...drinksPath,
  ...dessertPath,
];

const itemsBackup = itemsPath.map((item, index) => {
  const ranNum = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
  return {
    id: index,
    price: ranNum + 5,
    discounted_price: ranNum,
    name: item.replace('-', ' ').split('.')[0][0].toUpperCase() + item.replace('-', ' ').split('.')[0].slice(1),
    category: index < 9 ? 1 : index < 18 ? 2 : 3,
    cover: `/images/${item}`,
    isShown: true,
  }
});

// const foodsBackup = itemsBackup.filter((item) => item.category === 1);
// const drinksBackup = itemsBackup.filter((item) => item.category === 2);
// const dessertsBackup = itemsBackup.filter((item) => item.category === 3);

export const { emptySelectedItem, addOrRemoveOrder, setOrderQuantity, setIsShowingAllItem, setSearchValue, setSearchTimeout, setIsSearching, setIsItemDrawerOpen, setItemForDrawer } =
  cartItemSlice.actions;
export default cartItemSlice.reducer;
export { itemsBackup };
