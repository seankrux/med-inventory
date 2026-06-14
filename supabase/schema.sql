# Med Inventory — Supabase Schema
# Run this in Supabase SQL Editor

-- 1. CUSTOM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'staff');

-- 2. CATEGORIES
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, description) VALUES
  ('Anti-microbial', 'Antibiotics and antimicrobial agents'),
  ('Fluid and Electrolytes', 'Oral rehydration and electrolyte solutions'),
  ('Anti-asthma', 'Asthma and respiratory medications'),
  ('Anti-pyretic', 'Fever and pain relief medications'),
  ('Anti-diabetic', 'Diabetes management medications'),
  ('Anti-dyslipidemia', 'Cholesterol and lipid management'),
  ('Anti-hypertensive', 'Blood pressure medications'),
  ('Anti-thrombotic', 'Blood thinning and stroke prevention'),
  ('Anti-histamine', 'Allergy relief medications');

-- 3. PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  role user_role DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'staff' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. ITEMS (medicines)
CREATE TABLE items (
  id BIGSERIAL PRIMARY KEY,
  no INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  beginning_inventory INTEGER DEFAULT 0,
  stock_received INTEGER DEFAULT 0,
  total_available INTEGER GENERATED ALWAYS AS (beginning_inventory + stock_received) STORED,
  total_dispensed INTEGER DEFAULT 0,
  remaining_inventory INTEGER GENERATED ALWAYS AS (
    GREATEST(0, beginning_inventory + stock_received - total_dispensed)
  ) STORED,
  reorder_level INTEGER DEFAULT 0,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DISPENSES (audit trail)
CREATE TABLE dispenses (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
  month INTEGER NOT NULL DEFAULT 6,
  year INTEGER NOT NULL DEFAULT 2026,
  patient_ref TEXT DEFAULT '',
  dispensed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STOCK RECEIPTS (incoming stock)
CREATE TABLE stock_receipts (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  source TEXT DEFAULT 'Unknown',
  received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_dispenses_item ON dispenses(item_id);
CREATE INDEX idx_dispenses_date ON dispenses(year, month, day);
CREATE INDEX idx_dispenses_by ON dispenses(dispensed_by);
CREATE INDEX idx_stock_receipts_item ON stock_receipts(item_id);

-- 8. ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_receipts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Admins can update any profile
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Items: all authenticated users can read
CREATE POLICY "items_select" ON items FOR SELECT USING (true);
-- Admins can insert/update/delete
CREATE POLICY "items_insert" ON items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "items_update" ON items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "items_delete" ON items FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Dispenses: all authenticated can read/insert
CREATE POLICY "dispenses_select" ON dispenses FOR SELECT USING (true);
CREATE POLICY "dispenses_insert" ON dispenses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Stock receipts: all authenticated can read/insert
CREATE POLICY "stock_receipts_select" ON stock_receipts FOR SELECT USING (true);
CREATE POLICY "stock_receipts_insert" ON stock_receipts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 9. AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
