
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking database...');

    const { count: classCount, error: classError } = await supabase.from('class_groups').select('*', { count: 'exact', head: true });
    if (classError) console.error('Error fetching classes:', classError);
    else console.log('Total Class Groups:', classCount);

    const { count: assignCount, error: assignError } = await supabase.from('teacher_assignments').select('*', { count: 'exact', head: true });
    if (assignError) console.error('Error fetching assignments:', assignError);
    else console.log('Total Assignments:', assignCount);

    const { count: lessonCount, error: lessonError } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
    if (lessonError) console.error('Error fetching lessons:', lessonError);
    else console.log('Total Lessons:', lessonCount);

    // Check specific Saturday classes if possible
    const { data: satLessons, error: satError } = await supabase.from('lessons')
        .select('date, start_time')
        .like('date', '%-Saturday%') // This implies date format? No, date is usually YYYY-MM-DD. 
        // Let's just list next 5 lessons
        .limit(5);

    if (satError) console.error('Sat Error:', satError);
    else console.log('Sample Lessons:', satLessons);
}

checkData();
