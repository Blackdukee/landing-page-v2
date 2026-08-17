"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface PriceRangeFilter {
  label: string;
  labelAr: string;
  min: number;
  max: number | null;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter: string;
  email: string;
}

export interface IDailyOfferItem {
  _id?: string;
  productId: string;
  discountPercentage: number;
  expiresAt?: string | null;
  active: boolean;
  product?: {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    category: string;
  };
}

interface SiteSettings {
  websiteName: string;
  favicon: string;
  location: string;
  whatsappNumber: string;
  freeDeliveryMinPrice: number;
  shippingCost: number;
  returnDays: number;
  priceRangeFilters: PriceRangeFilter[];
  heroProduct: string | null;
  socialLinks: SocialLinks;
  dailyOffers: IDailyOfferItem[];
}

interface SiteSettingsContextValue extends SiteSettings {
  loading: boolean;
  refresh: () => void;
}

const defaultSocialLinks: SocialLinks = { facebook: "", twitter: "", email: "" };

const defaultSettings: SiteSettings = {
  websiteName: "M L N TOOLS",
  favicon: "/favicon.png",
  location: "قويسنا، المنوفية، مصر",
  whatsappNumber: "+201203441866",
  freeDeliveryMinPrice: 99,
  shippingCost: 9.99,
  returnDays: 30,
  priceRangeFilters: [],
  heroProduct: null,
  socialLinks: defaultSocialLinks,
  dailyOffers: [],
};

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  ...defaultSettings,
  loading: true,
  refresh: () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.websiteName) {
          setSettings({
            websiteName: data.websiteName,
            favicon: data.favicon || "/favicon.png",
            location: typeof data.location === "string" ? data.location : defaultSettings.location,
            whatsappNumber: data.whatsappNumber || defaultSettings.whatsappNumber,
            freeDeliveryMinPrice: typeof data.freeDeliveryMinPrice === "number" ? data.freeDeliveryMinPrice : defaultSettings.freeDeliveryMinPrice,
            shippingCost: typeof data.shippingCost === "number" ? data.shippingCost : defaultSettings.shippingCost,
            returnDays: typeof data.returnDays === "number" ? data.returnDays : defaultSettings.returnDays,
            priceRangeFilters: Array.isArray(data.priceRangeFilters)
              ? data.priceRangeFilters
              : defaultSettings.priceRangeFilters,
            heroProduct: data.heroProduct || null,
            socialLinks: data.socialLinks
              ? {
                  facebook: data.socialLinks.facebook || data.socialLinks.instagram || "",
                  twitter: data.socialLinks.twitter || "",
                  email: data.socialLinks.email || "",
                }
              : defaultSocialLinks,
            dailyOffers: Array.isArray(data.dailyOffers)
              ? data.dailyOffers.map((item: any) => {
                  const isPopulated = typeof item.productId === "object" && item.productId !== null;
                  const prodObj = isPopulated ? item.productId : item.product;
                  return {
                    _id: item._id ? String(item._id) : undefined,
                    productId: isPopulated ? String(item.productId._id) : String(item.productId || ""),
                    discountPercentage: typeof item.discountPercentage === "number" ? item.discountPercentage : 0,
                    expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : null,
                    active: typeof item.active === "boolean" ? item.active : true,
                    product: prodObj && prodObj._id ? {
                      _id: String(prodObj._id),
                      name: String(prodObj.name || ""),
                      description: String(prodObj.description || ""),
                      price: typeof prodObj.price === "number" ? prodObj.price : 0,
                      image: String(prodObj.image || ""),
                      stock: typeof prodObj.stock === "number" ? prodObj.stock : 0,
                      category: String(prodObj.category || ""),
                    } : undefined,
                  };
                })
              : defaultSettings.dailyOffers,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SiteSettingsContext.Provider
      value={{ ...settings, loading, refresh: fetchSettings }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
