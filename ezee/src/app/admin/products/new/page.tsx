"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { toast } from "sonner";

function NewProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const editProduct = editId ? products.find((p) => p.id === editId) : null;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: editProduct?.title || "",
    description: editProduct?.description || "",
    price: editProduct?.price?.toString() || "",
    discount: editProduct?.discount?.toString() || "0",
    discountType: editProduct?.discountType || "percentage",
    stock: editProduct?.stock?.toString() || "",
    categoryId: editProduct?.categoryId || "",
    active: editProduct?.active ?? true,
    featured: editProduct?.featured || false,
    bestSeller: editProduct?.bestSeller || false,
    newArrival: editProduct?.newArrival || false,
    imageUrl: editProduct?.images[0] || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast.success(editId ? "Product updated successfully!" : "Product created successfully!");
    router.push("/admin/products");
  };

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {editId ? "Edit Product" : "New Product"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {editId ? "Update product details" : "Add a new product to your store"}
          </p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic Info */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g., iPhone 15 Pro Max"
              className="h-11 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Product description..."
              rows={4}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={form.categoryId} onValueChange={(v) => updateField("categoryId", v)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={form.imageUrl}
              onChange={(e) => updateField("imageUrl", e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Pricing & Stock</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (INR) *</Label>
              <Input
                id="price"
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="0"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                value={form.stock}
                onChange={(e) => updateField("stock", e.target.value)}
                placeholder="0"
                className="h-11 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
                type="number"
                value={form.discount}
                onChange={(e) => updateField("discount", e.target.value)}
                placeholder="0"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) => updateField("discountType", v)}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (INR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Visibility & Tags</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Product is visible to customers</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => updateField("active", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Featured</Label>
                <p className="text-xs text-muted-foreground">Show on homepage featured section</p>
              </div>
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => updateField("featured", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Best Seller</Label>
                <p className="text-xs text-muted-foreground">Mark as best selling product</p>
              </div>
              <Switch
                checked={form.bestSeller}
                onCheckedChange={(v) => updateField("bestSeller", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>New Arrival</Label>
                <p className="text-xs text-muted-foreground">Show in new arrivals section</p>
              </div>
              <Switch
                checked={form.newArrival}
                onCheckedChange={(v) => updateField("newArrival", v)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/admin/products">
            <Button variant="outline" className="rounded-xl">
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="rounded-xl min-w-[140px]" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editId ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
      <NewProductContent />
    </Suspense>
  );
}
