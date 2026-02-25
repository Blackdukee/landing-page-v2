"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  /** Overlay content rendered on top of the active image (e.g. badges) */
  children?: React.ReactNode;
}

export default function ImageCarousel({ images, alt, children }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(
    () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1)),
    [images.length]
  );
  const next = useCallback(
    () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1)),
    [images.length]
  );

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface border border-border group">
        <Image
          src={images[current]}
          alt={`${alt} — ${current + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={current === 0}
        />

        {/* Overlay children (badges etc.) */}
        {children}

        {/* Prev / Next arrows — only when more than 1 image */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute start-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full glass-strong text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute end-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full glass-strong text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === current
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip — only when more than 1 image */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                idx === current
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${alt} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
