import { create } from 'zustand';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import type { School, Student, ClassGroup, Payment, Teacher, TeacherAssignment, ActivityLog, Lesson, Attendance, NotificationTemplate, TeacherLeave, SystemSettings, StudentEvaluation, TeacherEvaluation, InventoryItem, MakerProject, MakerProjectUpdate, MakerProjectDocument, MakerProjectStudent, Branch } from '../types';
import { addWeeks, format, startOfWeek } from 'date-fns';

interface AppState {
    schools: School[];
    students: Student[];
    classGroups: ClassGroup[];
    payments: Payment[];
    teachers: Teacher[];
    assignments: TeacherAssignment[];
    logs: ActivityLog[];
    traceLogs: { id: string, log_time: string, message: string }[];
    lessons: Lesson[];
    attendance: Attendance[];
    notificationTemplates: NotificationTemplate[];
    leaves: TeacherLeave[];
    inventory: InventoryItem[];
    branches: Branch[]; // NEW: Branches array

    // Theme & Settings
    theme: 'light' | 'dark';
    systemSettings: SystemSettings | null;
    toggleTheme: () => void;
    updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>;

    loading: boolean;
    initialized: boolean;
    logsOffset: number;
    lastActivityLogView: string | null;
    markActivityLogSeen: () => void;

    fetchData: () => Promise<void>;

    addSchool: (school: School) => Promise<void>;
    updateSchool: (id: string, school: Partial<School>) => Promise<void>;
    deleteSchool: (id: string) => Promise<void>;

    addStudent: (student: Student) => Promise<void>;
    updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;

    addClassGroup: (group: ClassGroup) => Promise<void>;

    addPayment: (payment: Payment) => Promise<void>;
    updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;

    addTeacher: (teacher: Teacher) => Promise<void>;
    updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
    deleteTeacher: (id: string) => Promise<void>;

    addAssignment: (assignment: TeacherAssignment) => Promise<void>;
    updateAssignment: (id: string, updates: Partial<TeacherAssignment>, regenerateLessons?: boolean) => Promise<void>;
    deleteAssignment: (id: string) => Promise<void>;

    // Lesson Management
    generateLessons: (weeks?: number, classGroupId?: string, startDate?: Date | string) => Promise<void>;
    addLesson: (lesson: Lesson) => Promise<void>;
    updateLesson: (id: string, updates: Partial<Lesson>) => Promise<void>;
    deleteLesson: (id: string) => Promise<void>;
    deleteClassGroup: (id: string) => Promise<void>;
    updateClassGroup: (id: string, updates: Partial<ClassGroup>) => Promise<void>;
    toggleClassStatus: (id: string, status: 'active' | 'archived') => Promise<void>;

    saveAttendance: (lessonId: string, records: { studentId: string, status: 'present' | 'absent' | 'late' | 'excused' }[]) => Promise<void>;

    // Evaluations
    studentEvaluations: StudentEvaluation[];
    teacherEvaluations: TeacherEvaluation[];
    addStudentEvaluation: (evaluation: Omit<StudentEvaluation, 'id' | 'createdAt'>) => Promise<void>;
    addTeacherEvaluation: (evaluation: Omit<TeacherEvaluation, 'id' | 'createdAt'>) => Promise<void>;

    // Notification Templates
    addNotificationTemplate: (template: NotificationTemplate) => Promise<void>;
    updateNotificationTemplate: (id: string, updates: Partial<NotificationTemplate>) => Promise<void>;
    deleteNotificationTemplate: (id: string) => Promise<void>;

    // Leaves
    addLeave: (leave: Omit<TeacherLeave, 'id'>) => Promise<void>; // Changed TeacherLeave to Leave and added Omit
    updateLeave: (id: string, updates: Partial<TeacherLeave>) => Promise<void>; // Added updateLeave
    deleteLeave: (id: string) => Promise<void>;
    findAvailableTeachers: (date: string, startTime: string, endTime: string) => Promise<Teacher[]>;

    // Inventory
    fetchInventory: (schoolId: string) => Promise<void>;
    addInventoryItem: (item: InventoryItem) => Promise<void>;
    updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
    deleteInventoryItem: (id: string) => Promise<void>;

    // Activity Log Helper
    logAction: (action: string, details: string, entityType?: string, entityId?: string) => Promise<void>; // entityType made optional
    fetchMoreLogs: () => Promise<void>; // Added fetchMoreLogs
    fetchTraceLogs: () => Promise<void>;

    // Maker Fair
    makerProjects: MakerProject[];
    makerProjectUpdates: MakerProjectUpdate[];
    makerProjectDocuments: MakerProjectDocument[];
    makerProjectStudents: MakerProjectStudent[]; // Use this to track relations

    fetchMakerProjects: (schoolId: string) => Promise<void>;
    addMakerProject: (project: Omit<MakerProject, 'id' | 'createdAt'>) => Promise<void>;
    updateMakerProject: (id: string, updates: Partial<MakerProject>) => Promise<void>;
    deleteMakerProject: (id: string) => Promise<void>;

    assignStudentToProject: (projectId: string, studentId: string) => Promise<void>;
    removeStudentFromProject: (projectId: string, studentId: string) => Promise<void>;

    addMakerProjectUpdate: (update: Omit<MakerProjectUpdate, 'id' | 'createdAt'>) => Promise<void>;
    addMakerProjectDocument: (doc: Omit<MakerProjectDocument, 'id' | 'createdAt'>) => Promise<void>;
    deleteMakerProjectDocument: (id: string) => Promise<void>;

    // Financial System
    seasons: { id: string; name: string; startDate: string; endDate: string; isActive: boolean }[];
    fetchSeasons: () => Promise<void>;
    fetchSchoolPeriods: (schoolId: string, seasonId: string) => Promise<any[]>; // Returns local data
    generateSchoolPeriods: (schoolId: string, seasonId: string) => Promise<void>;
    checkAndGeneratePeriods: (schoolId: string, seasonId: string) => Promise<void>;
    addFinancialTransaction: (data: {
        schoolId: string,
        amount: number,
        type: 'payment' | 'write_off',
        seasonId: string,
        periodId?: string,
        date: string,
        method?: string,
        notes?: string
    }) => Promise<void>;
    fetchSchoolSeasonStats: (schoolId: string, seasonId: string) => Promise<any>;
    closeSchoolSeason: (schoolId: string, seasonId: string, notes?: string) => Promise<void>;
    addSchoolPeriod: (schoolId: string, seasonId: string, startDate: string, endDate: string) => Promise<void>;
    deleteSchoolPeriod: (periodId: string) => Promise<void>;

    // Branches CRUD
    fetchBranches: () => Promise<void>;
    addBranch: (branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateBranch: (id: string, updates: Partial<Branch>) => Promise<void>;
    deleteBranch: (id: string) => Promise<void>;
}

import { persist } from 'zustand/middleware';

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            schools: [],
            students: [],
            classGroups: [],
            payments: [],
            teachers: [],
            assignments: [],
            logs: [],
            traceLogs: [],
            lessons: [],
            attendance: [],
            studentEvaluations: [],
            teacherEvaluations: [],
            notificationTemplates: [],
            leaves: [],
            inventory: [],
            makerProjects: [],
            makerProjectUpdates: [],
            makerProjectDocuments: [],
            makerProjectStudents: [],
            seasons: [],
            branches: [], // NEW: Branches initial state
            theme: 'light',
            systemSettings: null,
            loading: false,
            initialized: false,
            logsOffset: 0,
            lastActivityLogView: null,

            markActivityLogSeen: () => {
                set({ lastActivityLogView: new Date().toISOString() });
            },

            toggleTheme: () => {
                // Theme is now permanently dark
                return;
            },

            updateSystemSettings: async (updates) => {
                const current = get().systemSettings;
                const dbUpdate: any = {};

                if (updates.logoUrl !== undefined) dbUpdate.logo_url = updates.logoUrl;
                if (updates.systemName !== undefined) dbUpdate.system_name = updates.systemName;
                if (updates.telegramBotToken !== undefined) dbUpdate.telegram_bot_token = updates.telegramBotToken;
                if (updates.adminChatId !== undefined) dbUpdate.admin_chat_id = updates.adminChatId;

                if (current?.id) {
                    if (Object.keys(dbUpdate).length > 0) {
                        const { error } = await supabase
                            .from('system_settings')
                            .update(dbUpdate)
                            .eq('id', current.id);

                        if (error) {
                            console.error('Error updating system settings:', error);
                            throw error;
                        }
                        set({ systemSettings: { ...current, ...updates } });
                    }
                } else {
                    // Create new settings row
                    const { data, error } = await supabase
                        .from('system_settings')
                        .insert([dbUpdate])
                        .select()
                        .single();

                    if (error || !data) {
                        console.error('Error creating system settings:', error);
                        throw error;
                    }

                    set({
                        systemSettings: {
                            id: data.id,
                            systemName: data.system_name,
                            logoUrl: data.logo_url,
                            telegramBotToken: data.telegram_bot_token,
                            adminChatId: data.admin_chat_id
                        }
                    });
                }
            },

