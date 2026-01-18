import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { Banknote, TrendingUp, History, AlertCircle, Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import type { Payment, PaymentMethod, PaymentType } from '../types';

export function Finance() {
    const { schools, students, payments, addPayment } = useStore();
    const { user } = useAuth(); // Import useAuth

    // Security: Only Admins can see Global Finance
    if (user?.role !== 'admin') {
        return (
            <div className="p-8 text-center bg-white rounded-xl border border-red-200">
                <h3 className="text-red-600 font-bold">Yetkisiz Erişim</h3>
                <p className="text-slate-500">Bu sayfayı görüntüleme yetkiniz yok.</p>
            </div>
        );
    }

    // Add Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentType, setPaymentType] = useState<PaymentType>('Tuition');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

    // 1. Calculate Total Expected Revenue (Snapshot)
    // Logic: Sum of (School Total Active Students * School Per Student Price)
    let totalExpected = 0;

    schools.forEach(school => {
        const activeStudents = students.filter(s => s.schoolId === school.id && s.status === 'Active');

        const schoolExpected = activeStudents.reduce((total, student) => {
            // Free student
            if (student.paymentStatus === 'free') return total;

            // Discounted student
            if (student.paymentStatus === 'discounted' && student.discountPercentage) {
                const discountMultiplier = (100 - student.discountPercentage) / 100;
                return total + ((school.defaultPrice || 0) * discountMultiplier);
            }

            // Standard student
            return total + (school.defaultPrice || 0);
        }, 0);

        totalExpected += schoolExpected;
    });

    // 2. Calculate Total Collected
    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

    // 3. Calculate Outstanding
    const totalOutstanding = totalExpected - totalCollected;

    // 4. Recent Transactions
    const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchoolId || !amount) return;

        const newPayment: Payment = {
            id: crypto.randomUUID(),
            schoolId: selectedSchoolId,
            // studentId is no longer needed
            amount: Number(amount),
            date: new Date().toISOString().split('T')[0],
            type: paymentType,
            method: paymentMethod,
            month: new Date().toISOString().slice(0, 7) // Current month
        };

        addPayment(newPayment);
        setIsPaymentModalOpen(false);
        setAmount('');
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Finansal Genel Bakış</h2>
                        <p className="text-slate-500 mt-2">Aylık ciro ve tahsilat durumu.</p>
                    </div>
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-emerald-200"
                    >
                        <Plus size={20} />
                        Ödeme Al
                    </button>
                </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Banknote size={20} />
                            </div>
                            <span className="text-sm font-medium text-slate-500">Aylık Beklenen Ciro</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{totalExpected.toLocaleString('tr-TR')} ₺</p>
                        <p className="text-xs text-slate-400 mt-1">Öğrenci sayısı x Aylık Ücret</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-sm font-medium text-slate-500">Tahsil Edilen</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{totalCollected.toLocaleString('tr-TR')} ₺</p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 text-right">%{totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0} Tamamlandı</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                <AlertCircle size={20} />
                            </div>
                            <span className="text-sm font-medium text-slate-500">Bekleyen Bakiye</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{totalOutstanding.toLocaleString('tr-TR')} ₺</p>
                        <p className="text-xs text-slate-400 mt-1">Okullardan alacaklar</p>
                    </div>
                </div>
            </div>

            {/* School Financial Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Okul Bazlı Finansal Durum</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Okul Adı</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Öğrenci</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aylık Potansiyel</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Toplam Tahsilat</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Son İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {schools.map(school => {
                                const schoolStudents = students.filter(s => s.schoolId === school.id && s.status === 'Active');
                                const activeCount = schoolStudents.length;
                                const monthlyPotential = schoolStudents.reduce((total, student) => {
                                    if (student.paymentStatus === 'free') return total;
                                    if (student.paymentStatus === 'discounted' && student.discountPercentage) {
                                        return total + ((school.defaultPrice || 0) * (100 - student.discountPercentage) / 100);
                                    }
                                    return total + (school.defaultPrice || 0);
                                }, 0);

                                const schoolPayments = payments.filter(p => p.schoolId === school.id);
                                const totalPaid = schoolPayments.reduce((acc, p) => acc + p.amount, 0);

                                // Find last payment date
                                const lastPaymentDate = schoolPayments.length > 0
                                    ? schoolPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
                                    : null;

                                return (
                                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {school.name}
                                            <div className="text-xs text-slate-400 font-normal">
                                                {school.defaultPrice ? `${school.defaultPrice.toLocaleString('tr-TR')} ₺ / öğrenci` : 'Fiyat Belirlenmedi'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {activeCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">
                                            {monthlyPotential.toLocaleString('tr-TR')} ₺
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            {totalPaid.toLocaleString('tr-TR')} ₺
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-500">
                                            {lastPaymentDate ? new Date(lastPaymentDate).toLocaleDateString('tr-TR') : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {schools.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Henüz okul kaydı yok.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <History size={20} className="text-slate-400" />
                        <h3 className="font-bold text-slate-900">Son İşlemler</h3>
                    </div>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Okul</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tarih</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Yöntem</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Tutar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedPayments.map(payment => {
                            const school = schools.find(s => s.id === payment.schoolId);
                            const student = payment.studentId ? students.find(s => s.id === payment.studentId) : null;

                            return (
                                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {school?.name || 'Bilinmeyen Okul'}
                                        {student && (
                                            <div className="text-xs text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                                {student.name}
                                            </div>
                                        )}
                                        {!student && (
                                            <div className="text-xs text-slate-400 font-normal italic mt-0.5">
                                                Okuldan Direkt Ödeme
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{payment.date}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                            {payment.method === 'CreditCard' ? 'Kredi Kartı' :
                                                payment.method === 'Transfer' ? 'Havale/EFT' : 'Nakit'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                                        {payment.amount.toLocaleString('tr-TR')} ₺
                                    </td>
                                </tr>
                            );
                        })}
                        {sortedPayments.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    Henüz hiç ödeme kaydı bulunmuyor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Okul Ödemesi Al"
            >
                <form onSubmit={handleAddPayment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Okul Seçimi</label>
                        <select
                            value={selectedSchoolId}
                            onChange={(e) => setSelectedSchoolId(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="">Okul Seçiniz</option>
                            {schools.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tutar (TL)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                min="0"
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Tipi</label>
                            <select
                                value={paymentType}
                                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="Tuition">Okul Ücreti</option>
                                <option value="Book">Kitap/Kırtasiye</option>
                                <option value="Other">Diğer</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Yöntemi</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Cash', 'CreditCard', 'Transfer'] as const).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setPaymentMethod(m)}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${paymentMethod === m
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {m === 'Cash' ? 'Nakit' : m === 'CreditCard' ? 'K. Kartı' : 'Havale'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm shadow-sm"
                        >
                            Ödemeyi Kaydet
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
