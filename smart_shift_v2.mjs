
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

// Target Week Start: Monday, Feb 2, 2026
// We will align the *first available lesson* of each school to its corresponding weekday in this week.
const TARGET_WEEK_START_STR = '2026-02-02';

async function shiftSchool(school) {
    console.log(`\nProcessing ${school.name} (${school.id})...`);

    // 1. Fetch scheduled lessons
    const { data: lessons, error } = await supabase
        .from('lessons')
        .select('id, date, status')
        .eq('school_id', school.id)
        .eq('status', 'scheduled')
        .order('date', { ascending: true });

    if (error) {
        console.error(`Error fetching lessons for ${school.name}:`, error);
        return;
    }

    if (!lessons || lessons.length === 0) {
        console.log(`No scheduled lessons found for ${school.name}.`);
        return;
    }

    // 2. Fetch attendance to exclude
    const lessonIds = lessons.map(l => l.id);
    const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select('lesson_id')
        .in('lesson_id', lessonIds);

    if (attError) {
        console.error(`Error fetching attendance for ${school.name}:`, attError);
        return;
    }

    const attendedLessonIds = new Set(attendanceData?.map(a => a.lesson_id));

    // 3. Filter lessons to move
    const lessonsToMove = lessons.filter(l => !attendedLessonIds.has(l.id));

    if (lessonsToMove.length === 0) {
        console.log(`No lessons to move for ${school.name} (all protected or empty).`);
        return;
    }

    // 4. Calculate Shift
    // Get the first lesson's date
    const firstLessonDateStr = lessonsToMove[0].date;
    const firstLessonDate = new Date(firstLessonDateStr);

    // Target calculation:
    // We want the lesson to be in the week of Feb 2, 2026.
    // Monday Feb 2 is the anchor.
    // If first lesson is Wed, it should move to Wed Feb 4.
    // If first lesson is Mon, it should move to Mon Feb 2.

    // Get day of week of first lesson (0=Sun, 1=Mon, ..., 6=Sat)
    const dayOfWeek = firstLessonDate.getDay();
    // Adjust logic if Monday is start of week? 
    // create date for Mon Feb 2
    const targetWeekStart = new Date(TARGET_WEEK_START_STR); // This is Monday

    // Determine target date for THIS specific weekday
    // Note: getDay() returns 0 for Sunday. 
    // If Monday is 1, target is Feb 2.
    // If Sunday is 0, target is Feb 8 (Sunday of that week).

    // Simple approach: Calculate offset from Monday (1).
    // Mon(1) -> 0 offset
    // Tue(2) -> 1 offset
    // ...
    // Sun(0) -> 6 offset? Or is Sunday start of that week?
    // In Turkish context, week starts Monday. So Sunday is the LAST day.

    let dayOffset = dayOfWeek - 1;
    if (dayOffset === -1) dayOffset = 6; // Sunday becomes 6 (7th day)

    const targetDate = new Date(targetWeekStart);
    targetDate.setDate(targetWeekStart.getDate() + dayOffset);

    // Calculate diff days
    const diffTime = targetDate.getTime() - firstLessonDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 0) {
        console.log(`${school.name} is already aligned to target week.`);
        return;
    }

    console.log(`   First Lesson: ${firstLessonDateStr} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]})`);
    console.log(`   Target Date:  ${targetDate.toISOString().split('T')[0]}`);
    console.log(`   Shift:        ${diffDays > 0 ? '+' : ''}${diffDays} days`);
    console.log(`   Lessons to move: ${lessonsToMove.length}`);

    // 5. Perform Updates
    const updates = lessonsToMove.map(l => {
        const oldDate = new Date(l.date);
        const newDate = new Date(oldDate);
        newDate.setDate(newDate.getDate() + diffDays);
        return {
            id: l.id,
            date: newDate.toISOString().split('T')[0]
        };
    });

    // Batch update
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        await Promise.all(batch.map(u =>
            supabase.from('lessons').update({ date: u.date }).eq('id', u.id)
        ));
        process.stdout.write('.');
    }
    console.log(' Done.');
}

async function run() {
    console.log('Fetching schools...');
    const { data: schools, error } = await supabase
        .from('schools')
        .select('id, name');

    if (error) {
        console.error('Error fetching schools:', error);
        return;
    }

    console.log(`Found ${schools.length} schools.`);

    for (const s of schools) {
        await shiftSchool(s);
    }
}

run();
