import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

const sampleProducts = [
  {
    name: "Minimalist Desk Lamp",
    description:
      "Elegant brushed brass desk lamp with adjustable arm and warm LED light. Perfect for modern workspaces.",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&h=600&fit=crop",
    stock: 25,
    category: "Lighting",
    featured: true,
  },
  {
    name: "Artisan Ceramic Vase",
    description:
      "Hand-crafted ceramic vase with an organic matte finish. Each piece is unique and adds warmth to any room.",
    price: 64.0,
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600&h=600&fit=crop",
    stock: 18,
    category: "Decor",
    featured: true,
  },
  {
    name: "Walnut Cutting Board",
    description:
      "Premium solid walnut cutting board with juice groove. Sustainably sourced and finished with food-safe oil.",
    price: 55.0,
    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=600&fit=crop",
    stock: 40,
    category: "Kitchen",
    featured: true,
  },
  {
    name: "Linen Throw Blanket",
    description:
      "Stonewashed pure linen throw in soft clay. Perfectly draped over a sofa or at the foot of a bed.",
    price: 120.0,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop",
    stock: 15,
    category: "Textiles",
    featured: true,
  },
  {
    name: "Copper Pour-Over Kettle",
    description:
      "Precision gooseneck copper kettle for pour-over coffee. Built-in thermometer and ergonomic walnut handle.",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=600&fit=crop",
    stock: 30,
    category: "Kitchen",
    featured: false,
  },
  {
    name: "Concrete Planter Set",
    description:
      "Set of 3 hand-poured concrete planters in graduating sizes. Drainage holes included. Indoor/outdoor use.",
    price: 45.0,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&h=600&fit=crop",
    stock: 22,
    category: "Garden",
    featured: false,
  },
  {
    name: "Japanese Stoneware Mug",
    description:
      "Handmade stoneware mug with reactive glaze. Microwave and dishwasher safe. 12oz capacity.",
    price: 32.0,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop",
    stock: 50,
    category: "Kitchen",
    featured: false,
  },
  {
    name: "Oak Wall Shelf",
    description:
      "Floating solid oak shelf with hidden bracket system. Natural oil finish preserves the wood grain beauty.",
    price: 75.0,
    image: "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&h=600&fit=crop",
    stock: 12,
    category: "Furniture",
    featured: true,
  },
];

export async function POST() {
  try {
    await dbConnect();
    await Product.deleteMany({});
    const products = await Product.insertMany(sampleProducts);
    return NextResponse.json({
      message: `Seeded ${products.length} products`,
      products,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed products" }, { status: 500 });
  }
}
