import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Modal } from '../components/Modal';

export function ManagerSchoolDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { schools, classGroups, students, attendance, lessons, payments, addPayment, updateStudent, seasons, fetchSeasons, fetchSchoolPeriods, fetchSchoolSeasonStats, closeSchoolSeason } = useStore();

    // Tab State
    const [activeTab, setActiveTab] = useState<'students' | 'financial'>('students');

    // Financial State
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
    const [schoolPeriods, setSchoolPeriods] = useState<any[]>([]);
    const [seasonStats, setSeasonStats] = useState<any>(null);
    const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);

    // Determine School
    const schoolId = user?.role === 'manager' ? user.id : schools.find(s => s.id === user?.id)?.id || schools[0]?.id; // Fallback for testing
    const school = useMemo(() => schools.find(s => s.id === schoolId), [schools, schoolId]);

    // Filters
    const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');



    // Initial Load
    useEffect(() => {
        const load = async () => {
            if (seasons.length === 0) await fetchSeasons();
        };
        load();
    }, [seasons.length]);

    // Set Default Season
    useEffect(() => {
        if (!selectedSeasonId && seasons.length > 0) {
            const active = seasons.find(s => s.isActive) || seasons[0];
            setSelectedSeasonId(active.id);
        }
    }, [seasons, selectedSeasonId]);

    // Load Periods and Stats when Season/School changes
    useEffect(() => {
        const loadPeriods = async () => {
            if (schoolId && selectedSeasonId) {
                setIsLoadingFinancials(true);
                const [periodsData, statsData] = await Promise.all([
                    fetchSchoolPeriods(schoolId, selectedSeasonId),
                    fetchSchoolSeasonStats(schoolId, selectedSeasonId)
                ]);
                setSchoolPeriods(periodsData);
                setSeasonStats(statsData);
                setIsLoadingFinancials(false);
            }
        };
        loadPeriods();
    }, [schoolId, selectedSeasonId]);



    if (!school) return <div className="p-8 text-center">Okul bilgisi bulunamadı.</div>;

    const schoolClasses = classGroups.filter(c => c.schoolId === schoolId);

    // Calculate Financial Summary for Selected Season (Moved Up)
    const financialSummary = useMemo(() => {
        const totalDebt = schoolPeriods.reduce((acc, p) => acc + (p.expectedAmount || 0), 0);

        // Find payments for this season
        const seasonPayments = payments.filter(p => p.schoolId === schoolId && p.seasonId === selectedSeasonId && p.transactionType === 'payment');
        const totalPaid = seasonPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

        const writeOffs = payments.filter(p => p.schoolId === schoolId && p.seasonId === selectedSeasonId && p.transactionType === 'write_off');
        const totalForgiven = writeOffs.reduce((acc, p) => acc + (p.amount || 0), 0);

        const balance = totalDebt - totalPaid - totalForgiven;

        return { totalDebt, totalPaid, totalForgiven, balance };
    }, [schoolPeriods, payments, schoolId, selectedSeasonId]);

    const handleCloseSeason = async () => {
        if (!schoolId || !selectedSeasonId) return;

        const balance = financialSummary.balance;

        if (confirm(`DİKKAT: Bu sezonu kapatmak üzeresiniz.\n\nKalan Bakiye: ${balance} TL\n\nBu bakiye "Silinen/İade" olarak işaretlenecek ve sezon kapatılacaktır. Onaylıyor musunuz?`)) {
            await closeSchoolSeason(schoolId, selectedSeasonId, `Sezon Kapatma - Otomatik Silinen Bakiye: ${balance} TL`);

            // Add write-off if balance > 0
            if (balance > 0) {
                await useStore.getState().addFinancialTransaction({
                    schoolId,
                    seasonId: selectedSeasonId,
                    amount: balance,
                    type: 'write_off',
                    date: new Date().toISOString(),
                    notes: 'Sezon Kapatma İşlemi ile Silinen Bakiye'
                });
            }

            // Reload
            const stats = await fetchSchoolSeasonStats(schoolId, selectedSeasonId);
            setSeasonStats(stats);

            // Refresh periods/payments state via fetch
            const periods = await fetchSchoolPeriods(schoolId, selectedSeasonId);
            setSchoolPeriods(periods);
        }
    };

    // Period Logic (Database Driven)
    const sortedPeriods = useMemo(() => {
        return [...schoolPeriods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [schoolPeriods]);

    const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);

    // Auto-select current or last period on load
    useEffect(() => {
        if (sortedPeriods.length > 0) {
            const today = new Date();
            const current = sortedPeriods.findIndex(p => {
                const start = new Date(p.startDate);
                const end = new Date(p.endDate);
                return today >= start && today <= end;
            });

            if (current !== -1) {
                setSelectedPeriodIndex(current);
            } else {
                // If not in any period, show the one closest to future or last one
                // Simple default: Show the last one if all are past, or first if all future
                if (new Date(sortedPeriods[sortedPeriods.length - 1].endDate) < today) {
                    setSelectedPeriodIndex(sortedPeriods.length - 1);
                } else {
                    setSelectedPeriodIndex(0);
                }
            }
        }
    }, [sortedPeriods.length]); // Only run when periods are loaded/changed count

    const selectedPeriod = sortedPeriods[selectedPeriodIndex];

    const [isManagePeriodsModalOpen, setIsManagePeriodsModalOpen] = useState(false);


    // 2. Filter Students
    const filteredStudents = useMemo(() => {
        if (!schoolId) return [];
        return students.filter(s => {
            if (s.schoolId !== schoolId) return false;
            // if (s.status !== 'Active') return false; // Show all? Usually managers want Active.
            if (s.status === 'Left') return false; // Hide left students
            if (selectedClassGroupId !== 'all' && s.classGroupId !== selectedClassGroupId) return false;
            if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [students, schoolId, selectedClassGroupId, searchTerm]);

    // 3. Attendance Data (Unchanged)
    const getAttendanceHistory = (studentId: string, classGroupId: string | undefined) => {
        if (!classGroupId) return Array(4).fill('gray');

        const groupLessons = lessons
            .filter(l => l.classGroupId === classGroupId && l.status !== 'cancelled')
            .sort((a, b) => {
                const dA = new Date(a.date + 'T' + a.startTime);
                const dB = new Date(b.date + 'T' + b.startTime);
                return dB.getTime() - dA.getTime(); // Descending
            });

        const last4 = groupLessons.slice(0, 4).reverse();

        return last4.map(lesson => {
            const att = attendance.find(a => a.lessonId === lesson.id && a.studentId === studentId);
            const lessonDate = new Date(lesson.date + 'T' + lesson.endTime);
            if (lessonDate > new Date()) return 'future';

            if (!att) return 'unknown';
            return att.status;
        });
    };

    // 4. Payment Status Logic (Updated for DB Periods)
    const getPaymentStatus = (studentId: string) => {
        if (!selectedPeriod) return { hasPastDebt: false, currentStatus: 'unpaid' };

        let hasPastDebt = false;

        // Check ONLY previous DB periods for this season
        const previousPeriods = sortedPeriods.filter(p => new Date(p.endDate) < new Date(selectedPeriod.startDate));

        for (const p of previousPeriods) {
            const s = students.find(x => x.id === studentId);
            if (s && new Date(s.joinedDate) > new Date(p.endDate)) continue; // Joined after period end
            if (s?.paymentStatus === 'free') continue;

            const paid = payments.some(pay => {
                if (pay.studentId !== studentId) return false;
                // Match by Period ID if available, otherwise fallback to date range
                if (pay.schoolPeriodId === p.id) return true;

                const pDate = new Date(pay.date);
                // Strict check: payment must be within period dates if manual
                return pDate >= new Date(p.startDate) && pDate <= new Date(p.endDate);
            });

            if (!paid) {
                hasPastDebt = true;
                break;
            }
        }

        const s = students.find(x => x.id === studentId);
        let currentStatus: 'paid' | 'unpaid' | 'claimed' = 'unpaid';

        if (s?.paymentStatus === 'free') {
            currentStatus = 'paid';
        } else {
            const isPaid = payments.some(p => {
                if (p.studentId !== studentId) return false;
                // Match by Period ID
                if (p.schoolPeriodId === selectedPeriod.id) return true;

                // Fallback Date Check
                const pDate = new Date(p.date);
                return pDate >= new Date(selectedPeriod.startDate) && pDate <= new Date(selectedPeriod.endDate);
            });

            if (isPaid) {
                currentStatus = 'paid';
            } else if (s?.last_payment_status === 'claimed') { // This logic might need refinement to be period-specific but for now keep as is
                currentStatus = 'claimed';
            } else {
                currentStatus = 'unpaid';
            }
        }

        return { hasPastDebt, currentStatus };
    };

    // 5. Stats Calculation
    const stats = useMemo(() => {
        if (!selectedPeriod) return { total: 0, paid: 0 };
        const total = filteredStudents.length;
        const paid = filteredStudents.filter(s => {
            const { currentStatus } = getPaymentStatus(s.id);
            return currentStatus === 'paid';
        }).length;
        return { total, paid };
    }, [filteredStudents, payments, selectedPeriod, sortedPeriods]); // Added dependencies


    // Manual Payment Handler
    const handleManualPayment = async (student: any) => {
        if (!selectedPeriod) return;
        if (!confirm(`${student.name} için manuel ödeme girişi yapılacak. Onaylıyor musunuz?`)) return;

        const amount = Number(school?.defaultPrice) || 0;

        await addPayment({
            id: crypto.randomUUID(),
            schoolId,
            studentId: student.id,
            amount: amount,
            date: new Date().toISOString(),
            type: 'Tuition',
            method: 'Cash',
            month: new Date(selectedPeriod.startDate).toISOString().slice(0, 7),
            seasonId: selectedSeasonId || seasons.find(s => s.isActive)?.id,
            schoolPeriodId: selectedPeriod.id, // Direct Link to Period
            status: 'paid',
            paidAt: new Date().toISOString(),
            notes: `${selectedPeriod.periodNumber}. Dönem Manuel Ödeme`
        });

        await updateStudent(student.id, {
            last_payment_status: 'paid',
            last_payment_date: new Date().toISOString()
        });
    };

    // Quick Approve Handler
    const handleApproveClaim = async (student: any) => {
        if (!selectedPeriod) return;
        if (!confirm(`${student.name} tarafından yapılan ödeme bildirimini onaylıyor musunuz?`)) return;

        const amount = Number(school?.defaultPrice) || 0;

        await addPayment({
            id: crypto.randomUUID(),
            schoolId,
            studentId: student.id,
            amount: amount,
            date: new Date().toISOString(),
            type: 'Tuition',
            method: 'Transfer',
            month: new Date(selectedPeriod.startDate).toISOString().slice(0, 7),
            seasonId: selectedSeasonId || seasons.find(s => s.isActive)?.id,
            schoolPeriodId: selectedPeriod.id, // Direct Link
            status: 'paid',
            paidAt: new Date().toISOString(),
            notes: `${selectedPeriod.periodNumber}. Dönem Ödemesi (Veli Bildirimi Onayı)`
        });

        await updateStudent(student.id, {
            last_payment_status: 'paid',
            last_payment_date: new Date().toISOString()
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            <ManagePeriodsModal
                isOpen={isManagePeriodsModalOpen}
                onClose={() => setIsManagePeriodsModalOpen(false)}
                periods={sortedPeriods}
                schoolId={schoolId}
                seasonId={selectedSeasonId}
                onUpdate={async () => {
                    const data = await fetchSchoolPeriods(schoolId, selectedSeasonId);
                    setSchoolPeriods(data);
                }}
            />

            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{school.name}</h1>
                    <div className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                        <Calendar size={14} />
                        <span>Yönetici Paneli</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Öğrenciler
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'financial' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Finans & Sezon
                    </button>
                </div>
            </div>

            {activeTab === 'financial' && (
                <div className="space-y-6">
                    {isLoadingFinancials && (
                        <div className="p-8 text-center text-slate-500">
                            Yükleniyor...
                        </div>
                    )}
                    {!isLoadingFinancials && (
                        <>
                            {/* Season Selector and Tools */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-slate-700">Sezon:</label>
                                    <select
                                        value={selectedSeasonId}
                                        onChange={(e) => setSelectedSeasonId(e.target.value)}
                                        className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {seasons.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Aktif)' : ''}</option>
                                        ))}
                                    </select>
                                    {seasonStats?.is_closed && (
                                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold border border-red-200 uppercase tracking-wide">
                                            SEZON KAPANDI
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsManagePeriodsModalOpen(true)}
                                        className="text-slate-600 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Dönem Yönetimi
                                    </button>
                                    <button
                                        onClick={() => navigate('/financial-reports')}
                                        className="text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Detaylı Raporlar
                                    </button>
                                    {!seasonStats?.is_closed && (
                                        <>
                                            {/* Removed Auto Generate Button used to be here */}
                                            <button
                                                onClick={handleCloseSeason}
                                                className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors border border-red-100"
                                            >
                                                Sezonu Kapat
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase">Toplam Tahakkuk (Borç)</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-1">{financialSummary.totalDebt.toLocaleString('tr-TR')} ₺</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase">Toplam Tahsilat</div>
                                    <div className="text-2xl font-bold text-emerald-600 mt-1">{financialSummary.totalPaid.toLocaleString('tr-TR')} ₺</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase">Silinen / İade</div>
                                    <div className="text-2xl font-bold text-orange-600 mt-1">{financialSummary.totalForgiven.toLocaleString('tr-TR')} ₺</div>
                                </div>
                                <div className={`p-4 rounded-xl border shadow-sm ${financialSummary.balance > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <div className={`text-xs font-bold uppercase ${financialSummary.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {financialSummary.balance > 0 ? 'Kalan Bakiye' : 'Durum'}
                                    </div>
                                    <div className={`text-2xl font-bold mt-1 ${financialSummary.balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {financialSummary.balance > 0 ? `${financialSummary.balance.toLocaleString('tr-TR')} ₺` : 'Borçsuz'}
                                    </div>
                                </div>
                            </div>

                            {/* Periods Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortedPeriods.map((period) => {
                                    const pStart = new Date(period.startDate);
                                    const pEnd = new Date(period.endDate);
                                    const pPayments = payments.filter(p => {
                                        if (p.schoolId !== schoolId) return false;
                                        if (p.schoolPeriodId === period.id) return true;
                                        const d = new Date(p.date);
                                        return d >= pStart && d <= pEnd && p.seasonId === selectedSeasonId;
                                    });

                                    const periodPaid = pPayments.filter(p => p.transactionType === 'payment').reduce((acc, p) => acc + p.amount, 0);
                                    const periodDebt = period.expectedAmount || 0;
                                    const periodBalance = periodDebt - periodPaid;

                                    return (
                                        <div key={period.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                                                <div className="font-bold text-slate-700">{period.periodNumber}. Dönem</div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                    {format(pStart, 'd MMM', { locale: tr })} - {format(pEnd, 'd MMM', { locale: tr })}
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Öğrenci Sayısı (Snapshot):</span>
                                                    <span className="font-medium">{period.studentCountSnapshot}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Tahakkuk (Borç):</span>
                                                    <span className="font-bold text-slate-900">{periodDebt.toLocaleString('tr-TR')} ₺</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Ödenen:</span>
                                                    <span className="font-bold text-emerald-600">{periodPaid > 0 ? '+' : ''}{periodPaid.toLocaleString('tr-TR')} ₺</span>
                                                </div>

                                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                                    <div className={`px-2 py-1 rounded text-xs font-bold ${periodBalance > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {periodBalance > 0 ? 'Borçlu' : 'Tamamlandı'}
                                                    </div>
                                                    {periodBalance > 0 && (
                                                        <div className="text-red-600 font-bold text-sm">
                                                            -{periodBalance.toLocaleString('tr-TR')} ₺
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {sortedPeriods.length === 0 && (
                                    <div className="col-span-full p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                        Bu sezona ait oluşturulmuş bir dönem bulunmamaktadır.
                                        <br />
                                        <button onClick={() => setIsManagePeriodsModalOpen(true)} className="text-blue-600 font-bold hover:underline mt-2">
                                            Yeni Dönem Ekle
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'students' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                            <div className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                                <span className="font-bold text-slate-700">
                                    Tahsilat: <span className="text-green-600">{stats.paid}</span> / {stats.total}
                                </span>
                            </div>
                        </div>

                        {/* Period Selector */}
                        {sortedPeriods.length > 0 ? (
                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => setSelectedPeriodIndex(prev => Math.max(0, prev - 1))}
                                    disabled={selectedPeriodIndex === 0}
                                    className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="px-4 text-center">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">YOKLAMA DÖNEMİ</div>
                                    <div className="font-bold text-slate-800 text-sm whitespace-nowrap">
                                        {format(new Date(selectedPeriod.startDate), 'd MMM', { locale: tr })} - {format(new Date(selectedPeriod.endDate), 'd MMM', { locale: tr })}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        {selectedPeriod.periodNumber}. Dönem
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPeriodIndex(prev => Math.min(sortedPeriods.length - 1, prev + 1))}
                                    disabled={selectedPeriodIndex === sortedPeriods.length - 1}
                                    className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-sm font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                Dönem Bulunamadı
                            </div>
                        )}

                        {/* Filters */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Öğrenci Ara..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 w-40 md:w-64"
                            />
                            <select
                                value={selectedClassGroupId}
                                onChange={(e) => setSelectedClassGroupId(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                            >
                                <option value="all">Tüm Sınıflar</option>
                                {schoolClasses.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>


                    {/* Main Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Öğrenci</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sınıf</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Son 4 Ders</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ödeme Durumu</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map(student => {
                                    const attendanceHistory = getAttendanceHistory(student.id, student.classGroupId);
                                    const { hasPastDebt, currentStatus } = getPaymentStatus(student.id);

                                    let statusColorClass = 'border border-slate-200';

                                    if (hasPastDebt) {
                                        statusColorClass = 'border-2 border-red-500 bg-red-50/10 shadow-sm shadow-red-100';
                                    } else if (currentStatus === 'paid') {
                                        statusColorClass = 'border-2 border-emerald-500 bg-emerald-50/10 shadow-sm shadow-emerald-100';
                                    } else if (currentStatus === 'claimed') {
                                        statusColorClass = 'border-2 border-blue-500 bg-blue-50/10 shadow-sm shadow-blue-100';
                                    } else {
                                        statusColorClass = 'border-2 border-orange-400 bg-orange-50/10 shadow-sm shadow-orange-100';
                                    }

                                    return (
                                        <tr key={student.id} className={`hover:bg-slate-50 group transition-all rounded-lg block md:table-row mb-2 md:mb-0 ${statusColorClass}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{student.name}</div>
                                                        <div className="text-xs text-slate-400">{student.phone}</div>
                                                        {hasPastDebt && (
                                                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">
                                                                Geçmiş Borç
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                                    {classGroups.find(c => c.id === student.classGroupId)?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-1.5">
                                                    {attendanceHistory.map((status: any, idx) => (
                                                        <div
                                                            key={idx}
                                                            title={status === 'present' ? 'Geldi' : status === 'absent' ? 'Gelmedi' : 'Planlanmamış/Gelecek'}
                                                            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${status === 'present' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' :
                                                                status === 'absent' ? 'bg-orange-500 shadow-sm shadow-orange-200' :
                                                                    status === 'late' ? 'bg-yellow-500' :
                                                                        status === 'future' ? 'bg-slate-100 border border-slate-200' :
                                                                            'bg-slate-200'
                                                                }`}
                                                        >
                                                        </div>
                                                    ))}
                                                    {attendanceHistory.length < 4 && Array(4 - attendanceHistory.length).fill(null).map((_, i) => (
                                                        <div key={`empty-${i}`} className="w-6 h-6 rounded bg-slate-100 border border-slate-200 opacity-50"></div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-6">
                                                    <div className="flex flex-col items-center gap-1" title="Geçmiş Dönem Borçları">
                                                        <div className={`w-4 h-4 rounded-full transition-all ${hasPastDebt
                                                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
                                                            : 'bg-slate-200'
                                                            }`}></div>
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">Geçmiş</span>
                                                    </div>

                                                    <div className="flex flex-col items-center gap-1" title="Bu Dönem Ödemesi">
                                                        <div className={`w-4 h-4 rounded-full transition-all ${currentStatus === 'paid'
                                                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                            : currentStatus === 'claimed'
                                                                ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-bounce'
                                                                : 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]'
                                                            }`}></div>
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">
                                                            {currentStatus === 'claimed' ? 'Bildirim' : 'Dönem'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {currentStatus === 'unpaid' && (
                                                    <button
                                                        onClick={() => handleManualPayment(student)}
                                                        className="text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors border border-orange-100"
                                                    >
                                                        Ödeme Al
                                                    </button>
                                                )}
                                                {currentStatus === 'claimed' && (
                                                    <button
                                                        onClick={() => handleApproveClaim(student)}
                                                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition-all animate-pulse"
                                                    >
                                                        Ödemeyi Onayla
                                                    </button>
                                                )}
                                                {currentStatus === 'paid' && (
                                                    <button
                                                        disabled
                                                        className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100"
                                                    >
                                                        Tamamlandı
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400">
                                            Kayıtlı öğrenci bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}
        </div>
    );
}

// Manage Periods Modal Component
function ManagePeriodsModal({ isOpen, onClose, periods, schoolId, seasonId, onUpdate }: {
    isOpen: boolean;
    onClose: () => void;
    periods: any[];
    schoolId: string;
    seasonId: string;
    onUpdate: () => void;
}) {
    const { addSchoolPeriod, deleteSchoolPeriod } = useStore();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) return;

        await addSchoolPeriod(schoolId, seasonId, startDate, endDate);
        setStartDate('');
        setEndDate('');
        onUpdate();
    };

    const handleDelete = async (periodId: string) => {
        if (confirm('Bu dönemi silmek istediğinize emin misiniz?')) {
            await deleteSchoolPeriod(periodId);
            onUpdate();
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Dönem Yönetimi"
        >
            <div className="space-y-6">
                {/* List Existing */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {periods.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="text-sm">
                                <span className="font-bold text-slate-700">{p.periodNumber}. Dönem:</span>{' '}
                                <span className="text-slate-600">
                                    {format(new Date(p.startDate), 'd MMM', { locale: tr })} - {format(new Date(p.endDate), 'd MMM', { locale: tr })}
                                </span>
                            </div>
                            <button
                                onClick={() => handleDelete(p.id)}
                                className="text-red-600 hover:text-red-700 p-1 text-xs font-medium"
                            >
                                Sil
                            </button>
                        </div>
                    ))}
                    {periods.length === 0 && (
                        <div className="text-center text-slate-400 text-sm py-4">Henüz oluşturulmuş dönem yok.</div>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Yeni Dönem Ekle</h4>
                    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Başlangıç</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Bitiş</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                        >
                            Ekle
                        </button>
                    </form>
                </div>
            </div>
        </Modal>
    );
}
