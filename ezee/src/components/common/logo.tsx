"use client";

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
      {/* Icon Mark */}
      <div className={cn("relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary via-purple-500 to-purple-600 shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105", s.icon)}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[60%] w-[60%]"
        >
          {/* Shopping bag outline */}
          <path
            d="M10 14L12 6H28L30 14V32C30 33.1 29.1 34 28 34H12C10.9 34 10 33.1 10 32V14Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="white"
            fillOpacity="0.15"
          />
          {/* Bag handle */}
          <path
            d="M16 14V10C16 7.79 17.79 6 20 6C22.21 6 24 7.79 24 10V14"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* "E" letter inside the bag */}
          <path
            d="M16 20H24M16 24H22M16 28H24M16 20V28"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
