
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

const TARGET_START_DATE = '2026-02-02';
const WEEKS_REQUIRED = 4;

const DAYS_MAP = {
    'pazartesi': 1, 'pzt': 1, 'mon': 1,
    'salı': 2, 'sali': 2, 'tue': 2,
    'çarşamba': 3, 'carsamba': 3, 'wed': 3,
    'perşembe': 4, 'persembe': 4, 'thu': 4,
    'cuma': 5, 'fri': 5,
    'cumartesi': 6, 'sat': 6,
    'pazar': 0, 'sun': 0
};

function parseSchedule(scheduleStr) {
    if (!scheduleStr) return [];

    // Normalize
    const lower = scheduleStr.toLowerCase();

    // Simple heuristic: look for day names
    const daysFound = [];
    Object.keys(DAYS_MAP).forEach(d => {
        if (lower.includes(d)) {
            // Avoid double counting (e.g. 'pazartesi' and 'pzt' both match? No keys are unique enough mostly)
            // But 'pazartesi' includes 'pazar'? No. 'pazar' includes 'pazartesi'? No. 
            // Wait, 'pazar' is inside 'pazartesi'.
            // Better regex matching.
            const regex = new RegExp(`\\b${d}\\b`, 'i');
            // Actually many times it's just "Pazartesi 13:00".
            // Let's use includes for now but verify 'pazar' vs 'pazartesi'.

            if (d === 'pazar' && lower.includes('pazartesi')) return; // Skip if it's actually mon
            if (d === 'sali' && lower.includes('salı')) return; // duplicates

            // Check if we already added this day index
            const dayIdx = DAYS_MAP[d];
            if (!daysFound.includes(dayIdx)) {
                daysFound.push(dayIdx);
            }
        }
    });

    return [...new Set(daysFound)].sort(); // Unique sorted days
}

async function processClass(classGroup) {
    // 1. Parse schedule to find frequency per week
    const days = parseSchedule(classGroup.schedule);
    if (days.length === 0) {
        console.log(`[Skip] ${classGroup.name}: Could not parse schedule '${classGroup.schedule}'`);
        return;
    }

    const lessonsPerWeek = days.length;
    const targetTotal = lessonsPerWeek * WEEKS_REQUIRED;

    // 2. Count existing future lessons
    const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('class_group_id', classGroup.id)
        .gte('date', TARGET_START_DATE)
        .eq('status', 'scheduled')
        .order('date', { ascending: true });

    if (error) {
        console.error(`Error fetching lessons for ${classGroup.name}:`, error);
        return;
    }

    const currentCount = lessons.length;
    let needed = targetTotal - currentCount;

    console.log(`Processing ${classGroup.name} (${classGroup.schedule})`);
    console.log(`   Freq: ${lessonsPerWeek}/week. Target: ${targetTotal}. Found: ${currentCount}. Needed: ${needed}`);

    if (needed <= 0) {
        console.log('   OK. No extension needed.');
        return;
    }

    // 3. Generate new lessons
    // Start from the last scheduled lesson, or Feb 2 if none.
    let lastDateObj;
    if (lessons.length > 0) {
        lastDateObj = new Date(lessons[lessons.length - 1].date);
    } else {
        lastDateObj = new Date(TARGET_START_DATE);
        // Adjust back so we can "find next". 
        lastDateObj.setDate(lastDateObj.getDate() - 1);
    }

    const newLessons = [];
    while (needed > 0) {
        // Find next valid day
        let nextDate = new Date(lastDateObj);
        nextDate.setDate(nextDate.getDate() + 1);

        while (!days.includes(nextDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + 1);
        }

        lastDateObj = nextDate; // Advance

        newLessons.push({
            school_id: classGroup.school_id,
            class_group_id: classGroup.id,
            date: nextDate.toISOString().split('T')[0],
            status: 'scheduled',
            name: `${classGroup.name} Dersi`, // Default name, maybe check existing
            topics: []
        });

        needed--;
    }

    if (newLessons.length > 0) {
        console.log(`   Creating ${newLessons.length} new lessons...`);
        const { error: insertError } = await supabase.from('lessons').insert(newLessons);
        if (insertError) console.error('   Insert Error:', insertError);
        else console.log('   Success.');
    }
}

async function run() {
    console.log('Fetching class groups...');
    const { data: classes, error } = await supabase
        .from('class_groups')
        .select('id, school_id, name, schedule');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${classes.length} classes.`);

    for (const c of classes) {
        await processClass(c);
    }
}

run();
