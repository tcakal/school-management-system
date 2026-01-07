import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Phone, Mail, Plus, Edit2, BookOpen, Trash2, Shield } from 'lucide-react';
import { Modal } from '../components/Modal';
import type { Teacher } from '../types';

export function Teachers() {
    const { teachers, addTeacher, updateTeacher, deleteTeacher } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [specialties, setSpecialties] = useState('');
    const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
    const [password, setPassword] = useState('');

    const openModal = (teacher?: Teacher) => {
        if (teacher) {
            setEditingId(teacher.id);
            setName(teacher.name);
            setPhone(teacher.phone);
            setEmail(teacher.email || '');
            setSpecialties(teacher.specialties?.join(', ') || '');
            setRole(teacher.role);
            setPassword(teacher.password || ''); // Show current password or empty if wanted. Ideally shouldn't show but for this app requirements we might need to be able to edit it easily.
        } else {
            setEditingId(null);
            setName('');
            setPhone('');
            setEmail('');
            setSpecialties('');
            setRole('teacher');
            setPassword('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        const teacherData: Partial<Teacher> = {
            name,
            phone,
            email,
            specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
            role,
            password: password || '123456'
        };

        if (editingId) {
            await updateTeacher(editingId, teacherData);
        } else {
            const newTeacher: Teacher = {
                ...teacherData,
                id: crypto.randomUUID(),
                color: `bg-${['red', 'green', 'blue', 'yellow', 'purple', 'pink'][Math.floor(Math.random() * 6)]}-100`,
            } as Teacher;
            await addTeacher(newTeacher);
        }

        setIsModalOpen(false);
        setEditingId(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Kadro Yönetimi</h2>
                    <p className="text-slate-500 mt-2">Öğretmen ve yönetici kadrosu yönetimi.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Yeni Kişi Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map(teacher => (
                    <div key={teacher.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                                onClick={() => deleteTeacher(teacher.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                title="Sil"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={() => openModal(teacher)}
                                className="text-slate-400 hover:text-blue-600 p-1"
                                title="Düzenle"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xl font-bold relative">
                                {teacher.name.substring(0, 2).toUpperCase()}
                                {teacher.role === 'admin' && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white" title="Yönetici">
                                        <Shield size={12} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{teacher.name}</h3>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Phone size={14} />
                                    <span>{teacher.phone}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${teacher.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {teacher.role === 'admin' ? 'Yönetici' : 'Öğretmen'}
                                </span>
                            </div>

                            {teacher.email && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Mail size={16} className="text-slate-400" />
                                    <span>{teacher.email}</span>
                                </div>
                            )}

                            <div className="flex items-start gap-3 text-sm text-slate-600">
                                <BookOpen size={16} className="text-slate-400 mt-0.5" />
                                <div className="flex flex-wrap gap-2">
                                    {teacher.specialties?.length ? (
                                        teacher.specialties.map(spec => (
                                            <span key={spec} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                                {spec}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-400 italic">Uzmanlık belirtilmemiş</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Kişiyi Düzenle" : "Yeni Kişi Ekle"}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon (Kullanıcı Adı)</label>
                            <input
                                type="tel"
                                required
                                placeholder="5XX XXX XX XX"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'admin' | 'teacher')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="teacher">Öğretmen</option>
                                <option value="admin">Yönetici</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                            <input
                                type="text"
                                required
                                placeholder="Giriş şifresi belirleyin"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta (Opsiyonel)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Uzmanlık Alanları</label>
                        <input
                            type="text"
                            placeholder="Matematik, Robotik..."
                            value={specialties}
                            onChange={e => setSpecialties(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm"
                        >
                            {editingId ? 'Güncelle' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
