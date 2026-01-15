import { createClient } from '@supabase/supabase-js';

// These will be populated with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqdtcbghgnisgivtplpf.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8';

console.log('Supabase Client Init:', {
    url: supabaseUrl,
    keyLength: supabaseKey?.length || 0,
    keyStart: supabaseKey?.substring(0, 5)
});

export const supabase = createClient(supabaseUrl, supabaseKey);
