"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Image as ImageIcon,
  FolderTree,
  Smartphone,
  ChevronLeft,
  Menu,
  LogOut,
  Moon,
  Sun,
  Home,
  Users,
  BarChart3,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { t } = useLanguageStore();

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t.admin.dashboard },
    { href: "/admin/products", icon: Package, label: t.admin.products },
    { href: "/admin/orders", icon: ShoppingCart, label: t.admin.orders },
    { href: "/admin/categories", icon: FolderTree, label: t.admin.categories },
    { href: "/admin/banners", icon: ImageIcon, label: t.admin.banners },
    { href: "/admin/users", icon: Users, label: t.admin.users },
    { href: "/admin/sales", icon: BarChart3, label: "Sales History" },
  ];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If not authenticated as admin, redirect
  if (!isAuthenticated || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t.admin.accessDenied}</h1>
          <p className="text-muted-foreground mb-4">
            {t.admin.adminRequired}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login">
              <Button>{t.admin.loginAsAdmin}</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">{t.admin.goHome}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center">
          <Smartphone className="h-4 w-4" />
        </div>
        <span className="font-bold text-lg">{t.admin.title}</span>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-gradient-to-r from-primary to-purple-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-1">
        <Separator className="mb-3" />
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Home className="h-4 w-4" />
          {t.admin.viewStore}
        </Link>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t.admin.logout}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col border-r bg-card/80 backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 border-b bg-card/80 backdrop-blur-xl px-4 h-14">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <span className="font-semibold text-sm">{t.admin.title}</span>

        <div className="ml-auto flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="hidden lg:flex items-center justify-between border-b bg-card/80 backdrop-blur-xl px-6 h-14">
          <div />
          <div className="flex items-center gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white ring-2 ring-primary/20 flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
