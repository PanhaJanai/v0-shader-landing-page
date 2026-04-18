"use client"; // Ensure this is at the top for onClick to work

import { Search, Heart, User, ShoppingCart, Menu } from 'lucide-react';

// 1. Updated the type definition for setActiveCategory
interface NavbarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void; 
}

const Navbar = ({ activeCategory, setActiveCategory }: NavbarProps) => {
  const links = ["Women", "Men", "Kids", "Baby"];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-transparent text-white border-b border-white/10 backdrop-blur-sm">
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 font-bold text-xl tracking-tighter text-black">
          Panha Store
        </div>
      </div>

      {/* 2. Added a wrapper div to group links and fix layout spacing */}
      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => (
          <span
            key={link}
            onClick={() => setActiveCategory(link)} // This now calls handleCategoryClick in page.tsx
            className={`text-black cursor-pointer transition-all duration-300 text-sm uppercase tracking-widest ${
              activeCategory === link 
                ? "border-b-2 border-black font-bold opacity-100" 
                : "opacity-50 hover:opacity-100"
            }`}
          >
            {link}
          </span>
        ))}
      </div>

      {/* Right Icons */}
      <div className="flex items-center space-x-5">
        <button aria-label="Search" className='text-black opacity-50 hover:opacity-100 transition-opacity'><Search size={22} /></button>
        <button aria-label="Favorites" className="hidden sm:block text-black opacity-50 hover:opacity-100 transition-opacity"><Heart size={22} /></button>
        <button aria-label="Account" className="hidden sm:block text-black opacity-50 hover:opacity-100 transition-opacity"><User size={22} /></button>
        <button aria-label="Cart" className='text-black opacity-50 hover:opacity-100 transition-opacity'><ShoppingCart size={22} /></button>
        <button aria-label="Menu" className="md:hidden text-black opacity-50 hover:opacity-100 transition-opacity"><Menu size={22} /></button>
      </div>
    </nav>
  );
};

export default Navbar;