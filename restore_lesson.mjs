
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

// Pass school ID as argument
async function appendLesson(schoolId) {
    if (!schoolId) {
        console.error('Please provide a school ID');
        return;
    }

    // 1. Get last lesson
    const { data: lastLessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'scheduled')
        .order('date', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching last lesson:', error);
        return;
    }

    let lastLesson = lastLessons && lastLessons.length > 0 ? lastLessons[0] : null;

    if (!lastLesson) {
        // Try any status
        const { data: anyLast, error: anyError } = await supabase
            .from('lessons')
            .select('*')
            .eq('school_id', schoolId)
            .order('date', { ascending: false })
            .limit(1);

        lastLesson = anyLast && anyLast.length > 0 ? anyLast[0] : null;
    }

    if (!lastLesson) {
        console.error('No lessons found for this school to copy from.');
        return;
    }

    const newDate = new Date(lastLesson.date);
    newDate.setDate(newDate.getDate() + 7);
    const newDateStr = newDate.toISOString().split('T')[0];

    console.log(`Appending new lesson on ${newDateStr} (after ${lastLesson.date})...`);

    const { data: inserted, error: insertError } = await supabase
        .from('lessons')
        .insert({
            school_id: lastLesson.school_id,
            class_group_id: lastLesson.class_group_id,
            teacher_id: lastLesson.teacher_id,
            date: newDateStr,
            start_time: lastLesson.start_time,
            end_time: lastLesson.end_time,
            status: 'scheduled',
            type: lastLesson.type,
            topic: lastLesson.topic,
            notes: lastLesson.notes
        })
        .select();

    if (insertError) {
        console.error('Error moving lesson:', insertError); // moving? inserting
    } else {
        console.log('Successfully appended lesson:', inserted[0].id);
    }
}

const targetSchoolId = process.argv[2];
appendLesson(targetSchoolId);
