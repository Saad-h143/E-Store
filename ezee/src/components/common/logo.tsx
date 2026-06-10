"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: { wrapper: "h-8 gap-2", icon: "h-7 w-7", text: "text-lg" },
    md: { wrapper: "h-9 gap-2.5", icon: "h-9 w-9", text: "text-xl" },
    lg: { wrapper: "h-12 gap-3", icon: "h-12 w-12", text: "text-2xl" },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center", s.wrapper, className)}>
      {/* Icon Mark — brand logo */}
      <div className={cn("relative overflow-hidden rounded-xl bg-white ring-1 ring-black/5 shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105", s.icon)}>
        <Image
          src="/logo-icon.png"
          alt="Ezee Parts logo"
          fill
          className="object-cover"
          sizes="48px"
          priority
        />
      </div>

      {/* Wordmark */}
      <span className={cn("font-bold tracking-tight text-foreground", s.text)}>
        <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Ezee
        </span>
        <span className="text-muted-foreground font-medium ml-0.5 text-[0.7em]">
          Store
        </span>
      </span>
    </div>
  );
}
