
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
    // Try to insert a dummy lesson with type 'extra'
    // We need valid school_id etc. Let's fetch one first.
    const { data: schools } = await supabase.from('schools').select('id').limit(1);
    const { data: classes } = await supabase.from('class_groups').select('id').eq('school_id', schools[0].id).limit(1);

    if (!schools || !classes) {
        console.log('No data to test with.');
        return;
    }

    const payload = {
        school_id: schools[0].id,
        class_group_id: classes[0].id,
        teacher_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID? Might fail FK.
        // Let's get a real teacher or just try insertion and see if it complains about TYPE or FK first.
        date: '2099-01-01',
        start_time: '00:00',
        end_time: '00:00',
        status: 'cancelled', // So it doesn't show up easily
        type: 'extra'
    };

    console.log('Attempting insert with type="extra"...');
    // We expect FK error for teacher maybe, but if we get "check constraint" error, we know type is restricted.
    const { error } = await supabase.from('lessons').insert(payload);

    if (error) {
        console.log('Error:', error.message);
        console.log('Code:', error.code);
        if (error.message.includes('constraint') && error.message.includes('type')) {
            console.log('FAIL: Type constraint exists.');
        } else if (error.code === '23503') { // FK violation
            console.log('SUCCESS: Type accepted (FK error means type was passed).');
        } else {
            console.log('Unknown error, might be strict.');
        }
    } else {
        console.log('SUCCESS: Inserted successfully.');
        // Cleanup
        await supabase.from('lessons').delete().eq('date', '2099-01-01');
    }
}

testInsert();
