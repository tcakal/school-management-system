
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStudents() {
    const { data: students, error } = await supabase
        .from('students')
        .select('id, name, status, created_at, branch_id, school_id')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error(error)
        return
    }

    console.log('--- LATEST STUDENTS ---')
    students.forEach(s => {
        console.log(`${s.created_at} | ${s.name} | ${s.status} | Branch: ${s.branch_id} | School: ${s.school_id}`)
    })
}

checkStudents()
