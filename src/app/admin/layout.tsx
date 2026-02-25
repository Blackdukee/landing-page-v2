"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Globe,
} from "lucide-react";
import { LanguageProvider, useTranslation } from "@/i18n/LanguageContext";
import { SiteSettingsProvider } from "@/lib/SiteSettingsContext";
import type { TranslationKey } from "@/i18n/en";

interface AdminUser {
  email: string;
  role: string;
}

function AdminLanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-card-hover hover:text-foreground transition-all"
    >
      <Globe className="h-4 w-4" />
      {locale === "en" ? "العربية" : "English"}
    </button>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, dir } = useTranslation();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;

    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-sm text-muted">{t("admin.loading" as TranslationKey)}</div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t("admin.nav.dashboard" as TranslationKey) },
    { href: "/admin/products", icon: Package, label: t("admin.nav.products" as TranslationKey) },
    { href: "/admin/orders", icon: ClipboardList, label: t("admin.nav.orders" as TranslationKey) },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 ${dir === "rtl" ? "right-0" : "left-0"} z-50 h-full w-64 bg-surface border-${dir === "rtl" ? "l" : "r"} border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : dir === "rtl" ? "translate-x-full" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-400 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold block leading-tight text-foreground">
                {t("admin.brandName" as TranslationKey)}
              </span>
              <span className="text-[10px] text-primary-light uppercase tracking-wider">
                {t("admin.admin" as TranslationKey)}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive(href)
                  ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-md shadow-primary/20"
                  : "text-muted hover:bg-card-hover hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-border">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-card-hover hover:text-foreground transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              {t("admin.nav.viewStore" as TranslationKey)}
            </Link>
            <AdminLanguageSwitcher />
          </div>
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-foreground">{user.email}</p>
              <p className="text-[10px] text-muted capitalize">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted hover:text-danger transition-colors"
              title={t("admin.signOut" as TranslationKey)}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={dir === "rtl" ? "lg:pr-64" : "lg:pl-64"}>
        {/* Top bar - mobile */}
        <div className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-surface/80 backdrop-blur-xl px-6 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">{t("admin.brandName" as TranslationKey)} {t("admin.admin" as TranslationKey)}</span>
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <SiteSettingsProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </SiteSettingsProvider>
    </LanguageProvider>
  );
}
