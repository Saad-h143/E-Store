import { createClient } from "./client";
import type { Product, Category, BannerSlide, Order, UserProfile } from "@/types";

const supabase = createClient();

// ============================================
// HELPER: Map DB row to app types
// ============================================

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string) || "",
    price: Number(row.price),
    discount: Number(row.discount),
    discountType: (row.discount_type as "percentage" | "fixed") || "percentage",
    stock: Number(row.stock),
    active: row.active as boolean,
    images: (row.images as string[]) || [],
    categoryId: (row.category_id as string) || "",
    featured: row.featured as boolean,
    bestSeller: row.best_seller as boolean,
    newArrival: row.new_arrival as boolean,
    specs: (row.specs as Record<string, string>) || {},
    createdAt: row.created_at as string,
  };
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) || "",
    image: (row.image as string) || "",
    productCount: Number(row.product_count) || 0,
  };
}

function mapBanner(row: Record<string, unknown>): BannerSlide {
  return {
    id: row.id as string,
    title: row.title as string,
    subtitle: (row.subtitle as string) || "",
    description: (row.description as string) || "",
    image: (row.image as string) || "",
    ctaText: (row.cta_text as string) || "Shop Now",
    ctaLink: (row.cta_link as string) || "/shop",
    gradient: (row.gradient as string) || "from-slate-950 via-zinc-900 to-neutral-950",
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: (row.order_number as string) || (row.id as string),
    userId: (row.user_id as string) || "",
    customerName: (row.customer_name as string) || "",
    customerEmail: (row.customer_email as string) || "",
    customerPhone: (row.customer_phone as string) || "",
    items: (row.items as Order["items"]) || [],
    total: Number(row.total),
    status: (row.status as Order["status"]) || "pending",
    shippingAddress: (row.shipping_address as string) || "",
    createdAt: row.created_at as string,
  };
}

// ============================================
// PRODUCTS
// ============================================

export async function getProducts(filters?: {
  search?: string;
  category?: string;
  sort?: string;
  deals?: boolean;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  limit?: number;
}): Promise<Product[]> {
  let query = supabase.from("products").select("*").eq("active", true);

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters?.category) {
    // Get category ID from slug
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .single();
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  if (filters?.deals) {
    query = query.gt("discount", 0);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }
  if (filters?.maxPrice !== undefined && filters.maxPrice < 200000) {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters?.featured) query = query.eq("featured", true);
  if (filters?.bestSeller) query = query.eq("best_seller", true);
  if (filters?.newArrival) query = query.eq("new_arrival", true);

  // Sorting
  switch (filters?.sort) {
    case "price-low":
      query = query.order("price", { ascending: true });
      break;
    case "price-high":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "best-selling":
      query = query.order("best_seller", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "discount":
      query = query.order("discount", { ascending: false });
      break;
    default:
      query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return (data || []).map(mapProduct);
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
  return (data || []).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return mapProduct(data);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapProduct(data);
}

export async function createProduct(product: {
  title: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  discountType: string;
  stock: number;
  active: boolean;
  images: string[];
  categoryId: string;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  specs: Record<string, string>;
}) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      discount: product.discount,
      discount_type: product.discountType,
      stock: product.stock,
      active: product.active,
      images: product.images,
      category_id: product.categoryId || null,
      featured: product.featured,
      best_seller: product.bestSeller,
      new_arrival: product.newArrival,
      specs: product.specs,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(
  id: string,
  updates: Partial<{
    title: string;
    slug: string;
    description: string;
    price: number;
    discount: number;
    discountType: string;
    stock: number;
    active: boolean;
    images: string[];
    categoryId: string;
    featured: boolean;
    bestSeller: boolean;
    newArrival: boolean;
    specs: Record<string, string>;
  }>
) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.discount !== undefined) dbUpdates.discount = updates.discount;
  if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType;
  if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
  if (updates.active !== undefined) dbUpdates.active = updates.active;
  if (updates.images !== undefined) dbUpdates.images = updates.images;
  if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId || null;
  if (updates.featured !== undefined) dbUpdates.featured = updates.featured;
  if (updates.bestSeller !== undefined) dbUpdates.best_seller = updates.bestSeller;
  if (updates.newArrival !== undefined) dbUpdates.new_arrival = updates.newArrival;
  if (updates.specs !== undefined) dbUpdates.specs = updates.specs;

  const { data, error } = await supabase
    .from("products")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ============================================
// CATEGORIES
// ============================================

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return (data || []).map(mapCategory);
}

export async function createCategory(category: { name: string; slug: string; description: string; image: string }) {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return mapCategory(data);
}

export async function updateCategory(id: string, updates: Partial<{ name: string; slug: string; description: string; image: string }>) {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapCategory(data);
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ============================================
// BANNERS
// ============================================

export async function getBanners(): Promise<BannerSlide[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
  return (data || []).map(mapBanner);
}

export async function getAllBanners(): Promise<(BannerSlide & { active: boolean; sortOrder: number })[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order");
  if (error) return [];
  return (data || []).map((row) => ({
    ...mapBanner(row),
    active: row.active as boolean,
    sortOrder: row.sort_order as number,
  }));
}

export async function createBanner(banner: {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  gradient?: string;
}) {
  const { data, error } = await supabase
    .from("banners")
    .insert({
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      image: banner.image,
      cta_text: banner.ctaText,
      cta_link: banner.ctaLink,
      gradient: banner.gradient || "from-slate-950 via-zinc-900 to-neutral-950",
    })
    .select()
    .single();
  if (error) throw error;
  return mapBanner(data);
}

export async function updateBanner(
  id: string,
  updates: Partial<{
    title: string;
    subtitle: string;
    description: string;
    image: string;
    ctaText: string;
    ctaLink: string;
    gradient: string;
    active: boolean;
  }>
) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.ctaText !== undefined) dbUpdates.cta_text = updates.ctaText;
  if (updates.ctaLink !== undefined) dbUpdates.cta_link = updates.ctaLink;
  if (updates.gradient !== undefined) dbUpdates.gradient = updates.gradient;
  if (updates.active !== undefined) dbUpdates.active = updates.active;

  const { data, error } = await supabase
    .from("banners")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapBanner(data);
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}

// ============================================
// ORDERS
// ============================================

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return (data || []).map(mapOrder);
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []).map(mapOrder);
}

export async function createOrder(order: {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Order["items"];
  total: number;
  shippingAddress: string;
}) {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: "",
      user_id: order.userId,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      items: order.items,
      total: order.total,
      shipping_address: order.shippingAddress,
    })
    .select()
    .single();
  if (error) throw error;
  return mapOrder(data);
}

export async function updateOrderStatus(id: string, status: Order["status"]) {
  // id here is the UUID, not order_number
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("order_number", id);
  if (error) {
    // try by UUID
    const { error: err2 } = await supabase.from("orders").update({ status }).eq("id", id);
    if (err2) throw err2;
  }
}

// ============================================
// PROFILES
// ============================================

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone || "",
    role: data.role as "admin" | "customer",
    avatar: data.avatar_url || "",
    createdAt: data.created_at,
  };
}

export async function updateProfile(userId: string, updates: Partial<{ name: string; phone: string; avatar_url: string }>) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

// ============================================
// IMAGE UPLOAD
// ============================================

export async function uploadImage(file: File, folder: string = "products"): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteImage(url: string) {
  // Extract path from URL
  const match = url.match(/product-images\/(.+)$/);
  if (!match) return;
  const { error } = await supabase.storage
    .from("product-images")
    .remove([match[1]]);
  if (error) console.error("Error deleting image:", error);
}
