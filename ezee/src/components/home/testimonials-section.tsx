"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Testimonial } from "@/types";
import { SectionHeader } from "@/components/common/section-header";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section>
      <SectionHeader
        title="What Our Customers Say"
        subtitle="Trusted by thousands of happy customers"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="rounded-2xl border bg-card p-6 relative hover:bg-card/80 hover:backdrop-blur-xl hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
          >
            <Quote aria-hidden="true" className="absolute top-4 right-4 h-8 w-8 text-primary/15 drop-shadow-sm" />
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-10 w-10 rounded-full overflow-hidden">
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
                <div className="flex gap-0.5" role="img" aria-label={`Rated ${testimonial.rating} out of 5 stars`}>
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
          </motion.div>
        ))}
      </div>
    </section>
  );
}
