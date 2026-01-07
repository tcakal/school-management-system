import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useStore } from '../store/useStore';

export function Layout() {
    const { fetchData, initialized } = useStore();

    useEffect(() => {
        if (!initialized) {
            fetchData();
        }
    }, [initialized, fetchData]);

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