            fetchData: async () => {
                set({ loading: true });

                try {
                    const [
                        schoolsRes,
                        studentsRes,
                        classGroupsRes,
                        paymentsRes,
                        teachersRes,
                        assignmentsRes,
                        lessonsRes,
                        attendanceRes,
                        notificationTemplatesRes,
                        leavesRes,
                        settingsRes,
                        evaluationsRes,
                        teacherEvaluationsRes
                    ] = await Promise.all([
                        supabase.from('schools').select('*'),
                        supabase.from('students').select('*'),
                        supabase.from('class_groups').select('*'),
                        supabase.from('payments').select('*'),
                        supabase.from('teachers').select('*'),
                        supabase.from('teacher_assignments').select('*'),
                        supabase.from('lessons').select('*'),
                        supabase.from('attendance').select('*'),
                        supabase.from('notification_templates').select('*'),
                        supabase.from('teacher_leaves').select('*'),
                        supabase.from('system_settings').select('*').limit(1).single(),
                        supabase.from('student_evaluations').select('*'),
                        supabase.from('teacher_evaluations').select('*')
                    ]);

                    if (schoolsRes.error) console.error('Error fetching schools:', schoolsRes.error);

                    const schools: School[] = (schoolsRes.data || []).map(s => ({
                        id: s.id,
                        name: s.name,
                        address: s.address,
                        phone: s.phone,
                        defaultPrice: s.default_price,
                        paymentTerms: s.payment_terms,
                        color: s.color,
                        imageUrl: s.image_url,
                        managerName: s.manager_name,
                        managerPhone: s.manager_phone,
                        managerEmail: s.manager_email,
                        telegramChatId: s.telegram_chat_id,
                        payment_cycle_start_date: s.payment_cycle_start_date,
                        type: s.type || 'school',
                        eventDate: s.event_date,
                        eventDates: s.event_dates,
                        notes: s.notes
                    }));

                    const students: Student[] = (studentsRes.data || []).map(s => ({
                        id: s.id,
                        schoolId: s.school_id,
                        branchId: s.branch_id,
                        classGroupId: s.class_group_id,
                        enrollmentType: s.enrollment_type || '4week',
                        name: s.name,
                        phone: s.phone,
                        status: s.status as any,
                        joinedDate: s.joined_date,
                        paymentStatus: s.payment_status || 'paid',
                        discountPercentage: s.discount_percentage || 0,
                        parentName: s.parent_name,
                        parentEmail: s.parent_email,
                        parentPhone: s.parent_phone,
                        birthDate: s.birth_date,
                        address: s.address,
                        medicalNotes: s.medical_notes,
                        managerEmail: s.manager_email,
                        telegramChatId: s.telegram_chat_id,
                        payment_cycle_start_date: s.payment_cycle_start_date,
                        type: s.type || 'school',
                        eventDate: s.event_date,
                        notes: s.notes,
                        last_payment_status: s.last_payment_status,
                        last_payment_date: s.last_payment_date,
                        last_claim_date: s.last_claim_date
                    }));

                    const classGroups: ClassGroup[] = (classGroupsRes.data || []).map(c => ({
                        id: c.id,
                        schoolId: c.school_id,
                        branchId: c.branch_id,
                        name: c.name,
                        schedule: c.schedule,
                        status: c.status || 'active'
                    }));

                    const payments: Payment[] = (paymentsRes.data || []).map(p => ({
                        id: p.id,
                        schoolId: p.school_id,
                        amount: p.amount,
                        date: p.date,
                        type: p.type as any,
                        method: p.method as any,
                        month: p.month,
                        status: p.status || 'paid',
                        paidAt: p.paid_at
                    }));

                    const teachers: Teacher[] = (teachersRes.data || []).map(t => ({
                        id: t.id,
                        name: t.name,
                        phone: t.phone,
                        email: t.email,
                        specialties: t.specialties,
                        color: t.color,
                        role: t.role || 'teacher',
                        schoolId: t.school_id,
                        password: t.password,
                        telegramChatId: t.telegram_chat_id,
                        isActive: t.is_active
                    }));

                    const assignments: TeacherAssignment[] = (assignmentsRes.data || []).map(a => ({
                        id: a.id,
                        teacherId: a.teacher_id,
                        schoolId: a.school_id,
                        classGroupId: a.class_group_id,
                        dayOfWeek: a.day_of_week,
                        startTime: a.start_time,
                        endTime: a.end_time
                    }));

                    const lessons: Lesson[] = (lessonsRes.data || []).map(l => ({
                        id: l.id,
                        schoolId: l.school_id,
                        classGroupId: l.class_group_id,
                        teacherId: l.teacher_id,
                        date: l.date,
                        startTime: l.start_time,
                        endTime: l.end_time,
                        status: l.status,
                        type: l.type,
                        cancelReason: l.cancel_reason,
                        topic: l.topic,
                        notes: l.notes,
                        attachments: l.attachments || []
                    }));

                    const attendance: Attendance[] = (attendanceRes.data || []).map(a => ({
                        id: a.id,
                        lessonId: a.lesson_id,
                        studentId: a.student_id,
                        status: a.status,
                        note: a.note
                    }));

                    const notificationTemplates: NotificationTemplate[] = (notificationTemplatesRes.data || []).map(t => ({
                        id: t.id,
                        schoolId: t.school_id,
                        classGroupId: t.class_group_id,
                        triggerType: t.trigger_type,
                        messageTemplate: t.message_template,
                        offsetMinutes: t.offset_minutes,
                        triggerTime: t.trigger_time,
                        daysFilter: t.days_filter,
                        targetRoles: t.target_roles || ['student']
                    }));

                    const leaves: TeacherLeave[] = (leavesRes.data || []).map(l => ({
                        id: l.id,
                        teacherId: l.teacher_id,
                        startDate: l.start_date,
                        endDate: l.end_date,
                        type: l.type,
                        reason: l.reason,
                        createdAt: l.created_at
                    }));

                    const studentEvaluations: StudentEvaluation[] = (evaluationsRes.data || []).map(e => ({
                        id: e.id,
                        studentId: e.student_id,
                        teacherId: e.teacher_id,
                        score: e.score,
                        note: e.note,
                        createdAt: e.created_at
                    }));

                    // Handle System Settings
                    const settingsData = (settingsRes.data && Array.isArray(settingsRes.data)) ? settingsRes.data[0] : settingsRes.data;
                    const settingsError = settingsRes.error;

                    // Ignore error code PGRST116 (no rows), but log others
                    if (settingsError && settingsError.code !== 'PGRST116') {
                        console.error('Error fetching settings:', settingsError);
                    }

                    let systemSettings: SystemSettings | null = null;
                    if (settingsData) {
                        systemSettings = {
                            id: settingsData.id,
                            logoUrl: settingsData.logo_url,
                            systemName: settingsData.system_name,
                            telegramBotToken: settingsData.telegram_bot_token,
                            adminChatId: settingsData.admin_chat_id
                        };
                    } else {
                        // Initialize default if not exists
                        const defaultId = crypto.randomUUID();
                        const defaultSettings = {
                            id: defaultId,
                            system_name: 'Atölye Vizyon',
                            logo_url: ''
                        };

                        // Fire and forget insert to ensure DB has a row
                        supabase.from('system_settings').insert([defaultSettings]).then(({ error }) => {
                            if (error) console.error('Error creating default settings:', error);
                        });

                        systemSettings = {
                            id: defaultId,
                            systemName: 'Atölye Vizyon',
                            logoUrl: '',
                            telegramBotToken: undefined,
                            adminChatId: undefined
                        };
                    }

                    // Apply Theme
                    // const savedTheme = localStorage.getItem('theme'); // Unused
                    // Force dark mode if no theme saved OR if saved theme is light (migrating to dark)
                    // This is a temporary override to ensure the user gets dark mode as requested
                    const themeToApply = 'dark'; // Enforce dark

                    localStorage.setItem('theme', themeToApply);
                    if (themeToApply === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }

                    const teacherEvaluations: TeacherEvaluation[] = (teacherEvaluationsRes.data || []).map(e => ({
                        id: e.id,
                        teacherId: e.teacher_id,
                        evaluatorId: e.evaluator_id,
                        score: e.score,
                        note: e.note,
                        createdAt: e.created_at
                    }));

                    // FETCH ACTIVITY LOGS
                    const logsRes = await supabase
                        .from('activity_logs')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(100); // Limit to last 100 for performance initially

                    // FETCH TRACE LOGS
                    const traceLogsRes = await supabase
                        .from('debug_trace_logs')
                        .select('*')
                        .order('log_time', { ascending: false })
                        .limit(100);

                    const logs: ActivityLog[] = (logsRes.data || []).map(l => ({
                        id: l.id,
                        userId: l.user_id,
                        userName: l.user_name,
                        userRole: l.user_role,
                        action: l.action,
                        details: l.details,
                        timestamp: l.created_at,
                        entityType: l.entity_type,
                        entityId: l.entity_id
                    }));

                    set({
                        schools, students, classGroups, payments, teachers, assignments, lessons, attendance,
                        studentEvaluations, teacherEvaluations, notificationTemplates, leaves, systemSettings,
                        logs, traceLogs: traceLogsRes.data || [], theme: themeToApply, initialized: true,
                        logsOffset: logs.length // Set offset to loaded length (e.g. 100)
                    });
                } catch (error) {
                    console.error('Supabase fetch error:', error);
                } finally {
                    set({ loading: false });
                }

            },

            fetchTraceLogs: async () => {
                const { data, error } = await supabase
                    .from('debug_trace_logs')
                    .select('*')
                    .order('log_time', { ascending: false })
                    .limit(100);

                if (error) console.error('Error fetching trace logs:', error);

                if (data) {
                    set({ traceLogs: data });
                }
            },

            // HELPER: Log Action to DB
            logAction: async (action, details, entityType, entityId) => {
                const currentUser = useAuth.getState().user;

                // Fallback for System Actions (if no user logged in or auto-process)
                const userId = currentUser?.id || 'system-auto';
                const userName = currentUser?.name || 'Sistem Otomasyonu';
                const userRole = currentUser?.role || 'admin';

                const newLog = {
                    user_id: userId,
                    user_name: userName,
                    user_role: userRole,
                    action: action,
                    details: details,
                    entity_type: entityType,
                    entity_id: entityId
                };

                // Optimistic Update
                const optimisticLog: ActivityLog = {
                    id: crypto.randomUUID(),
                    userId: userId,
                    userName: userName,
                    userRole: userRole,
                    action: action,
                    details: details,
                    timestamp: new Date().toISOString(),
                    entityType: entityType,
                    entityId: entityId
                };

                set(state => ({ logs: [optimisticLog, ...state.logs] }));

                const { error } = await supabase.from('activity_logs').insert([newLog]);
                if (error) console.error('Error logging action:', error);
            },

