import { NavLink } from 'react-router-dom';
import { LayoutDashboard, School, Users, Banknote, Calendar, ClipboardList, Shield, History, Settings, CalendarDays } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../store/useAuth';
import { useState } from 'react';
import { ProfileModal } from './ProfileModal';

export function Sidebar() {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Panel' },
        { to: '/schedule', icon: CalendarDays, label: 'Ders Programı' },
        { to: '/schools', icon: School, label: 'Okullar' },
        { to: '/students', icon: Users, label: 'Öğrenciler' },
        { to: '/finance', icon: Banknote, label: 'Finans' },
        { to: '/teachers', icon: Calendar, label: 'Kadro' },
        { to: '/reports', icon: ClipboardList, label: 'Raporlar' },
    ];

    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Filter Navigation based on Role
    const filteredNavItems = navItems.filter(item => {
        if (!user) return false;

        // Admin sees everything
        if (user.role === 'admin') return true;

        // Teacher sees only specific items
        // Teacher sees: Dashboard, Schedule, Schools, Students, Reports
        if (user.role === 'teacher') {
            const teacherAllowed = ['/', '/schedule', '/schools', '/students', '/reports'];
            return teacherAllowed.includes(item.to);
        }

        // Manager sees: School, Attendance, Payments, Reports
        if (user.role === 'manager') {
            // New Manager Workflow (Visual Dashboard)
            const managerAllowedKeys = ['/', '/reports'];
            return managerAllowedKeys.includes(item.to);
        }

        return false;
    });

    // Custom Menu Items for Manager OR Admin (for testing)
    const showManagerItems = user?.role === 'manager' || user?.role === 'admin';

    const managerCustomItems = showManagerItems ? [
        { to: '/manager-dashboard', icon: LayoutDashboard, label: user?.role === 'admin' ? 'Müdür Paneli (Test)' : 'Panel' },
        { to: `/school/${user?.id}`, icon: School, label: 'Okulum' },
    ] : [];

    // Merge lists for display
    // If Manager: Show Manager Items + Reports
    // If Admin: Show Standard Items + Manager Link (prepended or appended)

    const finalNavItems = user?.role === 'manager'
        ? [...managerCustomItems, ...filteredNavItems.filter(i => i.to === '/reports')]
        : user?.role === 'admin'
            ? [...filteredNavItems, ...managerCustomItems] // Admin sees everything + Manager Link
            : filteredNavItems;

    return (
        <>
            <div className="h-screen w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Atölye Vizyon
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Okul Yönetim Sistemi</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {finalNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                twMerge(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )
                            }
                        >
                            <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}

                    {user?.role === 'admin' && (
                        <>
                            <NavLink
                                to="/activity-log"
                                className={({ isActive }) =>
                                    twMerge(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mt-4 border-t border-slate-800",
                                        isActive
                                            ? "bg-purple-900/50 text-purple-100"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    )
                                }
                            >
                                <History size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-medium">İşlem Geçmişi</span>
                            </NavLink>
                            <NavLink
                                to="/settings"
                                className={({ isActive }) =>
                                    twMerge(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                        isActive
                                            ? "bg-purple-900/50 text-purple-100"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    )
                                }
                            >
                                <Settings size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-medium">Ayarlar</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div
                        className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                        onClick={() => setIsProfileOpen(true)}
                        title="Profil Ayarları"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                            <span className="text-xs font-bold">{user?.name?.substring(0, 2).toUpperCase() || 'AD'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate flex items-center gap-1">
                                {user?.name || 'Yönetici'}
                                {user?.role === 'admin' && <Shield size={12} className="text-purple-400" />}
                            </h4>
                            <p className="text-xs text-slate-500 truncate capitalize">{user?.role === 'admin' ? 'Güçlü Yönetici' : 'Öğretmen'}</p>
                        </div>
                        <Settings size={14} className="text-slate-500" />
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </div>

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </>
    );
}
