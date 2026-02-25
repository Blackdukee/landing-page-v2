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
  instagram: string;
  twitter: string;
  email: string;
}

interface SiteSettings {
  websiteName: string;
  favicon: string;
  whatsappNumber: string;
  freeDeliveryMinPrice: number;
  returnDays: number;
  priceRangeFilters: PriceRangeFilter[];
  heroProduct: string | null;
  socialLinks: SocialLinks;
}

interface SiteSettingsContextValue extends SiteSettings {
  loading: boolean;
  refresh: () => void;
}

const defaultSocialLinks: SocialLinks = { instagram: "", twitter: "", email: "" };

const defaultSettings: SiteSettings = {
  websiteName: "QuesnaShop",
  favicon: "",
  whatsappNumber: "+201025571092",
  freeDeliveryMinPrice: 99,
  returnDays: 30,
  priceRangeFilters: [],
  heroProduct: null,
  socialLinks: defaultSocialLinks,
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
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.websiteName) {
          setSettings({
            websiteName: data.websiteName,
            favicon: data.favicon || "",
            whatsappNumber: data.whatsappNumber || defaultSettings.whatsappNumber,
            freeDeliveryMinPrice: typeof data.freeDeliveryMinPrice === "number" ? data.freeDeliveryMinPrice : defaultSettings.freeDeliveryMinPrice,
            returnDays: typeof data.returnDays === "number" ? data.returnDays : defaultSettings.returnDays,
            priceRangeFilters: Array.isArray(data.priceRangeFilters)
              ? data.priceRangeFilters
              : defaultSettings.priceRangeFilters,
            heroProduct: data.heroProduct || null,
            socialLinks: data.socialLinks
              ? {
                  instagram: data.socialLinks.instagram || "",
                  twitter: data.socialLinks.twitter || "",
                  email: data.socialLinks.email || "",
                }
              : defaultSocialLinks,
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
