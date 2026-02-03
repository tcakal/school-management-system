
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLessons() {
    const groupName = 'ASLAN ÇİMENTO 2. SINIF (Pazartesi)';

    // 1. Find group
    const { data: groups } = await supabase.from('class_groups').select('id, name').ilike('name', `%${groupName}%`);
    if (!groups || groups.length === 0) {
        console.log('Group not found');
        return;
    }
    const groupId = groups[0].id;
    console.log(`Checking lessons for group: ${groups[0].name} (${groupId})`);

    // 2. Find assignments
    const { data: assignments } = await supabase.from('teacher_assignments').select('*').eq('class_group_id', groupId);
    console.log('Assignments:', assignments?.map(a => ({ teacherId: a.teacher_id, time: a.start_time })));

    // 3. Find lessons
    const { data: lessons } = await supabase.from('lessons')
        .select('*, teachers(name)')
        .eq('class_group_id', groupId)
        .gte('date', '2026-02-02')
        .order('date', { ascending: true });

    console.log('Lessons found:', lessons?.length);
    lessons?.forEach(l => {
        console.log(`- ${l.date} ${l.start_time}: ${l.teachers?.name} (Status: ${l.status})`);
    });
}

checkLessons();
