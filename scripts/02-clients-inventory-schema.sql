-- Create Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('detergente', 'suavizante', 'bolsas', 'otros')),
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'litros', 'unidades')),
  min_stock DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  cost_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (cost_per_unit >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_owner ON clients(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_owner ON inventory_items(owner_user_id);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can create their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = owner_user_id);

-- RLS policies for inventory_items
CREATE POLICY "Users can view their own inventory_items" ON inventory_items
  FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can create their own inventory_items" ON inventory_items
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update their own inventory_items" ON inventory_items
  FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete their own inventory_items" ON inventory_items
  FOR DELETE USING (auth.uid() = owner_user_id);
