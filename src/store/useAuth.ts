import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStore } from './useStore';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher';
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

                // 2. Check against Teachers list (Simulating a DB check here)
                // Note: In a real app, this should be an API call to avoid loading passwords
                const teachers = useStore.getState().teachers;
                const foundUser = teachers.find(t => t.phone === phone && t.password === password);

                if (foundUser) {
                    set({
                        user: {
                            id: foundUser.id,
                            name: foundUser.name,
                            email: foundUser.email || '',
                            role: foundUser.role
                        },
                        isAuthenticated: true
                    });
                    return true;
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
