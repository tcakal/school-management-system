import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDuplicates() {
    console.log('Checking for duplicate lesson slots...');

    const { data: lessons, error } = await supabase
        .from('lessons')
        .select('id, class_group_id, date, start_time, teacher_id, teacher_ids')
        .eq('status', 'scheduled');

    if (error) {
        console.error('Error fetching lessons:', error);
        return;
    }

    const slots = {};
    const toMerge = [];

    lessons.forEach(l => {
        const key = `${l.class_group_id}-${l.date}-${l.start_time}`;
        if (!slots[key]) {
            slots[key] = [l];
        } else {
            slots[key].push(l);
        }
    });

    Object.keys(slots).forEach(key => {
        if (slots[key].length > 1) {
            console.log(`Duplicate slot found: ${key}`);
            console.log('Lessons:', slots[key].map(l => ({ id: l.id, teacher: l.teacher_id, teacherIds: l.teacher_ids })));
            toMerge.push(slots[key]);
        }
    });

    if (toMerge.length === 0) {
        console.log('No duplicate slots found in the database.');
    } else {
        console.log(`Found ${toMerge.length} slots with multiple lesson entries.`);
    }
}

checkDuplicates();
