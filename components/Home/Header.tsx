import { setSearchTimeout, setSearchValue } from "@/app/digital-menu/state/cartItemSlice";
import { AppDispatch, RootState } from "@/lib/redux/store";
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import { CiCircleRemove, CiSearch, CiShoppingCart } from "react-icons/ci";
import { FaBars } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
// import { useTranslations } from "use-intl";
import ItemDrawer from "@/components/Home/FoodSection/_components/ItemDrawer";
// import { useTranslations } from "next-intl";



export default function Header() {
  const label = (key: string) => {return key};
  const common = (key: string) => {return key};

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

  const ref = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch<AppDispatch>();

  const selectedItems = useSelector(
    (state: RootState) => state.idArray.selectedItemIds
  );

  const searchTimeout = useSelector(
    (state: RootState) => state.cartItem.searchTimeout
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      console.log("Search changed")
      dispatch(
        setSearchTimeout(
          setTimeout(() => {
            dispatch(setSearchValue(value));
            console.log("Dispatching search");
          }, 500)
        )
      );
    };

  const handleEmptySearchInput = () => {
    // ref.current ? (ref.current.value = "") : null;
    if (ref.current) {
      ref.current.value = "";
    }
    dispatch(setSearchValue(""));
  };

  return (
    <div className="pb-3">
      <ItemDrawer />
      <section className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-slate-100 p-2">
            <FaBars />
          </div>
          <span className="font-bold text-orange-500">
            {label("digital_menu")} W: {windowSize.width} H: {windowSize.height}
          </span>
        </div>
        <Link href={"/digital-menu/cart"}>
          <button
            className="p-2 cursor-pointer bg-slate-100 relative rounded-full mt-4"
          >
            {selectedItems.length > 0 && (
              <div className="absolute bg-orange-600 p-2 rounded-full w-5 h-5 flex justify-center items-center text-[12px] top-[-8px] text-white right-0">
                {selectedItems.length}
              </div>
            )}
            <CiShoppingCart size={25} />
          </button>
        </Link>
      </section>

      <div className="border-1 flex justify-between items-center border-slate-200 rounded-full p-2 px-4 w-full mt-2 ">
        <input
          ref={ref}
          type="text"
          className="w-[95%] outline-none"
          placeholder={common("search")}
          onChange={handleSearchChange}
        />
        <CiSearch />
        <div
          className="border-l-2 border-black/20 pl-3 ml-3"
          onClick={handleEmptySearchInput}
        >
          <CiCircleRemove onClick={handleEmptySearchInput} />
        </div>
      </div>
    </div>
  );
}
