import { useStore } from '../store/useStore';
import { History, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function ActivityLog() {
    const { logs } = useStore();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <History size={24} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">İşlem Geçmişi</h2>
                    <p className="text-slate-500">Sistem üzerinde yapılan tüm değişikliklerin kayıtları.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Zaman</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Kullanıcı</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">İşlem</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Detay</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} />
                                        {format(new Date(log.timestamp), 'd MMMM yyyy HH:mm', { locale: tr })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${log.userRole === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {log.userName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900 text-sm">{log.userName}</div>
                                            <div className="text-xs text-slate-500 capitalize">{log.userRole === 'admin' ? 'Yönetici' : 'Öğretmen'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium font-mono border border-slate-200">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    Henüz kayıtlı bir işlem bulunmuyor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
