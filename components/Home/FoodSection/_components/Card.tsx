"use client";
// import React, { useEffect } from "react";
import Image from "next/image";
import clsx from "clsx";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/redux/store";
import { addOrRemoveSelectedItemIds } from "@/app/digital-menu/state/idArraySlice";
import { addOrRemoveOrder, setIsItemDrawerOpen, setItemForDrawer } from "@/app/digital-menu/state/cartItemSlice";

interface Item {
  id: number;
  name: string;
  price: number;
  discounted_price: number;
  category: number;
  cover: string;
}


export default function ProductCard({ item, isSelected, width=200 }: { item: Item, isSelected: boolean, width?: number }) {
  const { id, name, price, discounted_price, cover } = item;

  const dispatch = useDispatch<AppDispatch>();
  

  return (
    <section
      className={clsx(
        "p-3 rounded-lg shadow-lg h-[200px] cursor-pointer",
        isSelected ? "border-4 border-orange-500" : ""
      )}
      style={{ width: width + "px" }}
      onClick={() => {
        if (!isSelected) {
          dispatch(setIsItemDrawerOpen(true));
        }
        dispatch(setItemForDrawer({ ...item, isShown: true }));
        dispatch(addOrRemoveSelectedItemIds({ id, type: isSelected ? "remove" : "add" }))
        dispatch(addOrRemoveOrder({ itemId: id, quantity: 1, price: price, discounted_price: discounted_price }));
      }}
    >
      <div className="w-full h-2/3 relative">
        <Image
          src={cover}
          alt=""
          className="w-full h-full object-contain"
          width={1000}
          height={1000}
        />
      </div>
      <div className="p-2">
        <h1 className="font-semibold w-2/3 truncate">{name} </h1>
        <div className="flex justify-between items-center">
          <span className="line-through text-orange-500 font-semibold ">
            ${price}
          </span>
          <span className="text-orange-500 font-semibold">
            ${discounted_price}
          </span>
        </div>
      </div>
    </section>
  );
}
