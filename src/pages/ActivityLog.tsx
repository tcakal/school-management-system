import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../supabase';
import { History, Clock, Search, Filter, UserCog, UserCheck, Shield, Receipt, Download, Loader2, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { utils, writeFile } from 'xlsx';

export function ActivityLog() {
    const { logs, fetchMoreLogs, markActivityLogSeen } = useStore();
    const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'manager' | 'parent' | 'system'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [exporting, setExporting] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Mark as seen on mount
    useEffect(() => {
        markActivityLogSeen();
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            const { data } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5000);

            if (data) {
                const headers = ['Tarih', 'Kullanıcı', 'Rol', 'İşlem', 'Detay'];
                const rows = data.map(l => [
                    format(new Date(l.created_at), 'dd.MM.yyyy HH:mm', { locale: tr }),
                    l.user_name,
                    l.user_role === 'admin' ? 'Yönetici' : l.user_role === 'manager' ? 'Müdür' : l.user_role === 'teacher' ? 'Öğretmen' : l.user_role,
                    l.action,
                    l.details
                ]);

                const wb = utils.book_new();
                const ws = utils.aoa_to_sheet([headers, ...rows]);

                // Column widths
                ws['!cols'] = [
                    { wch: 20 }, // Date
                    { wch: 20 }, // User
                    { wch: 15 }, // Role
                    { wch: 25 }, // Action
                    { wch: 50 }, // Details
                ];

                utils.book_append_sheet(wb, ws, "Aktivite Logları");
                writeFile(wb, `Aktivite_Gecmisi_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Rapor oluşturulurken hata oluştu.');
        } finally {
            setExporting(false);
        }
    };

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            await fetchMoreLogs();
        } catch (error) {
            console.error('Load more error:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Filter logs based on tab and search term
    const filteredLogs = logs.filter(log => {
        // Tab Filter
        if (activeTab === 'teacher' && log.userRole !== 'teacher') return false;
        if (activeTab === 'manager' && log.userRole !== 'manager') return false;
        if (activeTab === 'parent' && log.userRole !== 'parent') return false;
        if (activeTab === 'system' && log.userRole !== 'admin') return false; // Assuming 'admin' is system for now, or check log.entityType === 'system'

        // Search Filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                log.userName?.toLowerCase().includes(searchLower) ||
                log.details?.toLowerCase().includes(searchLower) ||
                log.action?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    // Helper to get icon based on action or entity type
    const getActionIcon = (log: any) => {
        if (log.entityType === 'payment' || log.action.includes('ODEME')) return <Receipt size={16} className="text-green-600" />;
        if (log.action.includes('OGRETMEN')) return <UserCheck size={16} className="text-blue-600" />;
        if (log.action.includes('YONETICI') || log.userRole === 'admin') return <Shield size={16} className="text-purple-600" />;
        return <UserCog size={16} className="text-slate-500" />;
    };

    return (
        <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                        <History size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">İşlem Geçmişi</h2>
                        <p className="text-white">Sistem üzerindeki tüm hareketler ve değişiklikler.</p>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    Excel İndir
                </button>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700">
                    {[
                        { id: 'all', label: 'Tümü' },
                        { id: 'teacher', label: 'Öğretmen' },
                        { id: 'manager', label: 'Müdür' },
                        { id: 'parent', label: 'Veli' },
                        { id: 'system', label: 'Sistem/Admin' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="İşlem veya kişi ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-purple-500/50 transition-all border-slate-700 !bg-slate-800 !text-slate-200 !border-slate-700 placeholder:text-slate-500"
                        style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}
                    />
                </div>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all flex flex-col md:flex-row gap-4 items-center md:items-start"
                        >
                            {/* User Avatar */}
                            <div className="shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg 
                                    ${log.userRole === 'admin' ? 'bg-purple-900/50 text-purple-400 ring-2 ring-purple-500/20' :
                                        log.userRole === 'teacher' ? 'bg-blue-900/50 text-blue-400 ring-2 ring-blue-500/20' :
                                            'bg-emerald-900/50 text-emerald-400 ring-2 ring-emerald-500/20'}`}
                                >
                                    {log.userName?.substring(0, 2).toUpperCase()}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                                    <h4 className="font-semibold text-slate-200 flex items-center justify-center md:justify-start gap-2">
                                        {log.userName}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider
                                            ${log.userRole === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                                                log.userRole === 'teacher' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-emerald-500/10 text-emerald-400'}`}
                                        >
                                            {log.userRole === 'admin' ? 'Yönetici' :
                                                log.userRole === 'teacher' ? 'Öğretmen' :
                                                    log.userRole === 'manager' ? 'Müdür' :
                                                        log.userRole === 'parent' ? 'Veli' : log.userRole}
                                        </span>
                                    </h4>
                                    <div className="flex items-center justify-center md:justify-end gap-2 text-xs text-slate-500">
                                        <Clock size={14} />
                                        {format(new Date(log.timestamp), 'd MMMM yyyy HH:mm', { locale: tr })}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <div className="mt-1 shrink-0">
                                        {getActionIcon(log)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-300 font-mono mb-1">
                                            {log.action}
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            {log.details}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700 border-dashed">
                        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                            <Filter size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 mb-2">Kayıt Bulunamadı</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Seçilen filtre kriterlerine uygun işlem geçmişi kaydı bulunamadı.
                        </p>
                    </div>
                )}
            </div>

            {logs.length > 0 && (
                <div className="flex justify-center pt-4 pb-2">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 transition-all font-medium disabled:opacity-50"
                    >
                        {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                        Daha Fazla Yükle
                    </button>
                </div>
            )}
        </div>
    );
}

export default ActivityLog;
