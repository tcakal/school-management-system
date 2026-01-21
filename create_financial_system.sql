-- Create Seasons Table
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create School Seasons Status (For archiving/closing seasons per school)
CREATE TABLE IF NOT EXISTS school_season_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMPTZ,
    closing_note TEXT,
    total_debt_forgiven DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, season_id)
);

-- Create School Periods Table (The Accrual/Debt Records)
CREATE TABLE IF NOT EXISTS school_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    period_number INTEGER NOT NULL, -- 1, 2, 3...
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Financials
    student_count_snapshot INTEGER DEFAULT 0, -- Snapshot of student count at generation time
    price_per_student_snapshot DECIMAL(10, 2) DEFAULT 0, -- Snapshot of price
    expected_amount DECIMAL(10, 2) DEFAULT 0, -- calculated debt (count * price)
    
    status TEXT CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'void')) DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, season_id, period_number)
);

-- Update Payments Table to link to Seasons and Periods
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id),
ADD COLUMN IF NOT EXISTS school_period_id UUID REFERENCES school_periods(id),
ADD COLUMN IF NOT EXISTS transaction_type TEXT CHECK (transaction_type IN ('payment', 'write_off', 'refund')) DEFAULT 'payment';

-- RLS Policies

-- Enable RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_periods ENABLE ROW LEVEL SECURITY;

-- Policies for Seasons (Public read, Admin write)
CREATE POLICY "Seasons are viewable by everyone" ON seasons FOR SELECT USING (true);
CREATE POLICY "Seasons are editable by admins" ON seasons FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for School Season Stats
CREATE POLICY "School stats viewable by users linked to school or admins" ON school_season_stats FOR SELECT USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND (role = 'admin' OR school_id = school_season_stats.school_id))
    OR 
    EXISTS (SELECT 1 FROM schools WHERE id = auth.uid() AND id = school_season_stats.school_id) -- If school logs in directly (manager)
);

CREATE POLICY "School stats editable by admins" ON school_season_stats FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for School Periods
CREATE POLICY "Periods viewable by users linked to school or admins" ON school_periods FOR SELECT USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND (role = 'admin' OR school_id = school_periods.school_id))
    OR 
    EXISTS (SELECT 1 FROM schools WHERE id = auth.uid() AND id = school_periods.school_id)
);

CREATE POLICY "Periods editable by admins" ON school_periods FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND role = 'admin')
);


-- DATA MIGRATION: Initialize Default Season
DO $$
DECLARE
    default_season_id UUID;
BEGIN
    -- 1. Create Default Season (2024-2025) if not exists
    IF NOT EXISTS (SELECT 1 FROM seasons WHERE name = '2024-2025 Sezonu') THEN
        INSERT INTO seasons (name, start_date, end_date, is_active)
        VALUES ('2024-2025 Sezonu', '2024-09-01', '2025-06-15', true)
        RETURNING id INTO default_season_id;
    ELSE
        SELECT id INTO default_season_id FROM seasons WHERE name = '2024-2025 Sezonu';
    END IF;

    -- 2. Link existing Payments to this Season
    UPDATE payments 
    SET season_id = default_season_id 
    WHERE season_id IS NULL;

    -- 3. Initialize Season Stats for all existing schools
    INSERT INTO school_season_stats (school_id, season_id)
    SELECT id, default_season_id FROM schools
    ON CONFLICT (school_id, season_id) DO NOTHING;
    
END $$;
