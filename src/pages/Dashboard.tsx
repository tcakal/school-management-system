
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Building2, Users, Banknote, Image as ImageIcon, Calendar, Plus, Tent, GitBranch } from 'lucide-react';
import { Modal } from '../components/Modal';
import type { School } from '../types';

import { useAuth } from '../store/useAuth';

export function Dashboard() {
    const { user } = useAuth();

    // Redirect Manager to new Dashboard
    if (user?.role === 'manager') {
        return <Navigate to="/manager-dashboard" replace />;
    }

    // Redirect Teacher to Schools List
    if (user?.role === 'teacher') {
        return <Navigate to="/schools" replace />;
    }

    const { schools, students, payments, addSchool, branches } = useStore();

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const activeStudents = students.filter(s => s.status === 'Active').length;

    // Filter Lists
    const regularSchools = schools.filter(s => s.type !== 'event' && s.type !== 'branch');
    const events = schools.filter(s => s.type === 'event');

    const [activeTab, setActiveTab] = useState<'schools' | 'events' | 'branches'>('schools');

    // Add School/Event Modal
    const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'school' | 'event'>('school'); // Which one are we adding?

    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolAddress, setNewSchoolAddress] = useState('');
    const [newSchoolPhone, setNewSchoolPhone] = useState('');
    const [newSchoolColor, setNewSchoolColor] = useState('#2563eb');
    const [newSchoolImage, setNewSchoolImage] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [newNotes, setNewNotes] = useState('');

    const openModal = (mode: 'school' | 'event') => {
        setModalMode(mode);
        setIsAddSchoolModalOpen(true);
        // Reset form
        setNewSchoolName('');
        setNewSchoolAddress('');
        setNewSchoolPhone('');
        setNewSchoolColor(mode === 'event' ? '#9333ea' : '#2563eb');
        setNewSchoolImage('');
        setNewEventDate('');
        setNewNotes('');
    };

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
            imageUrl: newSchoolImage,
            type: modalMode === 'event' ? 'event' : 'school',
            eventDate: newEventDate || undefined,
            notes: newNotes || undefined
        };

        await addSchool(newSchool);
        setIsAddSchoolModalOpen(false);
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Genel Bakış</h2>
                <p className="text-slate-500 mt-2">Okul ve etkinlik yönetim paneli.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Toplam Okul"
                    value={regularSchools.length}
                    icon={Building2}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Şubeler"
                    value={branches.length}
                    icon={GitBranch}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Aktif Etkinlik"
                    value={events.length}
                    icon={Tent}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Toplam Kayıtlı Öğrenci"
                    value={activeStudents}
                    icon={Users}
                    color="bg-emerald-500"
                />

                {user?.role === 'admin' && (
                    <StatCard
                        title="Toplam Ciro"
                        value={`${totalRevenue.toLocaleString('tr-TR')} ₺`}
                        icon={Banknote}
                        color="bg-slate-500"
                    />
                )}
            </div>

            {/* List Section */}
            <div>
                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-6">
                    <button
                        onClick={() => setActiveTab('schools')}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'schools' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Okullar
                        {activeTab === 'schools' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                    </button>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setActiveTab('branches')}
                            className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'branches' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Şubeler
                            {activeTab === 'branches' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'events' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Etkinlikler / Organizasyonlar
                        {activeTab === 'events' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full" />}
                    </button>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                        {activeTab === 'schools' ? 'Kayıtlı Okullar' : activeTab === 'events' ? 'Planlanan Etkinlikler' : 'Kayıtlı Şubeler'}
                    </h3>

                    {activeTab === 'schools' && (
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                            onClick={() => openModal('school')}
                        >
                            <Plus size={16} />
                            Yeni Okul Ekle
                        </button>
                    )}
                    {activeTab === 'events' && (
                        <button
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                            onClick={() => openModal('event')}
                        >
                            <Tent size={16} />
                            Yeni Etkinlik Planla
                        </button>
                    )}
                </div>

                {activeTab === 'schools' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regularSchools.map(school => (
                            <SchoolCard key={school.id} school={school} isEvent={false} />
                        ))}
                        {regularSchools.length === 0 && (
                            <div className="col-span-3 text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Henüz okul kaydı yok.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(school => (
                            <SchoolCard key={school.id} school={school} isEvent={true} />
                        ))}
                        {events.length === 0 && (
                            <div className="col-span-3 text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Henüz planlanmış etkinlik yok.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'branches' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {branches.map(branch => (
                            <BranchCard key={branch.id} branch={branch} />
                        ))}
                        {branches.length === 0 && (
                            <div className="col-span-3 text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Henüz şube kaydı yok. Okullar sayfasından şube ekleyebilirsiniz.
                            </div>
                        )}
                    </div>
                )}

            </div>


            <Modal
                isOpen={isAddSchoolModalOpen}
                onClose={() => setIsAddSchoolModalOpen(false)}
                title={modalMode === 'school' ? "Yeni Okul Ekle" : "Yeni Etkinlik Planla"}
            >
                <form onSubmit={handleAddSchool} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {modalMode === 'school' ? 'Okul Adı' : 'Etkinlik Adı'}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder={modalMode === 'school' ? "Örn: Atatürk İlkokulu" : "Örn: Turkcell Bilim Şenliği"}
                            value={newSchoolName}
                            onChange={(e) => setNewSchoolName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>

                    {modalMode === 'event' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tarih (Başlangıç)
                            </label>
                            <input
                                type="date"
                                value={newEventDate}
                                onChange={(e) => setNewEventDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {modalMode === 'school' ? 'Adres / İlçe' : 'Konum / Yer'}
                        </label>
                        <input
                            type="text"
                            placeholder={modalMode === 'school' ? "İlçe / Şehir" : "Örn: Plaza Giriş Kat"}
                            value={newSchoolAddress}
                            onChange={(e) => setNewSchoolAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>

                    {modalMode === 'school' && (
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
                    )}

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

                    {modalMode === 'event' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Genel Notlar / Hazırlıklar
                            </label>
                            <textarea
                                value={newNotes}
                                onChange={(e) => setNewNotes(e.target.value)}
                                placeholder="Örn: 30 adet masa lazım, elektrik kablosu vs."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 h-24 resize-none"
                            />
                        </div>
                    )}

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
                            {modalMode === 'school' ? 'Okul Ekle' : 'Etkinlik Oluştur'}
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

function SchoolCard({ school, isEvent }: { school: any, isEvent: boolean }) {
    const { students, payments } = useStore();
    const navigate = useNavigate();
    const studentCount = students.filter(s => s.schoolId === school.id && s.status === 'Active').length;

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
    if (!isEvent) { // Only color code regular schools based on payment
        if (expectedAmount > 0) {
            const ratio = collectedAmount / expectedAmount;
            if (ratio >= 1) borderColorClass = 'border-emerald-500 border-2 shadow-emerald-50'; // Green (>100%)
            else if (ratio >= 0.25) borderColorClass = 'border-orange-400 border-2 shadow-orange-50'; // Orange (25-99%)
            else borderColorClass = 'border-red-500 border-2 shadow-red-50'; // Red (<25%)
        }
    } else {
        borderColorClass = 'border-purple-200 shadow-purple-50';
    }

    const { user } = useAuth();

    return (
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group ${borderColorClass}`}>
            <div
                onClick={() => navigate(`/school/${school.id}`)}
                className="h-32 flex items-center justify-center bg-cover bg-center cursor-pointer relative"
                style={{
                    backgroundColor: school.color || '#f1f5f9',
                    backgroundImage: school.imageUrl ? `url(${school.imageUrl})` : undefined
                }}
            >
                {isEvent && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
                        <Tent size={12} className="text-purple-600" />
                        ETKİNLİK
                    </div>
                )}
                {!school.imageUrl && (
                    isEvent ? (
                        <Tent
                            size={48}
                            className="group-hover:scale-110 transition-transform duration-300"
                            style={{ color: school.color ? '#fff' : '#cbd5e1' }}
                        />
                    ) : (
                        <Building2
                            size={48}
                            className="group-hover:scale-110 transition-transform duration-300"
                            style={{ color: school.color ? '#fff' : '#cbd5e1' }}
                        />
                    )
                )}
            </div>
            <div className="p-5">
                <div onClick={() => navigate(`/school/${school.id}`)} className="cursor-pointer">
                    <h4
                        className="font-bold text-lg text-slate-900 mb-1"
                        style={{ color: school.color }}
                    >
                        {school.name}
                    </h4>
                    <p className="text-sm text-slate-500 mb-4 truncate">{school.address}</p>
                    {school.notes && isEvent && (
                        <p className="text-xs text-slate-400 mb-2 truncate italic bg-slate-50 p-1 rounded">
                            {school.notes}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <Users size={16} className={isEvent ? "text-purple-500" : "text-blue-500"} />
                        <span className="text-sm font-medium text-slate-700">{studentCount} {isEvent ? 'Katılımcı' : 'Öğrenci'}</span>
                    </div>
                    {user?.role === 'admin' && !isEvent && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/manager-dashboard');
                            }}
                            className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
                            title="Yönetici Paneli (Finans)"
                        >
                            <Banknote size={18} />
                        </button>
                    )}
                    {/* Event Date or Action for Events */}
                    {isEvent && school.eventDate && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar size={14} />
                            {school.eventDate}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function BranchCard({ branch }: { branch: any }) {
    const { students, classGroups, teachers } = useStore();
    const navigate = useNavigate();

    // Count students in branch classes
    const branchClasses = classGroups.filter(c => c.branchId === branch.id);
    const branchStudentCount = students.filter(s =>
        branchClasses.some(bc => bc.id === s.classGroupId) && s.status === 'Active'
    ).length;

    // Get manager name
    const manager = teachers.find(t => t.id === branch.managerId);

    return (
        <div
            onClick={() => navigate(`/branch/${branch.id}`)}
            className="bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            style={{ borderColor: `${branch.color || '#f97316'}40` }}
        >
            <div
                className="h-32 flex items-center justify-center transition-colors"
                style={{ backgroundColor: branch.color || '#f97316' }}
            >
                <GitBranch
                    size={48}
                    className="text-white/80 group-hover:scale-110 transition-transform duration-300"
                />
            </div>
            <div className="p-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 text-slate-600"
                            style={{ color: branch.color || '#f97316', backgroundColor: `${branch.color || '#f97316'}20` }}
                        >
                            Şube
                        </span>
                    </div>
                    <h4
                        className="font-bold text-lg mb-1"
                        style={{ color: branch.color || '#f97316' }}
                    >
                        {branch.name}
                    </h4>
                    <p className="text-sm text-slate-500 mb-2 truncate">{branch.address || 'Adres belirtilmedi'}</p>
                    {manager && (
                        <p className="text-xs text-slate-400 truncate">
                            Yönetici: {manager.name}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-3">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-orange-500" />
                        <span className="text-sm font-medium text-slate-700">{branchStudentCount} Öğrenci</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Building2 size={14} />
                        {branchClasses.length} Sınıf
                    </div>
                </div>
            </div>
        </div>
    );
}
