import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { supabase } from '../supabase';
import { Building2, ArrowRight, Plus, MapPin, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import { Modal } from '../components/Modal';
import type { School } from '../types';

export function Schools() {
    const { schools, students, addSchool } = useStore();
    const { user } = useAuth(); // Import user
    const navigate = useNavigate();

    // Filter schools for manager
    const visibleSchools = user?.role === 'manager'
        ? schools.filter(s => s.id === user.id)
        : schools;

    // Add School State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolAddress, setNewSchoolAddress] = useState('');
    const [newSchoolPhone, setNewSchoolPhone] = useState('');
    const [newSchoolColor, setNewSchoolColor] = useState('#2563eb'); // Default blue-600
    const [newSchoolImage, setNewSchoolImage] = useState('');

    const [managerName, setManagerName] = useState('');
    const [managerPhone, setManagerPhone] = useState('');
    const [managerEmail, setManagerEmail] = useState('');

    const handleAddSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSchoolName) return;

        const newSchool: School = {
            id: crypto.randomUUID(),
            name: newSchoolName,
            address: newSchoolAddress,
            phone: newSchoolPhone,
            defaultPrice: 0, // Default value
            color: newSchoolColor,
            imageUrl: newSchoolImage,
            managerName: managerName,
            managerPhone: managerPhone,
            managerEmail: managerEmail,
            type: 'school'
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
                setIsEditModalOpen(true);
            }
        }
    }, [editingSchoolId, schools]);

    const handleEditSchoolClick = (school: School) => {
        setEditingSchoolId(school.id);
        // Modal open is handled by useEffect
    };

    const handleUpdateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSchoolId) return;

        await useStore.getState().updateSchool(editingSchoolId, {
            name: editSchoolName,
            address: editSchoolAddress,
            phone: editSchoolPhone,
            color: editSchoolColor,
            imageUrl: editSchoolImage,
            managerName: editManagerName,
            managerPhone: editManagerPhone,
            managerEmail: editManagerEmail,
            type: 'school'
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
                {visibleSchools.map(school => {
                    // Payment Status Calculation
                    const activeStudents = students.filter(s => s.schoolId === school.id && s.status === 'Active');
                    // Payment Status Calculation (Currently Unused in UI favoring Active Status)
                    // const expectedAmount = activeStudents.length * (school.defaultPrice || 0);
                    // const collectedAmount = payments
                    //     .filter(p => p.schoolId === school.id)
                    //     .reduce((sum, p) => sum + Number(p.amount), 0);

                    // Active Status Calculation
                    const hasStudents = activeStudents.length > 0;
                    const hasAssignments = useStore.getState().assignments.some(a => a.schoolId === school.id);
                    const isActive = hasStudents || hasAssignments;

                    let borderColorClass = 'border-slate-200'; // Default gray
                    if (isActive) {
                        borderColorClass = 'border-emerald-500 border-2 shadow-emerald-50'; // Active (Green)
                    } else {
                        borderColorClass = 'border-orange-400 border-2 shadow-orange-50'; // Inactive (Orange)
                    }

                    // Original Payment Logic (Optional to keep or replace? User asked for Active/Inactive colored borders specifically)
                    // If we want to keep payment visualization, we might need a separate indicator or ring.
                    // User request: "aktif okullarda yeşil çerçeve olsun. henüz aktif olmamış... turuncu çerçeve olsun."
                    // So we prioritize Active status for the border.

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
                                            color: school.color ? '#fff' : '#2563eb', // text-blue-600 is #2563eb
                                            backgroundImage: school.imageUrl ? `url(${school.imageUrl})` : undefined
                                        }}
                                    >
                                        {!school.imageUrl && <Building2 size={24} />}
                                    </div>
                                    {/* <ArrowRight className="text-slate-300 group-hover:text-blue-500 transition-colors" /> */}
                                </div>
                                <div className="mb-4">
                                    <div className="text-xs text-slate-400 font-normal">
                                        {useAuth.getState().user?.role === 'teacher' ? (
                                            <span className="italic">Detaylar için tıklayın</span>
                                        ) : (
                                            school.defaultPrice ? `${school.defaultPrice.toLocaleString('tr-TR')} ₺ / öğrenci` : 'Fiyat Belirlenmedi'
                                        )}
                                    </div>
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
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                        <textarea
                            required
                            placeholder="Okulun açık adresi..."
                            value={newSchoolAddress}
                            onChange={e => setNewSchoolAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 text-slate-900"
                        />
                    </div>
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
                                <p className="text-xs text-slate-500 mt-1">Yönetici bu telefon numarası ve son 4 hanesi ile giriş yapacak.</p>
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
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={newSchoolImage}
                                    onChange={e => setNewSchoolImage(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const fileExt = file.name.split('.').pop();
                                            const fileName = `school-${Date.now()}.${fileExt}`;
                                            // Use Supabase client directly
                                            const { error } = await supabase.storage
                                                .from('school-assets')
                                                .upload(fileName, file);

                                            if (error) throw error;

                                            const { data: { publicUrl } } = supabase.storage
                                                .from('school-assets')
                                                .getPublicUrl(fileName);

                                            setNewSchoolImage(publicUrl);
                                        } catch (err: any) {
                                            alert('Yükleme Hatası: ' + err.message);
                                        }
                                    }}
                                />
                                <button type="button" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-2 transition-colors">
                                    <span className="text-sm font-medium">Yükle</span>
                                </button>
                            </div>
                        </div>
                        {newSchoolImage && <img src={newSchoolImage} alt="Önizleme" className="mt-2 h-20 w-auto rounded border border-slate-200" />}
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
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                        <textarea
                            required
                            placeholder="Okulun açık adresi..."
                            value={editSchoolAddress}
                            onChange={e => setEditSchoolAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input
                            type="tel"
                            placeholder="0212 ..."
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
                                    placeholder="Örn: Ahmet Yılmaz"
                                    value={editManagerName}
                                    onChange={e => setEditManagerName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon (Giriş için)</label>
                                <input
                                    type="tel"
                                    placeholder="555..."
                                    value={editManagerPhone}
                                    onChange={e => setEditManagerPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                                <input
                                    type="email"
                                    placeholder="mudur@okul.com"
                                    value={editManagerEmail}
                                    onChange={e => setEditManagerEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                />
                            </div>
                        </div>
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
                                <span>Kapak Görseli</span>
                            </div>
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={editSchoolImage}
                                    onChange={e => setEditSchoolImage(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const fileExt = file.name.split('.').pop();
                                            const fileName = `school-${Date.now()}.${fileExt}`;
                                            // Use Supabase client directly
                                            const { error } = await supabase.storage
                                                .from('school-assets')
                                                .upload(fileName, file);

                                            if (error) throw error;

                                            const { data: { publicUrl } } = supabase.storage
                                                .from('school-assets')
                                                .getPublicUrl(fileName);

                                            setEditSchoolImage(publicUrl);
                                        } catch (err: any) {
                                            alert('Yükleme Hatası: ' + err.message);
                                        }
                                    }}
                                />
                                <button type="button" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-2 transition-colors">
                                    <span className="text-sm font-medium">Yükle</span>
                                </button>
                            </div>
                        </div>
                        {editSchoolImage && <img src={editSchoolImage} alt="Önizleme" className="mt-2 h-20 w-auto rounded border border-slate-200" />}
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
