'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useSelector, useDispatch } from 'react-redux'
import { setIsItemDrawerOpen } from '@/app/digital-menu/state/cartItemSlice'
import { AppDispatch, RootState } from "@/lib/redux/store";
import { setOrderQuantity } from "@/app/digital-menu/state/cartItemSlice";
import Image from "next/image";


export default function ItemDrawer() {
  const dispatch = useDispatch<AppDispatch>();

  const open = useSelector((state: RootState) => state.cartItem.isItemDrawerOpen)
  const item = useSelector((state: RootState) => state.cartItem.itemForDrawer) || {
    id: -1,
    name: '',
    price: 0,
    discounted_price: 0,
    category: 0,
    cover: '',
    isShown: false,
  };
  const { id, name, price, discounted_price, cover } = item;

  const orders = useSelector((state: RootState) => state.cartItem.orders);
  const order = orders?.find((order) => order.itemId === id);

  const [quantity, setQuantity] = useState(order ? order.quantity : 1);

  useEffect(() => {
    setQuantity(order ? order.quantity : 1);
  }, [order, id]);

  const handleAddQuantity = () => {
    const newQ = quantity + 1;
    setQuantity(newQ);
    dispatch(setOrderQuantity({ itemId: id, newQuantity: newQ }));
  };

  const handleSubtractQuantity = () => {
    setQuantity(q => {
      const newQ = q > 1 ? q - 1 : 1;
      if (q > 1) dispatch(setOrderQuantity({ itemId: id, newQuantity: newQ }));
      return newQ;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/\D/g, ""), 10);
    const newQ = isNaN(val) || val < 1 ? 1 : val;
    setQuantity(newQ);
    dispatch(setOrderQuantity({ itemId: id, newQuantity: newQ }));
  };

  return (
    <div>
      <Dialog open={open} onClose={() => dispatch(setIsItemDrawerOpen(false))} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0"
        />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                <TransitionChild>
                  <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
                    <button
                      type="button"
                      onClick={() => dispatch(setIsItemDrawerOpen(false))}
                      className="relative rounded-md text-gray-300 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden"
                    >
                      <span className="absolute -inset-2.5" />
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon aria-hidden="true" className="size-6" />
                    </button>
                  </div>
                </TransitionChild>
                <div className="flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                  <div className="px-4 sm:px-6">
                    <DialogTitle className="text-base font-semibold text-gray-900">{item.name}</DialogTitle>
                  </div>
                  <div className="flex justify-center mt-[50px] flex-1 px-4 sm:px-6">
                    <div className="flex flex-col items-center">
                      <section
                        className={
                          "p-3 rounded-lg shadow-lg h-[200px] cursor-pointer"
                        }
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
                      <div className="flex flex-row mt-6">
                        <button className="cursor-pointer bg-orange-500 p-2 rounded-lg h-12 w-12 text-[16px] flex justify-center items-center text-white" onClick={handleSubtractQuantity}>
                          -
                        </button>
                        <div className="text-[24px] w-[50px] font-semibold mx-2 flex items-center justify-center">
                          <input 
                            type="text" 
                            className="w-[50px] border-0 text-center"  
                            value={quantity} 
                            onChange={handleInputChange}
                            name="foo"
                          />
                        </div>
                        <button className="cursor-pointer bg-orange-500 p-2 rounded-lg h-12 w-12 text-[16px] flex justify-center items-center text-white" onClick={handleAddQuantity}>
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
