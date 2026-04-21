// import { useTranslations } from "next-intl";
import React, { useEffect } from "react";
import { IoIosArrowForward } from "react-icons/io";
import DynamicIcon from "../common/DynamicIcon";
import clsx from "clsx";
// import type { Category } from "@/app/page";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { getCategoryAsync, setActiveCategory } from "@/app/digital-menu/state/categorySlice";
import { setIsShowingAllItem } from "@/app/digital-menu/state/cartItemSlice";
import { ThreeDot } from "react-loading-indicators";

export default function Category() {
  const label = (key: string) => {return key};

  // const isShowingAllItem = useSelector(
  //   (state: RootState) => state.cartItem.isShowingAllItem
  // );

  const categories = useSelector(
    (state: RootState) => state.category.categories
  );
  const activeCategory = useSelector(
    (state: RootState) => state.category.activeCategoryId
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(getCategoryAsync());
  }, [dispatch]);

  const showAllItem = () => {
    dispatch(setIsShowingAllItem(true));
  };

  const loading = useSelector(
    (state: RootState) => state.cartItem.loading
  );
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ThreeDot color="oklch(70.5% 0.213 47.604)" size="medium" text="Getting Items" textColor="" />
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h1 className="font-semibold">{label("all_categories")}</h1>
        <button
          className="flex items-center cursor-pointer"
          onClick={() => showAllItem()}
        >
          <span>{label("see_all")}</span> <IoIosArrowForward />{" "}
        </button>
      </div>
      <div className="flex flex-row gap-5 no-scrollbar overflow-x-auto overflow-y-visible p-5 ">
        {categories.map((category, index: number) => {
          return (
            <div
              key={index}
              draggable={false}
              onClick={() => dispatch(setActiveCategory(category.id))}
              className={clsx(
                " cursor-pointer flex justify-center items-center  gap-1  rounded-full   px-3 py-1 shadow-lg/20 select-none ",
                activeCategory === category.id ||
                  (activeCategory == null && index == 0)
                  ? "bg-orange-100 shadow-lg/30"
                  : ""
              )}
            >
              <div className="bg-white rounded-full p-2">
                <DynamicIcon
                  className="text-orange-500"
                  iconName={category.icon}
                />
              </div>
              <span className="text-[14px]"> {category.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
