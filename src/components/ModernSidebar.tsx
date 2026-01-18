
import { NavLink } from 'react-router-dom';
import {
    Building2, Users, GraduationCap, LayoutDashboard,
    Wallet, Calendar, FileText, Settings, LogOut, Activity, BookOpen
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';

export function ModernSidebar() {
    const { user, logout } = useAuth();
    const { systemSettings, logs, lastActivityLogView } = useStore();

    const hasNewLogs = logs.length > 0 && (!lastActivityLogView || new Date(logs[0].timestamp).getTime() > new Date(lastActivityLogView).getTime());

    // Base Navigation Items
    const allNavItems = [
        { to: '/', icon: LayoutDashboard, label: 'Panel' },
        { to: '/schools', icon: Building2, label: 'Okullar' },
        { to: '/students', icon: GraduationCap, label: 'Öğrenciler' },
        { to: '/schedule', icon: Calendar, label: 'Ders Programı' },
        { to: '/activity-log', icon: Activity, label: 'Aktivite' },
        { to: '/finance', icon: Wallet, label: 'Finans' },
        { to: '/teachers', icon: Users, label: 'Kadro' },
        { to: '/reports', icon: FileText, label: 'Raporlar' },
        { to: '/settings', icon: Settings, label: 'Ayarlar' },
        { to: '/rehber', icon: BookOpen, label: 'Yardım / Kılavuz' },
    ];

    // Filter Navigation based on Role - STRICT MODE
    let navItems = allNavItems;

    if (user?.role === 'manager') {
        // Manager ONLY sees Panel (Manager Dashboard) and Reports
        navItems = [
            { to: '/manager-dashboard', icon: LayoutDashboard, label: 'Panel' },
            { to: '/reports', icon: FileText, label: 'Raporlar' },
        ];
    } else if (user?.role === 'teacher') {
        // Teacher sees: Dashboard, Schedule, Schools, Students, Reports, Guide
        const teacherAllowed = ['/', '/schedule', '/schools', '/students', '/reports', '/rehber'];
        navItems = allNavItems.filter(item => teacherAllowed.includes(item.to));
    } else if (user?.role === 'admin') {
        // Admin sees everything
        navItems = allNavItems;
    } else {
        // Fallback (e.g. Student)
        navItems = [];
    }

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col transition-all duration-300">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-800 flex flex-col items-center justify-center gap-3 text-center">
                {systemSettings?.logoUrl ? (
                    <img
                        src={systemSettings.logoUrl}
                        alt="Logo"
                        className="w-16 h-16 object-contain rounded bg-white/5 p-1"
                    />
                ) : (
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
                        <GraduationCap size={28} className="text-white" />
                    </div>
                )}

                {systemSettings?.systemName ? (
                    <div className="font-bold text-lg tracking-tight break-words w-full">
                        {systemSettings.systemName}
                    </div>
                ) : (
                    <div className="font-bold text-lg tracking-tight">
                        <span className="text-blue-400">Okul</span>Yönetim
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            twMerge(
                                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={twMerge(
                                        "transition-colors duration-200",
                                        isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                    )}
                                />
                                <span>{item.label}</span>
                                {item.to === '/activity-log' && hasNewLogs && !isActive && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-red-500 shadow-md shadow-red-500/50 animate-pulse" />
                                )}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Logic & Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-800 flex items-center justify-center text-blue-200 font-bold shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                        <div className="text-xs text-slate-500 truncate capitalize">{user?.role === 'manager' ? 'Okul Müdürü' : user?.role === 'admin' ? 'Yönetici' : 'Öğretmen'}</div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 rounded-lg transition-colors text-sm font-medium group"
                >
                    <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                    Çıkış Yap
                </button>
            </div>
        </div>
    );
}
