"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Upload, X, ImageIcon, Plus, Trash2 } from "lucide-react";
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
import {
  getCategories,
  getSubcategories,
  getProductById,
  createProduct,
  updateProduct,
  uploadImage,
} from "@/lib/supabase/queries";
import { toast } from "sonner";
import type { Category, Subcategory, Product } from "@/types";

function NewProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!editId);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    discount: "0",
    discountType: "percentage",
    stock: "",
    categoryId: "",
    subcategoryId: "",
    active: true,
    featured: false,
    bestSeller: false,
    newArrival: false,
  });

  useEffect(() => {
    async function load() {
      const cats = await getCategories();
      setCategories(cats);

      if (editId) {
        const product = await getProductById(editId);
        if (product) {
          setForm({
            title: product.title,
            description: product.description,
            price: product.price.toString(),
            discount: product.discount.toString(),
            discountType: product.discountType,
            stock: product.stock.toString(),
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId || "",
            active: product.active,
            featured: product.featured,
            bestSeller: product.bestSeller,
            newArrival: product.newArrival,
          });
          setImages(product.images || []);
          if (product.specs && Object.keys(product.specs).length > 0) {
            setSpecs(Object.entries(product.specs).map(([key, value]) => ({ key, value })));
          }
        }
      }
      setPageLoading(false);
    }
    load();
  }, [editId]);

  // Load subcategories when categoryId changes
  useEffect(() => {
    if (form.categoryId) {
      getSubcategories(form.categoryId).then(setSubcategories);
    } else {
      setSubcategories([]);
    }
  }, [form.categoryId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadImage(file, "products");
        uploaded.push(url);
      }
      setImages((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded!`);
    } catch (err) {
      console.error("[Product image upload]", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const productData = {
        title: form.title,
        slug,
        description: form.description,
        price: Number(form.price),
        discount: Number(form.discount),
        discountType: form.discountType,
        stock: Number(form.stock),
        active: form.active,
        images,
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || undefined,
        featured: form.featured,
        bestSeller: form.bestSeller,
        newArrival: form.newArrival,
        specs: Object.fromEntries(
          specs
            .filter((s) => s.key.trim() && s.value.trim())
            .map((s) => [s.key.trim(), s.value.trim()])
        ),
      };

      const savePromise = editId
        ? updateProduct(editId, productData)
        : createProduct(productData);

      // Navigate immediately for fast UX
      router.push("/admin/products");

      toast.promise(savePromise, {
        loading: editId ? "Updating product..." : "Creating product...",
        success: editId ? "Product updated!" : "Product created!",
        error: "Failed to save product",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Operation failed";
      toast.error(message);
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-6 space-y-4">
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
            <Select value={form.categoryId} onValueChange={(v) => { updateField("categoryId", v); updateField("subcategoryId", ""); }}>
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

          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select value={form.subcategoryId} onValueChange={(v) => updateField("subcategoryId", v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select subcategory (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Images */}
        <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-6 space-y-4">
          <h2 className="font-semibold">Product Images</h2>

          {/* Image Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border group">
                  <Image src={img} alt="" fill className="object-cover" sizes="150px" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl w-full h-20 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Upload className="h-5 w-5 mr-2" />
              )}
              {uploadingImage ? "Uploading..." : "Upload Images"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1.5">
              JPG, PNG or WebP. Max 5MB each. First image will be the main image.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-6 space-y-4">
          <h2 className="font-semibold">Pricing & Stock</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (EUR) *</Label>
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
              <Select value={form.discountType} onValueChange={(v) => updateField("discountType", v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Specifications</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Add product specs like RAM, Camera, Battery, etc.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setSpecs((prev) => [...prev, { key: "", value: "" }])}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Spec
            </Button>
          </div>

          {specs.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-xl">
              <p className="text-sm">No specifications added yet</p>
              <p className="text-xs mt-1">Click &quot;Add Spec&quot; to add product specifications</p>
            </div>
          )}

          {specs.map((spec, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="e.g., RAM"
                  value={spec.key}
                  onChange={(e) => {
                    const updated = [...specs];
                    updated[index] = { ...updated[index], key: e.target.value };
                    setSpecs(updated);
                  }}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="flex-[2]">
                <Input
                  placeholder="e.g., 12GB"
                  value={spec.value}
                  onChange={(e) => {
                    const updated = [...specs];
                    updated[index] = { ...updated[index], value: e.target.value };
                    setSpecs(updated);
                  }}
                  className="h-10 rounded-xl"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={() => setSpecs((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Toggles */}
        <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-6 space-y-4">
          <h2 className="font-semibold">Visibility & Tags</h2>
          <div className="space-y-4">
            {[
              { key: "active", label: "Active", desc: "Product is visible to customers" },
              { key: "featured", label: "Featured", desc: "Show on homepage featured section" },
              { key: "bestSeller", label: "Best Seller", desc: "Mark as best selling product" },
              { key: "newArrival", label: "New Arrival", desc: "Show in new arrivals section" },
            ].map((toggle) => (
              <div key={toggle.key} className="flex items-center justify-between">
                <div>
                  <Label>{toggle.label}</Label>
                  <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                </div>
                <Switch
                  checked={form[toggle.key as keyof typeof form] as boolean}
                  onCheckedChange={(v) => updateField(toggle.key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/admin/products">
            <Button variant="outline" className="rounded-xl">Cancel</Button>
          </Link>
          <Button type="submit" className="rounded-xl min-w-[140px] bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white" disabled={loading}>
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
