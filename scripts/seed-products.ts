// scripts/seed-products.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATALOG_DATA = [
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
  },
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
  },
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
  },
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
];

async function main() {
  console.log("Seeding products...");
  for (const item of CATALOG_DATA) {
    await prisma.product.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        details: item.details,
        image: item.image,
        originalPrice: item.originalPrice,
        discountedPrice: item.discountedPrice,
        category: item.category,
      }
    });
  }
  console.log("Products seeded successfully.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
