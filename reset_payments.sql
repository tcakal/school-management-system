-- RESET PAYMENTS DATA

-- 1. Delete all payment records
TRUNCATE TABLE public.payments CASCADE;

-- 2. Reset Student Payment Tracking
-- Since payments are deleted, the last payment status for students should revert to 'pending' (or null if preferred, but 'pending' is safer).
UPDATE public.students 
SET 
    last_payment_status = 'pending',
    last_payment_date = NULL,
    last_claim_date = NULL;

-- 3. Reset any school specific financial tracking if it exists (none found in schema check, but just in case)
-- (No specific school balance table found, likely calculated on the fly)

