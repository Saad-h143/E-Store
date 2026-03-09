export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  discount: number; // percentage off
  discountType: "percentage" | "fixed";
  stock: number;
  active: boolean;
  images: string[];
  categoryId: string;
  subcategoryId?: string;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  specs?: Record<string, string>;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  gradient: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "admin" | "customer";
  avatar?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}
