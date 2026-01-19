export interface School {
    id: string;
    name: string;
    address: string;
    phone: string;
    logo?: string;
    color?: string; // Theme color
    imageUrl?: string; // Background image URL
    defaultPrice?: number;
    paymentTerms?: string; // e.g. "Monthly", "Termly"
    managerName?: string;
    managerPhone?: string;
    managerEmail?: string;
    telegramChatId?: string;
    payment_cycle_start_date?: string; // ISO Date "2024-01-01"
}

export interface ClassGroup {
    id: string;
    schoolId: string;
    name: string; // e.g. "1. Grup", "Cumartesi Sabah"
    schedule?: string; // Human readable schedule for now
    status?: 'active' | 'archived';
}

export type StudentStatus = 'Active' | 'Left';

export interface Student {
    id: string;
    schoolId: string;
    classGroupId?: string;
    name: string;
    parentName?: string; // New field
    phone: string;
    parentPhone?: string;
    parentEmail?: string; // Mandatory in logic, optional in type until migration
    role?: string; // Removed or unused?
    status: StudentStatus;
    joinedDate: string; // ISO Date
    birthDate?: string; // ISO Date
    gradeLevel?: number; // 1-12
    address?: string;
    medicalNotes?: string;
    leftDate?: string; // ISO Date
    leftReason?: string;
    notes?: string;
    // Financials
    paymentStatus?: 'paid' | 'free' | 'discounted'; // Default 'paid'
    discountPercentage?: number; // 0-100
    telegramChatId?: string;
    // Manual Payment Tracking
    last_payment_status?: 'paid' | 'claimed' | 'pending';
    last_payment_date?: string; // ISO Date
    last_claim_date?: string; // ISO Date
}

export type PaymentType = 'Tuition' | 'Book' | 'Uniform' | 'Other';
export type PaymentMethod = 'Cash' | 'CreditCard' | 'Transfer';

export interface Payment {
    id: string;
    studentId?: string; // Optional now, as we track by school
    schoolId: string;
    amount: number;
    date: string; // ISO Date
    type: PaymentType;
    method: PaymentMethod;
    notes?: string;
    month?: string; // For tuition tracking "2023-10"
    status?: 'paid' | 'pending';
    paidAt?: string;
}

export interface Teacher {
    id: string;
    name: string;
    phone: string;
    email?: string;
    specialties?: string[];
    color?: string; // For calendar visualization
    role: 'admin' | 'teacher';
    schoolId?: string; // Optional linkage for managers/filtering
    password?: string; // Optional for now to handle migration, but ideally required
    telegramChatId?: string; // For Telegram notifications
}

// ... (Student interface was not requested to be updated in the prompt, but the SQL migration included it. Let's update it too for consistency if needed, but the focus is Teacher/Admin first.)
// Actually, let's update SystemSettings first as per plan.

export interface SystemSettings {
    id: string;
    logoUrl?: string;
    systemName: string;
    telegramBotToken?: string;
}

export interface TeacherLeave {
    id: string;
    teacherId: string;
    startDate: string; // ISO Date "2024-02-14"
    endDate: string; // ISO Date "2024-02-15" (Inclusive)
    startTime?: string;
    endTime?: string;
    type: 'sick' | 'vacation' | 'other';
    reason?: string;
    createdAt: string;
}



export interface TeacherAssignment {
    id: string;
    teacherId: string;
    schoolId: string;
    classGroupId?: string;
    dayOfWeek: number; // 0-6 or 1-7
    startTime: string; // "09:00"
    endTime: string; // "10:30"
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    details: string;
    timestamp: string;
    entityType?: string; // e.g. 'student', 'teacher', 'payment'
    entityId?: string;
}

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled';
export type LessonType = 'regular' | 'makeup';

export interface Lesson {
    id: string;
    schoolId: string;
    classGroupId: string;
    teacherId: string;
    date: string; // ISO Date "2024-02-14"
    startTime: string; // "10:00"
    endTime: string; // "11:00"
    status: LessonStatus;
    type: LessonType;
    cancelReason?: string;
    topic?: string;
    notes?: string;
    originalTeacherId?: string; // For substitutions
    isSubstitute?: boolean; // UI flag
    attachments?: { name: string; url: string; type: 'pdf' | 'link' }[];
}

export interface NotificationTemplate {
    id: string;
    schoolId: string | null;
    classGroupId?: string; // Optional: If set, applies only to this class
    triggerType: 'lesson_start' | 'lesson_end' | '15_min_before' | 'fixed_time' | 'last_lesson_end';
    messageTemplate: string;
    offsetMinutes: number; // For last_lesson_end, this can be offset (e.g. +30 mins after last lesson)
    triggerTime?: string; // For fixed_time (e.g. "18:00")
    daysFilter?: number[]; // [1, 2, 3, 4, 5] for Weekdays, [0, 6] for Weekends
    targetRoles?: ('student' | 'teacher' | 'manager' | 'admin')[];
    isActive?: boolean;
}


export interface Attendance {
    id: string;
    lessonId: string;
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    note?: string;
}

export interface SystemSettings {
    id: string;
    logoUrl?: string;
    systemName: string;
    telegramBotToken?: string;
    adminChatId?: string;
}
export interface StudentEvaluation {
    id: string;
    studentId: string;
    teacherId?: string | null;
    evaluatorId?: string;
    score: number;
    note: string;
    createdAt: string;
}

export interface TeacherEvaluation {
    id: string;
    teacherId: string;
    evaluatorId?: string;
    score: number;
    note: string;
    createdAt: string;
}

export interface InventoryItem {
    id: string;
    schoolId: string;
    name: string;
    quantity: number;
    category?: string;
    notes?: string;
    createdAt?: string;
}
