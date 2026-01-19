-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    category TEXT, -- Optional: 'Electronics', 'Furniture', etc.
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON public.inventory_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.inventory_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.inventory_items
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.inventory_items
    FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_inventory_modtime
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Grant permissions
GRANT ALL ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
