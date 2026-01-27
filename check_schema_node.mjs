
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking "schools" table for "type" column...');

    // Try to select the 'type' column from a single record
    const { data, error } = await supabase
        .from('schools')
        .select('type')
        .limit(1);

    if (error) {
        console.error('Error fetching "type" column:', error);
        if (error.code === 'PGRST204') { // Column not found error code (approximate) or similar
            console.log('Pass: It seems the column might not exist or there is another error.');
        }
    } else {
        console.log('Success: "type" column exists.');
        console.log('Sample data:', data);
    }

    // Also fetch all columns for a single record to see what exists
    const { data: allData, error: allError } = await supabase
        .from('schools')
        .select('*')
        .limit(1);

    if (allError) {
        console.error('Error fetching school record:', allError);
    } else {
        console.log('Available columns in "schools" table:', Object.keys(allData[0] || {}));
    }
}

checkSchema();
