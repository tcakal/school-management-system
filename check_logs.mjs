
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLogs() {
    const { data: logs, error } = await supabase
        .from('debug_notification_logs')
        .select('*')
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Recent Logs:', JSON.stringify(logs, null, 2));
}

checkLogs();
