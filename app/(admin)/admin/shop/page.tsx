// app/(admin)/admin/shop/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Sparkles, 
  DollarSign, 
  Package, 
  Tag, 
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from "./actions";

interface Product {
  id: string;
  name: string;
  description: string;
  details: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  category: string;
}

export default function ShopAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  
  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Women");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formDiscountedPrice, setFormDiscountedPrice] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDetails, setFormDetails] = useState("");
  
  // Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch products on mount
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      showNotification("error", "Failed to load products from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setCurrentProductId(null);
    setFormName("");
    setFormCategory("Women");
    setFormOriginalPrice("");
    setFormDiscountedPrice("");
    setFormImage("/shop/photo-1591047139829-d91aecb6caea.avif"); // sensible default
    setFormDescription("");
    setFormDetails("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setModalMode("edit");
    setCurrentProductId(product.id);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormOriginalPrice(product.originalPrice.toString());
    setFormDiscountedPrice(product.discountedPrice.toString());
    setFormImage(product.image);
    setFormDescription(product.description);
    setFormDetails(product.details);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formOriginalPrice || !formDiscountedPrice || !formDescription) {
      showNotification("error", "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    const productData = {
      name: formName,
      category: formCategory,
      originalPrice: parseFloat(formOriginalPrice),
      discountedPrice: parseFloat(formDiscountedPrice),
      image: formImage,
      description: formDescription,
      details: formDetails,
    };

    try {
      if (modalMode === "create") {
        const res = await createProduct(productData);
        if (res.success) {
          showNotification("success", "Product created successfully.");
          setIsModalOpen(false);
          fetchProducts();
        } else {
          showNotification("error", res.error || "Failed to create product.");
        }
      } else if (modalMode === "edit" && currentProductId) {
        const res = await updateProduct(currentProductId, productData);
        if (res.success) {
          showNotification("success", "Product updated successfully.");
          setIsModalOpen(false);
          fetchProducts();
        } else {
          showNotification("error", res.error || "Failed to update product.");
        }
      }
    } catch (err) {
      showNotification("error", "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await deleteProduct(id);
      if (res.success) {
        showNotification("success", "Product deleted successfully.");
        fetchProducts();
      } else {
        showNotification("error", res.error || "Failed to delete product.");
      }
    } catch (err) {
      showNotification("error", "An error occurred during deletion.");
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Simple statistics
  const totalProducts = products.length;
  const categoriesCount = new Set(products.map((p) => p.category)).size;
  const averagePrice = products.length 
    ? (products.reduce((acc, p) => acc + p.discountedPrice, 0) / products.length).toFixed(2)
    : "0.00";

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-zinc-700/80 transition-all duration-200">
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Products</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalProducts}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-zinc-700/80 transition-all duration-200">
          <div className="p-3 bg-pink-500/10 rounded-lg text-pink-400">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Categories</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{categoriesCount} Active</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-zinc-700/80 transition-all duration-200">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Avg. Retail Price</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">${averagePrice}</h3>
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
                placeholder="Search catalog products..."
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
              <option value="all">All Categories</option>
              <option value="Women">Women</option>
              <option value="Men">Men</option>
              <option value="Kids">Kids</option>
              <option value="Baby">Baby</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm">Connecting to database...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
              <Package className="w-12 h-12 text-zinc-600" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs text-zinc-500">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-900/20">
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Original Price</th>
                  <th className="px-6 py-4">Discounted Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-900/10 transition-colors duration-150">
                    {/* Info */}
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700/80 overflow-hidden shrink-0">
                        {/* Render simple image placeholder if path doesn't start with http or slash */}
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=120";
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-white truncate max-w-md">{product.name}</h4>
                        <p className="text-xs text-zinc-400 truncate max-w-sm">{product.description}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        product.category === "Women" 
                          ? "bg-pink-500/10 border-pink-500/20 text-pink-400"
                          : product.category === "Men"
                          ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                          : product.category === "Kids"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                      }`}>
                        {product.category}
                      </span>
                    </td>

                    {/* Original Price */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-400 line-through">${product.originalPrice.toFixed(2)}</span>
                    </td>

                    {/* Discount Price */}
                    <td className="px-6 py-4 font-semibold text-white">
                      <span className="text-sm">${product.discountedPrice.toFixed(2)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-700/80 transition-all duration-150 cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 rounded bg-zinc-800/80 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-all duration-150 cursor-pointer"
                          title="Delete Product"
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
                <span>{modalMode === "create" ? "Add New Product" : "Edit Product"}</span>
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
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Italian Wool Knit Sweater"
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
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Kids">Kids</option>
                    <option value="Baby">Baby</option>
                  </select>
                </div>

                {/* Image Path */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Image Path or URL
                  </label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="e.g. /shop/photo.avif"
                    className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Grid Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original Price */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Original Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    placeholder="29.90"
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
                    placeholder="19.90"
                    className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the product look and style..."
                  className="w-full px-3 py-2 bg-[#0B0B0C] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-200 resize-none"
                />
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Details & Materials
                </label>
                <input
                  type="text"
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="e.g. 100% Cashmere • Ribbed Trims • Made in Italy"
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
                    <span>Save Product</span>
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
