import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Building2, Users, Banknote, ArrowUpRight, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../components/Modal';
import type { School } from '../types';

// import { SchoolDetail } from './SchoolDetail';
import { useAuth } from '../store/useAuth';

export function Dashboard() {
    const { user } = useAuth();

    // Redirect Manager to new Dashboard
    if (user?.role === 'manager') {
        return <Navigate to="/manager-dashboard" replace />;
    }

    // Mock data initialization is no longer needed with Supabase

    const { schools, students, payments, addSchool } = useStore();

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const activeStudents = students.filter(s => s.status === 'Active').length;

    const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolAddress, setNewSchoolAddress] = useState('');
    const [newSchoolPhone, setNewSchoolPhone] = useState('');
    const [newSchoolColor, setNewSchoolColor] = useState('#2563eb');
    const [newSchoolImage, setNewSchoolImage] = useState('');
    // const { addSchool } = useStore(); // Duplicate removed

    const handleAddSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSchoolName) return;

        const newSchool: School = {
            id: crypto.randomUUID(),
            name: newSchoolName,
            address: newSchoolAddress,
            phone: newSchoolPhone,
            defaultPrice: 0,
            paymentTerms: '',
            color: newSchoolColor,
            imageUrl: newSchoolImage
        };

        await addSchool(newSchool);
        setIsAddSchoolModalOpen(false);
        setNewSchoolName('');
        setNewSchoolAddress('');
        setNewSchoolPhone('');
        setNewSchoolColor('#2563eb');
        setNewSchoolImage('');
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Genel Bakış</h2>
                <p className="text-slate-500 mt-2">Okul yönetim sistemine hoş geldiniz.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Toplam Okul"
                    value={schools.length}
                    icon={Building2}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Aktif Öğrenci"
                    value={activeStudents}
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Toplam Ciro"
                    value={`${totalRevenue.toLocaleString('tr-TR')} ₺`}
                    icon={Banknote}
                    color="bg-emerald-500"
                />
            </div>

            {/* Schools Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Okullar</h3>
                    <button
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                        onClick={() => setIsAddSchoolModalOpen(true)}
                    >
                        + Yeni Okul
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {schools.map(school => (
                        <SchoolCard key={school.id} school={school} />
                    ))}
                </div>
            </div>

            <Modal
                isOpen={isAddSchoolModalOpen}
                onClose={() => setIsAddSchoolModalOpen(false)}
                title="Yeni Okul Ekle"
            >
                <form onSubmit={handleAddSchool} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Okul Adı
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Örn: Atatürk İlkokulu"
                            value={newSchoolName}
                            onChange={(e) => setNewSchoolName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Adres
                        </label>
                        <input
                            type="text"
                            placeholder="İlçe / Şehir"
                            value={newSchoolAddress}
                            onChange={(e) => setNewSchoolAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Telefon
                        </label>
                        <input
                            type="tel"
                            placeholder="0212 555 5555"
                            value={newSchoolPhone}
                            onChange={(e) => setNewSchoolPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tema Rengi</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={newSchoolColor}
                                onChange={e => setNewSchoolColor(e.target.value)}
                                className="h-10 w-20 p-1 border border-slate-300 rounded-lg cursor-pointer"
                            />
                            <span className="text-sm text-slate-500 uppercase">{newSchoolColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <ImageIcon size={16} />
                                <span>Kapak Görseli URL (İsteğe bağlı)</span>
                            </div>
                        </label>
                        <input
                            type="text"
                            placeholder="https://..."
                            value={newSchoolImage}
                            onChange={e => setNewSchoolImage(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAddSchoolModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200 ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            </div>
        </div>
    );
}

function SchoolCard({ school }: { school: any }) {
    const { students, payments } = useStore();
    const navigate = useNavigate();
    const studentCount = students.filter(s => s.schoolId === school.id && s.status === 'Active').length;

    // Payment Status Calculation (Same logic as Schools.tsx)
    // Payment Status Calculation (Same logic as Schools.tsx)
    const activeStudents = students.filter(s => s.schoolId === school.id && s.status === 'Active');

    // Calculate expected amount considering discounts
    const expectedAmount = activeStudents.reduce((total, student) => {
        // If student is free, add 0
        if (student.paymentStatus === 'free') return total;

        // If student is discount, calculate discounted price
        if (student.paymentStatus === 'discounted' && student.discountPercentage) {
            const discountMultiplier = (100 - student.discountPercentage) / 100;
            return total + ((school.defaultPrice || 0) * discountMultiplier);
        }

        // Default: Paid (full price)
        return total + (school.defaultPrice || 0);
    }, 0);
    const collectedAmount = payments
        .filter(p => p.schoolId === school.id)
        .reduce((sum, p) => sum + Number(p.amount), 0);

    let borderColorClass = 'border-slate-100'; // Default gray
    if (expectedAmount > 0) {
        const ratio = collectedAmount / expectedAmount;
        if (ratio >= 1) borderColorClass = 'border-emerald-500 border-2 shadow-emerald-50'; // Green (>100%)
        else if (ratio >= 0.25) borderColorClass = 'border-orange-400 border-2 shadow-orange-50'; // Orange (25-99%)
        else borderColorClass = 'border-red-500 border-2 shadow-red-50'; // Red (<25%)
    }

    return (
        <div
            onClick={() => navigate(`/school/${school.id}`)}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group cursor-pointer ${borderColorClass}`}
        >
            <div
                className="h-32 flex items-center justify-center bg-cover bg-center"
                style={{
                    backgroundColor: school.color || '#f1f5f9',
                    backgroundImage: school.imageUrl ? `url(${school.imageUrl})` : undefined
                }}
            >
                {!school.imageUrl && (
                    <Building2
                        size={48}
                        className="group-hover:scale-110 transition-transform duration-300"
                        style={{ color: school.color ? '#fff' : '#cbd5e1' }}
                    />
                )}
            </div>
            <div className="p-5">
                <h4
                    className="font-bold text-lg text-slate-900 mb-1"
                    style={{ color: school.color }}
                >
                    {school.name}
                </h4>
                <p className="text-sm text-slate-500 mb-4 truncate">{school.address}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">{studentCount} Öğrenci</span>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
            </div>
        </div>
    )
}
