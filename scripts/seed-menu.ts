// scripts/seed-menu.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { id: 0, name: "All", icon: "FaFire" },
  { id: 1, name: "Food", icon: "GiHotDog" },
  { id: 2, name: "Drink", icon: "RiDrinks2Line" },
  { id: 3, name: "Dessert", icon: "LuDessert" },
];

const GOURMET_DETAILS: Record<string, { desc: string; pairing: string; prep: string; tags: string[] }> = {
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
    tags: ["Signature"]
  },
  "Ice cream": {
    desc: "Gourmet, house-churned organic vanilla bean or Belgian dark chocolate ice cream, served with dark chocolate shavings.",
    pairing: "Waffles, Pies or Espresso",
    prep: "3 mins",
    tags: ["Sweet indulgence"]
  }
};

const foodPath = [
  "avocado-toast.avif",
  "meat-platter.avif",
  "salad.avif",
  "pizza.avif",
  "grilled-salmon.avif",
  "hamburgers.webp",
  "sushi.webp",
  "taco.webp",
  "blueberry-pancake.avif",
];

const drinksPath = [
  "iced-tea.avif",
  "lemonade.avif",
  "margarita.avif",
  "matcha-latte.webp",
  "thai tea.webp",
  "orange-juice.avif",
  "rose-wine.avif",
  "coffee.webp",
  "hot-chocolate.webp",
];

const dessertPath = [
  "sundae.webp",
  "cake.avif",
  "macarons.avif",
  "creme-brulee.webp",
  "cheesecake.webp",
  "cinnamon-rolls.webp",
  "donut.avif",
  "blueberry-pie.avif",
  "ice-cream.avif",
];

const itemsPath = [
  ...foodPath,
  ...drinksPath,
  ...dessertPath,
];

async function main() {
  console.log("Seeding categories...");
  for (const cat of CATEGORIES) {
    await prisma.menuCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name, icon: cat.icon },
      create: { id: cat.id, name: cat.name, icon: cat.icon }
    });
  }

  console.log("Seeding menu items...");
  for (let i = 0; i < itemsPath.length; i++) {
    const filename = itemsPath[i];
    const name = filename.replace('-', ' ').split('.')[0][0].toUpperCase() + filename.replace('-', ' ').split('.')[0].slice(1);
    
    // determine category (1 = Food, 2 = Drink, 3 = Dessert)
    const category = i < 9 ? 1 : i < 18 ? 2 : 3;
    const cover = `/images/${filename}`;
    
    const basePrice = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
    const price = basePrice + 5;
    const discountedPrice = basePrice;
    
    // Details
    const details = GOURMET_DETAILS[name] || {
      desc: "Fresh and premium gourmet recipe created by our master chefs.",
      pairing: "Ask your sommelier for pairings",
      prep: "10 mins",
      tags: ["Chef's Selection"]
    };

    await prisma.menuItem.upsert({
      where: { name },
      update: {},
      create: {
        name,
        price,
        discountedPrice,
        category,
        cover,
        isShown: true,
        description: details.desc,
        pairing: details.pairing,
        prep: details.prep,
        tags: details.tags.join(",")
      }
    });
  }
  console.log("Menu items seeded successfully.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
