
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function setSchoolStartWeek(schoolId, targetDateStr) {
    const targetDate = new Date(targetDateStr);

    // 1. Get current start
    const { data: lessons, error } = await supabase
        .from('lessons')
        .select('date')
        .eq('school_id', schoolId)
        .eq('status', 'scheduled')
        .order('date', { ascending: true })
        .limit(1);

    if (error) {
        console.error('Error fetching lessons:', error);
        return;
    }

    if (!lessons || lessons.length === 0) {
        console.log('No scheduled lessons found.');
        return;
    }

    const currentStart = new Date(lessons[0].date);

    // Calculate difference in days between the dates
    // We want to align the weeks. 
    // Simply: target - current
    const diffTime = targetDate.getTime() - currentStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 0) {
        console.log('Already on target date.');
        return;
    }

    console.log(`Shifting schedule for school ${schoolId} by ${diffDays} days (From ${lessons[0].date} to ${targetDateStr})...`);

    const { data: result, error: rpcError } = await supabase
        .rpc('shift_school_schedule', {
            p_school_id: schoolId,
            p_start_date: lessons[0].date,
            p_days_to_shift: diffDays
        });

    if (rpcError) {
        console.error('RPC Error:', rpcError);
    } else {
        console.log('Success:', result);
    }
}

// IDs from previous check
const schools = [
    { id: '26fcd256-2e1e-4536-b187-c4e1641249de', target: '2026-02-02' }, // Aslan (Mon)
    { id: 'e3cffc6b-2d73-477c-834e-9632fdc93443', target: '2026-02-02' }, // Yunus (Mon)
    { id: 'f7007dcf-ae02-4a92-b287-3ff24229081c', target: '2026-02-04' }, // Kroman (Wed)
    { id: 'ac3bc1e9-1044-4626-8f83-ffcd855dab44', target: '2026-02-03' }, // Mehmet (Tue)
    { id: 'ae73d39f-b847-48df-84a7-170a0df5c9e9', target: '2026-02-08' }, // Cemil (Sun)
    { id: '116d7acf-14e0-4a91-9998-e568595bca05', target: '2026-02-08' }  // Gebze (Sun)
];

async function runAll() {
    for (const s of schools) {
        await setSchoolStartWeek(s.id, s.target);
    }
}

runAll();
