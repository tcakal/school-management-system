
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqdtcbghgnisgivtplpf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHRjYmdoZ25pc2dpdnRwbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk1MzAsImV4cCI6MjA4MzI2NTUzMH0.ldyj7Hl9C_nCQFYLOgu9Yhj50mTaqjcPUc-qvDbBnW8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    // Get all schools
    const { data: schools, error: schoolError } = await supabase
        .from('schools')
        .select('id, name')

    if (schoolError) {
        console.error('Error fetching schools:', schoolError)
        return
    }

    console.log(`Found ${schools.length} schools. Checking schedules...`)

    for (const school of schools) {
        // Find the earliest lesson for each school
        const { data: lessons, error: lessonError } = await supabase
            .from('lessons')
            .select('date, status')
            .eq('school_id', school.id)
            .order('date', { ascending: true })
            .limit(1)

        if (lessonError) {
            console.error(`Error fetching lessons for ${school.name}:`, lessonError)
            continue
        }

        if (lessons && lessons.length > 0) {
            const date = new Date(lessons[0].date);
            const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
            console.log(`School: ${school.name} (ID: ${school.id}) - First Lesson: ${lessons[0].date} (${dayName}) (Status: ${lessons[0].status})`)
        } else {
            console.log(`School: ${school.name} (ID: ${school.id}) - No lessons found`)
        }
    }
}

check()
