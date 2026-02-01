import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { Phone, Mail, Plus, Edit2, BookOpen, Trash2, Shield, Filter, Calendar, Star, Link, RefreshCw, CheckCircle2, MessageSquare } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TeacherLeaveModal } from '../components/TeacherLeaveModal';
import { EvaluateTeacherModal } from '../components/EvaluateTeacherModal';
import { MessageModal } from '../components/MessageModal';
import type { Teacher } from '../types';
import { TelegramService } from '../services/TelegramService';

export function Teachers() {
    const { teachers, schools, assignments, addTeacher, updateTeacher, deleteTeacher } = useStore();
    const { user } = useAuth(); // Import useAuth hook
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [leaveModalTeacherId, setLeaveModalTeacherId] = useState<string | null>(null);
    const [evaluateModalTeacherId, setEvaluateModalTeacherId] = useState<string | null>(null);
    const [messageModalTeacherId, setMessageModalTeacherId] = useState<string | null>(null);
    // Initialize with manager's branch ID if manager, else 'all'
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>(user?.role === 'manager' ? (user.branchId || user.schoolId || 'all') : 'all');

    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [specialties, setSpecialties] = useState('');
    const [role, setRole] = useState<'teacher' | 'admin' | 'manager'>('teacher');
    const [type, setType] = useState<'regular' | 'guest'>('regular');
    const [password, setPassword] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Telegram Connect State
    const [connectCode, setConnectCode] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const openModal = (teacher?: Teacher) => {
        if (teacher) {
            setEditingId(teacher.id);
            setName(teacher.name);
            setPhone(teacher.phone);
            setEmail(teacher.email || '');
            setSpecialties(teacher.specialties?.join(', ') || '');
            setRole(teacher.role as 'teacher' | 'admin' | 'manager');
            setType(teacher.type || 'regular');
            setPassword(teacher.password || '');
            setTelegramChatId(teacher.telegramChatId || '');
            setIsActive(teacher.isActive !== false); // Default true
        } else {
            setEditingId(null);
            setName('');
            setPhone('');
            setEmail('');
            setSpecialties('');
            setRole('teacher');
            setType('regular');
            setPassword('');
            setTelegramChatId('');
            setConnectCode(null);
            setIsActive(true);
        }
        setIsModalOpen(true);
    };

    const generateTelegramCode = async () => {
        if (!editingId) {
            alert('Otomatik bağlama için önce kişiyi kaydetmelisiniz. Lütfen bilgileri doldurup "Kaydet" butonuna basın, sonra tekrar düzenleyerek bu işlemi yapın.');
            return;
        }
        try {
            const res = await TelegramService.generateCode(editingId, 'teacher');
            if (res.success) {
                setConnectCode(res.code);
            } else {
                alert('Kod oluşturulamadı: ' + res.error);
            }
        } catch (e: any) {
            console.error(e);
            alert('Hata: ' + e.message);
        }
    };

    const verifyTelegramCode = async () => {
        if (!editingId) return;
        setIsVerifying(true);
        try {
            const res = await TelegramService.verifyConnection(editingId, 'teacher');
            if (res.success) {
                setTelegramChatId(res.chat_id.toString());
                setConnectCode(null); // Close the code view
                alert(`✅ Başarıyla Bağlandı! (@${res.username})`);
            } else {
                alert('Henüz mesaj bulunamadı. Lütfen kodu bota gönderdiğinizden emin olun ve tekrar deneyin.');
            }
        } catch (e: any) {
            alert('Hata: ' + e.message);
        } finally {
            setIsVerifying(false);
        }
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
            type,
            password: password || '123456',
            telegramChatId: telegramChatId || undefined,
            isActive
        };

        if (editingId) {
            await updateTeacher(editingId, teacherData);
        } else {
            const newTeacher: Teacher = {
                ...teacherData,
                id: crypto.randomUUID(),
                color: `bg-${['red', 'green', 'blue', 'yellow', 'purple', 'pink'][Math.floor(Math.random() * 6)]}-100`,
                isActive: true
            } as Teacher;
            await addTeacher(newTeacher);
        }

        setIsModalOpen(false);
        setEditingId(null);
    };

    // Filter and Sort Logic
    const { superAdmins, managers, teachingStaff, guestStaff } = useMemo(() => {
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

        // 3. Split by Role and Type
        return {
            superAdmins: sorted.filter(t => t.role === 'admin'),
            managers: sorted.filter(t => t.role === 'manager'),
            teachingStaff: sorted.filter(t => t.role !== 'admin' && t.role !== 'manager' && (t.type === 'regular' || !t.type)),
            guestStaff: sorted.filter(t => t.role !== 'admin' && t.role !== 'manager' && t.type === 'guest')
        };
    }, [teachers, assignments, selectedSchoolId]);

    // Check assignment status for visualization
    const getTeacherStatus = (teacher: Teacher) => {
        if (teacher.role === 'admin') return 'admin';
        if (teacher.role === 'manager') return 'manager';
        const hasAssignment = assignments.some(a => a.teacherId === teacher.id);
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
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <div className="relative">
                            <select
                                value={selectedSchoolId}
                                onChange={(e) => setSelectedSchoolId(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 text-slate-700 pl-10 pr-8 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer hover:border-slate-300 transition-colors"
                            >
                                <option value="all">Tüm Şubeler / Okullar</option>
                                {schools
                                    .filter(s => {
                                        if (user?.role === 'admin') return true;
                                        return s.type === 'branch';
                                    })
                                    .map(school => (
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
                            {superAdmins.length}
                        </span>
                    </div>

                    {superAdmins.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Yönetici bulunamadı.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {superAdmins.map(admin => (
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
                                    onMessage={() => setMessageModalTeacherId(admin.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Şube Yöneticileri Section */}
                {managers.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Şube Yöneticileri</h3>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                {managers.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {managers.map(manager => (
                                <TeacherCard
                                    key={manager.id}
                                    teacher={manager}
                                    status="manager"
                                    onEdit={() => openModal(manager)}
                                    onDelete={() => {
                                        if (window.confirm('Bu şube yöneticisini silmek istediğinize emin misiniz?')) {
                                            deleteTeacher(manager.id);
                                        }
                                    }}
                                    onManageLeaves={() => setLeaveModalTeacherId(manager.id)}
                                    onMessage={() => setMessageModalTeacherId(manager.id)}
                                />
                            ))}
                        </div>
                    </section>
                )}

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
                                    status={getTeacherStatus(teacher) as any}
                                    onEdit={() => openModal(teacher)}
                                    onDelete={() => {
                                        if (window.confirm('Bu öğretmeni silmek istediğinize emin misiniz?')) {
                                            deleteTeacher(teacher.id);
                                        }
                                    }}
                                    onManageLeaves={() => setLeaveModalTeacherId(teacher.id)}
                                    // Only admins can evaluate teachers
                                    onEvaluate={() => setEvaluateModalTeacherId(teacher.id)}
                                    onMessage={() => setMessageModalTeacherId(teacher.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Divider */}
                <div className="border-t border-slate-200"></div>

                {/* Guest Teachers Section */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Misafir / Yardımcı Eğitmenler</h3>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                            {guestStaff.length}
                        </span>
                    </div>

                    {guestStaff.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Kayıtlı misafir eğitmen yok.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {guestStaff.map(teacher => (
                                <TeacherCard
                                    key={teacher.id}
                                    teacher={teacher}
                                    status={getTeacherStatus(teacher) as any}
                                    onEdit={() => openModal(teacher)}
                                    onDelete={() => {
                                        if (window.confirm('Bu eğitmeni silmek istediğinize emin misiniz?')) {
                                            deleteTeacher(teacher.id);
                                        }
                                    }}
                                    onManageLeaves={() => setLeaveModalTeacherId(teacher.id)}
                                    onMessage={() => setMessageModalTeacherId(teacher.id)}
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

                            {/* Connect Flow */}
                            {editingId && (
                                <div className="mt-2">
                                    {!connectCode ? (
                                        <button
                                            type="button"
                                            onClick={generateTelegramCode}
                                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            <Link size={14} />
                                            Telegram'ı Otomatik Bağla
                                        </button>
                                    ) : (
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                                            <div className="text-xs text-blue-800 font-medium text-center">
                                                Aşağıdaki kodu Telegram botuna gönderin:
                                            </div>
                                            <div className="text-xl font-bold font-mono text-center text-blue-900 tracking-wider bg-white py-1 rounded border border-blue-100 select-all">
                                                {connectCode}
                                            </div>
                                            <div className="flex gap-2 justify-center">
                                                <a
                                                    href={`https://t.me/${useStore.getState().systemSettings?.telegramBotToken?.split(':')[0] ? 'MySchoolBot' : ''}?start=${connectCode}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
                                                >
                                                    Bot'u Aç
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={verifyTelegramCode}
                                                    disabled={isVerifying}
                                                    className="px-3 py-1.5 bg-white text-blue-700 border border-blue-200 text-xs rounded hover:bg-blue-50 flex items-center gap-1"
                                                >
                                                    {isVerifying ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                    Kontrol Et
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setConnectCode(null)}
                                                className="w-full text-[10px] text-blue-400 hover:underline text-center"
                                            >
                                                İptal
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                            <div className="space-y-4">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'admin' | 'teacher' | 'manager')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                                >
                                    <option value="teacher">Eğitmen</option>
                                    <option value="admin">Yönetici (Süper)</option>
                                    <option value="manager">Şube Yöneticisi</option>
                                </select>

                                {role === 'teacher' && (
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="regular"
                                                checked={type === 'regular'}
                                                onChange={() => setType('regular')}
                                                className="text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-slate-700">Kadrolu</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="guest"
                                                checked={type === 'guest'}
                                                onChange={() => setType('guest')}
                                                className="text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-slate-700">Misafir / Yardımcı</span>
                                        </label>
                                    </div>
                                )}
                            </div>
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

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
                            <label className="flex items-center gap-2 p-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={e => setIsActive(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-slate-500'}`}>
                                    {isActive ? 'Hesap Aktif (Giriş Yapabilir)' : 'Hesap Pasif (Giriş Engellendi)'}
                                </span>
                            </label>
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

            {messageModalTeacherId && (
                <MessageModal
                    teacher={teachers.find(t => t.id === messageModalTeacherId)!}
                    onClose={() => setMessageModalTeacherId(null)}
                    onSend={async (msg: string) => {
                        const t = teachers.find(t => t.id === messageModalTeacherId);
                        if (!t?.telegramChatId) return { success: false, error: 'Chat ID bulunamadı.' };
                        return await TelegramService.sendMessage(t.telegramChatId, `📩 *Yöneticinizden Mesaj Var*\n\n${msg}`);
                    }}
                />
            )}
        </div >
    );
}



function TeacherCard({ teacher, status, onEdit, onDelete, onManageLeaves, onEvaluate, onMessage }: {
    teacher: Teacher,
    status: 'admin' | 'manager' | 'assigned' | 'unassigned',
    onEdit: () => void,
    onDelete: () => void,
    onManageLeaves: () => void,
    onEvaluate?: () => void,
    onMessage: () => void
}) {
    const borderColor = !teacher.isActive ? 'border-slate-200 bg-slate-50 opacity-75' : status === 'admin' ? 'border-purple-500 shadow-purple-50' : status === 'manager' ? 'border-indigo-500 shadow-indigo-50' : status === 'unassigned' ? 'border-orange-200 shadow-orange-50' : 'border-green-200 shadow-green-50';

    const statusText = !teacher.isActive ? 'PASİF' : status === 'admin' ? 'Yönetici' : status === 'manager' ? 'Şube Yöneticisi' : status === 'assigned' ? 'Ders Ataması Var' : 'Ders Ataması Yok';
    const statusBg = !teacher.isActive ? 'bg-slate-200 text-slate-600' : status === 'admin' ? 'bg-purple-100 text-purple-700' : status === 'manager' ? 'bg-indigo-100 text-indigo-700' : status === 'assigned' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';

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
                        {teacher.role === 'manager' && (
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full border-2 border-white" title="Şube Yöneticisi">
                                <Shield size={12} fill="currentColor" />
                            </div>
                        )}
                        {/* Status Orb for online/offline? Or simple indicator? */}
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
                {teacher.telegramChatId && (
                    <>
                        <button
                            onClick={onMessage}
                            className="text-slate-400 hover:text-blue-500 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                            title="Telegram Mesajı Gönder"
                        >
                            <MessageSquare size={18} />
                        </button>
                        <div className="w-px bg-slate-200 my-1"></div>
                    </>
                )}
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