            addStudentEvaluation: async (evaluation) => {
                const { data, error } = await supabase
                    .from('student_evaluations')
                    .insert([{
                        student_id: evaluation.studentId,
                        teacher_id: evaluation.teacherId,
                        evaluator_id: evaluation.evaluatorId,
                        score: evaluation.score,
                        note: evaluation.note
                    }])
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    studentEvaluations: [...state.studentEvaluations, {
                        id: data.id,
                        studentId: data.student_id,
                        teacherId: data.teacher_id,
                        evaluatorId: data.evaluator_id,
                        score: data.score,
                        note: data.note,
                        createdAt: data.created_at
                    }]
                }));

                const studentName = get().students.find(s => s.id === evaluation.studentId)?.name || 'Öğrenci';
                get().logAction('DEGERLENDIRME', `${studentName} değerlendirildi. Puan: ${evaluation.score}`, 'student_evaluation', data.id);
            },

            addTeacherEvaluation: async (evaluation) => {
                const { data, error } = await supabase
                    .from('teacher_evaluations')
                    .insert([{
                        teacher_id: evaluation.teacherId,
                        evaluator_id: evaluation.evaluatorId,
                        score: evaluation.score,
                        note: evaluation.note
                    }])
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    teacherEvaluations: [...state.teacherEvaluations, {
                        id: data.id,
                        teacherId: data.teacher_id,
                        evaluatorId: data.evaluator_id,
                        score: data.score,
                        note: data.note,
                        createdAt: data.created_at
                    }]
                }));

                const teacherName = get().teachers.find(t => t.id === evaluation.teacherId)?.name || 'Öğretmen';
                get().logAction('DEGERLENDIRME', `${teacherName} değerlendirildi. Puan: ${evaluation.score}`, 'teacher_evaluation', data.id);
            },

            addSchool: async (school) => {
                set((state) => ({ schools: [...state.schools, school] }));
                get().logAction('OKUL_EKLE', `${school.name} okulu eklendi.`, 'school', school.id);

                const { error } = await supabase.from('schools').insert([{
                    id: school.id,
                    name: school.name,
                    address: school.address,
                    phone: school.phone,
                    default_price: school.defaultPrice,
                    payment_terms: school.paymentTerms,
                    color: school.color,
                    image_url: school.imageUrl,
                    manager_name: school.managerName,
                    manager_phone: school.managerPhone,
                    manager_email: school.managerEmail,
                    type: school.type || 'school',
                    event_date: school.eventDate,
                    event_dates: school.eventDates,
                    notes: school.notes
                }]);

                if (error) {
                    console.error('Supabase Error:', error);
                    alert(`Veritabanı Kayıt Hatası: ${error.message}`);
                }
            },

            updateSchool: async (id, updated) => {
                const oldSchool = get().schools.find(s => s.id === id);
                set((state) => ({
                    schools: state.schools.map((s) => (s.id === id ? { ...s, ...updated } : s)),
                }));

                get().logAction('OKUL_GUNCELLE', `${oldSchool?.name} bilgileri güncellendi.`, 'school', id);

                const dbUpdate: any = {};
                if (updated.name) dbUpdate.name = updated.name;
                if (updated.defaultPrice !== undefined) dbUpdate.default_price = updated.defaultPrice;
                if (updated.paymentTerms) dbUpdate.payment_terms = updated.paymentTerms;
                if (updated.color) dbUpdate.color = updated.color;
                if (updated.imageUrl) dbUpdate.image_url = updated.imageUrl;
                if (updated.managerName) dbUpdate.manager_name = updated.managerName;
                if (updated.managerPhone) dbUpdate.manager_phone = updated.managerPhone;
                if (updated.managerEmail) dbUpdate.manager_email = updated.managerEmail;
                if (updated.type) dbUpdate.type = updated.type;
                if (updated.eventDate) dbUpdate.event_date = updated.eventDate;
                if (updated.eventDates) dbUpdate.event_dates = updated.eventDates;
                if (updated.notes) dbUpdate.notes = updated.notes;
                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('schools').update(dbUpdate).eq('id', id);
                }
            },


            addStudent: async (student) => {
                const previousStudents = get().students;
                set((state) => ({ students: [...state.students, student] }));
                get().logAction('OGRENCI_EKLE', `${student.name} kayıt edildi.`, 'student', student.id);

                const { error } = await supabase.from('students').insert([{
                    id: student.id,
                    school_id: student.schoolId || null,
                    branch_id: student.branchId || null,
                    class_group_id: student.classGroupId || null,
                    enrollment_type: student.enrollmentType || '4week',
                    name: student.name,
                    phone: student.phone,
                    status: student.status,
                    joined_date: student.joinedDate || new Date().toISOString(),
                    birth_date: student.birthDate || null,
                    grade_level: student.gradeLevel,
                    parent_name: student.parentName,
                    parent_email: student.parentEmail,
                    parent_phone: student.parentPhone,
                    address: student.address,
                    medical_notes: student.medicalNotes,
                    payment_status: student.paymentStatus,
                    discount_percentage: student.discountPercentage
                }]);

                if (error) {
                    console.error('Error adding student:', error);
                    alert(`Öğrenci eklenirken hata oluştu: ${error.message}`);
                    set({ students: previousStudents }); // Revert on error
                }
            },

            updateStudent: async (id, updated) => {
                const student = get().students.find((s: Student) => s.id === id);
                set((state) => ({
                    students: state.students.map((s) => (s.id === id ? { ...s, ...updated } : s)),
                }));

                if (student) {
                    let actionType = 'OGRENCI_GUNCELLE';
                    let details = `${student.name} bilgileri güncellendi.`;

                    // Check for specific actions
                    if (updated.status === 'Left') {
                        actionType = 'OGRENCI_SIL'; // Keeping as SIL/AYRILDI logic in logs
                        const reason = updated.leftReason || 'Belirtilmedi';
                        details = `${student.name} kaydı silindi/ayrıldı. Sebep: ${reason}`;
                    } else if (updated.name && updated.name !== student.name) {
                        details = `${student.name} adı ${updated.name} olarak değiştirildi.`;
                    } else if (updated.classGroupId && updated.classGroupId !== student.classGroupId) {
                        details = `${student.name} sınıfı değiştirildi.`;
                    }

                    get().logAction(actionType as any, details, 'student', id);
                }

                const dbUpdate: any = {};
                if (updated.name) dbUpdate.name = updated.name;
                if (updated.phone) dbUpdate.phone = updated.phone;
                if (updated.classGroupId !== undefined) dbUpdate.class_group_id = updated.classGroupId;
                if (updated.status) dbUpdate.status = updated.status;
                if (updated.leftReason) dbUpdate.left_reason = updated.leftReason;
                if (updated.joinedDate) dbUpdate.joined_date = updated.joinedDate;
                if (updated.birthDate) dbUpdate.birth_date = updated.birthDate;
                if (updated.gradeLevel) dbUpdate.grade_level = updated.gradeLevel;
                if (updated.parentName) dbUpdate.parent_name = updated.parentName;
                if (updated.parentEmail) dbUpdate.parent_email = updated.parentEmail;
                if (updated.parentPhone) dbUpdate.parent_phone = updated.parentPhone;
                if (updated.address) dbUpdate.address = updated.address;
                if (updated.medicalNotes) dbUpdate.medical_notes = updated.medicalNotes;

                if (updated.status === 'Left') {
                    if ((updated as any).leftDate) dbUpdate.left_date = (updated as any).leftDate;
                }

                if (updated.paymentStatus) dbUpdate.payment_status = updated.paymentStatus;
                if (updated.discountPercentage !== undefined) dbUpdate.discount_percentage = updated.discountPercentage;
                if (updated.last_payment_status) dbUpdate.last_payment_status = updated.last_payment_status;
                if (updated.last_payment_date) dbUpdate.last_payment_date = updated.last_payment_date;
                if (updated.last_claim_date) dbUpdate.last_claim_date = updated.last_claim_date;

                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('students').update(dbUpdate).eq('id', id);
                }
            },

            deleteStudent: async (id) => {
                const student = get().students.find(s => s.id === id);
                const studentName = student?.name || 'Bilinmeyen Öğrenci';

                set((state) => ({ students: state.students.filter(s => s.id !== id) }));

                get().logAction('OGRENCI_SIL', `${studentName} silindi.`, 'student', id);

                await supabase.from('students').delete().eq('id', id);
            },

            addClassGroup: async (group) => {
                set((state) => ({ classGroups: [...state.classGroups, group] }));
                get().logAction('SINIF_EKLE', `${group.name} grubu oluşturuldu.`, 'class_group', group.id);

                await supabase.from('class_groups').insert([{
                    id: group.id,
                    school_id: group.schoolId || group.branchId || null,
                    branch_id: group.branchId || null,
                    name: group.name,
                    schedule: group.schedule
                }]);
            },

            addPayment: async (payment) => {
                set((state) => ({ payments: [...state.payments, payment] }));
                get().logAction('ODEME_AL', `${payment.amount} TL ödeme girişi yapıldı (${payment.type}).`, 'payment', payment.id);

                await supabase.from('payments').insert([{
                    id: payment.id,
                    school_id: payment.schoolId,
                    amount: payment.amount,
                    date: payment.date,
                    type: payment.type,
                    method: payment.method,
                    month: payment.month,
                    status: payment.status || 'paid',
                    paid_at: payment.paidAt,
                    season_id: payment.seasonId,
                    school_period_id: payment.schoolPeriodId,
                    transaction_type: payment.transactionType || 'payment'
                }]);
            },

            // Financial System Actions
            fetchSeasons: async () => {
                const { data, error } = await supabase.from('seasons').select('*').order('start_date', { ascending: false });
                if (error) console.error('Error fetching seasons:', error);
                set({
                    seasons: data?.map(s => ({
                        id: s.id,
                        name: s.name,
                        startDate: s.start_date,
                        endDate: s.end_date,
                        isActive: s.is_active
                    })) || []
                });
            },

            fetchSchoolPeriods: async (schoolId, seasonId) => {
                const { data, error } = await supabase
                    .from('school_periods')
                    .select('*')
                    .eq('school_id', schoolId)
                    .eq('season_id', seasonId)
                    .order('period_number', { ascending: true });

                if (error) console.error('Error fetching periods:', error);

                // Return data for local consumption if needed, but also update store/local cache if we had one
                return data?.map(p => ({
                    id: p.id,
                    schoolId: p.school_id,
                    seasonId: p.season_id,
                    periodNumber: p.period_number,
                    startDate: p.start_date,
                    endDate: p.end_date,
                    studentCountSnapshot: p.student_count_snapshot,
                    pricePerStudentSnapshot: p.price_per_student_snapshot,
                    expectedAmount: p.expected_amount,
                    status: p.status
                })) || [];
            },

            generateSchoolPeriods: async (schoolId, seasonId) => {
                const school = get().schools.find(s => s.id === schoolId);
                const season = get().seasons.find(s => s.id === seasonId);

                if (!school || !season) return;

                // 1. Get existing periods to find where to start
                const existingPeriods = await get().fetchSchoolPeriods(schoolId, seasonId);
                // const lastPeriod = existingPeriods[existingPeriods.length - 1];

                // let startDate = ... (Unused)

                // If school joined AFTER season start, use school join date (or specific start date)
                // For now, let's assume season start or today if empty

                // const today = new Date();
                // const seasonEnd = new Date(season.endDate);

                // Determine effective start date for this calculation run
                // If no periods exist, start from Season Start. 
                // BUT if we want to be smart, maybe start from "School Start Date" if we add that field later.

                // We will generate periods up to TODAY + 4 weeks buffer? Or just up to end of season?
                // For "Accrual", we usually generate up to TODAY.

                if (existingPeriods.length === 0) {
                    // Initial generation: All the way from start to today
                }

                // ... Logic simplified for Admin Dashboard Tool:
                // We will create a helper in the UI to "Generate Periods" for a school if missing.
                // For now, let's just expose a function to create a SINGLE period if needed or auto-fill.

            },

            // New Action: Generate Periods up to a target date (e.g. Today)
            checkAndGeneratePeriods: async (schoolId, seasonId) => {
                const school = get().schools.find(s => s.id === schoolId);
                if (!school) return;

                // Fetch current periods
                const { data: periods } = await supabase.from('school_periods').select('*').eq('school_id', schoolId).eq('season_id', seasonId).order('period_number');

                const season = get().seasons.find(s => s.id === seasonId);
                if (!season) return;

                // Start Date
                let nextStart = new Date(season.startDate);
                let nextPeriodNum = 1;

                if (periods && periods.length > 0) {
                    const last = periods[periods.length - 1];
                    nextPeriodNum = last.period_number + 1;
                    // Start 1 day after last period
                    const lastEnd = new Date(last.end_date);
                    nextStart = new Date(lastEnd);
                    nextStart.setDate(lastEnd.getDate() + 1);
                }

                const today = new Date();
                const seasonEnd = new Date(season.endDate);

                // Loop and create periods until we cover TODAY
                const newPeriods = [];

                while (nextStart <= today && nextStart < seasonEnd) {
                    // 4 Weeks Duration (28 Days)
                    const periodEnd = new Date(nextStart);
                    periodEnd.setDate(nextStart.getDate() + 27); // +27 days = 28th day inclusive

                    // Cap at Season End
                    const effectiveEnd = periodEnd > seasonEnd ? seasonEnd : periodEnd;

                    // Snapshot Data
                    const currentStudents = get().students.filter(s => s.schoolId === schoolId && s.status === 'Active').length;
                    const price = school.defaultPrice || 0; // "4 Weekly Price"
                    const expected = currentStudents * price;

                    newPeriods.push({
                        school_id: schoolId,
                        season_id: seasonId,
                        period_number: nextPeriodNum,
                        start_date: nextStart.toISOString(),
                        end_date: effectiveEnd.toISOString(),
                        student_count_snapshot: currentStudents,
                        price_per_student_snapshot: price,
                        expected_amount: expected,
                        status: 'pending'
                    });

                    // Advance
                    nextStart = new Date(effectiveEnd);
                    nextStart.setDate(effectiveEnd.getDate() + 1);
                    nextPeriodNum++;
                }

                if (newPeriods.length > 0) {
                    const { error } = await supabase.from('school_periods').insert(newPeriods);
                    if (error) console.error('Error generating periods:', error);
                }
            },

            addFinancialTransaction: async (data: {
                schoolId: string,
                amount: number,
                type: 'payment' | 'write_off',
                seasonId: string,
                periodId?: string,
                date: string,
                method?: string,
                notes?: string
            }) => {
                const { schoolId, amount, type, seasonId, periodId, date, method, notes } = data;

                const newPayment: Payment = {
                    id: crypto.randomUUID(),
                    schoolId,
                    amount,
                    date,
                    type: type === 'payment' ? 'Tuition' : 'Other', // 'Other' for writeoff/refund technically, or we map it
                    method: (method as any) || 'Cash',
                    seasonId,
                    schoolPeriodId: periodId,
                    transactionType: type,
                    notes,
                    status: 'paid',
                    paidAt: new Date().toISOString()
                };

                await get().addPayment(newPayment);
            },

            fetchSchoolSeasonStats: async (schoolId, seasonId) => {
                try {
                    const { data, error } = await supabase
                        .from('school_season_stats')
                        .select('*')
                        .eq('school_id', schoolId)
                        .eq('season_id', seasonId)
                        .single();

                    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"
                    return data;
                } catch (error) {
                    console.error('Error fetching season stats:', error);
                    return null;
                }
            },

            closeSchoolSeason: async (schoolId, seasonId, notes) => {
                try {
                    // Upsert stats with is_closed = true
                    const { error } = await supabase
                        .from('school_season_stats')
                        .upsert({
                            school_id: schoolId,
                            season_id: seasonId,
                            is_closed: true,
                            closed_at: new Date().toISOString(),
                            notes: notes
                        }, { onConflict: 'school_id, season_id' }); // Use unique constraint

                    if (error) throw error;
                } catch (error) {
                    console.error('Error closing season:', error);
                    alert('Sezon kapatılırken hata oluştu.');
                }
            },

            addSchoolPeriod: async (schoolId, seasonId, startDate, endDate) => {
                try {
                    // Get max period number
                    const { data: existing } = await supabase
                        .from('school_periods')
                        .select('period_number')
                        .eq('school_id', schoolId)
                        .eq('season_id', seasonId)
                        .order('period_number', { ascending: false })
                        .limit(1);

                    const nextNumber = (existing && existing.length > 0) ? existing[0].period_number + 1 : 1;

                    // Calculate Snapshot (Active students at start date)
                    // Note: This is an approximation. Ideally we check student active status history.
                    // For now, simple total count of active students
                    const activeStudents = get().students.filter(s => s.schoolId === schoolId && s.status === 'Active').length;
                    const school = get().schools.find(s => s.id === schoolId);
                    const price = school?.defaultPrice || 0;
                    const expected = activeStudents * price; // Rough estimate, refined in UI

                    const { error } = await supabase.from('school_periods').insert({
                        id: crypto.randomUUID(),
                        school_id: schoolId,
                        season_id: seasonId,
                        period_number: nextNumber,
                        start_date: startDate,
                        end_date: endDate,
                        status: 'active',
                        student_count_snapshot: activeStudents,
                        price_per_student_snapshot: price,
                        expected_amount: expected
                    });

                    if (error) throw error;
                } catch (err) {
                    console.error('Error adding period:', err);
                    alert('Dönem eklenirken bir hata oluştu.');
                }
            },

            deleteSchoolPeriod: async (periodId) => {
                try {
                    const { error } = await supabase.from('school_periods').delete().eq('id', periodId);
                    if (error) throw error;
                } catch (err) {
                    console.error('Error deleting period:', err);
                    // Alert is handled in UI usually, but good to have safety
                    alert('Dönem silinirken hata. Silmeye çalıştığınız döneme ait ödemeler olabilir.');
                }
            },

            updatePayment: async (id, updated) => {
                const oldPayment = get().payments.find(p => p.id === id);
                set((state) => ({
                    payments: state.payments.map((p) => (p.id === id ? { ...p, ...updated } : p)),
                }));



                let details = `Ödeme güncellendi.`;
                if (updated.status === 'paid' && oldPayment?.status !== 'paid') {
                    details = `Ödeme "Tahsil Edildi" olarak işaretlendi. Tutar: ${oldPayment?.amount} TL`;
                }

                get().logAction('ODEME_GUNCELLE', details, 'payment', id);

                const dbUpdate: any = {};
                if (updated.amount) dbUpdate.amount = updated.amount;
                if (updated.type) dbUpdate.type = updated.type;
                if (updated.method) dbUpdate.method = updated.method;
                if (updated.date) dbUpdate.date = updated.date;
                if (updated.status) dbUpdate.status = updated.status;
                if (updated.paidAt) dbUpdate.paid_at = updated.paidAt;

                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('payments').update(dbUpdate).eq('id', id);
                }
            },

            addTeacher: async (teacher) => {
                set((state) => ({ teachers: [...state.teachers, teacher] }));
                get().logAction('OGRETMEN_EKLE', `${teacher.name} eklendi.`, 'teacher', teacher.id);

                await supabase.from('teachers').insert([{
                    id: teacher.id,
                    name: teacher.name,
                    phone: teacher.phone,
                    email: teacher.email,
                    specialties: teacher.specialties,
                    color: teacher.color,
                    role: teacher.role || 'teacher',
                    password: teacher.password || '123456',
                    telegram_chat_id: teacher.telegramChatId,
                    type: teacher.type || 'regular',
                    is_active: teacher.isActive !== undefined ? teacher.isActive : true,
                    school_id: teacher.schoolId // Also adding school_id as it seemed missing in insert, though maybe optional? Better safe.
                }]);
            },

            updateTeacher: async (id, updated) => {
                const oldTeacher = get().teachers.find(t => t.id === id);
                set((state) => ({
                    teachers: state.teachers.map((t) => (t.id === id ? { ...t, ...updated } : t)),
                }));

                get().logAction('OGRETMEN_GUNCELLE', `${oldTeacher?.name} bilgileri güncellendi.`, 'teacher', id);

                const dbUpdate: any = {};
                if (updated.name) dbUpdate.name = updated.name;
                if (updated.phone) dbUpdate.phone = updated.phone;
                if (updated.email) dbUpdate.email = updated.email;
                if (updated.specialties) dbUpdate.specialties = updated.specialties;
                if (updated.password) dbUpdate.password = updated.password;
                if (updated.role) dbUpdate.role = updated.role;
                if (updated.color) dbUpdate.color = updated.color;
                if (updated.telegramChatId) dbUpdate.telegram_chat_id = updated.telegramChatId;
                if (updated.type) dbUpdate.type = updated.type;
                if (updated.schoolId) dbUpdate.school_id = updated.schoolId;
                if (updated.isActive !== undefined) dbUpdate.is_active = updated.isActive;

                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('teachers').update(dbUpdate).eq('id', id);
                }
            },

            deleteTeacher: async (id) => {
                set((state) => ({ teachers: state.teachers.filter(t => t.id !== id) }));
                await supabase.from('teachers').delete().eq('id', id);
            },

            addAssignment: async (assignment) => {
                set((state) => ({ assignments: [...state.assignments, assignment] }));

                // Lookup correct school_id from class_group to ensure FK consistency
                const classGroup = get().classGroups.find(c => c.id === assignment.classGroupId);

                console.log('[useStore:addAssignment] Debug Info:', {
                    receivedClassGroupId: assignment.classGroupId,
                    receivedSchoolId: assignment.schoolId,
                    foundClassGroup: !!classGroup,
                    classGroupSchoolId: classGroup?.schoolId
                });

                let effectiveSchoolId = classGroup ? classGroup.schoolId : assignment.schoolId;

                // Emergency Fetch: If store lookup failed (e.g. RLS filtering issue or stale store), fetch directly
                if (!effectiveSchoolId || effectiveSchoolId === '') {
                    console.warn('[useStore:addAssignment] Store lookup failed for schoolId, attempting direct DB fetch...');
                    const { data: directClass } = await supabase
                        .from('class_groups')
                        .select('school_id')
                        .eq('id', assignment.classGroupId)
                        .single();

                    if (directClass?.school_id) {
                        effectiveSchoolId = directClass.school_id;
                        console.log('[useStore:addAssignment] Direct fetch success:', effectiveSchoolId);
                    } else {
                        console.error('[useStore:addAssignment] Direct fetch failed. Insert will likely fail.');
                    }
                } else {
                    console.log('[useStore:addAssignment] Using effectiveSchoolId:', effectiveSchoolId);
                }


                // 1. Insert assignment to DB (Critical path)
                const { error } = await supabase.from('teacher_assignments').insert([{
                    id: assignment.id,
                    teacher_id: assignment.teacherId,
                    school_id: (effectiveSchoolId && effectiveSchoolId !== '') ? effectiveSchoolId : (classGroup?.branchId || null), // Ensure no empty string
                    class_group_id: assignment.classGroupId,
                    day_of_week: assignment.dayOfWeek,
                    start_time: assignment.startTime,
                    end_time: assignment.endTime
                }]);

                if (error) {
                    console.error('Error inserting assignment:', error);
                    // Revert local state if DB fails? 
                    // For now, let's throw so the UI knows
                    set(state => ({ assignments: state.assignments.filter(a => a.id !== assignment.id) }));
                    throw error;
                }

                // 2. Trigger lesson generation in BACKGROUND (Non-blocking)
                get().generateLessons(4, assignment.classGroupId).catch(err => {
                    console.error('Background lesson generation failed:', err);
                });
            },

            deleteAssignment: async (id) => {
                // Find which class this assignment belongs to before deleting
                const assignment = get().assignments.find(a => a.id === id);
                const classGroupId = assignment?.classGroupId;

                set((state) => ({ assignments: state.assignments.filter(a => a.id !== id) }));
                await supabase.from('teacher_assignments').delete().eq('id', id);

                // Regenerate lessons to cleanup orphaned future lessons
                if (classGroupId) {
                    await get().generateLessons(4, classGroupId);
                }
            },

            generateLessons: async (weeks = 4, classGroupId, startDate) => {
                const allAssignments = get().assignments;
                const allSchools = get().schools;
                const assignments = classGroupId
                    ? allAssignments.filter(a => a.classGroupId === classGroupId)
                    : allAssignments;

                const currentLessons = get().lessons;
                const newLessons: Lesson[] = [];
                const baseDate = startDate ? new Date(startDate) : new Date();

                // Separate assignments by school type (event vs regular school)
                const eventAssignments: TeacherAssignment[] = [];
                const schoolAssignments: TeacherAssignment[] = [];

                assignments.forEach(assignment => {
                    const school = allSchools.find(s => s.id === assignment.schoolId);
                    if (school?.type === 'event') {
                        eventAssignments.push(assignment);
                    } else {
                        schoolAssignments.push(assignment);
                    }
                });

                // If startDate is provided, we might want to clean up EVERYTHING after that date?
                // Or maybe just generate missing ones? 
                // The user request: "all lessons will start 2nd Feb week".
                // Detailed logic:
                // 1. Identify all active groups.
                const activeGroupIds = new Set(assignments.map(a => a.classGroupId));

                // 2. Cleanup: Remove future "scheduled" lessons for these groups that DO NOT match any current assignment
                // This handles the case where a teacher was removed or time changed.
                const validFutureLessons: Lesson[] = [];
                const lessonsToDelete: string[] = [];

                // Helper to check if a lesson matches any active assignment
                const matchesAssignment = (lesson: Lesson, date: Date) => {
                    const dayOfWeek = date.getDay() || 7; // 1=Mon, 7=Sun
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const school = allSchools.find(s => s.id === lesson.schoolId);

                    // For events: check if date is in eventDates
                    if (school?.type === 'event') {
                        const eventDates = school.eventDates || [];
                        if (!eventDates.includes(dateStr)) {
                            return false; // Date is not a valid event date
                        }
                    }

                    return assignments.some(a =>
                        a.classGroupId === lesson.classGroupId &&
                        a.dayOfWeek === dayOfWeek &&
                        a.startTime === lesson.startTime
                    );
                };

                const baseDateStr = format(baseDate, 'yyyy-MM-dd');
                const todayStr = format(new Date(), 'yyyy-MM-dd');

                // If we are forcing a start date, strictly look at things >= that date
                // Otherwise use today
                const thresholdDateStr = startDate ? baseDateStr : todayStr;

                currentLessons.forEach(l => {
                    // Only check future or today's lessons (or from baseDate if provided)
                    if (l.date >= thresholdDateStr && activeGroupIds.has(l.classGroupId)) {

                        // If explicit reset requested (startDate provided), remove conflicting scheduled lessons in the target range?
                        // For now, keep the "Stale Check" logic but extend it.
                        if (l.type === 'regular' && l.status === 'scheduled') {
                            if (!matchesAssignment(l, new Date(l.date))) {
                                lessonsToDelete.push(l.id);
                                return;
                            }
                            // If we are forcing a start date, we might want to keep existing valid lessons 
                            // OR user might want to Wipe and Recreate?
                            // User said: "It didn't happen... some went forward... how to make all start Feb 2 week?"
                            // So effectively we just want to ensure lessons exist from Feb 2 onwards.
                        }
                    }
                    validFutureLessons.push(l);
                });

                // Update state to remove deleted lessons immediately
                if (lessonsToDelete.length > 0) {
                    set(state => ({
                        lessons: state.lessons.filter(l => !lessonsToDelete.includes(l.id))
                    }));
                    await supabase.from('lessons').delete().in('id', lessonsToDelete);
                    console.log(`Cleaned up ${lessonsToDelete.length} stale lessons.`);
                }

                // 3. Generate New Lessons for REGULAR SCHOOLS (weekly recurring)
                for (let i = 0; i < weeks; i++) {
                    // If startDate is provided, use it. Otherwise use start of current week.
                    const startOfBaseWeek = startOfWeek(baseDate, { weekStartsOn: 1 });
                    const weekStart = addWeeks(startOfBaseWeek, i);

                    schoolAssignments.forEach(assignment => {
                        const addDaysCount = assignment.dayOfWeek - 1;
                        const lessonDate = new Date(weekStart);
                        lessonDate.setDate(lessonDate.getDate() + addDaysCount);

                        const dateStr = format(lessonDate, 'yyyy-MM-dd');

                        // Skip if date is before today (unless we explicitly want to backfill, but usually we don't)
                        // If startDate is future, this check passes.
                        if (dateStr < todayStr && !startDate) return;

                        const exists = [...validFutureLessons, ...newLessons].some(l =>
                            l.classGroupId === assignment.classGroupId &&
                            l.date === dateStr &&
                            l.startTime === assignment.startTime
                        );

                        if (!exists) {
                            newLessons.push({
                                id: crypto.randomUUID(),
                                schoolId: assignment.schoolId,
                                classGroupId: assignment.classGroupId || '',
                                teacherId: assignment.teacherId,
                                date: dateStr,
                                startTime: assignment.startTime,
                                endTime: assignment.endTime,
                                status: 'scheduled',
                                type: 'regular'
                            });
                        }
                    });
                }

                // 4. Generate Lessons for EVENTS (using classGroup schedule as the event date)
                const allClassGroups = get().classGroups;
                eventAssignments.forEach(assignment => {
                    // Find the classGroup for this assignment to get its specific event date
                    const classGroup = allClassGroups.find(cg => cg.id === assignment.classGroupId);
                    const eventDateStr = classGroup?.schedule; // schedule contains the event date like "2026-01-30"

                    // If no valid event date found, skip
                    if (!eventDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(eventDateStr)) {
                        console.log(`Skipping event assignment - no valid schedule date for classGroup ${classGroup?.name}`);
                        return;
                    }

                    const dateStr = eventDateStr;

                    // Skip if date is before today  
                    if (dateStr < todayStr && !startDate) return;

                    const exists = [...validFutureLessons, ...newLessons].some(l =>
                        l.classGroupId === assignment.classGroupId &&
                        l.date === dateStr &&
                        l.startTime === assignment.startTime
                    );

                    if (!exists) {
                        console.log(`Creating event lesson: ${classGroup?.name} on ${dateStr} at ${assignment.startTime}`);
                        newLessons.push({
                            id: crypto.randomUUID(),
                            schoolId: assignment.schoolId,
                            classGroupId: assignment.classGroupId || '',
                            teacherId: assignment.teacherId,
                            date: dateStr,
                            startTime: assignment.startTime,
                            endTime: assignment.endTime,
                            status: 'scheduled',
                            type: 'regular'
                        });
                    }
                });

                if (newLessons.length > 0) {
                    set(state => ({ lessons: [...state.lessons, ...newLessons] }));
                    console.log(`Generated ${newLessons.length} new lessons`);

                    const { error } = await supabase.from('lessons').insert(newLessons.map(l => ({
                        id: l.id,
                        school_id: l.schoolId,
                        class_group_id: l.classGroupId,
                        teacher_id: l.teacherId,
                        date: l.date,
                        start_time: l.startTime,
                        end_time: l.endTime,
                        status: l.status,
                        type: l.type,
                        cancel_reason: l.cancelReason
                    })));

                    if (error) {
                        console.error('Error batch inserting lessons:', error);
                    }
                }
            },

            addLesson: async (lesson) => {
                set(state => ({ lessons: [...state.lessons, lesson] }));
                await supabase.from('lessons').insert([{
                    id: lesson.id,
                    school_id: lesson.schoolId,
                    class_group_id: lesson.classGroupId,
                    teacher_id: lesson.teacherId,
                    date: lesson.date,
                    start_time: lesson.startTime,
                    end_time: lesson.endTime,
                    status: lesson.status,
                    type: lesson.type,
                    cancel_reason: lesson.cancelReason,
                    topic: lesson.topic,
                    notes: lesson.notes,
                    attachments: lesson.attachments // JSONB
                }]);
            },

            updateLesson: async (id, updates) => {
                set(state => ({
                    lessons: state.lessons.map(l => l.id === id ? { ...l, ...updates } : l)
                }));

                const dbUpdate: any = {};
                if (updates.status) dbUpdate.status = updates.status;
                if (updates.cancelReason) dbUpdate.cancel_reason = updates.cancelReason;
                if (updates.type) dbUpdate.type = updates.type;
                if (updates.date) dbUpdate.date = updates.date;
                if (updates.startTime) dbUpdate.start_time = updates.startTime;
                if (updates.topic) dbUpdate.topic = updates.topic;
                if (updates.notes) dbUpdate.notes = updates.notes;
                if (updates.attachments) dbUpdate.attachments = updates.attachments;

                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('lessons').update(dbUpdate).eq('id', id);
                }
            },

            deleteLesson: async (id) => {
                set(state => ({ lessons: state.lessons.filter(l => l.id !== id) }));
                // Delete dependencies first
                await supabase.from('attendance').delete().eq('lesson_id', id);
                await supabase.from('lessons').delete().eq('id', id);
            },

            deleteSchool: async (id) => {
                const previousSchools = get().schools;
                // Optimistically remove school from local state
                set(state => ({ schools: state.schools.filter(s => s.id !== id) }));

                try {
                    // Delete related data first (Manual Cascade) from DB
                    // 1. Delete Payments
                    await supabase.from('payments').delete().eq('school_id', id);

                    // 1.1 Delete Student Evaluations (Referencing students in this school)
                    // We need to fetch students first to delete their evaluations
                    const { data: schoolStudents } = await supabase.from('students').select('id').eq('school_id', id);
                    if (schoolStudents && schoolStudents.length > 0) {
                        const studentIds = schoolStudents.map(s => s.id);
                        await supabase.from('student_evaluations').delete().in('student_id', studentIds);
                    }

                    // 2. Delete Attendance (via Lessons)
                    const { data: schoolLessons } = await supabase.from('lessons').select('id').eq('school_id', id);
                    if (schoolLessons && schoolLessons.length > 0) {
                        const lessonIds = schoolLessons.map(l => l.id);
                        await supabase.from('attendance').delete().in('lesson_id', lessonIds);
                        await supabase.from('lessons').delete().in('id', lessonIds);
                    }

                    // 3. Delete Assignments
                    await supabase.from('teacher_assignments').delete().eq('school_id', id);
                    // 4. Delete Students
                    await supabase.from('students').delete().eq('school_id', id);
                    // 5. Delete Class Groups
                    await supabase.from('class_groups').delete().eq('school_id', id);
                    // 6. Delete Notification Templates
                    await supabase.from('notification_templates').delete().eq('school_id', id);

                    await supabase.from('notification_templates').delete().eq('school_id', id);

                    // 7. Delete Inventory
                    await supabase.from('inventory').delete().eq('school_id', id);

                    // 8. Delete Maker Projects & Docs
                    const { data: schoolProjects } = await supabase.from('maker_projects').select('id').eq('school_id', id);
                    if (schoolProjects && schoolProjects.length > 0) {
                        const projectIds = schoolProjects.map(p => p.id);
                        await supabase.from('maker_project_documents').delete().in('project_id', projectIds);
                        await supabase.from('maker_project_updates').delete().in('project_id', projectIds);
                        await supabase.from('maker_project_students').delete().in('project_id', projectIds);
                        await supabase.from('maker_projects').delete().in('id', projectIds);
                    }

                    // Finally delete school
                    const { error } = await supabase.from('schools').delete().eq('id', id);
                    if (error) throw error;

                    // Should also clean up local state for related entities to prevent "ghost" data
                    set(state => ({
                        students: state.students.filter(s => s.schoolId !== id),
                        classGroups: state.classGroups.filter(c => c.schoolId !== id),
                        payments: state.payments.filter(p => p.schoolId !== id),
                        lessons: state.lessons.filter(l => l.schoolId !== id),
                        assignments: state.assignments.filter(a => a.schoolId !== id),
                        notificationTemplates: state.notificationTemplates.filter(n => n.schoolId !== id)
                    }));

                } catch (error) {
                    console.error('Error deleting school:', error);
                    alert('Okul silinirken bir hata oluştu. Lütfen önce ilişkili verileri (öğrenci, ders vb.) kontrol edin. Hata Detayı: ' + ((error as any).message || error));
                    set({ schools: previousSchools }); // Revert
                }
            },



            deleteClassGroup: async (id) => {
                const previousGroups = get().classGroups;
                const previousLessons = get().lessons;

                // Optimistic update: Remove group AND its lessons from state
                set(state => ({
                    classGroups: state.classGroups.filter(c => c.id !== id),
                    lessons: state.lessons.filter(l => l.classGroupId !== id)
                }));

                try {
                    // 1. Unassign Students
                    await supabase.from('students').update({ class_group_id: null }).eq('class_group_id', id);

                    // 2. Delete Assignments
                    await supabase.from('teacher_assignments').delete().eq('class_group_id', id);

                    // 3. Delete Lessons
                    const { data: groupLessons } = await supabase.from('lessons').select('id').eq('class_group_id', id);
                    if (groupLessons && groupLessons.length > 0) {
                        const lessonIds = groupLessons.map(l => l.id);
                        // Delete attendance first
                        await supabase.from('attendance').delete().in('lesson_id', lessonIds);
                        // Then delete lessons
                        await supabase.from('lessons').delete().in('id', lessonIds);
                    }

                    // Finally delete class group
                    const { error } = await supabase.from('class_groups').delete().eq('id', id);
                    if (error) throw error;
                } catch (error) {
                    console.error('Error deleting class group:', error);
                    alert('Sınıf silinirken bir hata oluştu.');
                    set({ classGroups: previousGroups, lessons: previousLessons }); // Revert
                }
            },

            updateClassGroup: async (id, updates) => {
                set(state => ({
                    classGroups: state.classGroups.map(c => c.id === id ? { ...c, ...updates } : c)
                }));

                const dbUpdate: any = {};
                if (updates.name) dbUpdate.name = updates.name;
                if (updates.schedule) dbUpdate.schedule = updates.schedule;

                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('class_groups').update(dbUpdate).eq('id', id);
                }
            },

            updateAssignment: async (id: string, updates: Partial<TeacherAssignment>, regenerateLessons: boolean = false) => {
                // 1. Optimistic Update
                set(state => ({
                    assignments: state.assignments.map(a => a.id === id ? { ...a, ...updates } : a)
                }));

                // 2. DB Update
                const dbUpdate: any = {};
                if (updates.dayOfWeek) dbUpdate.day_of_week = updates.dayOfWeek;
                if (updates.startTime) dbUpdate.start_time = updates.startTime;
                if (updates.endTime) dbUpdate.end_time = updates.endTime;
                if (updates.teacherId) dbUpdate.teacher_id = updates.teacherId;

                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('teacher_assignments').update(dbUpdate).eq('id', id);
                }

                // 3. Regenerate Lessons if requested
                if (regenerateLessons) {
                    const assignment = get().assignments.find(a => a.id === id);
                    if (!assignment) return;

                    const today = new Date().toISOString().split('T')[0];

                    // Delete future non-completed lessons for this class
                    const { data: futureLessons } = await supabase.from('lessons')
                        .select('id')
                        .eq('class_group_id', assignment.classGroupId)
                        .gte('date', today)
                        .neq('status', 'completed');

                    if (futureLessons && futureLessons.length > 0) {
                        const ids = futureLessons.map(l => l.id);
                        // Local delete
                        set(state => ({
                            lessons: state.lessons.filter(l => !ids.includes(l.id))
                        }));
                        // DB delete
                        await supabase.from('attendance').delete().in('lesson_id', ids);
                        await supabase.from('lessons').delete().in('id', ids);
                    }

                    // Generate new lessons (Default 4 weeks)
                    get().generateLessons(4, assignment.classGroupId);
                }
            },

            toggleClassStatus: async (id, status) => {
                set(state => ({
                    classGroups: state.classGroups.map(c => c.id === id ? { ...c, status } : c)
                }));

                if (status === 'archived') {
                    const today = new Date().toISOString().split('T')[0];
                    const state = get();

                    const lessonsToRemove = state.lessons.filter(l =>
                        l.classGroupId === id &&
                        l.date >= today &&
                        l.status !== 'completed'
                    );

                    const idsToRemove = lessonsToRemove.map(l => l.id);

                    if (idsToRemove.length > 0) {
                        set(state => ({
                            lessons: state.lessons.filter(l => !idsToRemove.includes(l.id))
                        }));

                        await supabase.from('attendance').delete().in('lesson_id', idsToRemove);
                        await supabase.from('lessons').delete().in('id', idsToRemove);
                    }

                    await supabase.from('class_groups').update({ status }).eq('id', id);
                } else {
                    await supabase.from('class_groups').update({ status }).eq('id', id);
                }
            },

            addLeave: async (leave) => {
                const newId = crypto.randomUUID();
                const newLeave = { ...leave, id: newId };
                set(state => ({ leaves: [...state.leaves, newLeave] }));

                const currentUser = useAuth.getState().user;
                if (currentUser) {
                    const log: ActivityLog = {
                        id: crypto.randomUUID(),
                        userId: currentUser.id,
                        userName: currentUser.name,
                        userRole: currentUser.role,
                        action: 'IZIN_EKLE',
                        details: `${leave.startDate} - ${leave.endDate} tarihleri için izin eklendi.`,
                        timestamp: new Date().toISOString()
                    };
                    set(state => ({ logs: [log, ...state.logs] }));
                }

                await supabase.from('teacher_leaves').insert([{
                    id: newId,
                    teacher_id: leave.teacherId,
                    start_date: leave.startDate,
                    end_date: leave.endDate,
                    start_time: leave.startTime,
                    end_time: leave.endTime,
                    type: leave.type,
                    reason: leave.reason
                }]);
            },

            updateLeave: async (id, updates) => {
                set(state => ({
                    leaves: state.leaves.map(l => l.id === id ? { ...l, ...updates } : l)
                }));

                const dbUpdate: any = {};
                if (updates.startDate) dbUpdate.start_date = updates.startDate;
                if (updates.endDate) dbUpdate.end_date = updates.endDate;
                if (updates.startTime) dbUpdate.start_time = updates.startTime;
                if (updates.endTime) dbUpdate.end_time = updates.endTime;
                if (updates.type) dbUpdate.type = updates.type;
                if (updates.reason) dbUpdate.reason = updates.reason;

                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('teacher_leaves').update(dbUpdate).eq('id', id);
                }
            },

            deleteLeave: async (id) => {
                set(state => ({ leaves: state.leaves.filter(l => l.id !== id) }));

                const currentUser = useAuth.getState().user;
                if (currentUser) {
                    const log: ActivityLog = {
                        id: crypto.randomUUID(),
                        userId: currentUser.id,
                        userName: currentUser.name,
                        userRole: currentUser.role,
                        action: 'IZIN_SIL',
                        details: `İzin kaydı silindi.`,
                        timestamp: new Date().toISOString()
                    };
                    set(state => ({ logs: [log, ...state.logs] }));
                }

                await supabase.from('teacher_leaves').delete().eq('id', id);
            },

            saveAttendance: async (lessonId, records) => {
                const newRecords = records.map(r => ({
                    id: crypto.randomUUID(),
                    lessonId,
                    studentId: r.studentId,
                    status: r.status,
                    note: ''
                } as Attendance));

                set(state => ({
                    attendance: [
                        ...state.attendance.filter(a => a.lessonId !== lessonId),
                        ...newRecords
                    ]
                }));

                const currentUser = useAuth.getState().user;
                if (currentUser) {
                    const lesson = get().lessons.find(l => l.id === lessonId);
                    useStore.getState().logs.push({
                        id: crypto.randomUUID(),
                        userId: currentUser.id,
                        userName: currentUser.name,
                        userRole: currentUser.role,
                        action: 'YOKLAMA_ALINDI',
                        details: `${lesson?.date} tarihli ders için yoklama alındı.`,
                        timestamp: new Date().toISOString()
                    });
                }
                // await supabase...

                // 1. Delete existing attendance for this lesson to prevent duplicates (full overwrite strategy)
                await supabase.from('attendance').delete().eq('lesson_id', lessonId);

                // 2. Insert new records
                if (newRecords.length > 0) {
                    await supabase.from('attendance').insert(newRecords.map(r => ({
                        id: r.id,
                        lesson_id: r.lessonId,
                        student_id: r.studentId,
                        status: r.status,
                        note: r.note
                    })));
                }
            },

            addNotificationTemplate: async (template) => {
                set(state => ({ notificationTemplates: [...state.notificationTemplates, { ...template, isActive: template.isActive ?? true }] }));
                await supabase.from('notification_templates').insert([{
                    id: template.id,
                    school_id: template.schoolId,
                    class_group_id: template.classGroupId,
                    trigger_type: template.triggerType,
                    message_template: template.messageTemplate,
                    offset_minutes: template.offsetMinutes,
                    trigger_time: template.triggerTime,
                    days_filter: template.daysFilter,
                    target_roles: template.targetRoles || ['student'],
                    is_active: template.isActive ?? true
                }]);
            },

            updateNotificationTemplate: async (id, updates) => {
                set(state => ({
                    notificationTemplates: state.notificationTemplates.map(t => t.id === id ? { ...t, ...updates } : t)
                }));

                const dbUpdate: any = {};
                if (updates.messageTemplate) dbUpdate.message_template = updates.messageTemplate;
                if (updates.offsetMinutes !== undefined) dbUpdate.offset_minutes = updates.offsetMinutes;
                if (updates.triggerType) dbUpdate.trigger_type = updates.triggerType;
                if (updates.classGroupId !== undefined) dbUpdate.class_group_id = updates.classGroupId;
                if (updates.targetRoles !== undefined) dbUpdate.target_roles = updates.targetRoles;
                if (updates.triggerTime !== undefined) dbUpdate.trigger_time = updates.triggerTime;
                if (updates.daysFilter !== undefined) dbUpdate.days_filter = updates.daysFilter;
                if (updates.isActive !== undefined) dbUpdate.is_active = updates.isActive;

                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('notification_templates').update(dbUpdate).eq('id', id);
                }
            },

            deleteNotificationTemplate: async (id) => {
                const previousTemplates = get().notificationTemplates;
                set(state => ({ notificationTemplates: state.notificationTemplates.filter(t => t.id !== id) }));

                try {
                    const { error } = await supabase.from('notification_templates').delete().eq('id', id);
                    if (error) {
                        throw error;
                    }
                } catch (err: any) {
                    console.error('Error deleting template:', err);
                    set({ notificationTemplates: previousTemplates });
                    alert('Şablon silinirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
                }
            },


            findAvailableTeachers: async (date, startTime, endTime) => {
                const state = get();
                const allTeachers = state.teachers.filter(t => t.isActive !== false && t.role === 'teacher');

                // Helper to check time overlap
                const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
                    return start1 < end2 && start2 < end1;
                };

                const availableTeachers = allTeachers.filter(teacher => {
                    // 1. Check Leaves
                    const hasLeave = state.leaves.some(leave => {
                        if (leave.teacherId !== teacher.id) return false;
                        const leaveStart = new Date(leave.startDate);
                        const leaveEnd = new Date(leave.endDate);
                        const checkDate = new Date(date);

                        // Simple date range check
                        if (checkDate >= leaveStart && checkDate <= leaveEnd) {
                            // If leave has specific times, check overlap
                            if (leave.startTime && leave.endTime) {
                                return isOverlapping(leave.startTime, leave.endTime, startTime, endTime);
                            }
                            return true; // Full day leave
                        }
                        return false;
                    });
                    if (hasLeave) return false;

                    // 2. Check Lessons
                    const hasLesson = state.lessons.some(lesson => {
                        if (lesson.teacherId !== teacher.id) return false;
                        if (lesson.status === 'cancelled') return false;
                        if (lesson.date !== date) return false;

                        return isOverlapping(lesson.startTime, lesson.endTime, startTime, endTime);
                    });
                    if (hasLesson) return false;

                    return true;
                });

                return availableTeachers;
            },

            fetchMoreLogs: async () => {
                const currentLogs = get().logs;
                const offset = get().logsOffset || 0;
                const limit = 50;

                const { data } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (data && data.length > 0) {
                    const mappedLogs: ActivityLog[] = data.map(l => ({
                        id: l.id,
                        userId: l.user_id,
                        userName: l.user_name,
                        userRole: l.user_role,
                        action: l.action,
                        details: l.details,
                        timestamp: l.created_at,
                        entityType: l.entity_type,
                        entityId: l.entity_id
                    }));

                    set({
                        logs: [...currentLogs, ...mappedLogs],
                        logsOffset: offset + data.length
                    });
                }
            },

            // Inventory Actions
            fetchInventory: async (schoolId) => {
                const { data, error } = await supabase
                    .from('inventory_items')
                    .select('*')
                    .eq('school_id', schoolId)
                    .order('name');

                if (error) {
                    console.error('Error fetching inventory:', error);
                    return;
                }

                // Map snake_case to camelCase
                const mappedData = data.map(item => ({
                    id: item.id,
                    schoolId: item.school_id,
                    name: item.name,
                    quantity: item.quantity,
                    category: item.category,
                    notes: item.notes,
                    createdAt: item.created_at
                }));

                set({ inventory: mappedData });
            },

            addInventoryItem: async (item) => {
                set(state => ({ inventory: [...state.inventory, item] }));

                const { error } = await supabase.from('inventory_items').insert([{
                    id: item.id,
                    school_id: item.schoolId,
                    name: item.name,
                    quantity: item.quantity,
                    category: item.category,
                    notes: item.notes
                }]);

                if (error) {
                    console.error('Error adding inventory item:', error);
                }
            },

            updateInventoryItem: async (id, updates) => {
                set(state => ({
                    inventory: state.inventory.map(i => i.id === id ? { ...i, ...updates } : i)
                }));

                const dbUpdates: any = {};
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
                if (updates.category !== undefined) dbUpdates.category = updates.category;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

                const { error } = await supabase
                    .from('inventory_items')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) console.error('Error updating inventory item:', error);
            },

            deleteInventoryItem: async (id) => {
                set(state => ({ inventory: state.inventory.filter(i => i.id !== id) }));
                const { error } = await supabase.from('inventory_items').delete().eq('id', id);
                if (error) console.error('Error deleting inventory item:', error);
            },

            // Maker Fair Implementation
            fetchMakerProjects: async (schoolId) => {
                const { data: projects, error: pError } = await supabase
                    .from('maker_projects')
                    .select('*')
                    .eq('school_id', schoolId);

                if (pError) console.error('Error fetching maker projects:', pError);

                if (projects && projects.length > 0) {
                    const mapped = projects.map(p => ({
                        id: p.id,
                        schoolId: p.school_id,
                        name: p.name,
                        description: p.description,
                        status: p.status,
                        makerFairDate: p.maker_fair_date,
                        createdAt: p.created_at,
                        createdBy: p.created_by
                    }));
                    set({ makerProjects: mapped as any });

                    // Fetch related data for these projects
                    const projectIds = mapped.map(p => p.id);

                    // 1. Students
                    const { data: students } = await supabase
                        .from('maker_project_students')
                        .select('*')
                        .in('project_id', projectIds);

                    if (students) {
                        set({ makerProjectStudents: students.map(s => ({ projectId: s.project_id, studentId: s.student_id })) });
                    }

                    // 2. Updates
                    const { data: updates } = await supabase
                        .from('maker_project_updates')
                        .select('*')
                        .in('project_id', projectIds);

                    if (updates) {
                        set({
                            makerProjectUpdates: updates.map(u => ({
                                id: u.id,
                                projectId: u.project_id,
                                weekNumber: u.week_number,
                                title: u.title,
                                content: u.content,
                                requests: u.requests,
                                createdAt: u.created_at
                            }))
                        });
                    }

                    // 3. Documents
                    const { data: docs } = await supabase
                        .from('maker_project_documents')
                        .select('*')
                        .in('project_id', projectIds);

                    if (docs) {
                        set({
                            makerProjectDocuments: docs.map(d => ({
                                id: d.id,
                                projectId: d.project_id,
                                title: d.title,
                                fileUrl: d.file_url,
                                fileType: d.file_type,
                                createdAt: d.created_at
                            }))
                        });
                    }
                } else {
                    set({ makerProjects: [], makerProjectStudents: [], makerProjectUpdates: [], makerProjectDocuments: [] });
                }
            },

            addMakerProject: async (project) => {
                const newId = crypto.randomUUID();
                const newProject = { ...project, id: newId, createdAt: new Date().toISOString() };
                set(state => ({ makerProjects: [...state.makerProjects, newProject as any] }));

                const { error } = await supabase.from('maker_projects').insert([{
                    id: newId,
                    school_id: project.schoolId,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    maker_fair_date: project.makerFairDate
                }]);

                if (error) {
                    console.error('Maker Project Add Error:', error);
                }
            },

            updateMakerProject: async (id, updates) => {
                set(state => ({
                    makerProjects: state.makerProjects.map(p => p.id === id ? { ...p, ...updates } : p)
                }));

                const dbUpdates: any = {};
                if (updates.name) dbUpdates.name = updates.name;
                if (updates.description) dbUpdates.description = updates.description;
                if (updates.status) dbUpdates.status = updates.status;
                if (updates.makerFairDate) dbUpdates.maker_fair_date = updates.makerFairDate;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('maker_projects').update(dbUpdates).eq('id', id);
                }
            },

            deleteMakerProject: async (id) => {
                set(state => ({ makerProjects: state.makerProjects.filter(p => p.id !== id) }));
                await supabase.from('maker_projects').delete().eq('id', id);
            },

            assignStudentToProject: async (projectId, studentId) => {
                set(state => ({
                    makerProjectStudents: [...state.makerProjectStudents, { projectId, studentId }]
                }));
                await supabase.from('maker_project_students').insert([{ project_id: projectId, student_id: studentId }]);
            },

            removeStudentFromProject: async (projectId, studentId) => {
                set(state => ({
                    makerProjectStudents: state.makerProjectStudents.filter(r => !(r.projectId === projectId && r.studentId === studentId))
                }));
                await supabase.from('maker_project_students').delete().match({ project_id: projectId, student_id: studentId });
            },

            addMakerProjectUpdate: async (update) => {
                const newId = crypto.randomUUID();
                const newUpdate = { ...update, id: newId, createdAt: new Date().toISOString() };
                set(state => ({ makerProjectUpdates: [...state.makerProjectUpdates, newUpdate as any] }));

                await supabase.from('maker_project_updates').insert([{
                    id: newId,
                    project_id: update.projectId,
                    week_number: update.weekNumber,
                    title: update.title,
                    content: update.content,
                    requests: update.requests
                }]);
            },

            addMakerProjectDocument: async (doc) => {
                const newId = crypto.randomUUID();
                const newDoc = { ...doc, id: newId, createdAt: new Date().toISOString() };
                set(state => ({ makerProjectDocuments: [...state.makerProjectDocuments, newDoc as any] }));

                await supabase.from('maker_project_documents').insert([{
                    id: newId,
                    project_id: doc.projectId,
                    title: doc.title,
                    file_url: doc.fileUrl,
                    file_type: doc.fileType
                }]);
            },

            deleteMakerProjectDocument: async (id) => {
                set(state => ({ makerProjectDocuments: state.makerProjectDocuments.filter(d => d.id !== id) }));
                await supabase.from('maker_project_documents').delete().eq('id', id);
            },

            // ============ BRANCHES CRUD ============
            async fetchBranches() {
                const { data, error } = await supabase.from('branches').select('*').order('name');
                if (error) {
                    console.error('Error fetching branches:', error);
                    return;
                }
                set({
                    branches: data?.map(b => ({
                        id: b.id,
                        name: b.name,
                        managerId: b.manager_id,
                        address: b.address,
                        phone: b.phone,
                        color: b.color,
                        defaultPrice: b.default_price,
                        price4Week: b.price_4week,
                        price12Week: b.price_12week,
                        priceDaily: b.price_daily,
                        priceHourly: b.price_hourly,
                        createdAt: b.created_at,
                        updatedAt: b.updated_at
                    })) || []
                });
            },

            async addBranch(branch) {
                const { data, error } = await supabase.from('branches').insert({
                    name: branch.name,
                    manager_id: branch.managerId,
                    address: branch.address,
                    phone: branch.phone,
                    color: branch.color
                }).select().single();
                if (error) {
                    console.error('Error adding branch:', error);
                    throw error;
                }
                set(state => ({
                    branches: [...state.branches, {
                        id: data.id,
                        name: data.name,
                        managerId: data.manager_id,
                        address: data.address,
                        phone: data.phone,
                        color: data.color,
                        createdAt: data.created_at,
                        updatedAt: data.updated_at
                    }]
                }));
            },

            updateBranch: async (id, updates) => {
                // 1. Optimistic Update: Update UI immediately
                const previousBranches = get().branches;
                set(state => ({
                    branches: state.branches.map(b => b.id === id ? { ...b, ...updates } : b)
                }));

                const dbUpdates: any = {};
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.managerId !== undefined) dbUpdates.manager_id = updates.managerId;
                if (updates.address !== undefined) dbUpdates.address = updates.address;
                if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
                if (updates.color !== undefined) dbUpdates.color = updates.color;
                if (updates.defaultPrice !== undefined) dbUpdates.default_price = updates.defaultPrice;
                if (updates.price4Week !== undefined) dbUpdates.price_4week = updates.price4Week;
                if (updates.price12Week !== undefined) dbUpdates.price_12week = updates.price12Week;
                if (updates.priceDaily !== undefined) dbUpdates.price_daily = updates.priceDaily;
                if (updates.priceHourly !== undefined) dbUpdates.price_hourly = updates.priceHourly;
                dbUpdates.updated_at = new Date().toISOString();

                // 2. Perform DB Update in background (Non-blocking)
                (async () => {
                    try {
                        const { error } = await supabase.from('branches').update(dbUpdates).eq('id', id);
                        if (error) {
                            console.error('Error updating branch in DB:', error);
                            // Rollback on failure
                            set({ branches: previousBranches });
                            alert('Veritabanı güncellemesi başarısız oldu, değişiklikler geri alındı.');
                        }
                    } catch (err) {
                        console.error('Unexpected error in branch update:', err);
                        set({ branches: previousBranches });
                    }
                })();

                // Return immediately to let UI close the modal
                return Promise.resolve();
            },

            deleteBranch: async (id) => {
                const { error } = await supabase.from('branches').delete().eq('id', id);
                if (error) {
                    console.error('Error deleting branch:', error);
                    throw error;
                }
                set(state => ({
                    branches: state.branches.filter(b => b.id !== id)
                }));
            },
        }),
        {
            name: 'school-storage',
            partialize: (state) => ({
                systemSettings: state.systemSettings,
                lastActivityLogView: state.lastActivityLogView,
                schools: state.schools,
                classGroups: state.classGroups,
                students: state.students,
                payments: state.payments,
                teachers: state.teachers,
                assignments: state.assignments,
                lessons: state.lessons,
                inventory: state.inventory,
                branches: state.branches, // NEW: Persist branches
            }),
        }
    )
);
