"use client";

import React, { useEffect } from "react";
import { CiForkAndKnife } from "react-icons/ci";
import { MdHistory } from "react-icons/md";
import { IoIosArrowBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { emptySelectedItem, getItemAsync } from "@/app/digital-menu/state/cartItemSlice";
import ProductCard from "./_components/ProductCard";
import Footer from "./_components/Footer";
import { ThreeDot } from "react-loading-indicators";
import Link from "next/link";

export default function CartPage() {
  const label = (key: string) => {return key};

  const dispatch = useDispatch<AppDispatch>();
  const itemIdFromMenu = useSelector((state: RootState) => state.idArray.selectedItemIds);
  const itemFromMenu = useSelector((state: RootState) => state.cartItem.selectedItems);

  useEffect(() => {
    if (itemIdFromMenu.length > 0) {
      dispatch(getItemAsync({ itemList: itemIdFromMenu, type: "filtered" }));
    } else {
      dispatch(emptySelectedItem());
    }
  }, [dispatch, itemIdFromMenu]);
  
  const loading = useSelector((state: RootState) => state.cartItem.loading);
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ThreeDot color="oklch(70.5% 0.213 47.604)" size="medium" text="Generating cart" textColor="" />
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex flex-row sticky top-0 z-1 justify-between items-center bg-white p-2">
        <Link href={"/digital-menu"} className="flex items-center gap-2">
          <button className="p-2">
            <IoIosArrowBack size={25} />
          </button>
        </Link>
        <h1 className="text-xl font-bold flex justify-center bg-white sticky top-0 p-2 items-center gap-2 z-0">
          <CiForkAndKnife /> <span className="z-0">{label("order")}</span>
          <br />
          <MdHistory /> <button>History</button>
        </h1>
      </div>
      <div className="grid mt-5 px-[10px] min-h-[calc(100vh-200px)] gap-x-5 gap-y-5">
        {itemFromMenu.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
      <Footer />
    </div>
  );
}