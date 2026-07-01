// app/(admin)/admin/digital-menu/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Sparkles, 
  DollarSign, 
  UtensilsCrossed, 
  Eye, 
  EyeOff, 
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wine
} from "lucide-react";
import { 
  getMenuItems, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem 
} from "./actions";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  discountedPrice: number;
  category: number; // 1 = Food, 2 = Drink, 3 = Dessert
  cover: string;
  isShown: boolean;
  description: string | null;
  pairing: string | null;
  prep: string | null;
  tags: string | null;
}

export default function DigitalMenuAdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  
  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState(1);
  const [formPrice, setFormPrice] = useState("");
  const [formDiscountedPrice, setFormDiscountedPrice] = useState("");
  const [formCover, setFormCover] = useState("");
  const [formIsShown, setFormIsShown] = useState(true);
  const [formDescription, setFormDescription] = useState("");
  const [formPairing, setFormPairing] = useState("");
  const [formPrep, setFormPrep] = useState("");
  const [formTags, setFormTags] = useState("");
  
  // Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch menu items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getMenuItems();
      setItems(data);
    } catch (err) {
      showNotification("error", "Failed to load menu items from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setCurrentItemId(null);
    setFormName("");
    setFormCategory(1);
    setFormPrice("");
    setFormDiscountedPrice("");
    setFormCover("/images/pizza.avif");
    setFormIsShown(true);
    setFormDescription("");
    setFormPairing("");
    setFormPrep("10 mins");
    setFormTags("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setModalMode("edit");
    setCurrentItemId(item.id);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormDiscountedPrice(item.discountedPrice.toString());
    setFormCover(item.cover);
    setFormIsShown(item.isShown);
    setFormDescription(item.description || "");
    setFormPairing(item.pairing || "");
    setFormPrep(item.prep || "10 mins");
    setFormTags(item.tags || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice || !formDiscountedPrice) {
      showNotification("error", "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    const itemData = {
      name: formName,
      category: Number(formCategory),
      price: parseFloat(formPrice),
      discountedPrice: parseFloat(formDiscountedPrice),
      cover: formCover,
      isShown: formIsShown,
      description: formDescription,
      pairing: formPairing,
      prep: formPrep,
      tags: formTags,
    };

    try {
      if (modalMode === "create") {
        const res = await createMenuItem(itemData);
        if (res.success) {
          showNotification("success", "Menu item created successfully.");
          setIsModalOpen(false);
          fetchItems();
        } else {
          showNotification("error", res.error || "Failed to create menu item.");
        }
      } else if (modalMode === "edit" && currentItemId !== null) {
        const res = await updateMenuItem(currentItemId, itemData);
        if (res.success) {
          showNotification("success", "Menu item updated successfully.");
          setIsModalOpen(false);
          fetchItems();
        } else {
          showNotification("error", res.error || "Failed to update menu item.");
        }
      }
    } catch (err) {
      showNotification("error", "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    try {
      const res = await deleteMenuItem(id);
      if (res.success) {
        showNotification("success", "Menu item deleted successfully.");
        fetchItems();
      } else {
        showNotification("error", res.error || "Failed to delete menu item.");
      }
    } catch (err) {
      showNotification("error", "An error occurred during deletion.");
    }
  };

  // Filtered menu items
  const filteredItems = items.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = 
      categoryFilter === "all" || 
      (categoryFilter === "Food" && p.category === 1) ||
      (categoryFilter === "Drink" && p.category === 2) ||
      (categoryFilter === "Dessert" && p.category === 3);
    
    return matchesSearch && matchesCategory;
  });

  // Simple statistics
  const totalItems = items.length;
  const foodCount = items.filter(i => i.category === 1).length;
  const drinkCount = items.filter(i => i.category === 2).length;
  const dessertCount = items.filter(i => i.category === 3).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div 
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 ${
            notification.type === "success" 
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-300" 
              : "bg-red-950/80 border-red-800 text-red-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-zinc-700/80 transition-all duration-200">
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Items</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalItems}</h3>
          </div>
        </div>

        {/* Food */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-zinc-700/80 transition-all duration-200">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <span className="text-sm font-bold font-mono">F</span>
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Foods</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{foodCount}</h3>
          </div>
        </div>

        {/* Drink */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-zinc-700/80 transition-all duration-200">
          <div className="p-3 bg-pink-500/10 rounded-lg text-pink-400">
            <span className="text-sm font-bold font-mono">D</span>
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Drinks</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{drinkCount}</h3>
          </div>
        </div>

        {/* Dessert */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-zinc-700/80 transition-all duration-200">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
            <span className="text-sm font-bold font-mono">S</span>
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Desserts</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{dessertCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-[#121214] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        {/* Controls Header */}
        <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 max-w-md">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search digital menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all duration-200"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-zinc-300 px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            >
              <option value="all">All Slices</option>
              <option value="Food">Food</option>
              <option value="Drink">Drink</option>
              <option value="Dessert">Dessert</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm">Connecting to database...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
              <UtensilsCrossed className="w-12 h-12 text-zinc-600" />
              <p className="text-sm font-medium">No menu items found</p>
              <p className="text-xs text-zinc-500">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-900/20">
                  <th className="px-6 py-4">Item Info</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Retail Price</th>
                  <th className="px-6 py-4">Discounted Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/10 transition-colors duration-150">
                    {/* Info */}
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700/80 overflow-hidden shrink-0">
                        <img
                          src={item.cover}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=120";
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-white truncate max-w-md">{item.name}</h4>
                        <p className="text-xs text-zinc-400 truncate max-w-sm">{item.description}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.category === 1 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : item.category === 2
                          ? "bg-pink-500/10 border-pink-500/20 text-pink-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}>
                        {item.category === 1 ? "Food" : item.category === 2 ? "Drink" : "Dessert"}
                      </span>
                    </td>

                    {/* Original Price */}
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      ${item.price.toFixed(2)}
                    </td>

                    {/* Discount Price */}
                    <td className="px-6 py-4 font-semibold text-white text-sm">
                      ${item.discountedPrice.toFixed(2)}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs ${
                        item.isShown ? "text-emerald-400" : "text-zinc-500"
                      }`}>
                        {item.isShown ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hidden</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-700/80 transition-all duration-150 cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded bg-zinc-800/80 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-all duration-150 cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Dialog for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>{modalMode === "create" ? "Add Menu Item" : "Edit Menu Item"}</span>
              </h3>
              <button onClick={handleCloseModal} className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wagyu Ribeye Steak"
                  className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
                />
              </div>

              {/* Grid 2-cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  >
                    <option value={1}>Food</option>
                    <option value={2}>Drink</option>
                    <option value={3}>Dessert</option>
                  </select>
                </div>

                {/* Cover Image Path */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Cover Image Path
                  </label>
                  <input
                    type="text"
                    value={formCover}
                    onChange={(e) => setFormCover(e.target.value)}
                    placeholder="e.g. /images/pizza.avif"
                    className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Grid Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Retail Price */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Retail Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="25.00"
                    className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  />
                </div>

                {/* Discounted Price */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Discounted Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formDiscountedPrice}
                    onChange={(e) => setFormDiscountedPrice(e.target.value)}
                    placeholder="19.00"
                    className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Status visibility checkbox */}
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="formIsShown"
                  checked={formIsShown}
                  onChange={(e) => setFormIsShown(e.target.checked)}
                  className="rounded border-zinc-800 bg-[#0B0B0C] text-indigo-600 focus:ring-indigo-500/40 w-4 h-4"
                />
                <label htmlFor="formIsShown" className="text-xs text-zinc-300 font-semibold cursor-pointer select-none">
                  Display Item on Public Digital Menu
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Gourmet Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the recipe and ingredients..."
                  className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200 resize-none"
                />
              </div>

              {/* Pairing & Prep Time & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pairing */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Sommelier Pairing
                  </label>
                  <input
                    type="text"
                    value={formPairing}
                    onChange={(e) => setFormPairing(e.target.value)}
                    placeholder="e.g. Cabernet Sauvignon or Pinot Noir"
                    className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  />
                </div>

                {/* Prep Time */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Prep Time
                  </label>
                  <input
                    type="text"
                    value={formPrep}
                    onChange={(e) => setFormPrep(e.target.value)}
                    placeholder="e.g. 15 mins"
                    className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Recipe Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. Vegetarian, Gluten-Free, Signature"
                  className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3 bg-[#121214] sticky bottom-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Item</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
