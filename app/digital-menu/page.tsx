"use client";

import React from "react";
import "./index.css";

import { Provider } from "react-redux";
import { store } from "@/lib/redux/store";

import App from "./App";


export default function Home() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}
