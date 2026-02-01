import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';

import { Building2, ArrowRight, Plus, MapPin, Image as ImageIcon, Trash2, Edit, Tent, Calendar, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { BranchesTab } from '../components/BranchesTab';
import type { School } from '../types';

export function Schools() {
    const { schools, students, addSchool } = useStore();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'schools' | 'events' | 'branches'>(
        (user?.role === 'manager' && user.branchId) ? 'branches' : 'schools'
    );

    // Filter schools for manager
    const allSchools = user?.role === 'manager'
        ? schools.filter(s => s.id === user.id || s.id === user.schoolId)
        : schools;

    const visibleRegularSchools = allSchools.filter(s => s.type !== 'event' && s.type !== 'branch').sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const visibleEvents = allSchools.filter(s => s.type === 'event').sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    const displayedList = activeTab === 'schools' ? visibleRegularSchools : visibleEvents;

    // Add School/Event State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolAddress, setNewSchoolAddress] = useState('');
    const [newSchoolPhone, setNewSchoolPhone] = useState('');
    const [newSchoolColor, setNewSchoolColor] = useState('#2563eb');
    const [newSchoolImage, setNewSchoolImage] = useState('');
    const [newEventDate, setNewEventDate] = useState(''); // Initial date for event

    const [managerName, setManagerName] = useState('');
    const [managerPhone, setManagerPhone] = useState('');
    const [managerEmail, setManagerEmail] = useState('');
    const [newNotes, setNewNotes] = useState('');

    const openAddModal = () => {
        setNewSchoolColor(activeTab === 'events' ? '#9333ea' : '#2563eb');
        setIsAddModalOpen(true);
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
            color: newSchoolColor,
            imageUrl: newSchoolImage,
            managerName: managerName,
            managerPhone: managerPhone,
            managerEmail: managerEmail,
            type: activeTab === 'events' ? 'event' : 'school',
            eventDate: activeTab === 'events' ? newEventDate : undefined,
            eventDates: activeTab === 'events' && newEventDate ? [newEventDate] : undefined,
            notes: activeTab === 'events' ? newNotes : undefined
        };

        await addSchool(newSchool);

        setIsAddModalOpen(false);
        setNewSchoolName('');
        setNewSchoolAddress('');
        setNewSchoolPhone('');
        setNewSchoolColor('#2563eb');
        setNewSchoolImage('');
        setManagerName('');
        setManagerPhone('');
        setManagerEmail('');
        setNewEventDate('');
        setNewNotes('');
    };

    // Edit School State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
    const [editSchoolName, setEditSchoolName] = useState('');
    const [editSchoolAddress, setEditSchoolAddress] = useState('');
    const [editSchoolPhone, setEditSchoolPhone] = useState('');
    const [editSchoolColor, setEditSchoolColor] = useState('');
    const [editSchoolImage, setEditSchoolImage] = useState('');
    const [editManagerName, setEditManagerName] = useState('');
    const [editManagerPhone, setEditManagerPhone] = useState('');
    const [editManagerEmail, setEditManagerEmail] = useState('');

    // Event specific edit
    const [editEventDates, setEditEventDates] = useState<string[]>([]);
    const [newDateInput, setNewDateInput] = useState('');

    // Sync state when editingSchoolId changes
    useEffect(() => {
        if (editingSchoolId) {
            const school = schools.find(s => s.id === editingSchoolId);
            if (school) {
                setEditSchoolName(school.name || '');
                setEditSchoolAddress(school.address || '');
                setEditSchoolPhone(school.phone || '');
                setEditSchoolColor(school.color || '#2563eb');
                setEditSchoolImage(school.imageUrl || '');
                setEditManagerName(school.managerName || '');
                setEditManagerPhone(school.managerPhone || '');
                setEditManagerEmail(school.managerEmail || '');

                // Load dates
                let dates = school.eventDates || [];
                if (dates.length === 0 && school.eventDate) {
                    dates = [school.eventDate];
                }
                setEditEventDates(dates);

                setIsEditModalOpen(true);
            }
        }
    }, [editingSchoolId, schools]);

    const handleEditSchoolClick = (school: School) => {
        setEditingSchoolId(school.id);
    };

    const addDateToEvent = () => {
        if (newDateInput && !editEventDates.includes(newDateInput)) {
            const updatedDates = [...editEventDates, newDateInput].sort();
            setEditEventDates(updatedDates);
            setNewDateInput('');
        }
    };

    const removeDateFromEvent = (dateToRemove: string) => {
        setEditEventDates(editEventDates.filter(d => d !== dateToRemove));
    };

    const handleUpdateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSchoolId) return;

        const school = schools.find(s => s.id === editingSchoolId);
        if (!school) return;

        const isEvent = school.type === 'event';

        await useStore.getState().updateSchool(editingSchoolId, {
            name: editSchoolName,
            address: editSchoolAddress,
            phone: editSchoolPhone,
            color: editSchoolColor,
            imageUrl: editSchoolImage,
            managerName: editManagerName,
            managerPhone: editManagerPhone,
            managerEmail: editManagerEmail,
            eventDates: isEvent ? editEventDates : undefined,
            eventDate: isEvent && editEventDates.length > 0 ? editEventDates[0] : undefined // Sync primary date
        });

        setIsEditModalOpen(false);
        setEditingSchoolId(null);
    };

    const editingSchoolType = schools.find(s => s.id === editingSchoolId)?.type || 'school';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">
                        {activeTab === 'schools' ? 'Okullar' : 'Etkinlikler'}
                    </h2>
                    <p className="text-slate-500 mt-1">
                        {activeTab === 'schools'
                            ? 'Sisteme kayıtlı okulları yönetin.'
                            : 'Planlanan etkinlik ve organizasyonları yönetin.'}
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className={`px-4 py-2 text-white rounded-lg shadow-sm flex items-center gap-2 font-medium transition-colors ${activeTab === 'schools' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                    {activeTab === 'schools' ? <Plus size={20} /> : <Tent size={20} />}
                    {activeTab === 'schools' ? 'Yeni Okul Ekle' : 'Yeni Etkinlik Planla'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('schools')}
                    className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'schools' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Okullar
                    {activeTab === 'schools' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'events' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Etkinlikler
                    {activeTab === 'events' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full" />}
                </button>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button
                        onClick={() => setActiveTab('branches')}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'branches' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Şubeler
                        {activeTab === 'branches' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
                    </button>
                )}
            </div>

            {activeTab === 'branches' ? (
                <BranchesTab />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedList.map(school => {
                        const activeStudents = students.filter(s => s.schoolId === school.id && s.status === 'Active');
                        const hasStudents = activeStudents.length > 0;
                        const hasAssignments = useStore.getState().assignments.some(a => a.schoolId === school.id);
                        const isActive = hasStudents || hasAssignments;

                        let borderColorClass = school.type === 'event'
                            ? 'border-purple-200'
                            : (isActive ? 'border-emerald-500 border-2' : 'border-orange-400 border-2');

                        return (
                            <div
                                key={school.id}
                                onClick={() => navigate(`/school/${school.id}`)}
                                className={`bg-white p-6 rounded-xl hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer group ${borderColorClass} flex flex-col h-full relative`}
                            >
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform bg-cover bg-center"
                                            style={{
                                                backgroundColor: school.color || '#eff6ff',
                                                color: school.color ? '#fff' : '#2563eb',
                                                backgroundImage: school.imageUrl ? `url(${school.imageUrl})` : undefined
                                            }}
                                        >
                                            {!school.imageUrl && (school.type === 'event' ? <Tent size={24} /> : <Building2 size={24} />)}
                                        </div>
                                        {school.type === 'event' && (
                                            <div className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-bold uppercase border border-purple-100">
                                                Etkinlik
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-4">
                                        <h3
                                            className="font-bold text-lg text-slate-900 mb-1"
                                            style={{ color: school.color }}
                                        >
                                            {school.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <MapPin size={14} />
                                            <span className="line-clamp-1">{school.address || 'Adres belirtilmedi'}</span>
                                        </div>
                                        {school.type === 'event' && school.eventDate && (
                                            <div className="flex items-center gap-2 text-sm text-purple-600 mt-1">
                                                <Calendar size={14} />
                                                <span>{school.eventDate}</span>
                                                {school.eventDates && school.eventDates.length > 1 && (
                                                    <span className="text-xs bg-purple-100 px-1 rounded">+{school.eventDates.length - 1} gün</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-sm font-medium text-slate-600 mb-4">
                                        <span>
                                            {students.filter(s => s.schoolId === school.id && s.status === 'Active').length} {school.type === 'event' ? 'Katılımcı' : 'Öğrenci'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-blue-600 text-xs font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        Detaylar <ArrowRight size={14} />
                                    </span>

                                    {useAuth.getState().user?.role === 'admin' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditSchoolClick(school);
                                                }}
                                                className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 rounded-lg"
                                                title="Düzenle"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <div className="w-px h-4 bg-slate-200"></div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
                                                        useStore.getState().deleteSchool(school.id);
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );

                    })}
                    {displayedList.length === 0 && (
                        <div className="col-span-3 py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-dashed border border-slate-200">
                            {activeTab === 'schools' ? 'Kayıtlı okul bulunamadı.' : 'Planlanmış etkinlik bulunamadı.'}
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={activeTab === 'schools' ? "Yeni Okul Ekle" : "Yeni Etkinlik Planla"}
            >
                <form onSubmit={handleAddSchool} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{activeTab === 'schools' ? 'Okul Adı' : 'Etkinlik Adı'}</label>
                        <input
                            type="text"
                            required
                            placeholder={activeTab === 'schools' ? "Örn: X Koleji" : "Örn: Bilim Şenliği"}
                            value={newSchoolName}
                            onChange={e => setNewSchoolName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>

                    {activeTab === 'events' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Tarihi</label>
                            <input
                                type="date"
                                required
                                value={newEventDate}
                                onChange={e => setNewEventDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{activeTab === 'schools' ? 'Adres' : 'Konum / Yer'}</label>
                        <textarea
                            required
                            placeholder={activeTab === 'schools' ? "Okulun açık adresi..." : "Örn: A salonu, Giriş Kat"}
                            value={newSchoolAddress}
                            onChange={e => setNewSchoolAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 text-slate-900"
                        />
                    </div>

                    {activeTab === 'schools' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                                <input
                                    type="tel"
                                    placeholder="0212 ..."
                                    value={newSchoolPhone}
                                    onChange={e => setNewSchoolPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                />
                            </div>
                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <h4 className="text-sm font-bold text-slate-900 mb-3">Okul Yöneticisi (Müdür)</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                                        <input
                                            type="text"
                                            placeholder="Örn: Ahmet Yılmaz"
                                            value={managerName}
                                            onChange={e => setManagerName(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon (Giriş için)</label>
                                        <input
                                            type="tel"
                                            placeholder="555..."
                                            value={managerPhone}
                                            onChange={e => setManagerPhone(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                                        <input
                                            type="email"
                                            placeholder="mudur@okul.com"
                                            value={managerEmail}
                                            onChange={e => setManagerEmail(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
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

                    {activeTab === 'events' && (
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
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm"
                        >
                            {activeTab === 'schools' ? 'Okul Ekle' : 'Etkinlik Oluştur'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={editingSchoolType === 'event' ? "Etkinliği Düzenle" : "Okulu Düzenle"}
            >
                <form onSubmit={handleUpdateSchool} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {editingSchoolType === 'event' ? 'Etkinlik Adı' : 'Okul Adı'}
                        </label>
                        <input
                            type="text"
                            required
                            value={editSchoolName}
                            onChange={e => setEditSchoolName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {editingSchoolType === 'event' ? 'Konum / Açıklama' : 'Adres'}
                        </label>
                        <textarea
                            required
                            value={editSchoolAddress}
                            onChange={e => setEditSchoolAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 text-slate-900"
                        />
                    </div>

                    {editingSchoolType === 'event' && (
                        <div className="border p-3 rounded-lg bg-slate-50">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Etkinlik Günleri</label>

                            <div className="flex gap-2 mb-3">
                                <input
                                    type="date"
                                    value={newDateInput}
                                    onChange={e => setNewDateInput(e.target.value)}
                                    className="px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={addDateToEvent}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                                >
                                    Ekle
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {editEventDates.map(date => (
                                    <div key={date} className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm text-sm text-slate-700">
                                        <Calendar size={12} className="text-slate-400" />
                                        {date}
                                        <button
                                            type="button"
                                            onClick={() => removeDateFromEvent(date)}
                                            className="text-slate-400 hover:text-red-500"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {editEventDates.length === 0 && <span className="text-xs text-slate-400 italic">Tarih eklenmedi.</span>}
                            </div>
                        </div>
                    )}

                    {editingSchoolType !== 'event' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                                <input
                                    type="tel"
                                    value={editSchoolPhone}
                                    onChange={e => setEditSchoolPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                />
                            </div>
                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <h4 className="text-sm font-bold text-slate-900 mb-3">Okul Yöneticisi (Müdür)</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                                        <input
                                            type="text"
                                            value={editManagerName}
                                            onChange={e => setEditManagerName(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                                        <input
                                            type="tel"
                                            value={editManagerPhone}
                                            onChange={e => setEditManagerPhone(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                                        <input
                                            type="email"
                                            value={editManagerEmail}
                                            onChange={e => setEditManagerEmail(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon size={16} />
                                        <span>Kapak Görseli</span>
                                    </div>
                                </label>
                                {/* Similar Image Input Reuse - Simplified for brevity in replace, can copy full logic if needed */}
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={editSchoolImage}
                                    onChange={e => setEditSchoolImage(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tema Rengi</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={editSchoolColor}
                                onChange={e => setEditSchoolColor(e.target.value)}
                                className="h-10 w-20 p-1 border border-slate-300 rounded-lg cursor-pointer"
                            />
                            <span className="text-sm text-slate-500 uppercase">{editSchoolColor}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Değişiklikleri Kaydet
                    </button>
                </form>
            </Modal>
        </div >
    );
}
