import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function analyzeLessons() {
    console.log('Fetching lessons and teachers...');

    const [lessonsRes, teachersRes] = await Promise.all([
        supabase.from('lessons').select('id, date, start_time, teacher_id, teacher_ids, class_group_id').eq('status', 'scheduled'),
        supabase.from('teachers').select('id, name')
    ]);

    if (lessonsRes.error || teachersRes.error) {
        console.error('Error fetching data:', lessonsRes.error || teachersRes.error);
        return;
    }

    const teacherMap = {};
    teachersRes.data.forEach(t => teacherMap[t.id] = t.name);

    const report = {};

    lessonsRes.data.forEach(l => {
        const key = `${l.class_group_id} @ ${l.start_time}`;
        if (!report[key]) report[key] = [];

        report[key].push({
            date: l.date,
            teacherId: l.teacher_id,
            teacherIds: l.teacher_ids || [],
            teacherNames: (l.teacher_ids || []).map(id => teacherMap[id] || 'Unknown')
        });
    });

    Object.keys(report).forEach(slot => {
        // Only show slots that have some discrepancy or multiple records across dates
        const distinctTeachersInSlot = new Set();
        report[slot].forEach(e => e.teacherNames.forEach(n => distinctTeachersInSlot.add(n)));

        if (distinctTeachersInSlot.size > 1) {
            console.log(`\nSlot: ${slot}`);
            report[slot].sort((a, b) => a.date.localeCompare(b.date)).forEach(entry => {
                console.log(`  ${entry.date}: Names=${JSON.stringify(entry.teacherNames)}, Legacy=${teacherMap[entry.teacherId]}`);
            });
        }
    });
}

analyzeLessons();
