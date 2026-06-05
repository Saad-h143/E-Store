import { createClient } from "./client";
import type { Product, Category, Subcategory, BannerSlide, Order, UserProfile } from "@/types";
import {
  cacheGet, cacheSet, cacheInvalidateProducts, cacheInvalidateCategories,
  CACHE_KEYS, DEFAULT_TTL, ADMIN_TTL,
} from "@/lib/cache";

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
    subcategoryId: (row.subcategory_id as string) || "",
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

function mapSubcategory(row: Record<string, unknown>): Subcategory {
  return {
    id: row.id as string,
    categoryId: (row.category_id as string) || "",
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
    id: row.id as string,
    orderNumber: (row.order_number as string) || (row.id as string),
    userId: (row.user_id as string) || "",
    customerName: (row.customer_name as string) || "",
    customerEmail: (row.customer_email as string) || "",
    customerPhone: (row.customer_phone as string) || "",
    items: (row.items as Order["items"]) || [],
    total: Number(row.total),
    status: (row.status as Order["status"]) || "pending",
    shippingAddress: (row.shipping_address as string) || "",
    paymentProof: (row.payment_proof as string) || "",
    paymentVerified: (row.payment_verified as boolean) || false,
    paymentMethod: (row.payment_method as "card" | "cod") || "cod",
    paymentIntentId: (row.payment_intent_id as string) || "",
    createdAt: row.created_at as string,
  };
}

// ============================================
// PRODUCTS — cached
// ============================================

/** Fetch all active products (cached). Used by store pages. */
async function fetchActiveProducts(): Promise<Product[]> {
  const cached = cacheGet<Product[]>(CACHE_KEYS.PRODUCTS_ACTIVE);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  const products = (data || []).map(mapProduct);
  cacheSet(CACHE_KEYS.PRODUCTS_ACTIVE, products, DEFAULT_TTL);
  return products;
}

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
  // Fetch all active products once, then filter in-memory
  let products = await fetchActiveProducts();

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    products = products.filter((p) => p.title.toLowerCase().includes(q));
  }

  if (filters?.category) {
    // Resolve slug to ID via cached categories
    const cats = await getCategories();
    const cat = cats.find((c) => c.slug === filters.category);
    if (cat) {
      products = products.filter((p) => p.categoryId === cat.id);
    }
  }

  if (filters?.deals) {
    products = products.filter((p) => p.discount > 0);
  }

  if (filters?.minPrice !== undefined) {
    products = products.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters?.maxPrice !== undefined && filters.maxPrice < 200000) {
    products = products.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters?.featured) products = products.filter((p) => p.featured);
  if (filters?.bestSeller) products = products.filter((p) => p.bestSeller);
  if (filters?.newArrival) products = products.filter((p) => p.newArrival);

  // Sorting
  switch (filters?.sort) {
    case "price-low":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      products.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "best-selling":
      products.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
      break;
    case "discount":
      products.sort((a, b) => b.discount - a.discount);
      break;
  }

  if (filters?.limit) {
    products = products.slice(0, filters.limit);
  }

  return products;
}

export async function getAllProducts(): Promise<Product[]> {
  const cached = cacheGet<Product[]>(CACHE_KEYS.PRODUCTS_ALL);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
  const products = (data || []).map(mapProduct);
  cacheSet(CACHE_KEYS.PRODUCTS_ALL, products, ADMIN_TTL);
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const cacheKey = CACHE_KEYS.PRODUCT_BY_SLUG(slug);
  const cached = cacheGet<Product>(cacheKey);
  if (cached) return cached;

  // Try finding from active products cache first
  const activeProducts = cacheGet<Product[]>(CACHE_KEYS.PRODUCTS_ACTIVE);
  if (activeProducts) {
    const found = activeProducts.find((p) => p.slug === slug);
    if (found) {
      cacheSet(cacheKey, found, DEFAULT_TTL);
      return found;
    }
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  const product = mapProduct(data);
  cacheSet(cacheKey, product, DEFAULT_TTL);
  return product;
}

export async function getProductById(id: string): Promise<Product | null> {
  const cacheKey = CACHE_KEYS.PRODUCT_BY_ID(id);
  const cached = cacheGet<Product>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const product = mapProduct(data);
  cacheSet(cacheKey, product, DEFAULT_TTL);
  return product;
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
  subcategoryId?: string;
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
      subcategory_id: product.subcategoryId || null,
      featured: product.featured,
      best_seller: product.bestSeller,
      new_arrival: product.newArrival,
      specs: product.specs,
    })
    .select()
    .single();
  if (error) throw error;
  cacheInvalidateProducts();
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
    subcategoryId: string;
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
  if (updates.subcategoryId !== undefined) dbUpdates.subcategory_id = updates.subcategoryId || null;
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
  cacheInvalidateProducts();
  return mapProduct(data);
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  cacheInvalidateProducts();
}

