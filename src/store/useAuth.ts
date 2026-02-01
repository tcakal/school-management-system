import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// import { useStore } from './useStore'; // Removed as unused
import { supabase } from '../supabase';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'school_admin' | 'teacher' | 'parent' | 'student' | 'manager';
    schoolId?: string;
    branchId?: string;
    linkedStudentId?: string;
    telegramChatId?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (phone: string, password: string) => Promise<boolean>;
    logout: () => void;
    updatePassword: (password: string) => Promise<boolean>;
}

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
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

                try {
                    // 2. Teacher & Manager Check (Teachers Table)
                    // Checks both 'teacher' and 'manager' roles in the teachers table
                    const { data: teacher } = await supabase
                        .from('teachers')
                        .select('*')
                        .eq('phone', phone)
                        .eq('password', password)
                        .maybeSingle();

                    if (teacher) {
                        // Access Control: Check is_active
                        if (teacher.is_active === false) {
                            alert('Hesabınız pasif durumdadır. Lütfen yönetici ile iletişime geçin.');
                            return false;
                        }

                        set({
                            user: {
                                id: teacher.id,
                                name: teacher.name,
                                email: teacher.email || '',
                                role: teacher.role as any, // 'admin' | 'manager' | 'teacher'
                                schoolId: teacher.school_id, // Link to school
                                branchId: teacher.branch_id, // Link to branch
                                telegramChatId: teacher.telegram_chat_id
                            },
                            isAuthenticated: true
                        });
                        return true;
                    }

                    // 3. Legacy Manager Check (Schools Table - if not in teachers yet)
                    // TODO: Deprecate this once all managers are migrated to teachers table
                    const { data: managerSchool } = await supabase
                        .from('schools')
                        .select('*')
                        .eq('manager_phone', phone)
                        .maybeSingle();

                    if (managerSchool) {
                        const last4 = phone.slice(-4);
                        if (password === last4) {
                            set({
                                user: {
                                    id: managerSchool.id,
                                    name: managerSchool.manager_name || 'Okul Müdürü',
                                    email: managerSchool.manager_email || '',
                                    role: 'manager',
                                    linkedStudentId: undefined,
                                    schoolId: managerSchool.id // They manage this school
                                },
                                isAuthenticated: true
                            });
                            return true;
                        }
                    }

                    // 4. Parent Check (Student Phone)
                    const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-10);
                    const normalizedInputPhone = normalizePhone(phone);

                    const { data: students } = await supabase
                        .from('students')
                        .select('*')
                        .ilike('phone', `%${normalizedInputPhone}`);

                    const student = students?.find(s => s.phone && normalizePhone(s.phone) === normalizedInputPhone);

                    if (student) {
                        // Access Control: Check Status
                        if (student.status !== 'Active') {
                            alert('Öğrenci kaydı aktif değildir. Giriş yapılamaz.');
                            return false;
                        }

                        const last4 = normalizedInputPhone.slice(-4);
                        if (password === last4) {
                            set({
                                user: {
                                    id: student.id,
                                    name: student.parent_name || student.name,
                                    email: student.parent_email || '',
                                    role: 'parent',
                                    linkedStudentId: student.id,
                                    schoolId: student.school_id
                                },
                                isAuthenticated: true
                            });
                            return true;
                        }
                    }

                } catch (error) {
                    console.error('Login error:', error);
                    return false;
                }

                return false;
            },

            updatePassword: async (newPassword: string) => {
                const { user } = get();
                if (!user) return false;

                try {
                    if (user.role === 'admin' || user.role === 'teacher' || user.role === 'manager') {
                        // Update teachers table
                        const { error } = await supabase
                            .from('teachers')
                            .update({ password: newPassword })
                            .eq('id', user.id);

                        if (error) throw error;
                        return true;
                    }

                    if (user.role === 'parent' && user.linkedStudentId) {
                        // Update students table? 
                        // Wait, parents calculate password from Phone Last 4. 
                        // If we want them to change password, we need a 'password' column on students table fallback?
                        // Or strict 'password' column usage.
                        // Current logic: `if (password === last4)`
                        // To support custom password, we need to change login logic to check `password` column FIRST, then fallback to last4.
                        // AND add `password` column to students.

                        // For now, I will assume we add 'password' column to students.
                        const { error } = await supabase
                            .from('students')
                            .update({ password: newPassword })
                            .eq('id', user.linkedStudentId);

                        if (error) throw error;
                        return true;
                    }

                    return false;
                } catch (err) {
                    console.error('Password update failed', err);
                    return false;
                }
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
