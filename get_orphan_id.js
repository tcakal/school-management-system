
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function getOrphanStudentId() {
    const { data: students, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('name', 'deneme öğretncisi')
        .is('branch_id', null)
        .is('school_id', null)
        .eq('status', 'Active')

    if (error) {
        console.error(error)
        return
    }

    if (students && students.length > 0) {
        console.log(`ORPHAN_STUDENT_ID:${students[0].id}`)
    } else {
        console.log('ORPHAN_STUDENT_NOT_FOUND')
    }
}

getOrphanStudentId()
