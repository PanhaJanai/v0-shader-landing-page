"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Heart, User, ShoppingCart, Menu, ChevronRight, ChevronDown, X } from 'lucide-react';

interface NavbarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const Navbar = ({ activeCategory, setActiveCategory }: NavbarProps) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // type is "nested" or "grid" will change how the subdropdown is rendered. Nested is for hover on subcategories, grid is for showing all subcategories at once
  const menuData: any = {
    Women: {
      type: "nested",
      categories: [
        { name: "Clothing", items: ["Dresses", "Tops", "Skirts", "Denim"] },
        { name: "Accessories", items: ["Jewelry", "Handbags", "Sunglasses"] },
        { name: "Shoes", items: ["Heels", "Sandals", "Sneakers"] }
      ]
    },
    Men: {
      type: "nested",
      categories: [
        { name: "New Arrivals", items: ["View All", "Best Sellers", "Trend Report"] },
        { name: "Clothing", items: ["Shirts", "Pants", "Jackets", "Suits"] },
        { name: "Shoes", items: ["Sneakers", "Boots", "Formal"] }
      ]
    },
    Kids: {
      type: "nested",
      categories: [
        { name: "Boy", items: ["T-shirts", "Shorts", "Shoes"] },
        { name: "Girl", items: ["Dresses", "Leggings", "Accessories"] }
      ]
    },
    Baby: {
      type: "nested",
      categories: [
        { name: "Newborn", items: ["Onesies", "Blankets"] },
        { name: "Toddler", items: ["Playwear", "Outerwear"] }
      ]
    }
  };

  const links = Object.keys(menuData);

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(menu);
    
    // Logic: Automatically select the first sub-category so the menu isn't empty
    if (menuData[menu].type === 'nested') {
      setActiveSubCategory(menuData[menu].categories[0].name);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setActiveSubCategory(null);
    }, 150);
  };

  const handleLinkClick = (link: string) => {
    setActiveCategory(link);
    setActiveDropdown(null); // Close dropdown on click
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav 
      className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-black/5"
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveCategory("Women")}>
          <span className="font-bold text-xl tracking-tighter text-black uppercase">
            Panha Store
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 h-full">
          {links.map((link) => (
            <div 
              key={link}
              onMouseEnter={() => handleMouseEnter(link)}
              className="h-full flex items-center relative"
            >
              <button
                onClick={() => handleLinkClick(link)}
                className={`text-black transition-all duration-300 text-sm uppercase tracking-widest h-full border-b-2 flex items-center gap-1 ${
                  activeCategory === link || activeDropdown === link
                    ? "border-black opacity-100 font-bold" 
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                {link}
                <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === link ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center space-x-5 text-black">
          <button className='opacity-50 hover:opacity-100 transition-opacity'><Search size={20} /></button>
          <button className="hidden sm:block opacity-50 hover:opacity-100 transition-opacity"><Heart size={20} /></button>
          <button className="hidden sm:block opacity-50 hover:opacity-100 transition-opacity"><User size={20} /></button>
          <button className='opacity-50 hover:opacity-100 transition-opacity relative'>
            <ShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
          </button>
          <button 
            className="md:hidden opacity-50 hover:opacity-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* --- Mega Menu Dropdown --- */}
      {activeDropdown && menuData[activeDropdown] && (
        <div 
          ref={dropdownRef}
          onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          className="hidden md:block absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="max-w-7xl mx-auto flex min-h-[350px]">
            {menuData[activeDropdown].type === 'nested' ? (
              /* NESTED LAYOUT (Like your  's logic) */
              <div className="flex w-full">
                <div className="w-64 border-r border-gray-50 py-8 px-6">
                  <ul className="space-y-1">
                    {menuData[activeDropdown].categories.map((cat: any, idx: number) => (
                      <li 
                        key={idx}
                        onMouseEnter={() => setActiveSubCategory(cat.name)}
                        className={`group flex items-center justify-between px-4 py-3 rounded-md cursor-pointer transition-colors ${activeSubCategory === cat.name ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black'}`}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">{cat.name}</span>
                        <ChevronRight className={`w-4 h-4 transition-opacity ${activeSubCategory === cat.name ? 'opacity-100' : 'opacity-0'}`} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 bg-gray-50/30 py-10 px-12">
                  {activeSubCategory ? (
                    <div className="grid grid-cols-3 gap-8 animate-in fade-in slide-in-from-left-2">
                      {menuData[activeDropdown].categories.find((c: any) => c.name === activeSubCategory)?.items.map((item: string, i: number) => (
                        <a key={i} href="#" className="text-sm text-gray-600 hover:text-black hover:underline underline-offset-4">{item}</a>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Hover over a category</div>
                  )}
                </div>
              </div>
            ) : (
              /* GRID LAYOUT (Like your Women's logic) */
              <div className="w-full px-12 py-10 grid grid-cols-4 gap-8">
                {menuData[activeDropdown].categories.map((cat: any, idx: number) => (
                  <div key={idx}>
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-4 text-black border-b border-gray-100 pb-2">{cat.name}</h3>
                    <ul className="space-y-2">
                      {cat.items.map((item: string, i: number) => (
                        <li key={i}>
                          <a href="#" className="text-gray-500 hover:text-black text-sm transition-colors">{item}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;