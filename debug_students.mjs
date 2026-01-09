
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data, error, count } = await supabase
        .from('students')
        .select('*', { count: 'exact' })

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Student Count:', count)
        console.log('Students:', JSON.stringify(data, null, 2))
    }
}

check()
