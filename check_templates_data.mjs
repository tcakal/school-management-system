
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTemplates() {
    const { data: templates, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Active Templates:', JSON.stringify(templates, null, 2));

    // Also check current day of week according to DB
    const { data: time } = await supabase.rpc('debug_get_time'); // If exists?
    // Or just simple select

    // Check DOW from DB perspective
    // We can't easily run a select for DOW via client without RPC or table
}

checkTemplates();
