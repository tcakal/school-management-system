import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { Phone, Mail, Plus, Edit2, BookOpen, Trash2, Shield, Filter, Calendar, Star } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TeacherLeaveModal } from '../components/TeacherLeaveModal';
import { EvaluateTeacherModal } from '../components/EvaluateTeacherModal';
import type { Teacher } from '../types';

export function Teachers() {
    const { teachers, schools, assignments, addTeacher, updateTeacher, deleteTeacher } = useStore();
    const { user } = useAuth(); // Import useAuth hook
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [leaveModalTeacherId, setLeaveModalTeacherId] = useState<string | null>(null);
    const [evaluateModalTeacherId, setEvaluateModalTeacherId] = useState<string | null>(null);
    // Initialize with manager's school ID if manager, else 'all'
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>(user?.role === 'manager' ? user.id : 'all');

    // ... (rest of state)

    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [specialties, setSpecialties] = useState('');
    const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
    const [password, setPassword] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');

    const openModal = (teacher?: Teacher) => {
        if (teacher) {
            setEditingId(teacher.id);
            setName(teacher.name);
            setPhone(teacher.phone);
            setEmail(teacher.email || '');
            setSpecialties(teacher.specialties?.join(', ') || '');
            setRole(teacher.role);
            setPassword(teacher.password || '');
            setTelegramChatId(teacher.telegramChatId || '');
        } else {
            setEditingId(null);
            setName('');
            setPhone('');
            setEmail('');
            setSpecialties('');
            setRole('teacher');
            setPassword('');
            setTelegramChatId('');
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
            password: password || '123456',
            telegramChatId: telegramChatId || undefined
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
                if (t.role === 'admin') return true; // Always show admins? Maybe not for school managers?
                // For managers, maybe only show admins if they are school admins? 
                // But admins are global currently. 
                // Let's assume Managers only care about Teachers assigned to their school.

                // If Manager, hide global admins? Or show them? 
                // Let's keep admins visible but separated.
                if ((t.role as string) === 'admin') return true;

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
                    {user?.role !== 'manager' && (
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
                    )}

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
                                    onDelete={() => {
                                        if (window.confirm('Bu yöneticiyi silmek istediğinize emin misiniz?')) {
                                            deleteTeacher(admin.id);
                                        }
                                    }}
                                    onManageLeaves={() => setLeaveModalTeacherId(admin.id)}
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
                                    onDelete={() => {
                                        if (window.confirm('Bu öğretmeni silmek istediğinize emin misiniz?')) {
                                            deleteTeacher(teacher.id);
                                        }
                                    }}
                                    onManageLeaves={() => setLeaveModalTeacherId(teacher.id)}
                                    // Only admins can evaluate teachers
                                    onEvaluate={() => setEvaluateModalTeacherId(teacher.id)}
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
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
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
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telegram Chat ID</label>
                            <input
                                type="text"
                                placeholder="Örn: 123456789"
                                value={telegramChatId}
                                onChange={e => setTelegramChatId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-mono"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Bildirimler için gereklidir (@userinfobot)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'admin' | 'teacher')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
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
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta (Opsiyonel)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
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
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
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

            <TeacherLeaveModal
                isOpen={!!leaveModalTeacherId}
                onClose={() => setLeaveModalTeacherId(null)}
                teacherId={leaveModalTeacherId}
            />

            <EvaluateTeacherModal
                isOpen={!!evaluateModalTeacherId}
                onClose={() => setEvaluateModalTeacherId(null)}
                teacher={teachers.find(t => t.id === evaluateModalTeacherId) || null}
            />
        </div >
    );
}

function TeacherCard({ teacher, status, onEdit, onDelete, onManageLeaves, onEvaluate }: {
    teacher: Teacher,
    status: 'admin' | 'assigned' | 'unassigned',
    onEdit: () => void,
    onDelete: () => void,
    onManageLeaves: () => void,
    onEvaluate?: () => void
}) {
    const borderColor = status === 'admin' ? 'border-purple-500 shadow-purple-50' : status === 'unassigned' ? 'border-orange-200 shadow-orange-50' : 'border-green-200 shadow-green-50';

    // const isActive = status === 'assigned' || status === 'admin';
    const statusText = status === 'admin' ? 'Yönetici' : status === 'assigned' ? 'Ders Ataması Var' : 'Ders Ataması Yok';
    const statusBg = status === 'admin' ? 'bg-purple-100 text-purple-700' : status === 'assigned' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 ${borderColor} hover:shadow-md transition-all group flex flex-col h-full`}>
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 text-xl font-bold relative">
                        {(() => {
                            const parts = teacher.name.trim().split(' ');
                            if (parts.length >= 2) {
                                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                            }
                            return teacher.name.substring(0, 2).toUpperCase();
                        })()}
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

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                    onClick={onManageLeaves}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 rounded-lg"
                    title="İzin Yönetimi"
                >
                    <Calendar size={18} />
                </button>
                <div className="w-px bg-slate-200 my-1"></div>
                {onEvaluate && (
                    <>
                        <button
                            onClick={onEvaluate}
                            className="text-slate-400 hover:text-yellow-600 transition-colors p-2 hover:bg-yellow-50 rounded-lg"
                            title="Değerlendir"
                        >
                            <Star size={18} />
                        </button>
                        <div className="w-px bg-slate-200 my-1"></div>
                    </>
                )}
                <button
                    onClick={onEdit}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 rounded-lg"
                    title="Düzenle"
                >
                    <Edit2 size={18} />
                </button>
                <div className="w-px bg-slate-200 my-1"></div>
                <button
                    onClick={onDelete}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                    title="Sil"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
