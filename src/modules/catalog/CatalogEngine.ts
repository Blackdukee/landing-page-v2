import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Company from "@/models/Company";

// Ensure Company model is pre-registered
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
Company;

export interface CatalogQueryParams {
  featured?: boolean;
  category?: string;
  company?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CatalogQueryResult {
  products: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Deep Catalog Engine Module:
 * Provides a unified query and faceting interface for the product catalog.
 */
export const CatalogEngine = {
  /**
   * Search and filter products with optional pagination and company population.
   */
  searchCatalog: async (params: CatalogQueryParams): Promise<CatalogQueryResult | any[]> => {
    await dbConnect();

    const { featured, category, company, search, page = 1, limit = 0 } = params;

    const filter: any = {};
    if (featured) filter.featured = true;
    if (category) filter.category = category;
    if (company) filter.company = company;
    if (search) filter.$text = { $search: search };

    // Unpaginated full query (limit = 0)
    if (!limit) {
      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .populate("company", "name logo")
        .limit(100)
        .lean();
      return products;
    }

    // Paginated query
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate("company", "name logo")
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Create a new product in the catalog with sanitized company reference.
   */
  createProduct: async (data: any): Promise<any> => {
    await dbConnect();

    if (data.company) {
      if (typeof data.company === "string" && data.company.trim()) {
        data.company = data.company.trim();
      } else if (typeof data.company === "object" && data.company._id) {
        data.company = data.company._id;
      } else {
        data.company = null;
      }
    } else {
      data.company = null;
    }

    return Product.create(data);
  },
};
