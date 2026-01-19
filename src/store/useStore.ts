import { create } from 'zustand';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import type { School, Student, ClassGroup, Payment, Teacher, TeacherAssignment, ActivityLog, Lesson, Attendance, NotificationTemplate, TeacherLeave, SystemSettings, StudentEvaluation, TeacherEvaluation } from '../types';
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
    generateLessons: (weeks?: number, classGroupId?: string) => Promise<void>;
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

    // Activity Log Helper
    logAction: (action: string, details: string, entityType?: string, entityId?: string) => Promise<void>; // entityType made optional
    fetchMoreLogs: () => Promise<void>; // Added fetchMoreLogs
    fetchTraceLogs: () => Promise<void>;
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
                        telegramChatId: s.telegram_chat_id
                    }));

                    const students: Student[] = (studentsRes.data || []).map(s => ({
                        id: s.id,
                        schoolId: s.school_id,
                        classGroupId: s.class_group_id,
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
                        gradeLevel: s.grade_level,
                        telegramChatId: s.telegram_chat_id,
                        last_payment_status: s.last_payment_status,
                        last_payment_date: s.last_payment_date,
                        last_claim_date: s.last_claim_date
                    }));

                    const classGroups: ClassGroup[] = (classGroupsRes.data || []).map(c => ({
                        id: c.id,
                        schoolId: c.school_id,
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
                        password: t.password,
                        telegramChatId: t.telegram_chat_id
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
                    manager_email: school.managerEmail
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
                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('schools').update(dbUpdate).eq('id', id);
                }
            },


            addStudent: async (student) => {
                set((state) => ({ students: [...state.students, student] }));
                get().logAction('OGRENCI_EKLE', `${student.name} kayıt edildi.`, 'student', student.id);

                const { error } = await supabase.from('students').insert([{
                    id: student.id,
                    school_id: student.schoolId,
                    class_group_id: student.classGroupId,
                    name: student.name,
                    phone: student.phone,
                    status: student.status,
                    joined_date: student.joinedDate,
                    birth_date: student.birthDate,
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
                    school_id: group.schoolId,
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
                    paid_at: payment.paidAt
                }]);
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
                    password: teacher.password || '123456'
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
                await supabase.from('teacher_assignments').insert([{
                    id: assignment.id,
                    teacher_id: assignment.teacherId,
                    school_id: assignment.schoolId,
                    class_group_id: assignment.classGroupId,
                    day_of_week: assignment.dayOfWeek,
                    start_time: assignment.startTime,
                    end_time: assignment.endTime
                }]);

                // Trigger lesson generation for this group immediately
                await get().generateLessons(4, assignment.classGroupId);
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

            generateLessons: async (weeks = 4, classGroupId) => {
                const allAssignments = get().assignments;
                const assignments = classGroupId
                    ? allAssignments.filter(a => a.classGroupId === classGroupId)
                    : allAssignments;

                const currentLessons = get().lessons;
                const newLessons: Lesson[] = [];
                const today = new Date();

                // 1. Identify all groups that have assignments
                const activeGroupIds = new Set(assignments.map(a => a.classGroupId));

                // 2. Cleanup: Remove future "scheduled" lessons for these groups that DO NOT match any current assignment
                // This handles the case where a teacher was removed or time changed.
                // We only touch 'scheduled' lessons, preserving 'completed' or 'cancelled' history if desired, 
                // though usually future cancelled lessons should also be removed if the schedule changed entirely.

                const validFutureLessons: Lesson[] = [];
                const lessonsToDelete: string[] = [];

                // Helper to check if a lesson matches any active assignment
                const matchesAssignment = (lesson: Lesson, date: Date) => {
                    const dayOfWeek = date.getDay() || 7; // 1=Mon, 7=Sun
                    return assignments.some(a =>
                        a.classGroupId === lesson.classGroupId &&
                        a.dayOfWeek === dayOfWeek &&
                        a.startTime === lesson.startTime
                    );
                };

                const todayStr = format(today, 'yyyy-MM-dd');

                currentLessons.forEach(l => {
                    // Only check future or today's lessons
                    if (l.date >= todayStr && activeGroupIds.has(l.classGroupId)) {
                        // If it's a manually scheduled extra lesson (type 'makeup'), keep it? 
                        // meaningful data. For now, we assume 'regular' lessons are auto-generated.
                        if (l.type === 'regular' && l.status === 'scheduled') {
                            if (!matchesAssignment(l, new Date(l.date))) {
                                lessonsToDelete.push(l.id);
                                return; // Don't add to valid list
                            }
                        }
                    }
                    validFutureLessons.push(l);
                });

                // Update state to remove deleted lessons immediately
                if (lessonsToDelete.length > 0) {
                    set(state => ({
                        lessons: state.lessons.filter(l => !lessonsToDelete.includes(l.id))
                    }));
                    // Fire and forget delete
                    await supabase.from('lessons').delete().in('id', lessonsToDelete);
                    console.log(`Cleaned up ${lessonsToDelete.length} stale lessons.`);
                }

                // 3. Generate New Lessons
                for (let i = 0; i < weeks; i++) {
                    const weekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), i);

                    assignments.forEach(assignment => {
                        const addDaysCount = assignment.dayOfWeek - 1;
                        const lessonDate = new Date(weekStart);
                        lessonDate.setDate(lessonDate.getDate() + addDaysCount);

                        const dateStr = format(lessonDate, 'yyyy-MM-dd');

                        // Skip if date is in the past
                        if (dateStr < todayStr) return;

                        // Check against the *filtered* list (validFutureLessons) plus what we've added in this loop
                        // We actually need to check against the Store's lessons (which we just updated) 
                        // but checking the valid list is safer to avoid async state issues.
                        // However, we might have just deleted it. 

                        // Let's use a composite key check
                        // Actually, simply check if we already have a lesson for this slot in "validFutureLessons" or "newLessons"
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

                if (Object.keys(dbUpdate).length > 0) {
                    await supabase.from('lessons').update(dbUpdate).eq('id', id);
                }
            },

            deleteLesson: async (id) => {
                set(state => ({ lessons: state.lessons.filter(l => l.id !== id) }));
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
                    alert('Okul silinirken bir hata oluştu. Lütfen önce ilişkili verileri (öğrenci, ders vb.) kontrol edin.');
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
                set(state => ({ notificationTemplates: state.notificationTemplates.filter(t => t.id !== id) }));
                await supabase.from('notification_templates').delete().eq('id', id);
            },


            findAvailableTeachers: async (date, startTime, endTime) => {
                const { data, error } = await supabase.rpc('find_available_teachers', {
                    p_date: date,
                    p_start_time: startTime,
                    p_end_time: endTime
                });

                if (error) {
                    console.error('Error finding available teachers:', error);
                    return [];
                }

                return (data || []).map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    phone: t.phone,
                    role: 'teacher' as const,
                    email: '',
                    specialties: [],
                    schoolId: 'system'
                }));
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
            }
        }),
        {
            name: 'school-storage',
            partialize: (state) => ({
                systemSettings: state.systemSettings,
                lastActivityLogView: state.lastActivityLogView,
                schools: state.schools,
                classGroups: state.classGroups,
                // Persist other essential data as needed
            }),
        }
    )
);
