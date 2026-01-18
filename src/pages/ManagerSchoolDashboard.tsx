import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
// PaymentModal logic is currently inline or simplified within this file to avoid complex dependency cycles.
// import { PaymentModal } from '../components/PaymentModal';

export function ManagerSchoolDashboard() {
    const { user } = useAuth();
    const { schools, classGroups, students, attendance, lessons, payments, addPayment, updateStudent } = useStore();

    // Determine School
    const schoolId = user?.role === 'manager' ? user.id : schools.find(s => s.id === user?.id)?.id || schools[0]?.id; // Fallback for testing
    const school = useMemo(() => schools.find(s => s.id === schoolId), [schools, schoolId]);

    // Filters
    const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Period Logic
    const [periodOffset, setPeriodOffset] = useState(0);

    // Initial Load - Set default class if needed, or leave 'all'

    // Quick Pay Mode - No Modal States needed anymore.
    // const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    // const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any | null>(null);

    // 1. Cycle Logic
    const cycleStartDate = useMemo(() => {
        if (school?.payment_cycle_start_date) {
            return new Date(school.payment_cycle_start_date);
        }
        return new Date(new Date().getFullYear(), 0, 1);
    }, [school]);

    const currentPhaseIndex = useMemo(() => {
        const today = startOfDay(new Date());
        const diff = differenceInDays(today, cycleStartDate);
        return Math.floor(diff / 28);
    }, [cycleStartDate]);

    const selectedPeriod = useMemo(() => {
        const targetIndex = currentPhaseIndex + periodOffset;
        const start = addDays(cycleStartDate, targetIndex * 28);
        const end = addDays(start, 27);
        return { start, end, index: targetIndex };
    }, [cycleStartDate, currentPhaseIndex, periodOffset]);

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

    // 3. Attendance Data (Last 4 Lessons)
    // We need to find the last 4 *completed* or *scheduled* lessons for this student's group relative to Today?
    // User said "Last 4 lessons". Usually implies chronological past.
    const getAttendanceHistory = (studentId: string, classGroupId: string | undefined) => {
        if (!classGroupId) return Array(4).fill('gray');

        // Find lessons for this group, sorted by date DESC
        // We consider lessons up to "Today" or just all lessons? 
        // Showing future lessons as Gray boxes is good context.
        // Let's take last 4 lessons relative to Today (Past & Present).

        const groupLessons = lessons
            .filter(l => l.classGroupId === classGroupId && l.status !== 'cancelled')
            .sort((a, b) => {
                const dA = new Date(a.date + 'T' + a.startTime);
                const dB = new Date(b.date + 'T' + b.startTime);
                return dB.getTime() - dA.getTime(); // Descending
            });

        // Let's just take top 4 descending, then reverse them so the rightmost is the most recent.
        const last4 = groupLessons.slice(0, 4).reverse();

        return last4.map(lesson => {
            const att = attendance.find(a => a.lessonId === lesson.id && a.studentId === studentId);
            // If lesson is in future?
            const lessonDate = new Date(lesson.date + 'T' + lesson.endTime);
            if (lessonDate > new Date()) return 'future';

            if (!att) return 'unknown'; // Lesson passed but no record?
            return att.status; // 'present' | 'absent' | 'late'
        });
    };

    // 4. Payment Status Logic
    const getPaymentStatus = (studentId: string) => {
        // A. Past Debt (Red Dot)
        // Check periods 0 to (selectedPeriod.index - 1)
        let hasPastDebt = false;

        // Optimization: Don't scan infinite past. Scan last 6 periods maybe?
        const checkLimit = 6;
        for (let i = 1; i <= checkLimit; i++) {
            const pIndex = selectedPeriod.index - i;
            if (pIndex < 0) break;

            const pStart = addDays(cycleStartDate, pIndex * 28);
            const pEnd = addDays(pStart, 27);

            // Check if student joined before this period ended
            const s = students.find(x => x.id === studentId);
            if (s && new Date(s.joinedDate) > pEnd) continue; // Didn't exist yet
            if (s?.paymentStatus === 'free') continue;

            const paid = payments.some(p => {
                if (p.studentId !== studentId) return false;
                const pDate = new Date(p.date);
                return pDate >= pStart && pDate <= pEnd;
            });

            if (!paid) {
                hasPastDebt = true;
                break;
            }
        }

        // B. Current Period Status
        const s = students.find(x => x.id === studentId);
        let currentStatus: 'paid' | 'unpaid' = 'unpaid';

        if (s?.paymentStatus === 'free') {
            currentStatus = 'paid';
        } else {
            const isPaid = payments.some(p => {
                if (p.studentId !== studentId) return false;
                const pDate = new Date(p.date);
                return pDate >= selectedPeriod.start && pDate <= selectedPeriod.end;
            });
            currentStatus = isPaid ? 'paid' : 'unpaid';
        }

        return { hasPastDebt, currentStatus };
    };

    // 5. Stats Calculation
    const stats = useMemo(() => {
        const total = filteredStudents.length;
        const paid = filteredStudents.filter(s => {
            const { currentStatus } = getPaymentStatus(s.id);
            return currentStatus === 'paid';
        }).length;
        return { total, paid };
    }, [filteredStudents, payments, selectedPeriod]);

    // Quick Pay Handler
    const handleQuickPay = async (student: any) => {
        if (!confirm(`${student.name} için bu dönem ödemesi alındı olarak işaretlensin mi?`)) return;

        // Determine amount (use student price or school default, fallback to 0)
        // Ideally we should have a price field. For now assuming 0 if not set, but status becomes 'paid'.
        // In a real app, we might need to fetch the school's default price if student's is empty.
        // For now, let's look for a price or default to 0.
        // We probably need to ensure 'student' object has 'price'. If not in store, we might need to update store.
        // The store 'students' usually have 'price'.

        const amount = Number(student.price) || 0;

        await addPayment({
            id: crypto.randomUUID(),
            schoolId,
            studentId: student.id,
            amount: amount,
            date: new Date().toISOString(),
            type: 'Tuition',
            method: 'Cash', // Default to Cash for quick action
            month: selectedPeriod.start.toISOString().slice(0, 7),
            status: 'paid',
            paidAt: new Date().toISOString(),
            notes: `${selectedPeriod.index + 1}. Dönem Tahsilatı (Hızlı İşlem)`
        });

        await updateStudent(student.id, {
            last_payment_status: 'paid',
            last_payment_date: new Date().toISOString()
        });

        // Optimistic update or wait for store? Store updates trigger re-render.
    };

    if (!school) return <div className="p-8 text-center">Okul bilgisi bulunamadı.</div>;

    const schoolClasses = classGroups.filter(c => c.schoolId === schoolId);

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{school.name}</h1>
                    <div className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                        <Calendar size={14} />
                        <span>Yönetici Paneli</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="font-bold text-slate-700">
                            Tahsilat: <span className="text-green-600">{stats.paid}</span> / {stats.total}
                        </span>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setPeriodOffset(prev => prev - 1)}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="px-4 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-400">ÖDEME DÖNEMİ</div>
                        <div className="font-bold text-slate-800 text-sm whitespace-nowrap">
                            {format(selectedPeriod.start, 'd MMM', { locale: tr })} - {format(selectedPeriod.end, 'd MMM', { locale: tr })}
                        </div>
                    </div>
                    <button
                        onClick={() => setPeriodOffset(prev => prev + 1)}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

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

                            // Re-calculate some status for UI
                            const currentPending = currentStatus === 'unpaid';

                            // Determine Bottom Border Color logic (User requested "Name field glows")
                            // We'll use a strong left border or a bottom border on the name cell.
                            // Let's use a subtle gradient background or border-left.

                            let statusColorClass = '';
                            if (hasPastDebt) statusColorClass = 'border-l-4 border-l-red-500 bg-red-50/30';
                            else if (currentStatus === 'paid') statusColorClass = 'border-l-4 border-l-emerald-500 bg-emerald-50/30';
                            else statusColorClass = 'border-l-4 border-l-orange-400 bg-orange-50/30';


                            return (
                                <tr key={student.id} className={`hover:bg-slate-50 group transition-colors ${statusColorClass}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{student.name}</div>
                                                <div className="text-xs text-slate-400">{student.phone}</div>

                                                {/* Mini Debt Tag for clarity */}
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
                                                                    'bg-slate-200' // Unknown
                                                        }`}
                                                >
                                                </div>
                                            ))}
                                            {/* Fill empty slots if history < 4 */}
                                            {attendanceHistory.length < 4 && Array(4 - attendanceHistory.length).fill(null).map((_, i) => (
                                                <div key={`empty-${i}`} className="w-6 h-6 rounded bg-slate-100 border border-slate-200 opacity-50"></div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-6">
                                            {/* Past Debt */}
                                            <div className="flex flex-col items-center gap-1" title="Geçmiş Dönem Borçları">
                                                <div className={`w-4 h-4 rounded-full transition-all ${hasPastDebt
                                                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
                                                    : 'bg-slate-200'
                                                    }`}></div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Geçmiş</span>
                                            </div>

                                            {/* Current Status */}
                                            <div className="flex flex-col items-center gap-1" title="Bu Dönem Ödemesi">
                                                <div className={`w-4 h-4 rounded-full transition-all ${currentStatus === 'paid'
                                                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                    : currentPending // Explicit usage
                                                        ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]'
                                                        : 'bg-orange-400'
                                                    }`}></div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Dönem</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {currentStatus === 'unpaid' && (
                                            <button
                                                onClick={() => handleQuickPay(student)}
                                                className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 shadow-sm transition-all"
                                            >
                                                Tahsil Et
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

            {/* Modal removed/hidden as per request for 'Direct Action' */}
        </div>
    );
}

// Simple Payment Modal removed from view as it is no longer triggered.
// Keeping component code or removing it? Let's keep the import but remove usages.
// Actually, we should comment out the unused Modal code if we are not using it.
function SimplePaymentModal() { return null; }
