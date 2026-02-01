
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClasses() {
    const branchId = '11214e69-780c-4221-9606-feb10fb5f0aa';
    console.log('Checking classes for Branch:', branchId);

    // Check if branch exists in schools now (it should)
    const { data: schoolCheck } = await supabase.from('schools').select('id, name').eq('id', branchId);
    console.log('Is Branch in Schools table?', schoolCheck && schoolCheck.length > 0 ? 'YES' : 'NO');

    // Inspect branches table structure
    const { data: branches, error: bErr } = await supabase.from('branches').select('*').limit(1);

    if (bErr) {
        console.error('Error fetching branches:', bErr);
    } else {
        console.log('Branches table sample:', branches);
    }

    // Inspect Manager Teacher Record
    const managerId = '2df8425d-3481-4d8a-b22d-fb736560644c';
    const { data: manager, error: mErr } = await supabase.from('teachers').select('*').eq('id', managerId).single();
    if (mErr) console.error('Manager fetch error:', mErr);
    else console.log('Manager Record:', manager);

    // List ALL classes to see what's out there
    const { data: classes, error } = await supabase
        .from('class_groups')
        .select('id, name, school_id, branch_id') // Added branch_id
        .limit(100);

    if (error) {
        console.error('Error fetching classes:', error);
    } else {
        console.log(`Found ${classes.length} classes total.`);

        // Count non-null branch_ids
        const withBranch = classes.filter(c => c.branch_id);
        console.log(`Classes with non-null branch_id: ${withBranch.length}`);

        if (withBranch.length > 0) {
            console.log('Sample classes with branch_id:');
            withBranch.slice(0, 5).forEach(c => {
                console.log(`- ${c.name} | Branch: ${c.branch_id} | School: ${c.school_id}`);
            });
        }

        // Also check if any matches the target ID manually in loop to be sure
        const match = classes.find(c => c.branch_id == branchId);
        console.log('Direct match check:', match ? 'FOUND' : 'NOT FOUND');
    }
}

checkClasses();
