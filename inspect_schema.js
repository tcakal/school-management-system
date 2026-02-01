
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('Checking for branches table...');
    const { data: branchesData, error: branchError } = await supabase.from('branches').select('*').limit(1);

    if (branchError) {
        console.log('Branches table access error (might not exist):', branchError.message);
    } else {
        console.log('Branches table exists. Sample:', branchesData);
    }

    console.log('Inspecting schools constraints by attempting invalid insert...');
    const { error: insertError } = await supabase.from('schools').insert({}).select();
    if (insertError) {
        console.log('Schools constraint info:', insertError.message);
    } else {
        console.log('Warn: Empty insert succeeded (unexpected).');
    }

    console.log('\nInspecting teacher_assignments columns (via empty insert error if possible, or just inference)...');
    // We can't query information_schema easily with supabase-js client without SQL function.
    // But we can try to Select a column 'branch_id' and see if it errors.

    const { data: assignData, error: assignError } = await supabase
        .from('teacher_assignments')
        .select('id, school_id, branch_id') // Try to select branch_id
        .limit(1);

    if (assignError) {
        console.log('Error selecting branch_id:', assignError.message);
    } else {
        console.log('Successfully selected branch_id from teacher_assignments. Value:', assignData);
    }
}

inspectSchema();