// ============================================
// CATEGORIES — cached
// ============================================

export async function getCategories(): Promise<Category[]> {
  const cached = cacheGet<Category[]>(CACHE_KEYS.CATEGORIES);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  const categories = (data || []).map(mapCategory);
  cacheSet(CACHE_KEYS.CATEGORIES, categories, DEFAULT_TTL);
  return categories;
}

export async function createCategory(category: { name: string; slug: string; description: string; image: string }) {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  cacheInvalidateCategories();
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
  cacheInvalidateCategories();
  return mapCategory(data);
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
  cacheInvalidateCategories();
}

// ============================================
// SUBCATEGORIES — cached
// ============================================

export async function getSubcategories(categoryId?: string): Promise<Subcategory[]> {
  const cacheKey = categoryId ? CACHE_KEYS.SUBCATEGORIES_BY_CAT(categoryId) : CACHE_KEYS.SUBCATEGORIES;
  const cached = cacheGet<Subcategory[]>(cacheKey);
  if (cached) return cached;

  let query = supabase.from("subcategories").select("*").order("name");
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) { console.error("Error fetching subcategories:", error); return []; }
  const subcategories = (data || []).map(mapSubcategory);
  cacheSet(cacheKey, subcategories, DEFAULT_TTL);
  return subcategories;
}

export async function createSubcategory(sub: { categoryId: string; name: string; slug: string; description: string; image: string }) {
  const { data, error } = await supabase
    .from("subcategories")
    .insert({ category_id: sub.categoryId, name: sub.name, slug: sub.slug, description: sub.description, image: sub.image })
    .select().single();
  if (error) throw error;
  cacheInvalidateCategories();
  return mapSubcategory(data);
}

export async function updateSubcategory(id: string, updates: Partial<{ name: string; slug: string; description: string; image: string; categoryId: string }>) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
  const { data, error } = await supabase.from("subcategories").update(dbUpdates).eq("id", id).select().single();
  if (error) throw error;
  cacheInvalidateCategories();
  return mapSubcategory(data);
}

export async function deleteSubcategory(id: string) {
  const { error } = await supabase.from("subcategories").delete().eq("id", id);
  if (error) throw error;
  cacheInvalidateCategories();
}

// ============================================
// BANNERS — cached
// ============================================

export async function getBanners(): Promise<BannerSlide[]> {
  const cached = cacheGet<BannerSlide[]>(CACHE_KEYS.BANNERS);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
  const banners = (data || []).map(mapBanner);
  cacheSet(CACHE_KEYS.BANNERS, banners, DEFAULT_TTL);
  return banners;
}

export async function getAllBanners(): Promise<(BannerSlide & { active: boolean; sortOrder: number })[]> {
  const cached = cacheGet<(BannerSlide & { active: boolean; sortOrder: number })[]>(CACHE_KEYS.BANNERS_ALL);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order");
  if (error) return [];
  const banners = (data || []).map((row: Record<string, unknown>) => ({
    ...mapBanner(row),
    active: row.active as boolean,
    sortOrder: row.sort_order as number,
  }));
  cacheSet(CACHE_KEYS.BANNERS_ALL, banners, ADMIN_TTL);
  return banners;
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
  cacheSet(CACHE_KEYS.BANNERS, null, 0); // invalidate
  cacheSet(CACHE_KEYS.BANNERS_ALL, null, 0);
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
  cacheSet(CACHE_KEYS.BANNERS, null, 0);
  cacheSet(CACHE_KEYS.BANNERS_ALL, null, 0);
  return mapBanner(data);
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
  cacheSet(CACHE_KEYS.BANNERS, null, 0);
  cacheSet(CACHE_KEYS.BANNERS_ALL, null, 0);
}

// ============================================
// ORDERS
// ============================================

export async function getOrders(): Promise<Order[]> {
  const cached = cacheGet<Order[]>(CACHE_KEYS.ORDERS);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  const orders = (data || []).map(mapOrder);
  cacheSet(CACHE_KEYS.ORDERS, orders, ADMIN_TTL);
  return orders;
}

// Get sales data per product from all orders
export async function getProductSalesMap(): Promise<Record<string, { totalSold: number; totalRevenue: number; orders: { orderNumber: string; customerName: string; quantity: number; date: string; status: string }[] }>> {
  const orders = await getOrders();
  const salesMap: Record<string, { totalSold: number; totalRevenue: number; orders: { orderNumber: string; customerName: string; quantity: number; date: string; status: string }[] }> = {};

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      const pid = item.productId;
      if (!pid) continue;
      if (!salesMap[pid]) {
        salesMap[pid] = { totalSold: 0, totalRevenue: 0, orders: [] };
      }
      salesMap[pid].totalSold += item.quantity;
      salesMap[pid].totalRevenue += item.price * item.quantity;
      salesMap[pid].orders.push({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        quantity: item.quantity,
        date: order.createdAt,
        status: order.status,
      });
    }
  }

  return salesMap;
}

