"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, AlertCircle, Globe } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/en";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Language toggle */}
      <button
        onClick={() => setLocale(locale === "en" ? "ar" : "en")}
        className="absolute top-5 right-5 z-20 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted hover:text-foreground hover:border-primary/30 transition-all"
      >
        <Globe className="h-4 w-4" />
        {locale === "en" ? "العربية" : "English"}
      </button>

      {/* Background gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-400 text-white mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t("admin.login.title" as TranslationKey)}</h1>
          <p className="text-sm text-muted mt-1">
            {t("admin.login.subtitle" as TranslationKey)}
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20"
        >
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 mb-5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="email"
                placeholder={t("admin.login.emailPlaceholder" as TranslationKey)}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="password"
                placeholder={t("admin.login.passwordPlaceholder" as TranslationKey)}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-primary to-purple-500 text-white py-3 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
          >
            {loading ? t("admin.login.signingIn" as TranslationKey) : t("admin.login.signIn" as TranslationKey)}
          </button>
        </form>

        <p className="text-center text-[11px] text-muted mt-6">
          {t("admin.login.defaultHint" as TranslationKey)}
        </p>
      </div>
    </div>
  );
}
