
-- Add status column to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'paid';

-- Update RLS if needed (Allow update)
CREATE POLICY "Enable update access for all users" ON public.payments FOR UPDATE USING (true);
