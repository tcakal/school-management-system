import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ModernSidebar } from '../components/ModernSidebar';
import { useStore } from '../store/useStore';

export function Layout() {
    const { fetchData, initialized } = useStore();

    useEffect(() => {
        if (!initialized) {
            fetchData();
        }
    }, [initialized, fetchData]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
            <ModernSidebar />
            <main className="flex-1 overflow-auto relative scroll-smooth">
                <div className="p-8 max-w-7xl mx-auto pb-20">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
