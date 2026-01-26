
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStatus() {
    // There isn't a direct "distinct" modifier in the JS client easily without rpc
    // But we can fetch status column and set it in JS
    const { data, error } = await supabase
        .from('lessons')
        .select('status');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const statuses = [...new Set(data.map(item => item.status))];
    console.log('Distinct Statuses:', statuses);
}

checkStatus();
