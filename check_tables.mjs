
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
    // We can try to guess table names or just check if 'attendance' exists
    const { data, error } = await supabase.from('attendance').select('*').limit(1);

    if (error) {
        console.log('Attendance table status:', error.message);
    } else {
        console.log('Attendance table exists.');
        if (data.length > 0) console.log('Sample:', data[0]);
    }

    const { data: d2, error: e2 } = await supabase.from('lesson_attendance').select('*').limit(1);
    if (e2) {
        console.log('Lesson_attendance table status:', e2.message);
    } else {
        console.log('Lesson_attendance table exists.');
    }
}

listTables();
