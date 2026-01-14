
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf-8');
const env = envConfig.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {} as Record<string, string>);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Starting data fix...');

    // 1. Ensure Teacher exists (or find ID 1)
    const { data: teachers, error: tErr } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', '1');

    // If getting by text ID fails, we might need a UUID.
    // If user previously set ID '1' (text) via SQL, it might be valid if the column allows text or auto-cast.
    // But error said "invalid input syntax for type uuid". So ID must be UUID.

    let teacherId: string;

    if (tErr || !teachers || teachers.length === 0) {
        console.log('Teacher ID 1 not found or invalid UUID. Creating/Finding a teacher.');
        const { data: anyTeacher } = await supabase.from('teachers').select('id').limit(1);

        if (anyTeacher && anyTeacher.length > 0) {
            teacherId = anyTeacher[0].id; // Use existing teacher
        } else {
            const { data: newTeacher, error: ntErr } = await supabase.from('teachers').insert({
                name: 'Test Teacher',
                phone: '5551112233',
                role: 'teacher',
                email: 'test@example.com'
            }).select().single();
            if (ntErr) { console.error("Error creating teacher:", ntErr); return; }
            teacherId = newTeacher.id;
        }

        // Update local storage script needs this ID
        console.log(`IMPORTANT: Updated Teacher ID is: ${teacherId}. Update the browser script!`);
    } else {
        teacherId = teachers[0].id;
    }

    console.log('Using Teacher ID:', teacherId);

    // 2. Get a School (or create)
    let schoolId: string;
    const { data: schools } = await supabase.from('schools').select('id').limit(1);
    if (schools && schools.length > 0) {
        schoolId = schools[0].id;
    } else {
        console.log('No schools found. Creating one.');
        const { data: newSchool, error: sErr } = await supabase.from('schools').insert({
            name: 'Demo School',
            phone: '555'
        }).select().single();
        if (sErr) throw sErr;
        schoolId = newSchool.id;
    }
    console.log('Using School ID:', schoolId);

    // 3. Create/Get Class Group (using class_groups table)
    let classGroupId: string;
    const { data: classGroups } = await supabase.from('class_groups').select('id').eq('name', 'Demo Class').eq('school_id', schoolId);
    if (classGroups && classGroups.length > 0) {
        classGroupId = classGroups[0].id;
    } else {
        const { data: newClass, error: cErr } = await supabase.from('class_groups').insert({
            name: 'Demo Class',
            school_id: schoolId,
            schedule: 'Mon-Fri 09:00-15:00'
        }).select().single();
        if (cErr) {
            console.error('Error creating class:', cErr);
            // Try to find ANY class
            const { data: anyClass } = await supabase.from('class_groups').select('id').limit(1);
            if (anyClass && anyClass.length > 0) classGroupId = anyClass[0].id;
            else throw new Error("No class groups and cannot create one");
        } else {
            classGroupId = newClass.id;
        }
    }
    console.log('Using Class Group ID:', classGroupId);

    // 4. Create Students (if not exist)
    const { data: existingStudents } = await supabase.from('students').select('id').eq('class_group_id', classGroupId);
    if (!existingStudents || existingStudents.length < 2) {
        console.log('Creating students...');
        // Attempt with minimal info
        const { error: sErr } = await supabase.from('students').insert([
            {
                name: 'Ali Yılmaz',
                school_id: schoolId,
                class_group_id: classGroupId
            },
            {
                name: 'Ayşe Demir',
                school_id: schoolId,
                class_group_id: classGroupId
            }
        ]);
        if (sErr) console.error('Error creating students:', sErr);
        else console.log('Students created.');
    } else {
        console.log('Students already exist in class.', existingStudents.length);
    }

    // 5. Create Lesson for TODAY
    const now = new Date();
    // Format date as YYYY-MM-DD
    const dateStr = now.toISOString().split('T')[0];
    const startTime = "10:00";
    const endTime = "10:40";

    console.log('Creating/Checking Lesson for:', dateStr, startTime);

    // Check if lesson exists for teacher today
    const { data: lessons } = await supabase.from('lessons')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('date', dateStr);

    if (lessons && lessons.length > 0) {
        console.log('Lesson already exists for today:', lessons[0]);
    } else {
        // We need to guess the columns. Based on index.ts:
        // schoolId, classGroupId, teacherId, date, startTime, endTime, status, type, topic
        const { error: lErr } = await supabase.from('lessons').insert({
            school_id: schoolId,
            class_group_id: classGroupId, // snake_case likely
            teacher_id: teacherId,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            status: 'scheduled',
            type: 'regular',
            topic: 'Matematik'
        });

        if (lErr) {
            console.error('Error creating lesson:', lErr);
            // Fallback: maybe columns are camelCase? Highly unlikely for Supabase/Postgres.
            // Or maybe 'topic' is 'title'? 
            if (lErr.message.includes('column "topic" does not exist')) {
                console.log("Retrying with 'title' column...");
                const { error: lErr2 } = await supabase.from('lessons').insert({
                    school_id: schoolId,
                    class_group_id: classGroupId,
                    teacher_id: teacherId,
                    date: dateStr,
                    start_time: startTime,
                    end_time: endTime,
                    status: 'scheduled',
                    type: 'regular',
                    title: 'Matematik' // Try title
                });
                if (lErr2) console.error('Error creating lesson (attempt 2):', lErr2);
                else console.log('Lesson created (attempt 2 used title).');
            }
        }
        else console.log('Lesson created successfully.');
    }
}

main();
