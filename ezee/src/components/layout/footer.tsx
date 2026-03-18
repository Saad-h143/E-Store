"use client";

import Link from "next/link";
import { Smartphone, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const footerLinks = {
  shop: [
    { label: "All Phones", href: "/shop" },
    { label: "New Arrivals", href: "/shop?sort=newest" },
    { label: "Best Sellers", href: "/shop?sort=best-selling" },
    { label: "Deals & Offers", href: "/shop?deals=true" },
  ],
  brands: [
    { label: "Apple", href: "/shop?category=apple" },
    { label: "Samsung", href: "/shop?category=samsung" },
    { label: "Google", href: "/shop?category=google" },
    { label: "OnePlus", href: "/shop?category=oneplus" },
  ],
  support: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "#" },
    { label: "Shipping Info", href: "#" },
    { label: "Return Policy", href: "#" },
  ],
  company: [
    { label: "About Ezee", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-card relative">
      {/* Gradient accent line at top */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary to-purple-600/50" />

      {/* Newsletter Section */}
      <div className="bg-gradient-to-br from-primary/5 via-purple-600/5 to-primary/5 backdrop-blur-sm border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Stay in the loop</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Subscribe to get exclusive deals, new arrivals and insider-only discounts.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Subscribed successfully! Check your email for confirmation.");
                (e.target as HTMLFormElement).reset();
              }}
              className="flex flex-col sm:flex-row w-full max-w-md gap-2"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                required
                className="h-11 rounded-xl flex-1 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/30"
              />
              <Button type="submit" className="h-11 rounded-xl px-6 cursor-pointer bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md shadow-primary/20">
                <Send className="h-4 w-4 mr-2" /> Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 cursor-pointer group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-md shadow-primary/25 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow duration-300">
                <Smartphone className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">Ezee</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Your trusted destination for premium smartphones at the best prices.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>123 Tech Street, Mumbai</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>support@ezee.com</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 capitalize text-foreground/80">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Ezee. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-all duration-200 hover:scale-110"
              >
                <social.icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
