import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ModernSidebar } from '../components/ModernSidebar';
import { useStore } from '../store/useStore';
import { NotificationCenter } from '../components/NotificationCenter';
import { TelegramOnboardingModal } from '../components/TelegramOnboardingModal';

import { supabase } from '../supabase';
import { useAuth } from '../store/useAuth';

export function Layout() {
    const { fetchData, initialized } = useStore();
    const { user } = useAuth();

    // Auto-process Telegram updates for Admins (Poll every 30s)
    useEffect(() => {
        if (user?.role !== 'admin') return;

        const checkUpdates = async () => {
            try {
                const { data, error } = await supabase.rpc('process_telegram_updates');
                if (!error && data) {
                    // If any user was matched or processed, refresh store to update UI
                    if (data.matched > 0) {
                        fetchData();
                        console.log('Telegram Auto-Match:', data);
                    }
                }
            } catch (err) {
                console.error('Auto-poll error:', err);
            }
        };

        // Run immediately on mount then interval
        checkUpdates();
        const interval = setInterval(checkUpdates, 30000);
        return () => clearInterval(interval);
    }, [user, fetchData]);

    useEffect(() => {
        if (!initialized) {
            fetchData();
        }
    }, [initialized, fetchData]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
            <TelegramOnboardingModal />
            <ModernSidebar />
            <main className="flex-1 overflow-auto relative scroll-smooth">
                {/* Notification Center Floating Top Right - Hidden for Managers and Parents */}
                {!['manager', 'parent'].includes(user?.role || '') && (
                    <div className="absolute top-6 right-8 z-20">
                        <NotificationCenter />
                    </div>
                )}

                <div className="p-8 max-w-7xl mx-auto pb-20">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
