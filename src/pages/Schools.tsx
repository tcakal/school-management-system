import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { Building2, ArrowRight, Plus, MapPin, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
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
    const [newSchoolColor, setNewSchoolColor] = useState('#2563eb'); // Default blue-600
    const [newSchoolImage, setNewSchoolImage] = useState('');

    const handleAddSchool = async (e: React.FormEvent) => {
        e.preventDefault();

        const newSchool: School = {
            id: crypto.randomUUID(),
            name: newSchoolName,
            address: newSchoolAddress,
            phone: newSchoolPhone,
            defaultPrice: 0, // Default value
            color: newSchoolColor,
            imageUrl: newSchoolImage
        };

        await addSchool(newSchool);

        setIsAddModalOpen(false);
        setNewSchoolName('');
        setNewSchoolAddress('');
        setNewSchoolPhone('');
        setNewSchoolColor('#2563eb');
        setNewSchoolImage('');
    };

    // Edit School State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
    const [editSchoolName, setEditSchoolName] = useState('');
    const [editSchoolAddress, setEditSchoolAddress] = useState('');
    const [editSchoolPhone, setEditSchoolPhone] = useState('');
    const [editSchoolColor, setEditSchoolColor] = useState('');
    const [editSchoolImage, setEditSchoolImage] = useState('');

    const handleEditSchoolClick = (school: School) => {
        setEditingSchoolId(school.id);
        setEditSchoolName(school.name);
        setEditSchoolAddress(school.address);
        setEditSchoolPhone(school.phone);
        setEditSchoolColor(school.color || '#2563eb');
        setEditSchoolImage(school.imageUrl || '');
        setIsEditModalOpen(true);
    };

    const handleUpdateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSchoolId) return;

        await useStore.getState().updateSchool(editingSchoolId, {
            name: editSchoolName,
            address: editSchoolAddress,
            phone: editSchoolPhone,
            color: editSchoolColor,
            imageUrl: editSchoolImage
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
                            className={`bg-white p-6 rounded-xl hover:shadow-md transition-all cursor-pointer group ${borderColorClass} flex flex-col h-full relative`}
                        >
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform bg-cover bg-center"
                                        style={{
                                            backgroundColor: school.color || '#eff6ff',
                                            color: school.color ? '#fff' : '#2563eb', // text-blue-600 is #2563eb
                                            backgroundImage: school.imageUrl ? `url(${school.imageUrl})` : undefined
                                        }}
                                    >
                                        {!school.imageUrl && <Building2 size={24} />}
                                    </div>
                                    {/* <ArrowRight className="text-slate-300 group-hover:text-blue-500 transition-colors" /> */}
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
                                        <span className="line-clamp-1">{school.address}</span>
                                    </div>
                                </div>

                                <div className="text-sm font-medium text-slate-600 mb-4">
                                    <span>
                                        {students.filter(s => s.schoolId === school.id && s.status === 'Active').length} Öğrenci
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
                                            title="Okulu Düzenle"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <div className="w-px h-4 bg-slate-200"></div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Bu okulu silmek istediğinizden emin misiniz?')) {
                                                    useStore.getState().deleteSchool(school.id);
                                                }
                                            }}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                            title="Okulu Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
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
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                            value={editSchoolImage}
                            onChange={e => setEditSchoolImage(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