// Fetch the signed-in user's orders, matched by account id AND by account email
// so that orders placed as a guest with the same email also show up. This goes
// through a service-role server route (/api/orders/mine) which authenticates via
// the session token, so it works regardless of RLS policy configuration.
export async function getUserOrders(): Promise<Order[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return [];

  const res = await fetch("/api/orders/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const result = await res.json().catch(() => ({}));
  return (result.orders || []).map(mapOrder);
}

// Orders are created through a service-role server route so that guests
// (user_id = null) can place orders despite RLS. userId is null for guests.
export async function createOrder(order: {
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Order["items"];
  total: number;
  shippingAddress: string;
  paymentMethod: "card" | "cod";
  paymentIntentId?: string;
}) {
  const res = await fetch("/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.order) {
    throw new Error(result.error || "Failed to create order");
  }

  cacheSet(CACHE_KEYS.ORDERS, null, 0);
  return mapOrder(result.order);
}

// Adjust product stock for a set of order items.
// delta = -1 deducts (a sale), delta = +1 restores (a cancellation/refund).
async function adjustProductStock(
  items: { productId?: string; quantity: number }[],
  delta: number
) {
  for (const item of items) {
    if (!item.productId) continue;
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.productId)
      .single();
    if (product) {
      const newStock = Math.max(0, (product.stock || 0) + delta * item.quantity);
      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.productId);
    }
  }
  cacheInvalidateProducts();
}

export async function updateOrderStatus(id: string, status: Order["status"]) {
  // Fetch the order first (needed to restore stock on cancellation)
  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) throw error;

  // If a cancelled order had its stock already deducted, put the stock back.
  if (status === "cancelled" && orderData?.stock_deducted && orderData?.items) {
    await adjustProductStock(
      orderData.items as { productId?: string; quantity: number }[],
      +1
    );
    await supabase.from("orders").update({ stock_deducted: false }).eq("id", id);
  }

  cacheSet(CACHE_KEYS.ORDERS, null, 0);
}

export async function uploadPaymentProof(orderId: string, proofUrl: string) {
  const { error } = await supabase
    .from("orders")
    .update({ payment_proof: proofUrl })
    .eq("id", orderId);
  if (error) throw error;
  cacheSet(CACHE_KEYS.ORDERS, null, 0);
}

export async function verifyPayment(orderId: string, verified: boolean) {
  // Fetch first so we know whether stock was already deducted (idempotency).
  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({ payment_verified: verified })
    .eq("id", orderId);
  if (error) throw error;

  const items = (orderData?.items as { productId?: string; quantity: number }[]) || [];
  if (verified && orderData && !orderData.stock_deducted) {
    // Payment confirmed -> deduct stock once and mark it.
    await adjustProductStock(items, -1);
    await supabase.from("orders").update({ stock_deducted: true }).eq("id", orderId);
  } else if (!verified && orderData?.stock_deducted) {
    // Payment un-verified -> give the stock back.
    await adjustProductStock(items, +1);
    await supabase.from("orders").update({ stock_deducted: false }).eq("id", orderId);
  }

  cacheSet(CACHE_KEYS.ORDERS, null, 0);
}

// ============================================
// PROFILES
// ============================================

export async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((d: Record<string, unknown>) => ({
    id: d.id as string,
    email: (d.email as string) || "",
    name: (d.name as string) || "",
    phone: (d.phone as string) || "",
    role: (d.role as "admin" | "customer") || "customer",
    avatar: (d.avatar_url as string) || "",
    createdAt: (d.created_at as string) || "",
  }));
}

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

// Uploads to Cloudinary via an unsigned upload preset. Used by admin product,
// banner and category forms. Returns the hosted secure_url.
export async function uploadImage(file: File, folder: string = "products"): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    throw new Error("Cloudinary is not configured (missing cloud name or upload preset).");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  form.append("folder", `ezee/${folder}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );
  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Image upload failed.");
  }
  return data.secure_url as string;
}

export async function deleteImage(url: string) {
  // Legacy Supabase-hosted images are removed from storage. Cloudinary assets
  // require a signed server-side call to delete, so we just drop the reference.
  const match = url.match(/product-images\/(.+)$/);
  if (!match) return;
  const { error } = await supabase.storage
    .from("product-images")
    .remove([match[1]]);
  if (error) console.error("Error deleting image:", error);
}
