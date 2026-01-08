import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Phone, Mail, Plus, Edit2, BookOpen, Trash2, Shield, Filter } from 'lucide-react';
import { Modal } from '../components/Modal';
import type { Teacher } from '../types';

export function Teachers() {
    const { teachers, schools, assignments, addTeacher, updateTeacher, deleteTeacher } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');

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
            setPassword(teacher.password || '');
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

    // Filter and Sort Logic
    const { admins, teachingStaff } = useMemo(() => {
        // 1. Filter by School if selected
        let filtered = teachers;
        if (selectedSchoolId !== 'all') {
            // Get teacher IDs that have assignments in this school
            const assignedTeacherIds = new Set(
                assignments
                    .filter(a => a.schoolId === selectedSchoolId)
                    .map(a => a.teacherId)
            );

            filtered = teachers.filter(t => {
                if (t.role === 'admin') return true; // Always show admins
                return assignedTeacherIds.has(t.id);
            });
        }

        // 2. Sort Alphabetically
        const sorted = [...filtered].sort((a, b) =>
            a.name.localeCompare(b.name, 'tr')
        );

        // 3. Split by Role
        return {
            admins: sorted.filter(t => t.role === 'admin'),
            teachingStaff: sorted.filter(t => t.role !== 'admin')
        };
    }, [teachers, assignments, selectedSchoolId]);

    // Check assignment status for visualization
    const getTeacherStatus = (teacherId: string) => {
        // If filtering by school, we might want to know if they are assigned to THIS school or ANY school?
        // Requirement: "tüm kadroya bakarken..." (While looking at all staff...).
        // "öğretmenlerden bir sınıfa bir okula atanmışları yeşil... atanmamışları turuncu"
        // So global assignment check seems correct for the "status" indicator.
        // Even if filtered, if they show up, they are assigned (green).
        const hasAssignment = assignments.some(a => a.teacherId === teacherId);
        return hasAssignment ? 'assigned' : 'unassigned';
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Kadro Yönetimi</h2>
                    <p className="text-slate-500 mt-2">Öğretmen ve yönetici kadrosu yönetimi.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* School Filter */}
                    <div className="relative">
                        <select
                            value={selectedSchoolId}
                            onChange={(e) => setSelectedSchoolId(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-slate-700 pl-10 pr-8 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer hover:border-slate-300 transition-colors"
                        >
                            <option value="all">Tüm Okullar</option>
                            {schools.map(school => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </select>
                        <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <button
                        onClick={() => openModal()}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Yeni Kişi Ekle
                    </button>
                </div>
            </div>

            <div className="space-y-10">
                {/* Administrators Section */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Yöneticiler</h3>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                            {admins.length}
                        </span>
                    </div>

                    {admins.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Yönetici bulunamadı.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {admins.map(admin => (
                                <TeacherCard
                                    key={admin.id}
                                    teacher={admin}
                                    status="admin"
                                    onEdit={() => openModal(admin)}
                                    onDelete={() => deleteTeacher(admin.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Divider */}
                <div className="border-t border-slate-200"></div>

                {/* Teachers Section */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Öğretmenler</h3>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                            {teachingStaff.length}
                        </span>
                    </div>

                    {teachingStaff.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            {selectedSchoolId !== 'all' ? 'Bu okulda görevli öğretmen bulunamadı.' : 'Öğretmen bulunamadı.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teachingStaff.map(teacher => (
                                <TeacherCard
                                    key={teacher.id}
                                    teacher={teacher}
                                    status={getTeacherStatus(teacher.id)}
                                    onEdit={() => openModal(teacher)}
                                    onDelete={() => deleteTeacher(teacher.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>
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

function TeacherCard({ teacher, status, onEdit, onDelete }: {
    teacher: Teacher,
    status: 'admin' | 'assigned' | 'unassigned',
    onEdit: () => void,
    onDelete: () => void
}) {
    const borderColor = status === 'unassigned' ? 'border-orange-200' : 'border-green-200';

    const isActive = status === 'assigned' || status === 'admin';
    const statusText = status === 'admin' ? 'Yönetici' : status === 'assigned' ? 'Ders Ataması Var' : 'Ders Ataması Yok';
    const statusBg = status === 'admin' ? 'bg-purple-100 text-purple-700' : status === 'assigned' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 ${borderColor} hover:shadow-md transition-all group relative`}>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                    onClick={onDelete}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Sil"
                >
                    <Trash2 size={18} />
                </button>
                <button
                    onClick={onEdit}
                    className="text-slate-400 hover:text-blue-600 p-1"
                    title="Düzenle"
                >
                    <Edit2 size={18} />
                </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 text-xl font-bold relative">
                    {teacher.name.substring(0, 2).toUpperCase()}
                    {teacher.role === 'admin' && (
                        <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1 rounded-full border-2 border-white" title="Yönetici">
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
                <div className="flex items-center gap-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${statusBg}`}>
                        {statusText}
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
    );
}
