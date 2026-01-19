import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// import { useStore } from './useStore'; // Removed as unused
import { supabase } from '../supabase';

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

                try {
                    // 2. Teacher Check (Direct DB)
                    const { data: teacher } = await supabase
                        .from('teachers')
                        .select('*')
                        .eq('phone', phone)
                        .eq('password', password)
                        .maybeSingle();

                    if (teacher) {
                        set({
                            user: {
                                id: teacher.id,
                                name: teacher.name,
                                email: teacher.email || '',
                                role: teacher.role,
                                telegramChatId: teacher.telegram_chat_id
                            },
                            isAuthenticated: true
                        });
                        return true;
                    }

                    // 3. Manager Check (School Manager)
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
                                    linkedStudentId: undefined
                                },
                                isAuthenticated: true
                            });
                            return true;
                        }
                    }

                    // 4. Parent Check (Student Phone)
                    const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-10);
                    const normalizedInputPhone = normalizePhone(phone);

                    // We check for students where the phone ends with the normalized input
                    // This is a bit looser but effective for phone matching
                    const { data: students } = await supabase
                        .from('students')
                        .select('*')
                        .ilike('phone', `%${normalizedInputPhone}`);

                    // Find strict match among potential candidates
                    const student = students?.find(s => s.phone && normalizePhone(s.phone) === normalizedInputPhone);

                    if (student) {
                        const last4 = normalizedInputPhone.slice(-4);
                        if (password === last4) {
                            set({
                                user: {
                                    id: student.id,
                                    name: student.parent_name || student.name,
                                    email: student.parent_email || '',
                                    role: 'parent',
                                    linkedStudentId: student.id
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
