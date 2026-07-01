// @ts-nocheck
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "@/lib/redux/store";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { 
  getItemAsync, 
  setIsShowingAllItem, 
  setSearchValue, 
  setSearchTimeout, 
  setIsSearching, 
  setIsItemDrawerOpen, 
  setItemForDrawer, 
  addOrRemoveOrder, 
  setOrderQuantity, 
  emptySelectedItem 
} from "@/app/digital-menu/state/cartItemSlice";
import { getCategoryAsync, setActiveCategory } from "@/app/digital-menu/state/categorySlice";
import { addOrRemoveSelectedItemIds, removeFromSelectedItemIds, clearSelectedItemIds } from "@/app/digital-menu/state/idArraySlice";
import { 
  Search, 
  ShoppingBag, 
  X, 
  ChevronLeft, 
  Plus, 
  Minus, 
  Clock, 
  Sparkles, 
  UtensilsCrossed, 
  Trash2, 
  Info, 
  Award,
  Leaf,
  Flame,
  CheckCircle,
  Wine
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── Gourmet Mock Descriptions & Pairings ─────────────────────────────────────
const GOURMET_DETAILS = {
  "Avocado toast": {
    desc: "Smashed organic Haas avocado, poached quail eggs, heirloom cherry tomatoes, and micro-greens on toasted rustic sourdough, finished with white truffle oil.",
    pairing: "Chardonnay or Crisp Sauvignon Blanc",
    prep: "10 mins",
    tags: ["Vegetarian", "Chef's Special"]
  },
  "Meat platter": {
    desc: "A curated selection of artisanal cured meats, prosciutto di Parma, Wagyu bresaola, house-made duck rillettes, served with cornichons and grain mustard.",
    pairing: "Full-bodied Cabernet Sauvignon or Syrah",
    prep: "15 mins",
    tags: ["Signature"]
  },
  "Salad": {
    desc: "Organic baby gem lettuce, shaved fennel, local honey-roasted beets, roasted pine nuts, and goat cheese crumbles dressed in a light champagne vinaigrette.",
    pairing: "Pinot Grigio or Dry Rosé",
    prep: "8 mins",
    tags: ["Vegetarian", "Gluten-Free"]
  },
  "Pizza": {
    desc: "Neapolitan-style sourdough crust topped with San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, and a drizzle of hot honey-infused olive oil.",
    pairing: "Chianti or Light Pinot Noir",
    prep: "12 mins",
    tags: ["Vegetarian"]
  },
  "Grilled salmon": {
    desc: "Pan-seared Atlantic salmon fillet with crispy skin, served over a bed of saffron wild rice, roasted asparagus spears, and finished with a citrus caper butter sauce.",
    pairing: "Chardonnay or Pinot Noir",
    prep: "18 mins",
    tags: ["Gluten-Free", "Signature"]
  },
  "Hamburgers": {
    desc: "Prime dry-aged Black Angus beef patty, melted gruyère cheese, caramelized sweet onions, and black truffle aioli on a toasted artisanal brioche bun.",
    pairing: "Bordeaux Blend or Craft Amber Ale",
    prep: "15 mins",
    tags: ["Chef's Special"]
  },
  "Sushi": {
    desc: "Chef's selection of premium nigiri and maki rolls featuring fresh bluefin tuna, king salmon, yellowtail, served with house-brewed soy sauce and fresh wasabi.",
    pairing: "Dry Junmai Daiginjo Sake or Riesling",
    prep: "20 mins",
    tags: ["Signature"]
  },
  "Taco": {
    desc: "Three blue corn tortillas filled with slow-braised beef barbacoa, avocado crema, pickled red onions, fresh cilantro, and house-made charred salsa.",
    pairing: "Reposado Tequila or Crisp Lager",
    prep: "10 mins",
    tags: ["Gluten-Free"]
  },
  "Blueberry pancake": {
    desc: "Fluffy soufflé-style buttermilk pancakes folded with fresh wild blueberries, topped with whipped vanilla bean mascarpone and pure Vermont maple syrup.",
    pairing: "Moscato d'Asti or Espresso Macchiato",
    prep: "12 mins",
    tags: ["Vegetarian"]
  },
  "Iced tea": {
    desc: "Freshly brewed organic black tea cold-infused with sweet white peach nectar, organic honey, and fresh garden mint leaves over hand-carved ice.",
    pairing: "Perfect on its own",
    prep: "3 mins",
    tags: ["Refresher"]
  },
  "Lemonade": {
    desc: "Freshly squeezed Meyer lemons mixed with sparkling spring water and organic lavender flower syrup, served with a candied lemon wheel.",
    pairing: "Refreshing palate cleanser",
    prep: "3 mins",
    tags: ["Refresher"]
  },
  "Margarita": {
    desc: "Premium Blanco Tequila, freshly squeezed lime juice, organic agave nectar, and a touch of orange liqueur, served with a Himalayan pink salt rim.",
    pairing: "Excellent with savory appetizers",
    prep: "4 mins",
    tags: ["House Cocktail"]
  },
  "Matcha latte": {
    desc: "Ceremonial-grade Japanese stone-ground green tea whisked with silky, steamed oat milk and sweetened with organic wildflower honey.",
    pairing: "Pairs beautifully with desserts",
    prep: "5 mins",
    tags: ["Vegetarian"]
  },
  "Thai tea": {
    desc: "Brewed black tea infused with sweet star anise, cardamom, and orange blossom, topped with a velvety float of sweetened condensed coconut milk.",
    pairing: "Complements spicy dishes",
    prep: "4 mins",
    tags: ["Traditional"]
  },
  "Orange juice": {
    desc: "Cold-pressed ripe Valencia oranges, freshly squeezed daily. Filled with vitamin C, sweet and naturally pulpy.",
    pairing: "Perfect for brunch pairings",
    prep: "2 mins",
    tags: ["Fresh Press"]
  },
  "Rose wine": {
    desc: "A elegant, pale pink Provencal rosé with delicate notes of fresh strawberries, red currants, white flowers, and a crisp, mineral finish.",
    pairing: "Salads, Seafood, or Summer Pastas",
    prep: "3 mins",
    tags: ["Gourmet Cellar"]
  },
  "Coffee": {
    desc: "Artisanal single-origin Ethiopian coffee beans brewed using a precise pour-over technique to extract clean floral and bergamot tasting notes.",
    pairing: "Perfect with rich chocolate desserts",
    prep: "5 mins",
    tags: ["Hot Beverage"]
  },
  "Hot chocolate": {
    desc: "Velvety Venezuelan dark chocolate melted into steamed whole milk, spiced with a hint of cinnamon and topped with house-made vanilla marshmallows.",
    pairing: "A cozy dessert accompaniment",
    prep: "5 mins",
    tags: ["Hot Beverage"]
  },
  "Sundae": {
    desc: "Decadent Madagascar vanilla bean ice cream layered with house-made salted caramel sauce, dark chocolate fudge, toasted hazelnuts, and gold leaf.",
    pairing: "Tawny Port or Espresso",
    prep: "6 mins",
    tags: ["Sweet indulgence"]
  },
  "Cake": {
    desc: "Triple-layer dark chocolate mousse cake made with 70% Valrhona chocolate, layered with raspberry coulis, and wrapped in a crisp chocolate collar.",
    pairing: "Ruby Port or Dark Roast Pour-over",
    prep: "5 mins",
    tags: ["Chef's Special"]
  },
  "Macarons": {
    desc: "An assortment of six delicate Parisian almond meringue cookies filled with custom ganache: salted caramel, pistachio, and dark chocolate.",
    pairing: "Champagne Brut or Earl Grey Tea",
    prep: "4 mins",
    tags: ["Sweet indulgence"]
  },
  "Creme brulee": {
    desc: "Silky Madagascar vanilla bean custard with a perfectly uniform, hand-torched caramelized sugar crust, served with fresh seasonal berries.",
    pairing: "Sauternes Dessert Wine or Espresso",
    prep: "7 mins",
    tags: ["Gluten-Free", "Signature"]
  },
  "Cheesecake": {
    desc: "Velvety New York-style baked cheesecake on a rich graham cracker crust, topped with a glossy glaze of fresh organic wild strawberries.",
    pairing: "Late Harvest Riesling or Macchiato",
    prep: "5 mins",
    tags: ["Traditional"]
  },
  "Cinnamon rolls": {
    desc: "Warm, fresh-from-the-oven buttery brioche dough swirled with premium Ceylon cinnamon and brown sugar, topped with cream cheese glaze.",
    pairing: "Flat White or Black Coffee",
    prep: "8 mins",
    tags: ["Signature"]
  },
  "Donut": {
    desc: "Brioche donut glazed with organic local wild honey, infused with real lavender petals and topped with micro-edible flower buds.",
    pairing: "Matcha Latte or Cold Brew",
    prep: "3 mins",
    tags: ["Vegetarian"]
  },
  "Blueberry pie": {
    desc: "Crisp flaky pastry shell loaded with plump, spiced Maine wild blueberries, baked golden brown, served with a scoop of vanilla ice cream.",
    pairing: "Espresso or Sweet Cider",
    prep: "7 mins",
    tags: ["Traditional"]
  },
  "Ice cream": {
    desc: "Two artisanal scoops of premium house-churned gelato. Choose from Roasted Pistachio, Tahitian Vanilla, or Dark Chocolate Sorbet.",
    pairing: "Perfect sweet finish",
    prep: "3 mins",
    tags: ["Gluten-Free"]
  }
};

const CATEGORY_NAMES = {
  1: "Starters & Mains",
  2: "Gourmet Beverages",
  3: "Artisanal Desserts"
};

// ── Main Page Component ──────────────────────────────────────────────────────
function MainGourmetMenu() {
  const dispatch = useDispatch<AppDispatch>();
  
  // UI states
  const [searchValueLocal, setSearchValueLocal] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategoryState, setActiveCategoryState] = useState<number | null>(0);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [estimatedPrepTime, setEstimatedPrepTime] = useState("25-30 mins");

  // Redux states
  const categories = useSelector((state: RootState) => state.category.categories);
  const itemList = useSelector((state: RootState) => state.cartItem.items);
  const searchedItems = useSelector((state: RootState) => state.cartItem.searchedItems);
  const isSearching = useSelector((state: RootState) => state.cartItem.isSearching);
  const selectedItemIds = useSelector((state: RootState) => state.idArray.selectedItemIds);
  const itemFromMenu = useSelector((state: RootState) => state.cartItem.selectedItems);
  const orders = useSelector((state: RootState) => state.cartItem.orders) || [];
  const fetched = useSelector((state: RootState) => state.cartItem.fetched);
  const loading = useSelector((state: RootState) => state.cartItem.loading || state.category.loading);

  const drawerOpen = useSelector((state: RootState) => state.cartItem.isItemDrawerOpen);
  const activeDrawerItem = useSelector((state: RootState) => state.cartItem.itemForDrawer) || {
    id: -1,
    name: "",
    price: 0,
    discounted_price: 0,
    category: 0,
    cover: "",
    isShown: false
  };

  // 1. Initial Load of items and categories
  useEffect(() => {
    dispatch(getCategoryAsync());
    if (!fetched) {
      dispatch(getItemAsync({ itemList: [], type: "full" }));
    }
  }, [dispatch, fetched]);

  // Set body background to match dark theme on mount and restore it on unmount
  useEffect(() => {
    document.body.style.backgroundColor = "#0B0B0C";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // 2. Sync Selected Items list whenever selection IDs change
  useEffect(() => {
    if (selectedItemIds.length > 0) {
      dispatch(getItemAsync({ itemList: selectedItemIds, type: "filtered" }));
    } else {
      dispatch(emptySelectedItem());
    }
  }, [dispatch, selectedItemIds]);

  // 3. Instant Search logic
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValueLocal(val);
    if (val.trim()) {
      const searchItemIds = itemList
        .filter((item) => item.name.toLowerCase().includes(val.toLowerCase()))
        .map((item) => item.id);
      dispatch(getItemAsync({ itemList: searchItemIds, type: "search" }));
    } else {
      dispatch(setIsSearching(false));
    }
  };

  const clearSearch = () => {
    setSearchValueLocal("");
    dispatch(setIsSearching(false));
  };

  // 4. Quantity Adjustments in Drawer
  const drawerOrder = orders.find((o) => o.itemId === activeDrawerItem.id);
  const drawerQty = drawerOrder ? drawerOrder.quantity : 1;

  const handleUpdateQty = (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    dispatch(setOrderQuantity({ itemId, newQuantity: newQty }));
  };

  // 5. Calculate Pricing
  const subtotal = orders.reduce((sum, order) => {
    const item = itemList.find((i) => i.id === order.itemId);
    const price = item ? item.discounted_price : order.discounted_price;
    return sum + price * order.quantity;
  }, 0);
  
  const serviceCharge = parseFloat((subtotal * 0.10).toFixed(2));
  const vat = parseFloat((subtotal * 0.07).toFixed(2));
  const total = parseFloat((subtotal + serviceCharge + vat).toFixed(2));

  // 6. Final checkout POST
  const submitGourmetOrder = () => {
    if (orders.length === 0) {
      toast.error("Please add exquisite selections to your order first.");
      return;
    }
    
    // Simulate API POST
    fetch("/api/product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orders),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Order submission failed");
        return res.json();
      })
      .then(() => {
        // Clear selection and orders
        dispatch(clearSelectedItemIds());
        dispatch(emptySelectedItem());
        setIsCartOpen(false);

        // Prep time mock calculation
        const itemsCount = orders.reduce((sum, o) => sum + o.quantity, 0);
        const time = itemsCount > 4 ? "35-40 mins" : "20-25 mins";
        setEstimatedPrepTime(time);
        
        // Show success
        setShowOrderSuccessModal(true);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Gastronomy order submission failed. Please try again.");
      });
  };

  // Filter items based on selected category
  const activeItemsList = isSearching ? searchedItems : itemList;
  const filteredList = 
    activeCategoryState !== null && activeCategoryState !== 0
      ? activeItemsList.filter((item) => item.category === activeCategoryState)
      : activeItemsList;

  // Chef's Spotlight (first 3 items)
  const spotlightItems = itemList.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F4F4F6] font-sans antialiased pb-24 relative overflow-x-hidden selection:bg-[#C5A880] selection:text-black">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        transition={Slide}
      />

      {/* Dynamic Font Styling Imports */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@200;300;400;500;600;700&display=swap');
        
        .font-serif {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .font-sans {
          font-family: 'Outfit', sans-serif;
        }
        .luxury-glass {
          background: rgba(18, 18, 20, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(197, 168, 128, 0.15);
        }
        .luxury-glow {
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* --- RESTAURANT BRANDING HEADER --- */}
      <header className="pt-8 pb-6 px-4 md:px-8 border-b border-[#C5A880]/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <div className="flex justify-center md:justify-start items-center gap-2 mb-1">
            <span className="h-[1px] w-6 bg-[#C5A880]" />
            <span className="font-mono text-xs tracking-[0.2em] text-[#C5A880] uppercase">Maison De Cuisine</span>
            <span className="h-[1px] w-6 bg-[#C5A880]" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#F4F4F6] via-[#C5A880] to-[#F4F4F6]">
            L&apos;Étoile Dorée
          </h1>
          <p className="text-xs text-[#8A898E] mt-1 font-mono tracking-widest uppercase">Table 14 • Dinner Selection</p>
        </div>

        {/* Brand Actions */}
        <div className="flex items-center gap-4">
          {/* Back to v1 option */}
          <Link href="/digital-menu">
            <span className="px-3.5 py-1.5 rounded-full border border-[#C5A880]/20 text-xs font-mono tracking-widest text-[#C5A880] hover:bg-[#C5A880]/10 transition-colors uppercase cursor-pointer">
              Classic View
            </span>
          </Link>

          {/* Luxury Cart Trigger */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-3 bg-[#161619] border border-[#C5A880]/20 rounded-full hover:bg-[#C5A880]/10 transition-all duration-300 relative flex items-center justify-center hover:scale-105 group"
          >
            <ShoppingBag className="h-5 w-5 text-[#C5A880] group-hover:text-white transition-colors" />
            {selectedItemIds.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#C5A880] text-[#0B0B0C] font-semibold text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0B0B0C] shadow-lg animate-pulse">
                {selectedItemIds.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* --- CHEF'S SPOTLIGHT (SPOTLIGHT SECTION) --- */}
      {!isSearching && activeCategoryState === 0 && spotlightItems.length > 0 && (
        <section className="py-8 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-5 w-5 text-[#C5A880]" />
            <h2 className="font-serif text-2xl tracking-wide uppercase">Chef&apos;s Signature Spotlight</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spotlightItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const detail = GOURMET_DETAILS[item.name] || { desc: "Gourmet creation prepared by our culinary team.", tags: ["Signature"] };
              return (
                <div 
                  key={`spotlight-${item.id}`}
                  onClick={() => {
                    if (!isSelected) {
                      dispatch(setIsItemDrawerOpen(true));
                    }
                    dispatch(setItemForDrawer({ ...item, isShown: true }));
                    dispatch(addOrRemoveSelectedItemIds({ id: item.id, type: isSelected ? "remove" : "add" }));
                    dispatch(addOrRemoveOrder({ itemId: item.id, quantity: 1, price: item.price, discounted_price: item.discounted_price }));
                  }}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-b from-[#18181B] to-[#121214] border transition-all duration-500 cursor-pointer hover:-translate-y-1.5 ${
                    isSelected ? "border-[#C5A880] shadow-[0_0_20px_rgba(197,168,128,0.25)]" : "border-[#C5A880]/10 hover:border-[#C5A880]/30"
                  }`}
                >
                  <div className="h-48 w-full relative overflow-hidden">
                    <Image 
                      src={item.cover} 
                      alt={item.name} 
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent opacity-80" />
                    
                    {/* Gourmet tags */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {detail.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider bg-stone-950/80 text-[#C5A880] border border-[#C5A880]/20 uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col justify-between min-h-[170px]">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="font-serif text-lg tracking-wide text-white group-hover:text-[#C5A880] transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <span className="font-mono text-sm text-[#C5A880] font-medium shrink-0">
                          ${item.discounted_price}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A898E] font-light leading-relaxed line-clamp-3">
                        {detail.desc}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#C5A880]/10">
                      <span className="text-[10px] font-mono text-[#8A898E] flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-[#C5A880]" /> {detail.prep}
                      </span>
                      <span className={`text-xs font-mono tracking-widest uppercase ${
                        isSelected ? "text-[#C5A880] font-semibold" : "text-[#8A898E] group-hover:text-white"
                      }`}>
                        {isSelected ? "Exquisite Selection" : "Taste Creation"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* --- SEARCH & CATEGORY BAR --- */}
      <section className="py-6 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          
          {/* Luxury Horizontal Categories */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
            <button
              onClick={() => setActiveCategoryState(0)}
              className={`px-5 py-2.5 rounded-full text-xs font-mono tracking-widest uppercase border transition-all duration-300 whitespace-nowrap ${
                activeCategoryState === 0
                  ? "bg-[#C5A880] text-black border-[#C5A880] font-medium shadow-md"
                  : "bg-transparent text-[#8A898E] border-[#C5A880]/10 hover:border-[#C5A880]/30 hover:text-white"
              }`}
            >
              Rendezvous (All)
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryState(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-mono tracking-widest uppercase border transition-all duration-300 whitespace-nowrap ${
                  activeCategoryState === cat.id
                    ? "bg-[#C5A880] text-black border-[#C5A880] font-medium shadow-md"
                    : "bg-transparent text-[#8A898E] border-[#C5A880]/10 hover:border-[#C5A880]/30 hover:text-white"
                }`}
              >
                {CATEGORY_NAMES[cat.id] || cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input 
              type="text"
              placeholder="Search cuisine..."
              value={searchValueLocal}
              onChange={handleSearchChange}
              className="w-full bg-[#161619] border border-[#C5A880]/10 rounded-full px-5 py-2.5 pl-11 text-sm text-white focus:outline-none focus:border-[#C5A880]/40 transition-colors placeholder:text-[#8A898E]/50 font-sans"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A898E]" />
            {searchValueLocal && (
              <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-stone-800">
                <X className="h-3 w-3 text-[#8A898E]" />
              </button>
            )}
          </div>
        </div>

        {/* --- MAIN DISHES GRID --- */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <div className="relative h-12 w-12 animate-spin rounded-full border-2 border-[#C5A880]/20 border-t-[#C5A880]" />
            <p className="font-serif italic text-[#C5A880] tracking-wider">Unveiling Gourmet Menu...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#C5A880]/10 rounded-2xl bg-[#121214]/30">
            <UtensilsCrossed className="h-8 w-8 text-[#C5A880]/40 mx-auto mb-4" />
            <h3 className="font-serif text-xl mb-1 text-white">No Creations Found</h3>
            <p className="text-xs text-[#8A898E] font-light">Our chef is refining recipes for this selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {filteredList.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const detail = GOURMET_DETAILS[item.name] || { desc: "An exquisite creation from our culinary experts.", tags: [], pairing: "Inquire with Sommelier", prep: "10 mins" };
              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    if (!isSelected) {
                      dispatch(setIsItemDrawerOpen(true));
                    }
                    dispatch(setItemForDrawer({ ...item, isShown: true }));
                    dispatch(addOrRemoveSelectedItemIds({ id: item.id, type: isSelected ? "remove" : "add" }));
                    dispatch(addOrRemoveOrder({ itemId: item.id, quantity: 1, price: item.price, discounted_price: item.discounted_price }));
                  }}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl bg-[#121214] border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    isSelected ? "border-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.15)]" : "border-[#C5A880]/10 hover:border-[#C5A880]/20"
                  }`}
                >
                  <div className="relative h-44 w-full overflow-hidden bg-stone-900">
                    <Image 
                      src={item.cover}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent opacity-60" />
                    
                    {/* Tags */}
                    {detail.tags.length > 0 && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[8px] font-mono tracking-wider bg-stone-950/80 text-[#C5A880] uppercase">
                        {detail.tags[0]}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="font-serif text-base tracking-wide text-white group-hover:text-[#C5A880] transition-colors mb-1 truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[#8A898E] font-light leading-relaxed line-clamp-2 mb-3">
                        {detail.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-[#C5A880]/10 mt-auto">
                      <div className="flex flex-col">
                        {item.price > item.discounted_price && (
                          <span className="line-through text-[10px] text-[#8A898E] font-light">
                            ${item.price}
                          </span>
                        )}
                        <span className="font-mono text-sm text-[#C5A880] font-medium">
                          ${item.discounted_price}
                        </span>
                      </div>
                      <span className={`h-7 w-7 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isSelected 
                          ? "bg-[#C5A880] border-[#C5A880] text-black" 
                          : "border-[#C5A880]/20 text-[#C5A880] group-hover:bg-[#C5A880]/10"
                      }`}>
                        {isSelected ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- SLEEK BOTTOM FLOATING ORDER BAR --- */}
      {selectedItemIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="luxury-glass luxury-glow rounded-full px-6 py-4 flex justify-between items-center bg-stone-950/80">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#C5A880]/10 flex items-center justify-center border border-[#C5A880]/20">
                <ShoppingBag className="h-4 w-4 text-[#C5A880]" />
              </div>
              <div>
                <p className="text-xs font-mono text-[#C5A880] uppercase tracking-wider">
                  {selectedItemIds.length} Selection{selectedItemIds.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-[#8A898E] font-light">Est. Total: ${total}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-[#C5A880] hover:bg-[#D4AF37] text-black font-semibold text-xs tracking-widest font-mono uppercase px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Order Gourmet
            </button>
          </div>
        </div>
      )}

      {/* --- EXQUISITE ITEM DRAWER / QUANTITY CONFIG --- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm transition-opacity duration-300">
          <div className="luxury-glass luxury-glow w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden bg-[#121214] max-h-[85vh] flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#C5A880]/10 mb-4">
              <h3 className="font-serif text-xl tracking-wide text-white font-medium">{activeDrawerItem.name}</h3>
              <button 
                onClick={() => dispatch(setIsItemDrawerOpen(false))}
                className="p-1.5 rounded-full hover:bg-stone-800 transition-colors"
              >
                <X className="h-4.5 w-4.5 text-[#8A898E]" />
              </button>
            </div>

            {/* Content scroll */}
            <div className="overflow-y-auto no-scrollbar flex-1 pb-6">
              <div className="relative h-48 w-full rounded-xl overflow-hidden mb-5 bg-stone-900">
                <Image 
                  src={activeDrawerItem.cover} 
                  alt={activeDrawerItem.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(GOURMET_DETAILS[activeDrawerItem.name]?.tags || []).map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[8px] font-mono tracking-widest bg-[#C5A880]/10 text-[#C5A880] border border-[#C5A880]/20 uppercase">
                    {t}
                  </span>
                ))}
              </div>

              {/* Dish info */}
              <p className="text-sm text-[#8A898E] font-light leading-relaxed mb-4">
                {GOURMET_DETAILS[activeDrawerItem.name]?.desc || "Our master culinary team prepares this unique recipe fresh for your table, blending rich local ingredients with creative cooking methods."}
              </p>

              {/* Culinary pairing / Prep time */}
              <div className="grid grid-cols-2 gap-4 bg-[#161619] p-4 rounded-xl border border-[#C5A880]/5 mb-6">
                <div>
                  <span className="text-[10px] font-mono text-[#8A898E] uppercase tracking-wider flex items-center gap-1">
                    <Wine className="h-3.5 w-3.5 text-[#C5A880]" /> Recommended Pairing
                  </span>
                  <p className="text-xs text-white font-medium mt-1">
                    {GOURMET_DETAILS[activeDrawerItem.name]?.pairing || "Inquire with Sommelier"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#8A898E] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#C5A880]" /> Preparation
                  </span>
                  <p className="text-xs text-white font-medium mt-1">
                    {GOURMET_DETAILS[activeDrawerItem.name]?.prep || "12 mins"}
                  </p>
                </div>
              </div>

              {/* Quantity selectors */}
              <div className="flex items-center justify-between bg-[#161619] p-4 rounded-xl border border-[#C5A880]/10">
                <span className="text-xs font-mono uppercase tracking-wider text-[#C5A880]">Select Quantity</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleUpdateQty(activeDrawerItem.id, drawerQty - 1)}
                    className="h-9 w-9 rounded-full bg-stone-900 hover:bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center border border-[#C5A880]/15 transition-all"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono text-base font-medium text-white w-6 text-center">{drawerQty}</span>
                  <button 
                    onClick={() => handleUpdateQty(activeDrawerItem.id, drawerQty + 1)}
                    className="h-9 w-9 rounded-full bg-[#C5A880] text-black hover:bg-[#D4AF37] flex items-center justify-center transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm buttons */}
            <div className="pt-4 border-t border-[#C5A880]/10 flex gap-4">
              <button 
                onClick={() => dispatch(setIsItemDrawerOpen(false))}
                className="flex-1 py-3 rounded-xl border border-[#C5A880]/20 text-[#C5A880] font-mono text-xs uppercase tracking-wider hover:bg-[#C5A880]/10 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => dispatch(setIsItemDrawerOpen(false))}
                className="flex-1 py-3 rounded-xl bg-[#C5A880] text-black font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#D4AF37] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CART SLIDE-OVER (GOURMET ORDER REVIEW) --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="luxury-glass w-full max-w-md bg-[#0B0B0C] h-full flex flex-col justify-between shadow-2xl p-6 border-l border-[#C5A880]/20 animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#C5A880]/10 mb-6">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4.5 w-4.5 text-[#C5A880]" />
                  <h3 className="font-serif text-xl tracking-wide text-white uppercase">Gourmet Selection</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-800 transition-colors"
                >
                  <X className="h-5 w-5 text-[#8A898E]" />
                </button>
              </div>

              {/* Items List */}
              {itemFromMenu.length === 0 ? (
                <div className="py-24 text-center">
                  <ShoppingBag className="h-10 w-10 text-[#C5A880]/40 mx-auto mb-4" />
                  <p className="font-serif italic text-base text-[#8A898E]">Your tasting cart is empty.</p>
                  <p className="text-[11px] text-[#8A898E]/70 mt-2 font-mono uppercase tracking-widest">Select items from the cellar and kitchen.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                  {itemFromMenu.map((item) => {
                    const orderItem = orders.find((o) => o.itemId === item.id);
                    const qty = orderItem ? orderItem.quantity : 1;
                    return (
                      <div key={item.id} className="flex gap-4 p-3 bg-[#121214] border border-[#C5A880]/10 rounded-xl items-center">
                        <div className="h-16 w-16 relative rounded-md overflow-hidden bg-stone-900 shrink-0">
                          <Image src={item.cover} alt={item.name} fill className="object-cover" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-xs font-semibold text-white truncate">{item.name}</h4>
                            <button 
                              onClick={() => {
                                dispatch(removeFromSelectedItemIds(item.id));
                              }}
                              className="p-1 rounded hover:bg-stone-800 text-stone-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2.5">
                            <span className="font-mono text-xs text-[#C5A880]">${item.discounted_price}</span>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2.5">
                              <button 
                                onClick={() => handleUpdateQty(item.id, qty - 1)}
                                className="h-6 w-6 rounded-full bg-stone-900 text-[#C5A880] flex items-center justify-center border border-[#C5A880]/15 hover:bg-[#C5A880]/10"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="font-mono text-xs text-white w-4 text-center">{qty}</span>
                              <button 
                                onClick={() => handleUpdateQty(item.id, qty + 1)}
                                className="h-6 w-6 rounded-full bg-[#C5A880] text-black flex items-center justify-center hover:bg-[#D4AF37]"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calculations & Submit */}
            <div className="border-t border-[#C5A880]/15 pt-6 bg-[#0B0B0C] mt-auto">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs text-[#8A898E]">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${subtotal}</span>
                </div>
                <div className="flex justify-between text-xs text-[#8A898E]">
                  <span>Premium Service Charge (10%)</span>
                  <span className="font-mono text-white">${serviceCharge}</span>
                </div>
                <div className="flex justify-between text-xs text-[#8A898E]">
                  <span>VAT (7%)</span>
                  <span className="font-mono text-white">${vat}</span>
                </div>
                <div className="flex justify-between text-sm pt-2.5 border-t border-[#C5A880]/10 font-semibold text-white">
                  <span>Grand Total</span>
                  <span className="font-mono text-[#C5A880]">${total}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={submitGourmetOrder}
                  disabled={orders.length === 0}
                  className="w-full bg-[#C5A880] hover:bg-[#D4AF37] disabled:bg-stone-800 disabled:text-stone-600 text-black font-semibold text-xs tracking-widest font-mono uppercase py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-98"
                >
                  <Sparkles className="h-4 w-4" /> Place Gastronomy Order
                </button>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-transparent border border-stone-800 text-[#8A898E] hover:text-white font-mono text-xs uppercase tracking-wider py-3.5 rounded-xl transition-colors"
                >
                  Return to Menu
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- ORDER SUCCESS CONGRATULATORY MODAL --- */}
      {showOrderSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="luxury-glass luxury-glow w-full max-w-md rounded-2xl p-8 bg-[#121214] text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-[#C5A880]/15 rounded-full flex items-center justify-center border border-[#C5A880]/40">
              <CheckCircle className="h-8 w-8 text-[#C5A880]" />
            </div>
            
            <div>
              <h2 className="font-serif text-2xl tracking-wide text-white mb-2 uppercase">Bon Appétit!</h2>
              <p className="text-xs text-[#8A898E] font-mono uppercase tracking-widest text-[#C5A880] mb-4">Your Order is Confirmed</p>
              <p className="text-sm text-[#8A898E] font-light leading-relaxed">
                Our chef is crafting your selected gastronomy. We will serve each creation fresh to Table 14 as it is finished.
              </p>
            </div>

            <div className="w-full bg-[#161619] p-4 rounded-xl border border-[#C5A880]/10 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A898E]">Estimated Prep Time:</span>
                <span className="font-mono text-[#C5A880] font-semibold">{estimatedPrepTime}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A898E]">Table Number:</span>
                <span className="font-mono text-white font-semibold">Table 14</span>
              </div>
            </div>

            <button 
              onClick={() => setShowOrderSuccessModal(false)}
              className="w-full bg-[#C5A880] hover:bg-[#D4AF37] text-black font-semibold text-xs tracking-widest font-mono uppercase py-3.5 rounded-xl transition-all"
            >
              Exquisite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapping in Redux Provider to share exactly the same state
export default function GourmetMenuPage() {
  return (
    <Provider store={store}>
      <MainGourmetMenu />
    </Provider>
  );
}
