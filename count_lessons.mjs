
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function count() {
    const { data: schools } = await supabase.from('schools').select('id, name');

    for (const school of schools) {
        const { count, error } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', school.id)
            .eq('status', 'scheduled');

        console.log(`${school.name}: ${count} lessons`);
    }
}
count();
