import Category from "../../models/Category";
import Product from "../../models/Product";

/**
 * Normalizes Arabic or English category names into clean URL slugs.
 */
export function generateCategorySlug(name: string): string {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
  if (!slug) slug = `category-${Date.now()}`;
  return slug;
}

/**
 * Ensures a category exists in the Category collection. If missing, auto-creates it with a normalized slug.
 */
export async function ensureCategoryExists(categoryName: string): Promise<string> {
  const trimmed = categoryName.trim();
  if (!trimmed) return "";

  const existing = await Category.findOne({ name: trimmed });
  if (existing) {
    return existing.slug || generateCategorySlug(trimmed);
  }

  const slug = generateCategorySlug(trimmed);
  const created = await Category.create({ name: trimmed, slug, description: "" });
  return created.slug;
}

/**
 * Updates a category and cascades name re-indexing across all products in the Product collection.
 */
export async function updateCategoryAndCascade(
  categoryId: string,
  updateData: { name?: string; description?: string; image?: string }
): Promise<{ success: boolean; category?: any; error?: string }> {
  const existing = await Category.findById(categoryId);
  if (!existing) {
    return { success: false, error: "Category not found" };
  }

  const oldName = existing.name;

  if (updateData.name && updateData.name.trim() !== oldName) {
    const newName = updateData.name.trim();
    (updateData as any).slug = generateCategorySlug(newName);

    // Cascade name update across Product documents referencing the old category name
    await Product.updateMany({ category: oldName }, { $set: { category: newName } });
  }

  const updated = await Category.findByIdAndUpdate(categoryId, updateData, { returnDocument: "after" });
  return { success: true, category: updated };
}

/**
 * Deletes a category and re-assigns orphaned products to "General" / "عام".
 */
export async function deleteCategoryAndCascade(categoryId: string): Promise<{ success: boolean; error?: string }> {
  const category = await Category.findByIdAndDelete(categoryId);
  if (!category) {
    return { success: false, error: "Category not found" };
  }

  // Re-assign orphaned products to "عام"
  await Product.updateMany({ category: category.name }, { $set: { category: "عام" } });
  return { success: true };
}
