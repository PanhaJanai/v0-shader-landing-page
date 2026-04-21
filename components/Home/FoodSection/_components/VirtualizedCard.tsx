"use client";
import { FixedSizeList } from "react-window";
import ProductCard from "./Card";
import { useEffect, useState } from "react";

interface Item {
  id: number;
  name: string;
  price: number;
  discounted_price: number;
  category: number;
  cover: string;
}

export default function VirtualizedCard(
  {
    filteredList,
    selectedItemIds,
    isShowingAllItem,
    numberOfItemsPerRow,
    itemSize,
    widthOfCard,
  }: {
    filteredList: Item[];
    selectedItemIds: number[];
    isShowingAllItem: boolean;
    numberOfItemsPerRow: number;
    itemSize: number;
    widthOfCard: number;
  }
) {

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

  return (
    <FixedSizeList
      height={
        isShowingAllItem
          ? (windowSize.height * 88) / 100
          : (windowSize.height * 55) / 100
      }
      itemCount={filteredList.length / (numberOfItemsPerRow - 0.25)}
      itemSize={itemSize}
      width={"auto"}
    >
      {({ index, style }) => {
        const items = filteredList.slice(index * numberOfItemsPerRow, index * numberOfItemsPerRow + numberOfItemsPerRow);
        return (
          <div
            className="flex gap-x-10"
            style={{ ...style, height: "" }}
          >
            {items.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                isSelected={selectedItemIds.includes(item.id)}
                width={widthOfCard}
              />
            ))}
          </div>
        );
      }}
    </FixedSizeList>
  )
} 