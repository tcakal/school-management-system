import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { ChevronRight, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Modal } from '../components/Modal';

// Modal imported from components, but SchoolDetail creates its own Manual payment logic.
// We should reuse logic. Ideally PaymentModal should be a shared component.
// For now, I will include a basic Payment Modal inside this file to speed up, 
// similar to logic in SchoolDetail but specific to this flow.

export function PaymentManager() {
    const { user } = useAuth();
    const { schools, students, payments, classGroups, addPayment, updateStudent } = useStore();

    const schoolId = user?.role === 'manager' ? user.id : schools[0]?.id;
    const school = useMemo(() => schools.find(s => s.id === schoolId), [schools, schoolId]);

    // Period State (Index based)
    // 0 = Current Period
    // -1 = Previous, 1 = Next
    // We calculate "Current Period" based on (Today - StartDate) / 28
    const [periodOffset, setPeriodOffset] = useState(0);

    const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>('all');

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any | null>(null);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'Cash' | 'Transfer' | 'CreditCard'>('Cash');

    // 1. Determine Cycle Start
    const cycleStartDate = useMemo(() => {
        if (school?.payment_cycle_start_date) {
            return new Date(school.payment_cycle_start_date);
        }
        // Fallback: If no date set, use School Creation Date or fallback to Jan 1st of current year
        return new Date(new Date().getFullYear(), 0, 1);
    }, [school]);

    // 2. Calculate Current Phase Index (Where we are today)
    const currentPhaseIndex = useMemo(() => {
        const today = startOfDay(new Date());
        const diff = differenceInDays(today, cycleStartDate);
        return Math.floor(diff / 28);
    }, [cycleStartDate]);

    // 3. Calculate Selected Period Dates
    const selectedPeriod = useMemo(() => {
        const targetIndex = currentPhaseIndex + periodOffset;
        const start = addDays(cycleStartDate, targetIndex * 28);
        const end = addDays(start, 27);
        return { start, end, index: targetIndex };
    }, [cycleStartDate, currentPhaseIndex, periodOffset]);

    // 4. Filter Students
    const periodStudents = useMemo(() => {
        return students.filter(s => {
            if (s.schoolId !== schoolId) return false;
            // Only Active students should appear in current/future lists. 
            // Left students might assume they don't pay.
            if (s.status !== 'Active') return false;
            if (selectedClassGroupId !== 'all' && s.classGroupId !== selectedClassGroupId) return false;
            return true;
        });
    }, [students, schoolId, selectedClassGroupId]);

    // 5. Calculate Status for Each Student for THIS Period
    const studentPeriodStatus = useMemo(() => {
        const map: Record<string, 'paid' | 'unpaid'> = {};

        periodStudents.forEach(student => {
            // Find a payment within this period range
            const payment = payments.find(p => {
                if (p.studentId !== student.id) return false;
                const pDate = new Date(p.date);
                return pDate >= selectedPeriod.start && pDate <= selectedPeriod.end;
            });

            // If Student is Free, mark as paid visually or skip
            if (student.paymentStatus === 'free') {
                map[student.id] = 'paid'; // Or 'free'
            } else {
                map[student.id] = payment ? 'paid' : 'unpaid';
            }
        });
        return map;
    }, [periodStudents, payments, selectedPeriod]);

    // 6. Calculate "Devir" (Debt from previous periods)
    // Only check periods BEFORE the selected period (or if viewing current, before current)
    // This can be heavy if many periods. We limit to last 3 periods for performance or check all.
    const carryOverDebt = useMemo(() => {
        const debtMap: Record<string, number> = {}; // StudentID -> Count of unpaid periods

        // We only show debt if viewing Current Period or Future. 
        // If viewing past, "Debt" is contextual to that time? No, usually "Current Debt" is what matters.
        // Let's assume we calculate Total Unpaid Periods up to (Selected Period Start).

        // Optimization: Only check for displayed students
        periodStudents.forEach(student => {
            if (student.paymentStatus === 'free') return;

            // Check periods from 0 to currentPhaseIndex - 1 (if offset is 0)
            // Simple logic: Scan back 5 periods max for demo
            let unpaidCount = 0;
            for (let i = 1; i <= 6; i++) {
                const checkIndex = selectedPeriod.index - i;
                if (checkIndex < 0) break; // Don't check before timeline started

                const pStart = addDays(cycleStartDate, checkIndex * 28);
                const pEnd = addDays(pStart, 27);

                // Check if student joined AFTER this period? 
                // If Joined Date > pEnd, skip
                if (new Date(student.joinedDate) > pEnd) continue;

                const hasPayment = payments.some(p => {
                    if (p.studentId !== student.id) return false;
                    const pDate = new Date(p.date);
                    return pDate >= pStart && pDate <= pEnd;
                });

                if (!hasPayment) unpaidCount++;
            }
            if (unpaidCount > 0) debtMap[student.id] = unpaidCount;
        });

        return debtMap;
    }, [periodStudents, payments, selectedPeriod, cycleStartDate]);

    // Handlers
    const handlePayClick = (student: any) => {
        setSelectedStudentForPayment(student);
        // Default amount logic
        let defaultAmount = school?.defaultPrice || 0;
        if (student.paymentStatus === 'discounted' && student.discountPercentage) {
            defaultAmount = defaultAmount * ((100 - student.discountPercentage) / 100);
        }
        setAmount(defaultAmount.toString());
        setIsPaymentModalOpen(true);
    };

    const processPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentForPayment || !schoolId) return;

        await addPayment({
            id: crypto.randomUUID(),
            schoolId: schoolId,
            studentId: selectedStudentForPayment.id,
            amount: Number(amount),
            date: new Date().toISOString(), // Payment made NOW
            type: 'Tuition',
            method: method,
            month: selectedPeriod.start.toISOString().slice(0, 7), // Approximate month
            status: 'paid',
            paidAt: new Date().toISOString(),
            notes: `${selectedPeriod.index + 1}. Dönem (${format(selectedPeriod.start, 'd MMM')} - ${format(selectedPeriod.end, 'd MMM')}) için tahsilat.`
        });

        // Also update Last Payment Status on student for the global list
        await updateStudent(selectedStudentForPayment.id, {
            last_payment_status: 'paid',
            last_payment_date: new Date().toISOString()
        } as any);

        setIsPaymentModalOpen(false);
        setSelectedStudentForPayment(null);
    };


    if (!school) return <div className="p-6">Okul bilgisi bulunamadı.</div>;

    const schoolClasses = classGroups.filter(c => c.schoolId === schoolId);
    const debtors = Object.keys(carryOverDebt);

    return (
        <div className="space-y-6">
            {/* Header and Period Navigator */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Ödeme Takibi</h2>

                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setPeriodOffset(prev => prev - 1)}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="text-center px-4">
                            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                                {selectedPeriod.index + 1}. Dönem
                            </div>
                            <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
                                {format(selectedPeriod.start, 'd MMMM', { locale: tr })} - {format(selectedPeriod.end, 'd MMMM', { locale: tr })}
                            </div>
                        </div>

                        <button
                            onClick={() => setPeriodOffset(prev => prev + 1)}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <select
                        value={selectedClassGroupId}
                        onChange={(e) => setSelectedClassGroupId(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tüm Sınıflar</option>
                        {schoolClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Debt Alert Section */}
            {debtors.length > 0 && selectedClassGroupId === 'all' && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="text-red-600" size={20} />
                        <h3 className="font-bold text-red-800">Geçmiş Dönem Borçları ({debtors.length})</h3>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden mb-2">
                        {debtors.slice(0, 8).map(did => {
                            const s = students.find(x => x.id === did);
                            return (
                                <div key={did} className="w-8 h-8 rounded-full bg-white border-2 border-red-50 flex items-center justify-center text-xs font-bold text-red-800" title={`${s?.name}: ${carryOverDebt[did]} dönem borçlu`}>
                                    {s?.name.charAt(0)}
                                </div>
                            )
                        })}
                        {debtors.length > 8 && (
                            <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-50 flex items-center justify-center text-xs font-bold text-red-800">
                                +{debtors.length - 8}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-red-600">
                        * Listede ismi yanında uyarı işareti olanların geçmiş dönemlerden ödemesi eksiktir.
                    </p>
                </div>
            )}

            {/* Student List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Öğrenci</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Sınıf</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Dönem Ödemesi</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {periodStudents.map(student => {
                            const status = studentPeriodStatus[student.id];
                            const debtCount = carryOverDebt[student.id] || 0;
                            const groupName = classGroups.find(c => c.id === student.classGroupId)?.name || '-';

                            return (
                                <tr key={student.id} className="hover:bg-slate-50 group">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                                    {student.name.charAt(0)}
                                                </div>
                                                {debtCount > 0 && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-white">
                                                        {debtCount}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{student.name}</div>
                                                {debtCount > 0 && (
                                                    <div className="text-[10px] font-bold text-red-500">
                                                        {debtCount} Dönemdir Ödemedi!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{groupName}</td>
                                    <td className="px-4 py-3">
                                        {status === 'paid' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                                <CheckCircle2 size={14} />
                                                ÖDENDİ
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                                                <AlertCircle size={14} />
                                                ÖDENMEDİ
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {status === 'unpaid' && (
                                            <button
                                                onClick={() => handlePayClick(student)}
                                                className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 shadow-sm transition-all active:scale-95"
                                            >
                                                Tahsil Et
                                            </button>
                                        )}
                                        {status === 'paid' && (
                                            <span className="text-xs text-slate-400 font-medium">İşlem Tamam</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {periodStudents.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400">Bu filtrede öğrenci bulunamadı.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Ödeme Tahsilatı"
            >
                <form onSubmit={processPayment} className="space-y-4">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Öğrenci</span>
                        <div className="font-bold text-lg text-slate-900">{selectedStudentForPayment?.name}</div>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Dönem</span>
                        <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium border border-blue-100">
                            {selectedPeriod.index + 1}. Dönem: {format(selectedPeriod.start, 'd MMM')} - {format(selectedPeriod.end, 'd MMM')}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tutar (TL)</label>
                        <input
                            type="number"
                            required
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-bold text-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Yöntemi</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Cash', 'Transfer', 'CreditCard'] as const).map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethod(m)}
                                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${method === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {m === 'Cash' ? 'Nakit' : m === 'Transfer' ? 'Havale' : 'Kredi Kartı'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-200 mt-2 transition-transform active:scale-95"
                    >
                        Tahsil Et
                    </button>
                </form>
            </Modal>
        </div>
    );
}
