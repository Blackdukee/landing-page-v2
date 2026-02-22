"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Star,
  ChevronRight,
  Sparkles,
  Zap,
  Package,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  featured: boolean;
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?featured=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFeatured(data.slice(0, 4));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left - Text content */}
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-medium text-primary-light mb-8">
                <Sparkles className="h-3.5 w-3.5" />
                New Collection 2025
              </span>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6">
                Experience
                <br />
                <span className="gradient-text">modern</span> shopping
                <br />
                today
              </h1>

              <p className="text-lg text-muted max-w-lg leading-relaxed mb-10">
                Discover premium products across every category. From tech to
                fashion, find everything you need in one place with unbeatable
                quality and fast delivery.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 px-8 py-4 text-sm font-semibold text-white transition-all hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore Collection
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#featured"
                  className="inline-flex items-center gap-2 rounded-full glass px-8 py-4 text-sm font-medium text-foreground transition-all hover:bg-glass-border"
                >
                  See Featured
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-8 mt-14 pt-8 border-t border-border">
                {[
                  { icon: Truck, text: "Free Delivery", sub: "On orders $99+" },
                  { icon: ShieldCheck, text: "Easy Returns", sub: "30-day policy" },
                  { icon: Headphones, text: "24/7 Support", sub: "Always here" },
                ].map(({ icon: Icon, text, sub }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{text}</p>
                      <p className="text-[11px] text-muted">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Featured product showcase */}
            <div className="relative hidden lg:flex items-center justify-center">
              {/* Large floating card */}
              <div className="relative w-[380px] h-[480px] rounded-3xl overflow-hidden border border-glass-border shadow-2xl shadow-primary/10 rotate-3 hover:rotate-0 transition-transform duration-700">
                <Image
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=800&fit=crop"
                  alt="Featured product"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="inline-block rounded-full bg-primary/80 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold text-white mb-3">
                    TRENDING NOW
                  </span>
                  <h3 className="text-xl font-bold text-white mb-1">Best Sellers</h3>
                  <p className="text-sm text-white/70">Shop our top rated items</p>
                </div>
              </div>

              {/* Floating stats card */}
              <div className="absolute -bottom-4 -left-8 glass-strong rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 text-green-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Free Delivery</p>
                    <p className="text-[11px] text-muted">On your first order</p>
                  </div>
                </div>
              </div>

              {/* Star rating card */}
              <div className="absolute -top-2 -right-4 glass-strong rounded-2xl p-3 px-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-foreground">4.9</span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">2k+ Reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="text-[10px] uppercase tracking-widest text-muted">
              Scroll
            </span>
            <div className="h-8 w-px bg-gradient-to-b from-primary/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* ───────────── FEATURED ───────────── */}
      <section id="featured" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
                Handpicked
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Featured Products
              </h2>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              View all
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-surface animate-pulse aspect-[3/4]"
                />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p) => (
                <ProductCard
                  key={p._id}
                  id={p._id}
                  name={p.name}
                  description={p.description}
                  price={p.price}
                  image={p.image}
                  category={p.category}
                  stock={p.stock}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted mb-4">
                No products yet. Seed the database to get started.
              </p>
              <SeedButton />
            </div>
          )}
        </div>
      </section>

      {/* ───────────── VALUES / FEATURES ───────────── */}
      <section className="py-24 border-y border-border bg-surface/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Why Choose <span className="gradient-text">NovaShop</span>?
            </h2>
            <p className="text-muted max-w-2xl mx-auto text-sm leading-relaxed">
              We&apos;re committed to providing you with the best shopping experience.
              Here&apos;s what sets us apart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Star,
                title: "Premium Quality",
                desc: "Every product is carefully vetted to ensure it meets our high standards of quality and durability.",
              },
              {
                icon: Package,
                title: "Fast Shipping",
                desc: "Get your orders delivered quickly with our efficient shipping network. Free shipping on orders over $99.",
              },
              {
                icon: ShieldCheck,
                title: "Secure Shopping",
                desc: "Shop with confidence. Easy returns, buyer protection, and 24/7 customer support for peace of mind.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group relative rounded-2xl glass p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-foreground">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA BANNER ───────────── */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1400&h=600&fit=crop"
              alt="Shopping"
              width={1400}
              height={600}
              className="w-full h-64 sm:h-80 lg:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent flex items-center">
              <div className="px-8 sm:px-14 max-w-lg">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
                  Start your
                  <br />
                  <span className="gradient-text">shopping journey</span> today
                </h2>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  Browse our full catalog and discover something amazing.
                  Free shipping on orders over $99.
                </p>
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SeedButton() {
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const seed = async () => {
    setSeeding(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      setDone(true);
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  if (done) return <p className="text-success text-sm">Database seeded! Refreshing...</p>;

  return (
    <button
      onClick={seed}
      disabled={seeding}
      className="rounded-full bg-gradient-to-r from-primary to-purple-500 text-white px-6 py-2.5 text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50"
    >
      {seeding ? "Seeding..." : "Seed Sample Products"}
    </button>
  );
}
