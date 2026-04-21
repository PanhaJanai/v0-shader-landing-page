import React from "react";
import Image from "next/image";
import { Item } from "@/app/digital-menu/App";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { setOrderQuantity } from "@/app/digital-menu/state/cartItemSlice";
// import { addOrRemoveSelectedItemIds } from "@/app/state/idArraySlice";

function ProductCard({ item }: { item: Item }) {
  const { id, name, price, discounted_price, cover } = item;

  const orders = useSelector((state: RootState) => state.cartItem.orders);
  const order = orders?.find((order) => order.itemId === id);

  let [quantity, totalPrice, totalDiscountedPrice] = [0, 0, 0];

  if (order) {
    quantity = order.quantity;
    totalPrice = quantity * price;
    totalDiscountedPrice = quantity * discounted_price;
  } else {
    quantity = 1;
    totalPrice = discounted_price;
    totalDiscountedPrice = discounted_price;
  }

  const dispatch = useDispatch<AppDispatch>();

  const PriceEle = (
    <span className="line-through text-orange-500 font-semibold">
      ${totalPrice}
    </span>
  );

  const DiscountedPriceEle = (
    <span className=" text-orange-500 font-semibold">
      ${totalDiscountedPrice}
    </span>
  );

  const handleAddQuantity = () => {
    dispatch(setOrderQuantity({ itemId: id, newQuantity: quantity + 1 }));
  };

  const handleSubtractQuantity = () => {
    if (order && order.quantity > 1) {
      quantity = order.quantity - 1;
    } else {
      // dispatch(addOrRemoveSelectedItemIds(id));
      return;
    }
    dispatch(setOrderQuantity({ itemId: id, newQuantity: quantity }));
  };

  const quantityText = <span className="text-lg">{quantity}</span>;

  const addQuantityButton = (
    <button
      onClick={handleAddQuantity}
      className="flex justify-center items-center rounded-full bg-orange-500 text-white text-[18px] h-8 w-8"
    >
      +
    </button>
  );

  const subtractQuantityButton = (
    <button
      onClick={handleSubtractQuantity}
      className="flex justify-center items-center rounded-full bg-orange-500 text-white text-[18px] h-8 w-8"
    >
      -
    </button>
  );

  return (
    <section className="flex flex-row items-center shadow-sm rounded-lg h-[125px] gap-0">
      <div className="h-full relative w-full overflow-visible p-2 rounded-lg">
        <Image
          src={cover}
          alt=""
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-row w-full gap-2 max-sm:w-[65%] max-sm:px-2  p-2 ">
        <div className="flex flex-col gap-2 max-sm:w-[65%]  p-2 max-sm:px-2 w-full ">
          <div>
            <h1 className="text-lg font-bold">{name}</h1>
            <br />
            <div className="flex gap-4">
              {PriceEle}
              {DiscountedPriceEle}  
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-between items-center ">
          

          <div className="flex flex-row gap-3 items-center">
            {subtractQuantityButton}
            {quantityText}
            {addQuantityButton}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductCard;
