// app/(admin)/layout.tsx
import type React from "react";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, ArrowLeft, Shield, UtensilsCrossed } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard - Shaders Store",
  description: "Manage products, categories and store settings.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-gray-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#121214] border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-lg tracking-wider text-white">
            STORE <span className="text-indigo-500 font-bold">ADMIN</span>
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/admin/shop"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            <span>Shop CRUD</span>
          </Link>
          <Link
            href="/admin/digital-menu"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
          >
            <UtensilsCrossed className="w-4 h-4 text-pink-400" />
            <span>Digital Menu CRUD</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex flex-col gap-1">
            <Link
              href="/shop/v2"
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-all duration-200 py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Shop (v2)</span>
            </Link>
            <Link
              href="/digital-menu/v2"
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-all duration-200 py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Menu (v2)</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0B0B0C] overflow-y-auto">
        <header className="h-16 flex items-center justify-between px-6 md:px-8 border-b border-zinc-800/80 bg-[#0B0B0C]/80 backdrop-blur-md sticky top-0 z-30">
          <h1 className="font-semibold text-lg text-white">Store Administration</h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Database Connected
            </span>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
