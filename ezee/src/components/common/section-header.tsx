"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
}

export function SectionHeader({ title, subtitle, href, linkText = "View All" }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex items-end justify-between mb-8"
    >
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-purple-500 mt-3" />
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link href={href}>
          <Button variant="ghost" className="text-sm font-medium group hover:text-primary focus-visible:ring-2">
            {linkText}
            <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4 transition-all duration-300 group-hover:translate-x-1.5" />
          </Button>
        </Link>
      )}
    </motion.div>
  );
}
