"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BannerSlide } from "@/types";
import { cn } from "@/lib/utils";

interface BannerCarouselProps {
  slides: BannerSlide[];
}

export function BannerCarousel({ slides }: BannerCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative group">
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((slide, index) => (
            <div key={slide.id} className="embla__slide min-w-0 flex-[0_0_100%]">
              <div
                className={cn(
                  "relative h-[400px] sm:h-[480px] md:h-[540px] lg:h-[600px] overflow-hidden bg-gradient-to-br",
                  slide.gradient
                )}
              >
                {/* Background Image */}
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover opacity-30 mix-blend-luminosity"
                  priority={index === 0}
                  sizes="100vw"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-purple-900/30 to-blue-900/20" />

                {/* Content */}
                <div className="relative h-full flex items-center">
                  <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 w-full">
                    <AnimatePresence mode="wait">
                      {selectedIndex === index && (
                        <motion.div
                          key={slide.id}
                          initial={{ opacity: 0, x: -40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                          transition={{ duration: 0.3 }}
                          className="max-w-xl"
                        >
                          <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            className="inline-block text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-white/70 mb-3"
                          >
                            {slide.subtitle}
                          </motion.span>

                          <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                          >
                            {slide.title}
                          </motion.h2>

                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45, duration: 0.3 }}
                            className="mt-4 text-sm sm:text-base text-white/80 leading-relaxed max-w-md"
                          >
                            {slide.description}
                          </motion.p>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.3 }}
                            className="mt-6 sm:mt-8"
                          >
                            <Link href={slide.ctaLink}>
                              <Button
                                size="lg"
                                className="rounded-xl text-sm font-semibold h-12 px-8 bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 shadow-2xl"
                              >
                                {slide.ctaText}
                              </Button>
                            </Link>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/25 opacity-70 hover:opacity-100 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/50"
        onClick={scrollPrev}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/25 opacity-70 hover:opacity-100 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/50"
        onClick={scrollNext}
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/20 backdrop-blur-xl rounded-full px-3 py-2 border border-white/10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={cn(
              "h-2 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/50",
              selectedIndex === index
                ? "w-8 bg-white"
                : "w-2 bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </section>
  );
}
