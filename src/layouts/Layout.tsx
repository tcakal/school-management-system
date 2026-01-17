import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ModernSidebar } from '../components/ModernSidebar';
import { useStore } from '../store/useStore';
import { NotificationCenter } from '../components/NotificationCenter';
import { TelegramOnboardingModal } from '../components/TelegramOnboardingModal';

export function Layout() {
    const { fetchData, initialized } = useStore();

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
                {/* Notification Center Floating Top Right */}
                <div className="absolute top-6 right-8 z-20">
                    <NotificationCenter />
                </div>

                <div className="p-8 max-w-7xl mx-auto pb-20">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
