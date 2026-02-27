const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Parse .env.local manually
const envPath = path.resolve(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
});

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    images: [String],
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, required: true, default: "General" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

async function migrateImageUrls() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find products with old ImageKit transform
    const oldTransform = "c-maintain_ratio,fo-auto";
    const newTransform = "c-at_max,fo-top";

    const productsWithOldUrls = await Product.find({
      $or: [
        { image: new RegExp(oldTransform) },
        { images: { $elemMatch: { $regex: oldTransform } } },
      ],
    });

    if (productsWithOldUrls.length === 0) {
      console.log("ℹ️  No products found with old ImageKit transform.");
      console.log(
        "Either all URLs are already updated or no ImageKit URLs exist.\n"
      );
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(
      `📦 Found ${productsWithOldUrls.length} product(s) with old transform URLs\n`
    );

    // Update each product
    let updatedCount = 0;
    for (const product of productsWithOldUrls) {
      let updated = false;

      // Update main image
      if (product.image && product.image.includes(oldTransform)) {
        product.image = product.image.replace(oldTransform, newTransform);
        updated = true;
        console.log(`  ✓ Updated main image: ${product.name}`);
      }

      // Update images array if it exists
      if (product.images && Array.isArray(product.images)) {
        const newImages = product.images.map((img) =>
          img.includes(oldTransform) ? img.replace(oldTransform, newTransform) : img
        );

        if (JSON.stringify(newImages) !== JSON.stringify(product.images)) {
          product.images = newImages;
          updated = true;
          console.log(`  ✓ Updated ${product.images.length} image(s) in array`);
        }
      }

      if (updated) {
        await product.save();
        updatedCount++;
      }
    }

    console.log(
      `\n✅ Migration complete! Updated ${updatedCount} product(s)\n`
    );
    console.log(
      `📝 Change: "${oldTransform}" → "${newTransform}"\n`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

migrateImageUrls();
