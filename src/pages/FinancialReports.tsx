import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { BarChart3, TrendingUp, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FinancialReports() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Access Control
    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800">Yetkisiz Erişim</h1>
                <p className="text-slate-500 mt-2">Bu sayfayı görüntüleme yetkiniz yok.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Ana Sayfaya Dön
                </button>
            </div>
        );
    }

    const { schools, seasons, fetchSeasons, fetchSchoolPeriods, payments } = useStore();

    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
    const [periodData, setPeriodData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            if (seasons.length === 0) await fetchSeasons();
        };
        load();
    }, [seasons.length]);

    // Set Defaults
    useEffect(() => {
        if (!selectedSchoolId && schools.length > 0) {
            // If manager, prioritize their school
            const mySchool = schools.find(s => s.id === user?.id) || schools[0];
            setSelectedSchoolId(mySchool.id);
        }
        if (!selectedSeasonId && seasons.length > 0) {
            const active = seasons.find(s => s.isActive) || seasons[0];
            setSelectedSeasonId(active.id);
        }
    }, [schools, seasons, user, selectedSchoolId, selectedSeasonId]);

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            if (selectedSchoolId && selectedSeasonId) {
                setIsLoading(true);
                const periods = await fetchSchoolPeriods(selectedSchoolId, selectedSeasonId);
                setPeriodData(periods);
                setIsLoading(false);
            }
        };
        loadData();
    }, [selectedSchoolId, selectedSeasonId]);

    // Prepare Chart Data
    const chartData = useMemo(() => {
        return periodData.map(p => {
            // Calculate realized for this period
            // Needs logic to match payments to period. Duplicated from Dashboard, maybe should be shared helper?
            // For reporting, we can do it here.

            const pStart = new Date(p.startDate);
            const pEnd = new Date(p.endDate);

            // Filter payments for this period
            const periodPayments = payments.filter(pay => {
                if (pay.schoolId !== selectedSchoolId) return false;
                // Match by ID if available, else date range
                if (pay.schoolPeriodId === p.id) return true;
                // Fallback date range
                const d = new Date(pay.date);
                return d >= pStart && d <= pEnd && pay.seasonId === selectedSeasonId;
            });

            const realized = periodPayments
                .filter(pay => pay.transactionType === 'payment')
                .reduce((acc, pay) => acc + pay.amount, 0);

            const expected = p.expectedAmount || 0;
            const studentCount = p.studentCountSnapshot || 0;

            return {
                label: `${p.periodNumber}. Dönem`,
                realized,
                expected,
                studentCount
            };
        });
    }, [periodData, payments, selectedSchoolId, selectedSeasonId]);

    // Max values for scaling
    const maxMoney = Math.max(...chartData.map(d => Math.max(d.expected, d.realized)), 1000);
    const maxStudents = Math.max(...chartData.map(d => d.studentCount), 10);

    const school = schools.find(s => s.id === selectedSchoolId);

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-2"
                        >
                            <ArrowLeft size={20} className="mr-1" />
                            Geri Dön
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900">{school?.name} Finansal Raporlar</h1>
                        <p className="text-slate-500">Gelir ve öğrenci trend analizi</p>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <select
                            value={selectedSchoolId}
                            onChange={(e) => setSelectedSchoolId(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
                        >
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select
                            value={selectedSeasonId}
                            onChange={(e) => setSelectedSeasonId(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
                        >
                            {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-20 text-slate-500">Yükleniyor...</div>
                ) : (
                    <>
                        {/* Revenue Chart */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <BarChart3 className="text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-900">Beklenen vs Gerçekleşen Gelir</h2>
                            </div>

                            <div className="h-80 flex items-end gap-4 pb-2 border-b border-slate-200 relative">
                                {/* Grid lines (optional) */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-xs text-slate-300">
                                    <span>{maxMoney.toLocaleString('tr-TR')} ₺</span>
                                    <span>{(maxMoney / 2).toLocaleString('tr-TR')} ₺</span>
                                    <span>0 ₺</span>
                                </div>

                                {chartData.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end z-10">
                                        {/* Bars Container */}
                                        <div className="w-full max-w-[60px] flex items-end gap-1 h-full px-1">
                                            {/* Expected Bar */}
                                            <div
                                                style={{ height: `${(d.expected / maxMoney) * 100}%` }}
                                                className="flex-1 bg-slate-200 rounded-t hover:bg-slate-300 transition-all relative group/bar"
                                            >
                                                <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                                                    Beklenen: {d.expected.toLocaleString('tr-TR')} ₺
                                                </div>
                                            </div>
                                            {/* Realized Bar */}
                                            <div
                                                style={{ height: `${(d.realized / maxMoney) * 100}%` }}
                                                className="flex-1 bg-blue-600 rounded-t hover:bg-blue-700 transition-all relative group/bar"
                                            >
                                                <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                                                    Gerçekleşen: {d.realized.toLocaleString('tr-TR')} ₺
                                                </div>
                                            </div>
                                        </div>
                                        {/* Label */}
                                        <div className="text-xs font-medium text-slate-500 rotate-0">
                                            {d.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-slate-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-slate-200 rounded"></div>
                                    <span>Tahakkuk (Beklenen)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                                    <span>Tahsilat (Gerçekleşen)</span>
                                </div>
                            </div>
                        </div>

                        {/* Student Trend Chart */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="text-emerald-600" />
                                <h2 className="text-lg font-bold text-slate-900">Öğrenci Sayısı Trendi</h2>
                            </div>

                            <div className="h-64 flex items-end gap-4 pb-2 border-b border-slate-200 relative">
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-xs text-slate-300">
                                    <span>{maxStudents} Öğrenci</span>
                                    <span>{Math.round(maxStudents / 2)}</span>
                                    <span>0</span>
                                </div>

                                {chartData.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end z-10">
                                        <div
                                            style={{ height: `${(d.studentCount / maxStudents) * 100}%` }}
                                            className="w-full max-w-[40px] bg-emerald-100 border-t-4 border-emerald-500 rounded-t hover:bg-emerald-200 transition-all relative group/bar"
                                        >
                                            <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                                                {d.studentCount} Öğrenci
                                            </div>
                                        </div>
                                        <div className="text-xs font-medium text-slate-500">
                                            {d.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
