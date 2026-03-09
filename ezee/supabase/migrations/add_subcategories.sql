CREATE TABLE IF NOT EXISTS subcategories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text DEFAULT '',
  image text DEFAULT '',
  product_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- Add subcategory_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON subcategories FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON subcategories FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update" ON subcategories FOR UPDATE USING (true);
CREATE POLICY "Auth delete" ON subcategories FOR DELETE USING (true);
