import { NavLink } from 'react-router-dom';
import { LayoutDashboard, School, Users, Banknote, Calendar, ClipboardList, Shield, History, Settings, CalendarDays, LogOut, Hexagon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { useState } from 'react';
import { ProfileModal } from './ProfileModal';

export function ModernSidebar() {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Panel' },
        { to: '/parent', icon: LayoutDashboard, label: 'Panel' },
        { to: '/schedule', icon: CalendarDays, label: 'Ders Programı' },
        { to: '/schools', icon: School, label: 'Okullar' },
        { to: '/students', icon: Users, label: 'Öğrenciler' },
        { to: '/finance', icon: Banknote, label: 'Finans' },
        { to: '/teachers', icon: Calendar, label: 'Kadro' },
        { to: '/reports', icon: ClipboardList, label: 'Raporlar' },
    ];

    const { user, logout } = useAuth();
    const systemSettings = useStore((state) => state.systemSettings);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Filter Navigation based on Role
    const filteredNavItems = navItems.filter(item => {
        if (!user) return false;
        if (user.role === 'admin') return item.to !== '/parent';
        if (user.role === 'parent') {
            return item.to === '/parent';
        }
        const teacherAllowed = ['/', '/schedule', '/schools', '/students', '/reports'];
        return teacherAllowed.includes(item.to);
    });

    return (
        <>
            <div className="h-full w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="p-6 relative z-10 flex flex-col items-center text-center">
                    <div className="mb-3 bg-white/10 p-3 rounded-full shadow-lg border border-white/10 backdrop-blur-sm">
                        {systemSettings?.logoUrl ? (
                            <img src={systemSettings.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
                        ) : (
                            <Hexagon size={36} className="text-blue-500 fill-current" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                            {systemSettings?.systemName || 'Okul Yönetim Sistemi'}
                        </h1>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar relative z-10">
                    <div className="mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Menü</div>

                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                twMerge(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 translate-x-1"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:pl-5"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={18} className={isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform duration-300"} />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}

                    {user?.role === 'admin' && (
                        <>
                            <div className="mt-8 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Yönetim</div>
                            <NavLink
                                to="/activity-log"
                                className={({ isActive }) =>
                                    twMerge(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
                                        isActive
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 translate-x-1"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:pl-5"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <History size={18} className={isActive ? "" : "text-purple-400 group-hover:text-purple-300 transition-colors"} />
                                        <span className="font-medium text-sm">İşlem Geçmişi</span>
                                    </>
                                )}
                            </NavLink>
                            <NavLink
                                to="/settings"
                                className={({ isActive }) =>
                                    twMerge(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
                                        isActive
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 translate-x-1"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:pl-5"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Settings size={18} className={isActive ? "" : "text-purple-400 group-hover:text-purple-300 transition-colors"} />
                                        <span className="font-medium text-sm">Ayarlar</span>
                                    </>
                                )}
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* Footer / Profile */}
                <div className="p-4 relative z-10 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
                    <div
                        className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-800 transition-all duration-300 group border border-transparent hover:border-slate-700/50"
                        onClick={() => setIsProfileOpen(true)}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform ${user?.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                            <span className="text-sm font-bold text-white">
                                {(() => {
                                    const name = user?.name || 'AD';
                                    const parts = name.trim().split(' ');
                                    if (parts.length >= 2) {
                                        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                                    }
                                    return name.substring(0, 2).toUpperCase();
                                })()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate flex items-center gap-1">
                                {user?.name || 'Yönetici'}
                                {user?.role === 'admin' && <Shield size={12} className="text-purple-400" />}
                            </h4>
                            <p className="text-xs text-slate-400 truncate capitalize">{user?.role === 'admin' ? 'Süper Yönetici' : 'Öğretmen'}</p>
                        </div>
                        <Settings size={16} className="text-slate-500 group-hover:text-white transition-colors group-hover:rotate-90 duration-500" />
                    </div>

                    <button
                        onClick={logout}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 group uppercase tracking-wide"
                    >
                        <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Çıkış Yap
                    </button>
                </div>
            </div>

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </>
    );
}
