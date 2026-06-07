"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Testimonial } from "@/types";
import { SectionHeader } from "@/components/common/section-header";
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="rounded-2xl border bg-card p-6 relative h-full hover:bg-card/80 hover:backdrop-blur-xl hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <Quote aria-hidden="true" className="absolute top-4 right-4 h-8 w-8 text-primary/15 drop-shadow-sm" />
      <div className="flex items-center gap-3 mb-4">
        <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
          <Image
            src={testimonial.avatar}
            alt={testimonial.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
        <div>
          <p className="text-sm font-semibold">{testimonial.name}</p>
          <div
            className="flex gap-0.5"
            role="img"
            aria-label={`Rated ${testimonial.rating} out of 5 stars`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                aria-hidden="true"
                className={`h-3 w-3 ${
                  i < testimonial.rating
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "fill-muted text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
        {testimonial.comment}
      </p>
    </div>
  );
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      setSnaps(emblaApi.scrollSnapList());
      onSelect();
    });
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section>
      <SectionHeader
        title="What Our Customers Say"
        subtitle="Trusted by thousands of happy customers"
      />

      {/* Animated carousel — 1 card on mobile, 2 on tablet, 3 on desktop */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] pr-4 md:pr-6"
            >
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {snaps.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to review ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 cursor-pointer",
              selected === i
                ? "w-6 bg-gradient-to-r from-primary to-purple-600"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </section>
  );
}
