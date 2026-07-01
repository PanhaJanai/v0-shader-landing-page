// app/(admin)/admin/shop/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  try {
    return await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw new Error("Failed to fetch products.");
  }
}

export async function createProduct(formData: {
  name: string;
  description: string;
  details: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  category: string;
}) {
  try {
    const product = await prisma.product.create({
      data: {
        name: formData.name,
        description: formData.description,
        details: formData.details,
        image: formData.image || "/placeholder.jpg",
        originalPrice: formData.originalPrice,
        discountedPrice: formData.discountedPrice,
        category: formData.category,
      },
    });
    revalidatePath("/admin/shop");
    revalidatePath("/shop/v2");
    return { success: true, product };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, error: "Failed to create product." };
  }
}

export async function updateProduct(
  id: string,
  formData: {
    name: string;
    description: string;
    details: string;
    image: string;
    originalPrice: number;
    discountedPrice: number;
    category: string;
  }
) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: formData.name,
        description: formData.description,
        details: formData.details,
        image: formData.image,
        originalPrice: formData.originalPrice,
        discountedPrice: formData.discountedPrice,
        category: formData.category,
      },
    });
    revalidatePath("/admin/shop");
    revalidatePath("/shop/v2");
    return { success: true, product };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Failed to update product." };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });
    revalidatePath("/admin/shop");
    revalidatePath("/shop/v2");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product." };
  }
}
