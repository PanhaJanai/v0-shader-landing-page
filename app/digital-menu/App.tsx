"use client";

import React from "react";
import Category from "@/components/Home/Category";
import FoodSection from "@/components/Home/FoodSection";
import Header from "@/components/Home/Header";
import "./index.css";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { setIsShowingAllItem } from "./state/cartItemSlice";

export interface Item {
  id: number;
  name: string;
  price: number;
  discounted_price: number;
  category: number;
  cover: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function App() {

  const dispatch = useDispatch<AppDispatch>();
  const isShowingAllItem = useSelector(
    (state: RootState) => state.cartItem.isShowingAllItem
  );

  return (
    <main className="grid grid-cols-1 h-[100vh]">
      <div
        className={`sticky top-0 z-1 bg-white rounded-lg shadow-lg p-5 max-h-[40vh] ${
          isShowingAllItem ? "hidden" : ""
        }`}
      >
        <Header />
        <Category />
      </div>

      {isShowingAllItem && (
        <div className="flex justify-between items-center p-5 mb-6 bg-white rounded-lg shadow-lg z-2 sticky top-5 h-[8vh]">
          <h1 className="font-semibold">All Items</h1>
          <button
            className="text-orange-500 font-semibold"
            onClick={() => {
              dispatch(setIsShowingAllItem(false));
            }}
          >
            Close
          </button>
        </div>
      )}

      <div
        // className={`${
        //   isShowingAllItem ? "max-h-[88vh]" : "max-h-[55vh]"
        // } overflow-y-auto mt-5`}
      >
        <div>
          <FoodSection />
        </div>
      </div>
    </main>
  );
}
