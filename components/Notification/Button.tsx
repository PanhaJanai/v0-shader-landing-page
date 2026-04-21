import '@/app/digital-menu/index.css';
import { HTMLAttributes } from "react";

export function Button(props: HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="
        my-2 mx-5
        rainbow-glow
        disabled:opacity-50
        disabled:cursor-not-allowed 
        inline-flex 
        text-base 
        text-gray-100 
        shadow-md 
        items-center 
        justify-center
        whitespace-nowrap 
        rounded-md 
        transition-all 
        ring-black 
        ring-offset-black 
        focus-visible:outline-none
        focus-visible:ring-2 
        focus-visible:ring-offset-2 
        focus:outline-none
        focus:ring-2 
        focus:ring-offset-2 
        active:scale-[.95] 
        active:shadow-sm 
        bg-zinc-950 
        hover:bg-zinc-950/55 
        h-9 px-4 py-2  
        relative"
      {...props}
    />
  );
}