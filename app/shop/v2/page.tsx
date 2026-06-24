// @ts-nocheck
"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Pagination } from "swiper/modules";
import { 
  Search, 
  Heart, 
  User, 
  ShoppingCart, 
  ChevronDown, 
  ChevronRight, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Package
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "./styles.css";

// ── Gourmet Fashion Catalog Data ─────────────────────────────────────────────
const CATALOG_DATA = {
  Women: [
    {
      id: "w-1",
      name: "White Off-The-Shoulder Eyelet Mini Dress",
      description: "Blending a lightweight summer feel with a clean, elegant silhouette. Features delicate eyelet embroidery, puffed sleeves, and a beautifully structured scalloped hemline.",
      details: "100% Organic Cotton • Silk Thread Embroidery • Hand-crafted in Italy",
      image: "/shop/women/dress/white-off-the-shoulder-eyelet-mini-dress.jpg",
      originalPrice: 30.90,
      discountedPrice: 19.90,
      category: "Women"
    },
    {
      id: "w-2",
      name: "Women's Essential Ivory Tee",
      description: "Comfortable, breathable, and highly versatile. The signature ivory t-shirt is tailored from premium long-staple cotton, offering an incredibly soft touch and a draped fit.",
      details: "100% Pima Cotton • Pre-shrunk Double Stitching • Made in Portugal",
      image: "/shop/women/shirt/white-t.avif",
      originalPrice: 15.90,
      discountedPrice: 9.90,
      category: "Women"
    },
    {
      id: "w-3",
      name: "Nike Pleated Court Tennis Skirt",
      description: "A premium classic performance piece featuring a sleek pleated design and dry-wicking interior shorts. Crafted for effortless movement on the court and absolute style off it.",
      details: "Recycled Polyester Blend • Dri-FIT Technology • Breathable mesh lining",
      image: "/shop/women/skirt/black-nike-tennis-skirt.jpg",
      originalPrice: 45.90,
      discountedPrice: 29.90,
      category: "Women"
    },
    {
      id: "w-4",
      name: "Side-Stripe Sport Track Pants",
      description: "Urban athletic wear reimagined in high-end tailored fabrics. Featuring side-seam contrast striping, zipped pockets, and comfortable elasticized ankle cuffs.",
      details: "Techno-Jersey Blend • Gold-tone Zipper Accents • Designed in Paris",
      image: "/shop/women/pants/side-stripe-track-pants.avif",
      originalPrice: 50.90,
      discountedPrice: 34.90,
      category: "Women"
    }
  ],
  Men: [
    {
      id: "m-1",
      name: "Tan Cashmere Crewneck Knitwear",
      description: "Finest Italian cashmere yarn knit in a classic crewneck pattern. Offering warmth, lightness, and a sophisticated silhouette that transitions effortlessly from day to night.",
      details: "100% Grade-A Mongolian Cashmere • Ribbed Trims • Dry Clean Only",
      image: "/shop/photo-1591047139829-d91aecb6caea.avif",
      originalPrice: 189.00,
      discountedPrice: 129.00,
      category: "Men"
    },
    {
      id: "m-2",
      name: "Classic Double-Breasted Charcoal Overcoat",
      description: "A structured wool overcoat with broad lapels and a classic double-breasted button layout. Cut from heavy-weight virgin wool, tailored to drape perfectly over blazers.",
      details: "80% Virgin Wool, 20% Cashmere • Fully Lined • Internal Passport Pocket",
      image: "/shop/photo-1578681994506-b8f463449011.avif",
      originalPrice: 299.00,
      discountedPrice: 219.00,
      category: "Men"
    },
    {
      id: "m-3",
      name: "Urban Shearling Flight Bomber Jacket",
      description: "Rugged masculinity met with absolute comfort. This bomber features a genuine suede shell with warm shearling collar, ribbed knit cuffs, and dual utility zip pockets.",
      details: "Lambskin Suede Outer • Faux-Shearling Lining • Weather-resistant finish",
      image: "/shop/photo-1611312449408-fcece27cdbb7.avif",
      originalPrice: 249.00,
      discountedPrice: 179.00,
      category: "Men"
    }
  ],
  Kids: [
    {
      id: "k-1",
      name: "Classic Beige Double-Breasted Trench Coat",
      description: "A mini take on the timeless British classic. Water-resistant cotton twill with signature buttoned epaulets, waist belt, and elegant check-patterned interior lining.",
      details: "100% Twill Cotton • Showerproof Treatment • Checked lining",
      image: "/shop/photo-1521572163474-6864f9cf17ab.avif",
      originalPrice: 89.00,
      discountedPrice: 59.00,
      category: "Kids"
    },
    {
      id: "k-2",
      name: "Pastel Lemon Knit Cotton Cardigan",
      description: "Charming knit cardigan with mother-of-pearl buttons. Crafted from hypoallergenic organic cotton yarn that is extra gentle on sensitive skin.",
      details: "100% Organic Cotton • French-knit detailing • Wood-carved button closure",
      image: "/shop/photo-1617019114583-affb34d1b3cd.avif",
      originalPrice: 45.00,
      discountedPrice: 29.00,
      category: "Kids"
    }
  ],
  Baby: [
    {
      id: "b-1",
      name: "Organic Cable-Stitched Knit Blanket",
      description: "Wrap your newborn in luxurious softness. Beautifully knit in a classic cable-stitch pattern, this blanket is highly breathable and perfect for cribs, strollers, or nursing.",
      details: "100% Certified Organic Cotton • GOTS Certified • 100cm x 80cm size",
      image: "/shop/photo-1588099768531-a72d4a198538.avif",
      originalPrice: 39.00,
      discountedPrice: 24.00,
      category: "Baby"
    },
    {
      id: "b-2",
      name: "Signature Canvas Monogram Carryall",
      description: "An elegant solution for parents on the move. Crafted from durable coated canvas with leather trimmings, featuring insulated bottle pockets and a padded changing mat.",
      details: "Coated Monogram Canvas • Cowhide Leather Trim • Water-resistant interior",
      image: "/shop/photo-1690759403193-ab748ed1e594.avif",
      originalPrice: 149.00,
      discountedPrice: 99.00,
      category: "Baby"
    }
  ]
};

const MENU_DATA = {
  Women: {
    categories: [
      { name: "New Arrivals", items: ["Summer Dresses", "Linen Sets", "Atelier Knitwear"] },
      { name: "Accessories", items: ["Leather Handbags", "Monogram Sunglasses", "Fine Jewelry"] }
    ]
  },
  Men: {
    categories: [
      { name: "Tailoring", items: ["Virgin Wool Suits", "Atelier Blazers", "Tuxedos"] },
      { name: "Footwear", items: ["Leather Chelsea Boots", "Loafers", "Atelier Sneakers"] }
    ]
  },
  Kids: {
    categories: [
      { name: "Mini-Me", items: ["Outerwear", "Playwear", "Knitwear"] }
    ]
  },
  Baby: {
    categories: [
      { name: "Essentials", items: ["Knit Blankets", "Gift Sets", "Carryall Bags"] }
    ]
  }
};

// ── Main Page Component ──────────────────────────────────────────────────────
export default function AppV2() {
  const categories = ["Women", "Men", "Kids", "Baby"];
  const [activeCategory, setActiveCategory] = useState("Women");
  const [cart, setCart] = useState<{ item: any; qty: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);

  const swiperRef = useRef<SwiperType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Manage body background and overflow dynamically
  useEffect(() => {
    document.body.style.backgroundColor = "#0B0B0C";
    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, []);

  // 2. Swiper Slide-to category sync
  useEffect(() => {
    if (swiperRef.current) {
      const index = categories.indexOf(activeCategory);
      if (index !== -1 && swiperRef.current.activeIndex !== index) {
        swiperRef.current.slideTo(index, 800);
      }
    }
  }, [activeCategory]);

  // 3. Dropdown Menu mouse triggers
  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(menu);
    if (MENU_DATA[menu] && MENU_DATA[menu].categories.length > 0) {
      setActiveSubCategory(MENU_DATA[menu].categories[0].name);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setActiveSubCategory(null);
    }, 150);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setActiveSubCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Cart Logic
  const handleAddToCart = (product: any) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.item.id === product.id);
      if (existing) {
        toast.info(`Increased quantity of ${product.name} in bag.`);
        return prevCart.map((i) =>
          i.item.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      toast.success(`Added ${product.name} to luxury bag.`);
      return [...prevCart, { item: product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setCart((prev) =>
      prev.map((i) => (i.item.id === productId ? { ...i, qty: newQty } : i))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.item.id !== productId));
    toast.warn("Item removed from bag.");
  };

  // Pricing calculations
  const subtotal = cart.reduce((sum, entry) => sum + entry.item.discountedPrice * entry.qty, 0);
  const delivery = subtotal > 150 ? 0 : 25;
  const total = subtotal + delivery;
  const cartTotalQty = cart.reduce((sum, entry) => sum + entry.qty, 0);

  const handleCheckoutSubmit = () => {
    if (cart.length === 0) return;
    setCart([]);
    setIsCartOpen(false);
    setShowCheckoutSuccess(true);
  };

  return (
    <div className="h-screen w-full bg-[#0B0B0C] text-[#F4F4F6] font-sans antialiased overflow-hidden relative selection:bg-[#C5A880] selection:text-black">
      <ToastContainer position="top-right" autoClose={2000} theme="dark" transition={Slide} />

      {/* Global CSS Inject */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@200;300;400;500;600;700&display=swap');
        
        .font-serif {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .font-sans {
          font-family: 'Outfit', sans-serif;
        }
        .luxury-glass {
          background: rgba(18, 18, 20, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(197, 168, 128, 0.15);
        }
        .luxury-glow {
          box-shadow: 0 4px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Swiper Overrides to fit full viewport height */
        .mySwiper, .mySwiper2 {
          width: 100%;
          height: 100%;
        }
      `}</style>

      {/* --- ATELIER LUXURY NAVBAR --- */}
      <nav 
        className="fixed top-0 left-0 w-full z-50 bg-[#0B0B0C]/80 backdrop-blur-md border-b border-[#C5A880]/15"
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveCategory("Women")}>
            <div className="h-9 w-9 rounded bg-[#C5A880] flex items-center justify-center border border-[#C5A880]/30 shadow-md">
              <span className="font-serif text-lg font-bold text-black">P</span>
            </div>
            <span className="font-serif text-xl tracking-[0.15em] text-white uppercase font-light">
              Panha <span className="text-[#C5A880]">Atelier</span>
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-10 h-full">
            {categories.map((link) => (
              <div 
                key={link}
                onMouseEnter={() => handleMouseEnter(link)}
                className="h-full flex items-center relative"
              >
                <button
                  onClick={() => {
                    setActiveCategory(link);
                    setActiveDropdown(null);
                  }}
                  className={`text-xs uppercase tracking-[0.25em] h-full border-b transition-all duration-300 flex items-center gap-1.5 font-mono ${
                    activeCategory === link || activeDropdown === link
                      ? "border-[#C5A880] text-[#C5A880] font-semibold" 
                      : "border-transparent text-[#8A898E] hover:text-white"
                  }`}
                >
                  {link}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === link ? 'rotate-180' : ''}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-6 text-[#8A898E]">
            <Link href="/shop" className="text-xs font-mono uppercase tracking-widest text-[#C5A880] border border-[#C5A880]/20 px-3.5 py-1.5 rounded-full hover:bg-[#C5A880]/10 transition-colors">
              Classic Shop
            </Link>

            <button className="p-1 hover:text-white transition-colors relative" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={22} className="text-[#C5A880]" />
              {cartTotalQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C5A880] text-black font-semibold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full border border-black shadow">
                  {cartTotalQty}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        {activeDropdown && MENU_DATA[activeDropdown] && (
          <div 
            ref={dropdownRef}
            onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
            className="hidden md:block absolute top-full left-0 w-full bg-[#121214] border-b border-[#C5A880]/15 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <div className="max-w-7xl mx-auto flex min-h-[300px]">
              <div className="flex w-full">
                {/* Left sub-list */}
                <div className="w-80 border-r border-[#C5A880]/10 py-10 px-8">
                  <ul className="space-y-2">
                    {MENU_DATA[activeDropdown].categories.map((cat: any, idx: number) => (
                      <li 
                        key={idx}
                        onMouseEnter={() => setActiveSubCategory(cat.name)}
                        className={`group flex items-center justify-between px-5 py-3 rounded-lg cursor-pointer transition-colors ${
                          activeSubCategory === cat.name 
                            ? 'bg-[#C5A880]/10 text-[#C5A880]' 
                            : 'text-[#8A898E] hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-mono uppercase tracking-[0.2em]">{cat.name}</span>
                        <ChevronRight className={`w-4 h-4 transition-opacity ${activeSubCategory === cat.name ? 'opacity-100' : 'opacity-0'}`} />
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Right detailed items */}
                <div className="flex-1 bg-stone-950/20 py-12 px-16">
                  {activeSubCategory ? (
                    <div className="grid grid-cols-3 gap-10 animate-in fade-in slide-in-from-left-2">
                      {MENU_DATA[activeDropdown].categories
                        .find((c: any) => c.name === activeSubCategory)
                        ?.items.map((item: string, i: number) => (
                          <a 
                            key={i} 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); setActiveDropdown(null); }}
                            className="text-sm font-light text-[#8A898E] hover:text-[#C5A880] hover:underline underline-offset-8 decoration-[#C5A880]/40 transition-colors"
                          >
                            {item}
                          </a>
                        ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#8A898E]/40 text-sm italic font-serif">
                      Hover over a department to explore
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* --- HORIZONTAL MAIN SWIPER (CATEGORIES) --- */}
      <Swiper
        className="mySwiper swiper-h"
        spaceBetween={0}
        direction={"horizontal"}
        modules={[Pagination]}
        onSlideChange={(swiper) => {
          setActiveCategory(categories[swiper.activeIndex]);
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
      >
        {categories.map((catName) => (
          <SwiperSlide key={catName}>
            {/* --- VERTICAL PRODUCT SWIPER IN EACH CATEGORY --- */}
            <Swiper
              className="mySwiper2 swiper-v"
              direction={"vertical"}
              parallax={true}
              loop={true}
              spaceBetween={0}
              pagination={{
                clickable: true,
              }}
              modules={[Pagination, Mousewheel]}
              mousewheel={{
                thresholdTime: 500,
                thresholdDelta: 20,
                forceToAxis: true,
              }}
              speed={800}
            >
              {(CATALOG_DATA[catName] || []).map((product) => (
                <SwiperSlide key={product.id}>
                  {/* Luxury Product Split View */}
                  <div className="flex flex-col md:flex-row w-full h-full justify-between items-center bg-[#0B0B0C] px-8 md:px-24 pt-24 pb-12 gap-8 md:gap-16">
                    
                    {/* Left Info Panel */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6 text-left" data-swiper-parallax="-300">
                      <div className="flex items-center gap-2">
                        <span className="h-px w-8 bg-[#C5A880]" />
                        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#C5A880]">{product.category} Collection</span>
                      </div>

                      <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-white leading-tight">
                        {product.name}
                      </h2>

                      <p className="text-sm md:text-base text-[#8A898E] font-light leading-relaxed max-w-xl">
                        {product.description}
                      </p>

                      <div className="py-2.5 border-y border-[#C5A880]/10 flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono tracking-widest text-[#8A898E] uppercase">Atelier Specs</span>
                        <span className="text-xs text-[#F4F4F6] font-light">{product.details}</span>
                      </div>

                      <div className="flex items-center gap-8 pt-4">
                        {/* Price Panel */}
                        <div className="flex flex-col">
                          {product.originalPrice > product.discountedPrice && (
                            <span className="line-through text-xs text-[#8A898E] font-light">
                              ${product.originalPrice}
                            </span>
                          )}
                          <span className="font-serif text-3xl text-[#C5A880] font-light">
                            ${product.discountedPrice}
                          </span>
                        </div>

                        {/* Add to Cart button */}
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="bg-[#C5A880] hover:bg-[#D4AF37] text-black font-mono text-xs uppercase tracking-widest px-8 py-3.5 rounded-full font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" /> Add to Bag
                        </button>
                      </div>
                    </div>

                    {/* Right Image Panel */}
                    <div className="w-full md:w-[45%] h-[40vh] md:h-[65vh] relative flex items-center justify-center rounded-2xl overflow-hidden group shadow-2xl border border-[#C5A880]/15 bg-stone-900" data-swiper-parallax="-100">
                      <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill
                        className="object-cover object-top transition-transform duration-1000 group-hover:scale-105"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                    </div>

                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* --- FLOATING CATEGORY SELECTOR INDICATOR --- */}
      <div className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-4 border border-[#C5A880]/20 bg-[#0B0B0C]/85 px-5 py-3 rounded-full backdrop-blur-md">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`text-[9px] font-mono tracking-widest uppercase transition-colors ${
              activeCategory === c ? "text-[#C5A880] font-bold" : "text-[#8A898E] hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* --- CART SLIDE-OVER DRAWER (SHOPPING BAG) --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="luxury-glass w-full max-w-md bg-[#0B0B0C] h-full flex flex-col justify-between shadow-2xl p-6 border-l border-[#C5A880]/20 animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#C5A880]/10 mb-6">
                <div className="flex items-center gap-2">
                  <Package className="h-4.5 w-4.5 text-[#C5A880]" />
                  <h3 className="font-serif text-xl tracking-wide text-white uppercase font-light">Atelier Bag</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1.5 rounded-full hover:bg-stone-800 transition-colors">
                  <X className="h-5 w-5 text-[#8A898E]" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-24 text-center">
                  <ShoppingCart className="h-10 w-10 text-[#C5A880]/40 mx-auto mb-4" />
                  <p className="font-serif italic text-base text-[#8A898E]">Your shopping bag is empty.</p>
                  <p className="text-[10px] text-[#8A898E]/70 mt-2 font-mono uppercase tracking-widest">Select items from the catalog slides.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                  {cart.map((entry) => (
                    <div key={entry.item.id} className="flex gap-4 p-3 bg-[#121214] border border-[#C5A880]/10 rounded-xl items-center animate-in fade-in">
                      <div className="h-16 w-16 relative rounded-md overflow-hidden bg-stone-900 shrink-0">
                        <Image src={entry.item.image} alt={entry.item.name} fill className="object-cover object-top" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-xs font-semibold text-white truncate">{entry.item.name}</h4>
                          <button 
                            onClick={() => removeFromCart(entry.item.id)}
                            className="p-1 rounded hover:bg-stone-800 text-stone-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2.5">
                          <span className="font-mono text-xs text-[#C5A880]">${entry.item.discountedPrice}</span>
                          
                          {/* Qty Controls */}
                          <div className="flex items-center gap-2.5">
                            <button 
                              onClick={() => updateCartQty(entry.item.id, entry.qty - 1)}
                              className="h-6 w-6 rounded-full bg-stone-900 text-[#C5A880] flex items-center justify-center border border-[#C5A880]/15 hover:bg-[#C5A880]/10"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-mono text-xs text-white w-4 text-center">{entry.qty}</span>
                            <button 
                              onClick={() => updateCartQty(entry.item.id, entry.qty + 1)}
                              className="h-6 w-6 rounded-full bg-[#C5A880] text-black flex items-center justify-center hover:bg-[#D4AF37]"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations & Submit */}
            <div className="border-t border-[#C5A880]/15 pt-6 bg-[#0B0B0C] mt-auto">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs text-[#8A898E]">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#8A898E]">
                  <span>Atelier Secure White-Glove Delivery</span>
                  <span className="font-mono text-white">
                    {delivery === 0 ? "Complimentary" : `$${delivery.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2.5 border-t border-[#C5A880]/10 font-semibold text-white">
                  <span>Estimated Total</span>
                  <span className="font-mono text-[#C5A880]">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleCheckoutSubmit}
                  disabled={cart.length === 0}
                  className="w-full bg-[#C5A880] hover:bg-[#D4AF37] disabled:bg-stone-800 disabled:text-stone-600 text-black font-semibold text-xs tracking-widest font-mono uppercase py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Request Consultation & Order
                </button>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-transparent border border-stone-800 text-[#8A898E] hover:text-white font-mono text-xs uppercase tracking-wider py-3.5 rounded-xl transition-colors"
                >
                  Return to Boutique
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- CHECKOUT SUCCESS MODAL --- */}
      {showCheckoutSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="luxury-glass luxury-glow w-full max-w-md rounded-2xl p-8 bg-[#121214] text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-[#C5A880]/15 rounded-full flex items-center justify-center border border-[#C5A880]/40">
              <ShieldCheck className="h-8 w-8 text-[#C5A880]" />
            </div>
            
            <div>
              <h2 className="font-serif text-2xl tracking-wide text-white mb-2 uppercase font-light">Consultation Requested</h2>
              <p className="text-xs text-[#8A898E] font-mono uppercase tracking-widest text-[#C5A880] mb-4">Request Received</p>
              <p className="text-sm text-[#8A898E] font-light leading-relaxed">
                Thank you for your order request. An Atelier representative will contact you shortly to confirm sizing, coordinate delivery, and schedule a private fittings consultation.
              </p>
            </div>

            <button 
              onClick={() => setShowCheckoutSuccess(false)}
              className="w-full bg-[#C5A880] hover:bg-[#D4AF37] text-black font-semibold text-xs tracking-widest font-mono uppercase py-3.5 rounded-xl transition-all"
            >
              Conclude
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
