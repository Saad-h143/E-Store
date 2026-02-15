-- ============================================
-- EZEE MOBILE STORE - SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  product_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  stock INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  images TEXT[] NOT NULL DEFAULT '{}',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  best_seller BOOLEAN NOT NULL DEFAULT false,
  new_arrival BOOLEAN NOT NULL DEFAULT false,
  specs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  cta_text TEXT DEFAULT 'Shop Now',
  cta_link TEXT DEFAULT '/shop',
  gradient TEXT DEFAULT 'from-slate-950 via-zinc-900 to-neutral-950',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  shipping_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read their own, admins can read all
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CATEGORIES: public read, admin write
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PRODUCTS: public read (active), admin write
CREATE POLICY "Active products viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- BANNERS: public read, admin write
CREATE POLICY "Banners viewable by everyone" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Admins can insert banners" ON public.banners FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update banners" ON public.banners FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete banners" ON public.banners FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDERS: users see own orders, admins see all
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Authenticated users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Generate order number
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  order_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO order_count FROM public.orders;
  NEW.order_number := 'ORD-' || LPAD(order_count::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- ============================================
-- STORAGE: Create bucket for product images
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- SEED DATA: Categories
-- ============================================
INSERT INTO public.categories (name, slug, description, image, product_count) VALUES
  ('Apple', 'apple', 'Premium iPhones and Apple ecosystem devices', 'https://images.unsplash.com/photo-1621768216002-5ac171876625?w=600&q=80', 2),
  ('Samsung', 'samsung', 'Galaxy smartphones from flagship to mid-range', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80', 3),
  ('Google', 'google', 'Pixel phones with pure Android and AI features', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80', 1),
  ('OnePlus', 'oneplus', 'Flagship killers with blazing-fast performance', 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600&q=80', 1),
  ('Xiaomi', 'xiaomi', 'Value champions with top-tier specs', 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&q=80', 2),
  ('Others', 'others', 'Nothing, Realme, Motorola, POCO and more', 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600&q=80', 3);

-- SEED DATA: Banners
INSERT INTO public.banners (title, subtitle, description, image, cta_text, cta_link, gradient, sort_order) VALUES
  ('iPhone 15 Pro Max', 'The Future is Here', 'Experience titanium. A17 Pro chip. 48MP camera system. The most powerful iPhone ever created.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=80', 'Shop Now', '/product/iphone-15-pro-max', 'from-violet-950 via-purple-900 to-indigo-950', 1),
  ('Galaxy S24 Ultra', 'Galaxy AI is Here', '200MP camera. Titanium frame. Snapdragon 8 Gen 3. Welcome to the era of Galaxy AI.', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200&q=80', 'Explore', '/product/samsung-galaxy-s24-ultra', 'from-slate-950 via-zinc-900 to-neutral-950', 2),
  ('Mega Sale — Up to 30% OFF', 'Limited Time Offer', 'Grab the best deals on top smartphones. Premium phones at unbeatable prices. Hurry!', 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80', 'View Deals', '/shop', 'from-rose-950 via-red-900 to-orange-950', 3),
  ('Google Pixel 8 Pro', 'AI-Powered Photography', '7 years of updates. Best-in-class AI features. Magic Eraser. Photo Unblur. Best Pixel ever.', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&q=80', 'Learn More', '/product/google-pixel-8-pro', 'from-emerald-950 via-teal-900 to-cyan-950', 4);

-- SEED DATA: Products (will reference categories by slug query)
DO $$
DECLARE
  apple_id UUID;
  samsung_id UUID;
  google_id UUID;
  oneplus_id UUID;
  xiaomi_id UUID;
  others_id UUID;
BEGIN
  SELECT id INTO apple_id FROM public.categories WHERE slug = 'apple';
  SELECT id INTO samsung_id FROM public.categories WHERE slug = 'samsung';
  SELECT id INTO google_id FROM public.categories WHERE slug = 'google';
  SELECT id INTO oneplus_id FROM public.categories WHERE slug = 'oneplus';
  SELECT id INTO xiaomi_id FROM public.categories WHERE slug = 'xiaomi';
  SELECT id INTO others_id FROM public.categories WHERE slug = 'others';

  INSERT INTO public.products (slug, title, description, price, discount, discount_type, stock, active, images, category_id, featured, best_seller, new_arrival, specs) VALUES
  ('iphone-15-pro-max', 'iPhone 15 Pro Max', 'The most powerful iPhone ever. A17 Pro chip, 48MP camera system, titanium design, and Action button. Experience the ultimate in mobile technology with the stunning Super Retina XDR display featuring ProMotion technology.', 159999, 10, 'percentage', 25, true, ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80','https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80','https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80'], apple_id, true, true, true, '{"Display":"6.7\" Super Retina XDR","Chip":"A17 Pro","Camera":"48MP + 12MP + 12MP","Battery":"4422 mAh","Storage":"256GB","RAM":"8GB"}'::jsonb),

  ('samsung-galaxy-s24-ultra', 'Samsung Galaxy S24 Ultra', 'Galaxy AI is here. The Samsung Galaxy S24 Ultra features a stunning 6.8-inch Dynamic AMOLED display, Snapdragon 8 Gen 3 processor, and a powerful 200MP camera system. Built with titanium for maximum durability.', 139999, 15, 'percentage', 30, true, ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80','https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&q=80','https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80'], samsung_id, true, true, false, '{"Display":"6.8\" Dynamic AMOLED 2X","Chip":"Snapdragon 8 Gen 3","Camera":"200MP + 50MP + 12MP + 10MP","Battery":"5000 mAh","Storage":"256GB","RAM":"12GB"}'::jsonb),

  ('google-pixel-8-pro', 'Google Pixel 8 Pro', 'The best of Google with Tensor G3 chip, advanced AI photo features, 7 years of updates, and the most helpful AI on a phone. Stunning 50MP triple camera system delivers incredible photos day and night.', 89999, 20, 'percentage', 18, true, ARRAY['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80','https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'], google_id, true, false, true, '{"Display":"6.7\" LTPO OLED","Chip":"Google Tensor G3","Camera":"50MP + 48MP + 48MP","Battery":"5050 mAh","Storage":"128GB","RAM":"12GB"}'::jsonb),

  ('oneplus-12', 'OnePlus 12', 'Flagship performance at an incredible price. Snapdragon 8 Gen 3, 50MP Hasselblad triple camera, 100W SUPERVOOC charging, and a beautiful 6.82-inch LTPO AMOLED display with 120Hz refresh rate.', 69999, 12, 'percentage', 40, true, ARRAY['https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=800&q=80','https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80','https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&q=80'], oneplus_id, false, true, true, '{"Display":"6.82\" LTPO AMOLED","Chip":"Snapdragon 8 Gen 3","Camera":"50MP + 64MP + 48MP","Battery":"5400 mAh","Storage":"256GB","RAM":"12GB"}'::jsonb),

  ('xiaomi-14-pro', 'Xiaomi 14 Pro', 'Leica optics meets cutting-edge technology. The Xiaomi 14 Pro features a 50MP Leica triple camera system, Snapdragon 8 Gen 3, and a gorgeous 6.73-inch LTPO AMOLED display. Premium design meets powerful performance.', 59999, 0, 'percentage', 22, true, ARRAY['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80','https://images.unsplash.com/photo-1580910051074-3eb694886571?w=800&q=80'], xiaomi_id, true, false, true, '{"Display":"6.73\" LTPO AMOLED","Chip":"Snapdragon 8 Gen 3","Camera":"50MP + 50MP + 50MP","Battery":"4880 mAh","Storage":"256GB","RAM":"12GB"}'::jsonb),

  ('nothing-phone-2', 'Nothing Phone (2)', 'Design different. Nothing Phone (2) features the iconic Glyph Interface, Snapdragon 8+ Gen 1, 50MP dual camera, and a clean software experience. Stand out from the crowd with unique LED lighting patterns.', 44999, 25, 'percentage', 15, true, ARRAY['https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&q=80','https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80','https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'], others_id, false, false, true, '{"Display":"6.7\" LTPO OLED","Chip":"Snapdragon 8+ Gen 1","Camera":"50MP + 50MP","Battery":"4700 mAh","Storage":"128GB","RAM":"8GB"}'::jsonb),

  ('iphone-15', 'iPhone 15', 'Dynamic Island. 48MP camera. USB-C. The iPhone 15 brings powerful features to everyone. A16 Bionic chip, Super Retina XDR display, and the new 48MP main camera system for stunning photos.', 79999, 8, 'percentage', 50, true, ARRAY['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80','https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80','https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80'], apple_id, false, true, false, '{"Display":"6.1\" Super Retina XDR","Chip":"A16 Bionic","Camera":"48MP + 12MP","Battery":"3877 mAh","Storage":"128GB","RAM":"6GB"}'::jsonb),

  ('samsung-galaxy-a55', 'Samsung Galaxy A55 5G', 'Premium mid-range champion. The Galaxy A55 5G features a 6.6-inch Super AMOLED display, Exynos 1480 chip, 50MP triple camera, IP67 water resistance, and Samsung commitment to 4 years of updates.', 39999, 18, 'percentage', 60, true, ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80','https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80','https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&q=80'], samsung_id, false, true, false, '{"Display":"6.6\" Super AMOLED","Chip":"Exynos 1480","Camera":"50MP + 12MP + 5MP","Battery":"5000 mAh","Storage":"128GB","RAM":"8GB"}'::jsonb),

  ('realme-gt-5-pro', 'Realme GT 5 Pro', 'Speed meets style. Snapdragon 8 Gen 3, Sony IMX890 camera sensor, 100W SuperVOOC charging, and a vibrant 6.78-inch AMOLED display. Flagship specs at a price that wont break the bank.', 34999, 10, 'percentage', 35, true, ARRAY['https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80','https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=800&q=80','https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&q=80'], others_id, false, false, true, '{"Display":"6.78\" AMOLED","Chip":"Snapdragon 8 Gen 3","Camera":"50MP + 8MP + 2MP","Battery":"5400 mAh","Storage":"256GB","RAM":"8GB"}'::jsonb),

  ('motorola-edge-50-pro', 'Motorola Edge 50 Pro', 'Premium design, incredible camera. Motorola Edge 50 Pro features a 50MP AI camera, Snapdragon 7 Gen 3, 125W TurboPower charging, and a stunning vegan leather design.', 29999, 30, 'percentage', 0, true, ARRAY['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80','https://images.unsplash.com/photo-1580910051074-3eb694886571?w=800&q=80','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'], others_id, false, false, false, '{"Display":"6.7\" pOLED","Chip":"Snapdragon 7 Gen 3","Camera":"50MP + 13MP + 10MP","Battery":"4500 mAh","Storage":"256GB","RAM":"12GB"}'::jsonb),

  ('samsung-galaxy-z-fold-5', 'Samsung Galaxy Z Fold 5', 'Unfold your world. The Galaxy Z Fold 5 features a 7.6-inch foldable display, Snapdragon 8 Gen 2, Flex Mode, and a triple camera system. The ultimate productivity phone.', 154999, 5, 'percentage', 8, true, ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80','https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80','https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&q=80'], samsung_id, true, false, false, '{"Display":"7.6\" Dynamic AMOLED","Chip":"Snapdragon 8 Gen 2","Camera":"50MP + 12MP + 10MP","Battery":"4400 mAh","Storage":"256GB","RAM":"12GB"}'::jsonb),

  ('poco-f6-pro', 'POCO F6 Pro', 'Flagship killer reloaded. Snapdragon 8 Gen 2, 120W HyperCharge, 50MP OIS camera, and a 6.67-inch AMOLED display with 120Hz. Insane performance at an unbeatable price point.', 24999, 15, 'percentage', 45, true, ARRAY['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80','https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80','https://images.unsplash.com/photo-1580910051074-3eb694886571?w=800&q=80'], xiaomi_id, false, true, false, '{"Display":"6.67\" AMOLED","Chip":"Snapdragon 8 Gen 2","Camera":"50MP + 8MP + 2MP","Battery":"5000 mAh","Storage":"256GB","RAM":"12GB"}'::jsonb);
END $$;
