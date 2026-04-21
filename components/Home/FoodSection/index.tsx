import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/lib/redux/store";
import { RootState } from "@/lib/redux/store";
import { getItemAsync, setIsSearching } from "@/app/digital-menu/state/cartItemSlice";
import { ThreeDot } from "react-loading-indicators";
import VirtualizedCard from "./_components/VirtualizedCard";

export const breakpoints = {
  sm: { width: 640, height: 360 },
  md: { width: 768, height: 432 },
  lg: { width: 1024, height: 576 },
  xl: { width: 1280, height: 720 },
};
interface Item {
  id: number;
  name: string;
  price: number;
  discounted_price: number;
  category: number;
  cover: string;
}

export default function FoodSection() {

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
    useEffect(() => {
      // Only runs on client
      function handleResize() {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }
      handleResize(); // Set initial size
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

  const itemList = useSelector((state: RootState) => state.cartItem.items);
  const searchedItems = useSelector(
    (state: RootState) => state.cartItem.searchedItems
  );
  const isSearching = useSelector(
    (state: RootState) => state.cartItem.isSearching
  );
  const isShowingAllItem = useSelector(
    (state: RootState) => state.cartItem.isShowingAllItem
  );

  const activeCategory = useSelector(
    (state: RootState) => state.category.activeCategoryId
  );
  // var isSelected: boolean = false;

  const dispatch = useDispatch<AppDispatch>();
  const selectedItemIds = useSelector(
    (state: RootState) => state.idArray.selectedItemIds
  );

  const searchValue = useSelector(
    (state: RootState) => state.cartItem.searchValue
  );

  const fetched = useSelector((state: RootState) => state.cartItem.fetched);
  useEffect(() => {
    if (!fetched) dispatch(getItemAsync({ itemList: [], type: "full" }));
  }, [dispatch, fetched]);

  useEffect(() => {
    if (searchValue?.trim()) {
      const searchItemId = itemList
        .filter((item: Item) => {
          return item.name.toLowerCase().includes(searchValue.toLowerCase());
        })
        .map((item: Item) => item.id);
      dispatch(getItemAsync({ itemList: searchItemId, type: "search" }));
    } else {
      dispatch(setIsSearching(false));
    }
  }, [dispatch, searchValue, itemList]);

  const loading = useSelector((state: RootState) => state.cartItem.loading);
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ThreeDot
          color="oklch(70.5% 0.213 47.604)"
          size="medium"
          text="Getting Items"
          textColor=""
        />
      </div>
    );
  }

  const itemsToRender = isSearching ? searchedItems : itemList;
  const filteredList =
    activeCategory !== null && activeCategory !== 0
      ? itemsToRender.filter((item: Item) => item.category === activeCategory)
      : itemsToRender;

  if (windowSize.width < breakpoints.sm.width) {
    return (
      <VirtualizedCard
        filteredList={filteredList}
        selectedItemIds={selectedItemIds}
        isShowingAllItem={isShowingAllItem}
        numberOfItemsPerRow={2}
        itemSize={220}
        widthOfCard={165}
      />
    );
  }
  else if (windowSize.width < breakpoints.md.width) {
    return (
      <VirtualizedCard
        filteredList={filteredList}
        selectedItemIds={selectedItemIds}
        isShowingAllItem={isShowingAllItem}
        numberOfItemsPerRow={3}
        itemSize={220}
        widthOfCard={175}
      />
    );
  }
  else if (windowSize.width < breakpoints.lg.width) {
    return (
      <VirtualizedCard
        filteredList={filteredList}
        selectedItemIds={selectedItemIds}
        isShowingAllItem={isShowingAllItem}
        numberOfItemsPerRow={3}
        itemSize={220}
        widthOfCard={200}
      />
    );
  }
  else {
    return (
      <VirtualizedCard
        filteredList={filteredList}
        selectedItemIds={selectedItemIds}
        isShowingAllItem={isShowingAllItem}
        numberOfItemsPerRow={4}
        itemSize={220}
        widthOfCard={200}
      />
    );
  }
}