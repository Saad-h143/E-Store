"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  Shield,
  LogOut,
  Package,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { getCategories, getSubcategories } from "@/lib/supabase/queries";
import type { Category, Subcategory } from "@/types";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/logo";
import { useLanguageStore } from "@/store/language-store";
import { localeNames, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";

const FLAG_MAP: Record<string, string> = {
  en: "🇬🇧", pt: "🇵🇹", es: "🇪🇸", it: "🇮🇹", fr: "🇫🇷", de: "🇩🇪",
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<string, Subcategory[]>>({});
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const itemCount = useCartStore((s) => s.getItemCount());
  const { user, isAuthenticated, logout } = useAuthStore();
  const { locale, t, setLocale } = useLanguageStore();

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/shop", label: t.nav.shop },
    { href: "/contact", label: t.nav.contact },
  ];

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    getCategories().then((cats) => {
      setCategories(cats);
      getSubcategories().then((allSubs) => {
        const map: Record<string, Subcategory[]> = {};
        allSubs.forEach((sub) => {
          if (!map[sub.categoryId]) map[sub.categoryId] = [];
          map[sub.categoryId].push(sub);
        });
        setSubcategoriesMap(map);
      });
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <>
      {/* Skip to main content - accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg">
        Skip to main content
      </a>

      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
        className={cn(
          "fixed z-50 transition-all duration-500 ease-out",
          isScrolled
            ? "top-4 left-4 right-4 rounded-2xl bg-background/75 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-border/40 dark:bg-background/60 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] dark:border-white/[0.08]"
            : "top-0 left-0 right-0 bg-background border-b border-border/50"
        )}
      >
        {/* Animated gradient accent line */}
        <div className={cn(
          "absolute bottom-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary to-purple-500/0 transition-all duration-500",
          isScrolled ? "left-[5%] right-[5%] opacity-60" : "left-0 right-0 opacity-30"
        )} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6">

            {/* Logo */}
            <Link href="/" className="shrink-0 cursor-pointer group">
              <Logo size="md" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link, i) => (
                <React.Fragment key={link.href}>
                  {/* Categories dropdown inserted before Contact */}
                  {i === 2 && (
                    <DropdownMenu onOpenChange={(open) => { if (!open) setExpandedCat(null); }}>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2">
                          Categories
                          <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="center"
                        sideOffset={12}
                        className="w-72 p-2 rounded-xl border-border/50 shadow-xl shadow-black/10 dark:shadow-black/30 bg-background/95 backdrop-blur-xl"
                      >
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2">
                          Browse by Brand
                        </DropdownMenuLabel>
                        {categories.map((cat) => {
                          const subs = subcategoriesMap[cat.id] || [];
                          const isExpanded = expandedCat === cat.id;
                          return (
                          <DropdownMenuGroup key={cat.id}>
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center justify-between rounded-lg px-3 py-2.5 focus:bg-primary/10 focus:text-primary"
                              onSelect={(e) => {
                                if (subs.length > 0) {
                                  e.preventDefault();
                                  setExpandedCat(isExpanded ? null : cat.id);
                                } else {
                                  router.push(`/shop?category=${cat.slug}`);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 overflow-hidden shrink-0">
                                  {cat.image ? (
                                    <Image src={cat.image} alt={cat.name} width={28} height={28} className="object-cover w-full h-full" />
                                  ) : (
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                  )}
                                </div>
                                <span className="font-medium text-sm">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0 h-5 rounded-md">
                                  {cat.productCount}
                                </Badge>
                                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200", isExpanded && "rotate-90")} />
                              </div>
                            </DropdownMenuItem>
                            {subs.length > 0 && isExpanded && (
                              <div className="ml-9 mr-2 mb-1.5 pl-3 border-l-2 border-primary/10">
                                <DropdownMenuItem
                                  className="cursor-pointer text-foreground text-xs py-1.5 px-2 rounded-md font-medium hover:text-foreground focus:bg-primary/5 focus:text-primary"
                                  onSelect={() => router.push(`/shop?category=${cat.slug}`)}
                                >
                                  All {cat.name}
                                </DropdownMenuItem>
                                {subs.map((sub) => (
                                  <DropdownMenuItem
                                    key={sub.id}
                                    className="cursor-pointer text-muted-foreground text-xs py-1.5 px-2 rounded-md hover:text-foreground focus:bg-primary/5 focus:text-primary"
                                    onSelect={() => router.push(`/shop?category=${cat.slug}&subcategory=${sub.slug}`)}
                                  >
                                    {sub.name}
                                  </DropdownMenuItem>
                                ))}
                              </div>
                            )}
                          </DropdownMenuGroup>
                          );
                        })}
                        <DropdownMenuSeparator className="my-1.5" />
                        <DropdownMenuItem
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-primary focus:bg-primary/10"
                          onSelect={() => router.push("/shop")}
                        >
                          View All Products
                          <ChevronRight className="ml-auto h-3.5 w-3.5" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <Link
                    href={link.href}
                    className={cn(
                      "relative px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer",
                      pathname === link.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    {link.label}
                    {pathname === link.href && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/15"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                  </Link>
                </React.Fragment>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-0.5">
              {/* Search - desktop only */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex h-9 w-9 rounded-xl cursor-pointer hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-200"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Theme Toggle - always visible */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl cursor-pointer hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-200"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={theme}
                      initial={{ y: -12, opacity: 0, rotate: -90 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      exit={{ y: 12, opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              )}

              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl cursor-pointer hover:bg-accent/60 hidden md:flex">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px] rounded-xl p-1">
                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">Language</DropdownMenuLabel>
                  {(Object.keys(localeNames) as Locale[]).map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => setLocale(loc)}
                      className={cn("cursor-pointer rounded-lg gap-2 text-sm", locale === loc && "bg-primary/10 text-primary font-medium")}
                    >
                      <span className="text-base">{FLAG_MAP[loc]}</span>
                      {localeNames[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Separator - desktop only */}
              <div className="hidden md:block w-px h-6 bg-border/60 mx-1.5" />

              {/* Cart - desktop only */}
              <Link href="/cart" className="hidden md:block cursor-pointer">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl relative cursor-pointer hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-200"
                  aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-[10px] font-bold text-white shadow-md shadow-primary/30 ring-2 ring-background"
                    >
                      {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                  )}
                </Button>
              </Link>

              {/* User Menu - desktop only */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:inline-flex h-9 w-9 rounded-xl cursor-pointer hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary/50">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-white text-xs font-bold ring-2 ring-background shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={12} className="w-56 p-2 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30">
                    <div className="px-3 py-2.5 mb-1 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer rounded-lg">
                        <User className="mr-2 h-4 w-4" /> My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer rounded-lg">
                        <Package className="mr-2 h-4 w-4" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer rounded-lg">
                            <Shield className="mr-2 h-4 w-4" /> Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { logout(); router.push("/"); }} className="cursor-pointer text-destructive rounded-lg focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login" className="hidden md:block cursor-pointer ml-1">
                  <Button size="sm" className="h-9 px-5 rounded-xl text-xs font-semibold cursor-pointer bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]">
                    <User className="mr-1.5 h-3.5 w-3.5" /> Sign In
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Trigger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl cursor-pointer hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary/50 relative" aria-label="Open menu">
                    <Menu className="h-4 w-4" />
                    {/* Cart badge on hamburger for mobile */}
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-[9px] font-bold text-white ring-2 ring-background">
                        {itemCount > 9 ? "9+" : itemCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-background/98 backdrop-blur-2xl p-0 flex flex-col">
                  <SheetHeader className="p-6 pb-4 border-b border-border/50 shrink-0">
                    <SheetTitle>
                      <Logo size="sm" />
                    </SheetTitle>
                  </SheetHeader>

                  {/* User info at top of mobile menu */}
                  {isAuthenticated && user && (
                    <div className="px-5 py-4 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-bold shadow-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                    {/* Search inside mobile menu */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = (e.target as HTMLFormElement).search.value;
                        if (val.trim()) {
                          window.location.href = `/shop?search=${encodeURIComponent(val.trim())}`;
                          setMobileOpen(false);
                        }
                      }}
                      className="relative mb-3"
                    >
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="search"
                        placeholder="Search products..."
                        className="pl-10 h-11 rounded-xl bg-accent/40 border-border/40"
                      />
                    </form>

                    {/* Cart link in mobile menu */}
                    <Link
                      href="/cart"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer flex items-center justify-between",
                        pathname === "/cart"
                          ? "bg-gradient-to-r from-primary/15 to-purple-600/10 text-primary"
                          : "text-muted-foreground hover:bg-accent/80 hover:text-foreground active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingCart className="h-4 w-4" />
                        Cart
                      </div>
                      {itemCount > 0 && (
                        <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] px-2 py-0 h-5 rounded-full border-0">
                          {itemCount}
                        </Badge>
                      )}
                    </Link>

                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer flex items-center",
                          pathname === link.href
                            ? "bg-gradient-to-r from-primary/15 to-purple-600/10 text-primary"
                            : "text-muted-foreground hover:bg-accent/80 hover:text-foreground active:scale-[0.98]"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}

                    <div className="mt-4 mb-2 px-4 flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>

                    {categories.map((cat) => {
                      const subs = subcategoriesMap[cat.id] || [];
                      const isExpanded = expandedCat === cat.id;
                      return (
                      <div key={cat.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (subs.length > 0) {
                              setExpandedCat(isExpanded ? null : cat.id);
                            } else {
                              router.push(`/shop?category=${cat.slug}`);
                              setMobileOpen(false);
                            }
                          }}
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground/80 hover:bg-accent/80 hover:text-foreground transition-all duration-200 cursor-pointer flex items-center justify-between active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 overflow-hidden shrink-0">
                              {cat.image ? (
                                <Image src={cat.image} alt={cat.name} width={24} height={24} className="object-cover w-full h-full" />
                              ) : (
                                <Sparkles className="h-3 w-3 text-primary" />
                              )}
                            </div>
                            {cat.name}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 rounded-md">
                              {cat.productCount}
                            </Badge>
                            {subs.length > 0 && (
                              <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200", isExpanded && "rotate-90")} />
                            )}
                          </div>
                        </button>
                        <AnimatePresence>
                          {subs.length > 0 && isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <Link
                                href={`/shop?category=${cat.slug}`}
                                onClick={() => setMobileOpen(false)}
                                className="ml-11 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-accent/60 transition-all duration-200 cursor-pointer block"
                              >
                                All {cat.name}
                              </Link>
                              {subs.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/shop?category=${cat.slug}&subcategory=${sub.slug}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="ml-11 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all duration-200 cursor-pointer block"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      );
                    })}

                    {isAdmin && (
                      <>
                        <div className="mt-4 mb-2 px-4 flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</span>
                          <div className="flex-1 h-px bg-border/50" />
                        </div>
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-all duration-200 cursor-pointer flex items-center gap-2.5 active:scale-[0.98]"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 text-orange-600">
                            <Shield className="h-3 w-3" />
                          </div>
                          Admin Panel
                        </Link>
                      </>
                    )}
                  </nav>

                  {/* Language Switcher - Mobile */}
                  <div className="shrink-0 border-t border-border/50 px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(Object.keys(localeNames) as Locale[]).map((loc) => (
                        <button
                          key={loc}
                          onClick={() => setLocale(loc)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                            locale === loc
                              ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                              : "text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {FLAG_MAP[loc]} {localeNames[loc].slice(0, 2).toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bottom action - Sign In / Account / Logout */}
                  <div className="shrink-0 border-t border-border/50 p-4">
                    {isAuthenticated && user ? (
                      <div className="flex gap-2">
                        <Link href="/account" onClick={() => setMobileOpen(false)} className="flex-1">
                          <Button variant="outline" className="w-full h-11 rounded-xl text-sm font-medium cursor-pointer">
                            <User className="mr-2 h-4 w-4" /> Account
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="h-11 rounded-xl text-sm font-medium cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => { logout(); setMobileOpen(false); router.push("/"); }}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full h-11 rounded-xl text-sm font-semibold cursor-pointer bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-md shadow-primary/20">
                          <User className="mr-2 h-4 w-4" /> Sign In
                        </Button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border/30"
            >
              <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = (e.target as HTMLFormElement).search.value;
                    if (val.trim()) {
                      window.location.href = `/shop?search=${encodeURIComponent(val.trim())}`;
                      setSearchOpen(false);
                    }
                  }}
                  className="relative"
                >
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="search"
                    placeholder="Search phones, brands, models..."
                    className="pl-10 pr-10 h-11 rounded-xl bg-accent/40 border-border/40 focus:border-primary/40 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg cursor-pointer hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/50"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16" />
    </>
  );
}
