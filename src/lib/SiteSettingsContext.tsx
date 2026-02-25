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

interface SiteSettings {
  websiteName: string;
  whatsappNumber: string;
  priceRangeFilters: PriceRangeFilter[];
  heroProduct: string | null;
}

interface SiteSettingsContextValue extends SiteSettings {
  loading: boolean;
  refresh: () => void;
}

const defaultSettings: SiteSettings = {
  websiteName: "QuesnaShop",
  whatsappNumber: "+201025571092",
  priceRangeFilters: [],
  heroProduct: null,
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
            whatsappNumber: data.whatsappNumber || defaultSettings.whatsappNumber,
            priceRangeFilters: Array.isArray(data.priceRangeFilters)
              ? data.priceRangeFilters
              : defaultSettings.priceRangeFilters,
            heroProduct: data.heroProduct || null,
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
