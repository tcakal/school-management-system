import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { Building2, ArrowRight, Plus, MapPin } from 'lucide-react';
import { Modal } from '../components/Modal';
import type { School } from '../types';

export function Schools() {
    const { schools, students, addSchool, payments } = useStore();
    const navigate = useNavigate();

    // Add School State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolAddress, setNewSchoolAddress] = useState('');
    const [newSchoolPhone, setNewSchoolPhone] = useState('');

    const handleAddSchool = async (e: React.FormEvent) => {
        e.preventDefault();

        const newSchool: School = {
            id: crypto.randomUUID(),
            name: newSchoolName,
            address: newSchoolAddress,
            phone: newSchoolPhone,
            defaultPrice: 0 // Default value
        };

        await addSchool(newSchool);

        setIsAddModalOpen(false);
        setNewSchoolName('');
        setNewSchoolAddress('');
        setNewSchoolPhone('');
    };

    // Edit School State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
    const [editSchoolName, setEditSchoolName] = useState('');
    const [editSchoolAddress, setEditSchoolAddress] = useState('');
    const [editSchoolPhone, setEditSchoolPhone] = useState('');

    const handleEditSchoolClick = (school: School) => {
        setEditingSchoolId(school.id);
        setEditSchoolName(school.name);
        setEditSchoolAddress(school.address);
        setEditSchoolPhone(school.phone);
        setIsEditModalOpen(true);
    };

    const handleUpdateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSchoolId) return;

        await useStore.getState().updateSchool(editingSchoolId, {
            name: editSchoolName,
            address: editSchoolAddress,
            phone: editSchoolPhone
        });

        setIsEditModalOpen(false);
        setEditingSchoolId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-900">Okullar</h2>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 font-medium"
                >
                    <Plus size={20} />
                    Yeni Okul Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schools.map(school => {
                    // Payment Status Calculation
                    const activeStudents = students.filter(s => s.schoolId === school.id && s.status === 'Active');
                    const expectedAmount = activeStudents.length * (school.defaultPrice || 0);
                    const collectedAmount = payments
                        .filter(p => p.schoolId === school.id)
                        .reduce((sum, p) => sum + Number(p.amount), 0);

                    let borderColorClass = 'border-slate-200'; // Default gray
                    if (expectedAmount > 0) {
                        const ratio = collectedAmount / expectedAmount;
                        if (ratio >= 1) borderColorClass = 'border-emerald-500 border-2 shadow-emerald-50'; // Green (>100%)
                        else if (ratio >= 0.25) borderColorClass = 'border-orange-400 border-2 shadow-orange-50'; // Orange (25-99%)
                        else borderColorClass = 'border-red-500 border-2 shadow-red-50'; // Red (<25%)
                    }

                    return (
                        <div
                            key={school.id}
                            onClick={() => navigate(`/school/${school.id}`)}
                            className={`bg-white p-6 rounded-xl hover:shadow-md transition-all cursor-pointer group ${borderColorClass}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <Building2 size={24} />
                                </div>
                                <ArrowRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg text-slate-900">{school.name}</h3>
                                {useAuth.getState().user?.role === 'admin' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Bu okulu silmek istediğinizden emin misiniz?')) {
                                                useStore.getState().deleteSchool(school.id);
                                            }
                                        }}
                                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                        title="Okulu Sil"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                    </button>
                                )}
                                {useAuth.getState().user?.role === 'admin' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditSchoolClick(school);
                                        }}
                                        className="text-slate-400 hover:text-blue-600 transition-colors p-1 ml-1"
                                        title="Okulu Düzenle"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.293 2.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-9 9a1 1 0 0 1-.39.242l-3 1a1 1 0 0 1-1.266-1.265l1-3a1 1 0 0 1 .242-.391l9-9zM12 2l2 2m-2-2 2 2" /></svg>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                <MapPin size={14} />
                                <span className="truncate">{school.address}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-50 text-sm font-medium text-slate-600 flex justify-between items-center">
                                <span>
                                    {students.filter(s => s.schoolId === school.id && s.status === 'Active').length} Öğrenci
                                </span>
                                <span className="text-blue-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                                    Detaylar &rarr;
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Yeni Okul Ekle"
            >
                <form onSubmit={handleAddSchool} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Okul Adı</label>
                        <input
                            type="text"
                            required
                            placeholder="Örn: X Koleji"
                            value={newSchoolName}
                            onChange={e => setNewSchoolName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                        <textarea
                            required
                            placeholder="Okulun açık adresi..."
                            value={newSchoolAddress}
                            onChange={e => setNewSchoolAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input
                            type="tel"
                            placeholder="0212 ..."
                            value={newSchoolPhone}
                            onChange={e => setNewSchoolPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Kaydet
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Okulu Düzenle"
            >
                <form onSubmit={handleUpdateSchool} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Okul Adı</label>
                        <input
                            type="text"
                            required
                            placeholder="Örn: X Koleji"
                            value={editSchoolName}
                            onChange={e => setEditSchoolName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                        <textarea
                            required
                            placeholder="Okulun açık adresi..."
                            value={editSchoolAddress}
                            onChange={e => setEditSchoolAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input
                            type="tel"
                            placeholder="0212 ..."
                            value={editSchoolPhone}
                            onChange={e => setEditSchoolPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
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
