
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log('Inspecting Class Groups...');

    // Inspect Teachers
    console.log('Inspecting Teachers...');
    const { data: teachers, error: tErr } = await supabase.from('teachers').select('id, name, branch_id').limit(1);
    if (tErr) console.error('Teacher Error:', tErr);
    else console.log('Teacher sample:', teachers);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Recent Classes:', classes.map(c => ({
        id: c.id,
        name: c.name,
        school_id: c.school_id,
        branch_id: c.branch_id, // checking if this column exists and is populated
        created_at: c.created_at
    })));

    // Find specific branch
    const { data: specificBranch } = await supabase.from('schools').select('*').ilike('name', '%Kurtköy%');
    console.log('Kurtköy Branch:', specificBranch);

    if (specificBranch && specificBranch.length > 0) {
        const branchId = specificBranch[0].id;
        console.log('Searching for classes with school_id =', branchId);
        const { data: linkedClasses } = await supabase.from('class_groups').select('*').eq('school_id', branchId);
        console.log('Linked Classes:', linkedClasses);
    }
}

inspectData();
