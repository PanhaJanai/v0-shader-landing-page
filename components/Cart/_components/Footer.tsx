import { RootState } from "@/lib/redux/store";
import React from "react";
import { useSelector } from "react-redux";
// import ToastNotif from "@/components/Notification/App";
import { ToastContainer, toast } from "react-toastify";
import { Slide } from "react-toastify";
import { Button } from "@/components/Notification/Button";

export default function Footer(/* { order }: FooterProps */) {
  const orders = useSelector((state: RootState) => state.cartItem.orders);

  const notify = () => {
    fetch("http://localhost:3000/api/product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orders),
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      } else {
        toast("✅ Orders placed successfully!", {
          position: "top-right",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Slide,
        });
      }
    });

    // console.log(JSON.stringify({ orders }));

    // Show toast as before
  };

  return (
    <div className="flex flex-row-reverse bg-white p-2 mb-0 sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)] rounded-full z-10">
      {/* <button onClick={() => console.log(orders)}>
        <h1 className="rounded-full text-xl font-bold flex justify-center bg-gradient-to-r from-lime-600 to-green-800 text-white px-8 py-4 items-center gap-2">
          Done
        </h1>
      </button> */}
      <Button onClick={notify}>Submit</Button>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Slide}
      />
    </div>
  );
}
