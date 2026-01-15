import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStore } from './useStore';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher' | 'parent' | 'manager';
    linkedStudentId?: string;
    telegramChatId?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (phone: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,

            login: async (phone: string, password: string) => {
                // 1. Super Admin Check
                if (phone === '5364606500' && password === 'Atolye8008.') {
                    set({
                        user: {
                            id: 'super-admin',
                            name: 'Süper Yönetici',
                            email: 'admin@okul.com',
                            role: 'admin'
                        },
                        isAuthenticated: true
                    });
                    return true;
                }

                const store = useStore.getState();

                // 2. Teacher Check
                const teacher = store.teachers.find(t => t.phone === phone && t.password === password);
                if (teacher) {
                    set({
                        user: {
                            id: teacher.id,
                            name: teacher.name,
                            email: teacher.email || '',
                            role: teacher.role, // 'admin' or 'teacher'
                            telegramChatId: teacher.telegramChatId
                        },
                        isAuthenticated: true
                    });
                    return true;
                }

                // 3. Manager Check (School Manager)
                const managerSchool = store.schools.find(s => s.managerPhone === phone);
                if (managerSchool) {
                    // Password must be the last 4 digits of the phone number
                    const last4 = phone.slice(-4);
                    if (password === last4) {
                        set({
                            user: {
                                id: managerSchool.id, // Using School ID as User ID for simplicity? Or create a composite "manager-" + schoolId?
                                // Let's use "manager-" + schoolId to avoid collision with Student IDs if any
                                name: managerSchool.managerName || 'Okul Müdürü',
                                email: managerSchool.managerEmail || '',
                                role: 'manager',
                                linkedStudentId: undefined // Not linked to a student
                            },
                            isAuthenticated: true
                        });
                        return true;
                    }
                }

                // 4. Parent Check (Student Phone)
                // Normalize input phone: remove non-numeric chars, take last 10 digits
                const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-10);
                const normalizedInputPhone = normalizePhone(phone);

                const student = store.students.find(s => s.phone && normalizePhone(s.phone) === normalizedInputPhone);
                if (student) {
                    // Password is last 4 digits of the normalized phone (10 digits)
                    // If input phone was < 10 digits, this logic might be weak, but assuming valid 10 digit input
                    const last4 = normalizedInputPhone.slice(-4);

                    if (password === last4) {
                        set({
                            user: {
                                id: student.id,
                                name: student.parentName || student.name, // Use parent name if available, else student name
                                email: student.parentEmail || '',
                                role: 'parent',
                                linkedStudentId: student.id
                            },
                            isAuthenticated: true
                        });
                        return true;
                    }
                }

                return false;
            },

            logout: () => {
                set({ user: null, isAuthenticated: false });
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
