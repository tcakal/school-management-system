import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddStudentModal({ isOpen, onClose }: AddStudentModalProps) {
    const { schools, classGroups, addStudent } = useStore();
    const { user } = useAuth();

    // Default values
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [parentName, setParentName] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [schoolId, setSchoolId] = useState('');
    const [classGroupId, setClassGroupId] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gradeLevel, setGradeLevel] = useState<number | ''>('');
    const [address, setAddress] = useState('');
    const [medicalNotes, setMedicalNotes] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize schoolId based on user role
    useEffect(() => {
        if (isOpen) {
            if (user?.role === 'manager' || user?.role === 'teacher') {
                // Assuming 'manager' or 'teacher' user object has an associated schoolId 
                // However, the current User type doesn't strictly explicitly enforce schoolId on the user object itself in all interfaces shown
                // But typically for this app context, managers/teachers belong to a school context.
                // For now, let's default to the first school available if they are restricted, or user's id if it matches a school (often the case for managers in this system)
                if (schools.length > 0) {
                    // If user is manager, their ID might be the school ID or they manage one school.
                    // Let's safe-guard: if schools list has 1 item, pick it.
                    if (schools.length === 1) {
                        setSchoolId(schools[0].id);
                    } else if (user?.role === 'manager') {
                        // Often manager.id === school.id in this specific system's legacy or design
                        const userSchool = schools.find(s => s.id === user.id);
                        if (userSchool) setSchoolId(userSchool.id);
                    }
                }
            }
        }
    }, [isOpen, user, schools]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !schoolId || !phone) return;

        try {
            setIsSubmitting(true);
            const newStudent = {
                id: crypto.randomUUID(),
                schoolId,
                classGroupId: classGroupId || undefined,
                name,
                phone,
                parentName,
                parentEmail,
                status: 'Active' as const,
                joinedDate: new Date().toISOString(),
                birthDate: birthDate || undefined,
                gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
                address,
                medicalNotes,
                telegramChatId: telegramChatId || undefined
            };

            await addStudent(newStudent);

            // Reset form
            setName('');
            setPhone('');
            setParentName('');
            setParentEmail('');
            setBirthDate('');
            setGradeLevel('');
            setAddress('');
            setMedicalNotes('');
            setTelegramChatId('');
            // Keep schoolId if possible

            onClose();
        } catch (error) {
            console.error('Failed to add student:', error);
            alert('Öğrenci eklenirken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredClassGroups = classGroups.filter(c => c.schoolId === schoolId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Yeni Öğrenci Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* School Selection - Only if Admin or multiple schools */}
                {user?.role === 'admin' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Okul <span className="text-red-500">*</span></label>
                        <select
                            value={schoolId}
                            onChange={(e) => {
                                setSchoolId(e.target.value);
                                setClassGroupId(''); // Reset class when school changes
                            }}
                            className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                            required
                        >
                            <option value="">Seçiniz</option>
                            {schools.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Fallback for Manager/Teacher if schoolId is empty (should satisfy required) */}
                {user?.role !== 'admin' && !schoolId && schools.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Okul <span className="text-red-500">*</span></label>
                        <select
                            value={schoolId}
                            onChange={(e) => setSchoolId(e.target.value)}
                            className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                            required
                        >
                            <option value="">Seçiniz</option>
                            {schools.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                        placeholder="Örn: Ahmet Yılmaz"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon <span className="text-red-500">*</span></label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                            placeholder="555..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telegram Chat ID</label>
                        <input
                            type="text"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            className="w-full border-slate-300 rounded-lg focus:ring-blue-500 font-mono text-sm"
                            placeholder="Örn: 12345678"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf / Grup</label>
                        <select
                            value={classGroupId}
                            onChange={(e) => setClassGroupId(e.target.value)}
                            className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                            disabled={!schoolId}
                        >
                            <option value="">Sınıf Seçiniz</option>
                            {filteredClassGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Seviyesi</label>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            value={gradeLevel}
                            onChange={(e) => setGradeLevel(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                            placeholder="Örn: 5"
                        />
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <h4 className="font-medium text-slate-900 mb-3">Veli Bilgileri</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Veli Adı</label>
                            <input
                                type="text"
                                value={parentName}
                                onChange={(e) => setParentName(e.target.value)}
                                className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Veli E-posta</label>
                            <input
                                type="email"
                                value={parentEmail}
                                onChange={(e) => setParentEmail(e.target.value)}
                                className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adres / Notlar</label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full border-slate-300 rounded-lg focus:ring-blue-500"
                        rows={2}
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        disabled={isSubmitting}
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={isSubmitting || !schoolId}
                    >
                        {isSubmitting ? 'Kaydediliyor...' : 'Öğrenciyi Kaydet'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
