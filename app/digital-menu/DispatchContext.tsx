import { createContext, useContext } from "react";
// import { Provider, useDispatch } from "react-redux";
import { AppDispatch } from "@/libs/redux/store";

// Create a context for the dispatch function
const DispatchContext = createContext<AppDispatch | null>(null);

// Custom hook to use the dispatch context
export const useAppDispatch = () => {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error("useAppDispatch must be used within a DispatchProvider");
  }
  return context;
};