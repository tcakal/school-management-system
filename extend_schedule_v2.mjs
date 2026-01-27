
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

const TARGET_START_DATE = '2026-02-02';
const WEEKS_REQUIRED = 4;

const DAYS_MAP = {
    'pazartesi': 1, 'ptesi': 1, 'pzt': 1,
    'salı': 2, 'sali': 2, 'sal': 2,
    'çarşamba': 3, 'carsamba': 3, 'çrş': 3, 'crs': 3,
    'perşembe': 4, 'persembe': 4, 'prş': 4, 'prs': 4,
    'cumartesi': 6, 'cmts': 6, 'ctesi': 6,
    'cuma': 5, 'cum': 5,
    'pazar': 0, 'paz': 0
};

const SORTED_KEYS = Object.keys(DAYS_MAP).sort((a, b) => b.length - a.length);

function parseSchedule(scheduleStr) {
    if (!scheduleStr) return [];

    let lower = scheduleStr.toLowerCase();
    const daysFound = [];

    for (const key of SORTED_KEYS) {
        if (lower.includes(key)) {
            daysFound.push(DAYS_MAP[key]);
            lower = lower.replace(key, ' ');
        }
    }

    return [...new Set(daysFound)].sort();
}

async function processClass(classGroup) {
    const days = parseSchedule(classGroup.schedule);
    if (days.length === 0) {
        console.log(`[Skip] ${classGroup.name}: Could not parse schedule '${classGroup.schedule}'`);
        return;
    }

    const lessonsPerWeek = days.length;
    const targetTotal = lessonsPerWeek * WEEKS_REQUIRED;

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

    if (needed <= 0) {
        return;
    }

    console.log(`   -> Needs ${needed} more lessons.`);

    let templateLesson = null;
    let lastDateObj;

    if (lessons.length > 0) {
        templateLesson = lessons[lessons.length - 1];
        lastDateObj = new Date(templateLesson.date);
    } else {
        const { data: prevLessons } = await supabase
            .from('lessons')
            .select('*')
            .eq('class_group_id', classGroup.id)
            .limit(1)
            .order('date', { ascending: false });

        if (prevLessons && prevLessons.length > 0) {
            templateLesson = prevLessons[0];
            lastDateObj = new Date(TARGET_START_DATE);
            lastDateObj.setDate(lastDateObj.getDate() - 1);
        } else {
            // Fallback: Parse time
            const timeMatch = classGroup.schedule.match(/(\d{1,2})[.:](\d{2})/);
            if (timeMatch) {
                const hour = parseInt(timeMatch[1]);
                const minute = parseInt(timeMatch[2]);
                const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

                let endHour = hour + 1;
                let endMinute = minute + 20;
                if (endMinute >= 60) {
                    endHour++;
                    endMinute -= 60;
                }
                const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

                templateLesson = { start_time: startTime, end_time: endTime };
                lastDateObj = new Date(TARGET_START_DATE);
                lastDateObj.setDate(lastDateObj.getDate() - 1);

                console.log(`   [Info] Parsed time ${startTime}-${endTime} from schedule string.`);
            } else {
                console.log('   [Warning] No past lessons found and could not parse time. Skipping.');
                return;
            }
        }
    }

    const newLessons = [];
    while (needed > 0) {
        let nextDate = new Date(lastDateObj);
        nextDate.setDate(nextDate.getDate() + 1);

        let safety = 0;
        while (!days.includes(nextDate.getDay()) && safety < 14) {
            nextDate.setDate(nextDate.getDate() + 1);
            safety++;
        }

        lastDateObj = nextDate;

        newLessons.push({
            school_id: classGroup.school_id,
            class_group_id: classGroup.id,
            date: nextDate.toISOString().split('T')[0],
            status: 'scheduled',
            start_time: templateLesson.start_time,
            end_time: templateLesson.end_time,
            type: 'regular'
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
