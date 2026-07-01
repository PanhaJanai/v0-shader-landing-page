// app/(admin)/admin/digital-menu/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMenuItems() {
  try {
    return await prisma.menuItem.findMany({
      orderBy: { id: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
    throw new Error("Failed to fetch menu items.");
  }
}

export async function getMenuCategories() {
  try {
    return await prisma.menuCategory.findMany({
      orderBy: { id: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch menu categories:", error);
    throw new Error("Failed to fetch menu categories.");
  }
}

export async function createMenuItem(formData: {
  name: string;
  price: number;
  discountedPrice: number;
  category: number;
  cover: string;
  isShown: boolean;
  description: string;
  pairing: string;
  prep: string;
  tags: string;
}) {
  try {
    const item = await prisma.menuItem.create({
      data: {
        name: formData.name,
        price: formData.price,
        discountedPrice: formData.discountedPrice,
        category: formData.category,
        cover: formData.cover || "/images/pizza.avif",
        isShown: formData.isShown,
        description: formData.description,
        pairing: formData.pairing,
        prep: formData.prep,
        tags: formData.tags,
      },
    });
    revalidatePath("/admin/digital-menu");
    revalidatePath("/digital-menu/v2");
    return { success: true, item };
  } catch (error) {
    console.error("Failed to create menu item:", error);
    return { success: false, error: "Failed to create menu item. Make sure name is unique." };
  }
}

export async function updateMenuItem(
  id: number,
  formData: {
    name: string;
    price: number;
    discountedPrice: number;
    category: number;
    cover: string;
    isShown: boolean;
    description: string;
    pairing: string;
    prep: string;
    tags: string;
  }
) {
  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name: formData.name,
        price: formData.price,
        discountedPrice: formData.discountedPrice,
        category: formData.category,
        cover: formData.cover,
        isShown: formData.isShown,
        description: formData.description,
        pairing: formData.pairing,
        prep: formData.prep,
        tags: formData.tags,
      },
    });
    revalidatePath("/admin/digital-menu");
    revalidatePath("/digital-menu/v2");
    return { success: true, item };
  } catch (error) {
    console.error("Failed to update menu item:", error);
    return { success: false, error: "Failed to update menu item." };
  }
}

export async function deleteMenuItem(id: number) {
  try {
    await prisma.menuItem.delete({
      where: { id },
    });
    revalidatePath("/admin/digital-menu");
    revalidatePath("/digital-menu/v2");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete menu item:", error);
    return { success: false, error: "Failed to delete menu item." };
  }
}
