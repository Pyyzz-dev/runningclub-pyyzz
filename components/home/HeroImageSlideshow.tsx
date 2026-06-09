"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

const SLIDE_INTERVAL_MS = 2000;
const FADE_DURATION = 0.8;
const FALLBACK_IMAGE = "/running-hero.svg";

interface HeroImageSlideshowProps {
  images: string[];
}

function SlideshowPlaceholder() {
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
      <span className="text-6xl" aria-hidden>
        🏃‍♂️
      </span>
    </div>
  );
}

function SlideshowSkeleton() {
  return <div className="aspect-video w-full animate-pulse rounded-2xl bg-gray-200 shadow-xl" />;
}

function HeroSlideImage({
  src,
  alt,
  priority,
  onError,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  onError: () => void;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover"
      onError={onError}
    />
  );
}

export function HeroImageSlideshow({ images }: HeroImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [useFallback, setUseFallback] = useState(false);
  const [mounted, setMounted] = useState(false);

  const slideshowImages = useMemo(() => {
    if (useFallback) return [FALLBACK_IMAGE];
    const valid = images.filter((url) => !failedUrls.has(url));
    if (valid.length > 0) return valid;
    if (images.length > 0) return [FALLBACK_IMAGE];
    return [];
  }, [images, failedUrls, useFallback]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setFailedUrls(new Set());
    setUseFallback(false);
  }, [images]);

  useEffect(() => {
    if (slideshowImages.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideshowImages.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [slideshowImages.length]);

  const handleImageError = useCallback((url: string) => {
    if (url === FALLBACK_IMAGE) {
      setUseFallback(false);
      return;
    }

    setFailedUrls((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
    setCurrentIndex(0);
  }, []);

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl shadow-xl">
        <SlideshowSkeleton />
      </div>
    );
  }

  if (slideshowImages.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl shadow-xl">
        <SlideshowPlaceholder />
      </div>
    );
  }

  if (slideshowImages.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl shadow-xl">
        <div className="relative aspect-video w-full">
          <HeroSlideImage
            src={slideshowImages[0]}
            alt="CLB Chạy bộ CMC Global"
            priority
            onError={() => {
              if (slideshowImages[0] === FALLBACK_IMAGE) return;
              setUseFallback(true);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl shadow-xl">
      <div className="relative aspect-video w-full">
        <AnimatePresence initial={false}>
          <motion.div
            key={`${currentIndex}-${slideshowImages[currentIndex]}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_DURATION, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <HeroSlideImage
              src={slideshowImages[currentIndex]}
              alt={`Ảnh hero ${currentIndex + 1}`}
              priority={currentIndex === 0}
              onError={() => handleImageError(slideshowImages[currentIndex])}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
          {slideshowImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Xem ảnh ${idx + 1}`}
              aria-current={idx === currentIndex ? "true" : undefined}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? "w-4 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
