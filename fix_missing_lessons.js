
import { createClient } from '@supabase/supabase-js';
import { format, startOfWeek, addWeeks, addDays } from 'date-fns';

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function regenerateLessons() {
    const groupId = 'cc1d6a41-2c57-4802-8819-9bf0b6e0ac7c';
    console.log('Regenerating lessons for group:', groupId);

    // 1. Fetch Assignments
    const { data: assignments } = await supabase.from('teacher_assignments').select('*').eq('class_group_id', groupId);
    if (!assignments) return;

    // 2. Fetch Existing Lessons
    const { data: existingLessons } = await supabase.from('lessons').select('*').eq('class_group_id', groupId).gte('date', '2026-02-03');

    const todayStr = '2026-02-03';
    const weeks = 4;
    const newLessons = [];

    const baseDate = new Date();
    const startOfBaseWeek = startOfWeek(baseDate, { weekStartsOn: 1 });

    for (let i = 0; i < weeks; i++) {
        const weekStart = addWeeks(startOfBaseWeek, i);

        assignments.forEach(assignment => {
            const lessonDate = addDays(weekStart, assignment.day_of_week - 1);
            const dateStr = format(lessonDate, 'yyyy-MM-dd');

            if (dateStr < todayStr) return;

            const exists = (existingLessons || []).some(l =>
                l.date === dateStr &&
                l.start_time === assignment.start_time &&
                l.teacher_id === assignment.teacher_id
            );

            const alreadyInQueue = newLessons.some(l =>
                l.date === dateStr &&
                l.start_time === assignment.start_time &&
                l.teacher_id === assignment.teacher_id
            );

            if (!exists && !alreadyInQueue) {
                console.log(`Adding missing lesson: ${dateStr} ${assignment.start_time} (Teacher: ${assignment.teacher_id})`);
                newLessons.push({
                    id: crypto.randomUUID(),
                    school_id: assignment.school_id,
                    class_group_id: assignment.class_group_id,
                    teacher_id: assignment.teacher_id,
                    date: dateStr,
                    start_time: assignment.start_time,
                    end_time: assignment.end_time,
                    status: 'scheduled',
                    type: 'regular'
                });
            }
        });
    }

    if (newLessons.length > 0) {
        console.log(`Inserting ${newLessons.length} lessons...`);
        const { error } = await supabase.from('lessons').insert(newLessons);
        if (error) console.error('Error:', error);
        else console.log('Successfully inserted.');
    } else {
        console.log('No missing lessons found.');
    }
}

regenerateLessons();
