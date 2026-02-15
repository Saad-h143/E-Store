"use client";

import { motion } from "framer-motion";
import { Truck, Shield, RotateCcw, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹25,000",
  },
  {
    icon: Shield,
    title: "Genuine Products",
    description: "100% authentic warranty",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "7-day return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated assistance",
  },
];

export function FeaturesStrip() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 md:p-5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <feature.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{feature.title}</p>
            <p className="text-xs text-muted-foreground">{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
