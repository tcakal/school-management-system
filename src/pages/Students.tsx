
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { Search, ArrowRight, User, Users, ChevronRight, School } from 'lucide-react';
import { Modal } from '../components/Modal';
import { EvaluateStudentModal } from '../components/EvaluateStudentModal';
import { Plus } from 'lucide-react';
import { AddStudentModal } from '../components/AddStudentModal';
import { TelegramService } from '../services/TelegramService';
import { Link, RefreshCw, CheckCircle2 } from 'lucide-react';


export function Students() {
    const { students, schools, classGroups } = useStore();
    const navigate = useNavigate();
    const { user } = useAuth();

    // UI STATES
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // FILTERS
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>(user?.role === 'manager' ? user.id : 'all');
    const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>('all');
    const [statusFilter] = useState<'Active' | 'Left' | 'All'>('All');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | 'paid' | 'claimed' | 'unpaid'>('All');

    // MODAL STATES
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

    // TELEGRAM STATES
    const [connectCode, setConnectCode] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // --- TELEGRAM LOGIC ---
    const generateTelegramCode = async (studentId: string) => {
        try {
            const res = await TelegramService.generateCode(studentId, 'student');
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

    const verifyTelegramCode = async (studentId: string) => {
        setIsVerifying(true);
        try {
            const res = await TelegramService.verifyConnection(studentId, 'student');
            if (res.success) {
                if (selectedStudent && selectedStudent.id === studentId) {
                    setSelectedStudent({ ...selectedStudent, telegramChatId: res.chat_id.toString() });
                }
                setConnectCode(null);
                alert(`✅ Başarıyla Bağlandı! (@${res.username})`);
            } else {
                alert('Henüz mesaj bulunamadı. Lütfen kodu bota gönderdiğinizden emin olun.');
            }
        } catch (e: any) {
            alert('Hata: ' + e.message);
        } finally {
            setIsVerifying(false);
        }
    };

    // --- DERIVED DATA ---

    // 1. Schools List (Manager sees all)
    // 2. Class Groups (Filtered by School)
    const filteredClassGroups = useMemo(() => {
        if (selectedSchoolId === 'all') {
            return classGroups.filter(c => c.status === 'active');
        }
        return classGroups.filter(c => c.schoolId === selectedSchoolId && c.status === 'active');
    }, [classGroups, selectedSchoolId]);

    // 3. Students (Filtered by everything)
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // School Filter
            if (selectedSchoolId !== 'all' && student.schoolId !== selectedSchoolId) return false;

            // Class Filter
            if (selectedClassGroupId !== 'all' && student.classGroupId !== selectedClassGroupId) return false;

            // Status Filter
            if (statusFilter !== 'All' && student.status !== statusFilter) return false;

            // Payment Filter
            if (paymentStatusFilter !== 'All') {
                if (paymentStatusFilter === 'paid' && student.last_payment_status !== 'paid') return false;
                if (paymentStatusFilter === 'claimed' && student.last_payment_status !== 'claimed') return false;
                if (paymentStatusFilter === 'unpaid' && (student.last_payment_status === 'paid' || student.last_payment_status === 'claimed')) return false;
            }

            // Search Term
            if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            return true;
        }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    }, [students, selectedSchoolId, selectedClassGroupId, statusFilter, searchTerm, paymentStatusFilter]);

    // --- HANDLERS ---
    const handleClassCardClick = (classId: string) => {
        setSelectedClassGroupId(classId);
        setViewMode('list');
    };

    const handleBackToClasses = () => {
        setSelectedClassGroupId('all');
        setViewMode('grid');
    };

    const handleViewDetail = (student: any) => {
        setSelectedStudent(student);
        setConnectCode(null);
        setIsDetailModalOpen(true);
    };


    return (
        <div className="space-y-6">
            {/* --- HEADER --- */}
            <div>
                <h2 className="text-3xl font-bold text-slate-900">
                    {viewMode === 'grid' ? (selectedSchoolId === 'all' ? 'Tüm Sınıflar' : 'Sınıflar & Gruplar') : 'Öğrenci Listesi'}
                </h2>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-slate-500">
                        {viewMode === 'grid'
                            ? 'Detaylarını görmek istediğiniz sınıfı seçin.'
                            : classGroups.find(c => c.id === selectedClassGroupId)?.name || 'Tüm Öğrenciler'}
                    </p>
                    <div className="flex gap-2">
                        {viewMode === 'list' && (
                            <button
                                onClick={handleBackToClasses}
                                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 font-medium"
                            >
                                <ArrowRight className="rotate-180" size={18} />
                                Sınıflara Dön
                            </button>
                        )}
                        <button
                            onClick={() => setIsAddStudentModalOpen(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                        >
                            <Plus size={18} />
                            Yeni Öğrenci
                        </button>
                    </div>
                </div>
            </div>

            {/* --- FILTERS BAR --- */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={viewMode === 'grid' ? "Sınıf veya grup ara..." : "Öğrenci ara..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                        {/* School Select */}
                        {user?.role !== 'manager' && (
                            <select
                                value={selectedSchoolId}
                                onChange={(e) => {
                                    setSelectedSchoolId(e.target.value);
                                    setSelectedClassGroupId('all'); // Reset Class
                                    // Optionally switch to grid here if you want:
                                    // setViewMode('grid');
                                }}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-slate-900"
                            >
                                <option value="all">Tüm Okullar</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>{school.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Payment Status (Only relevant in List View usually, but kept for consistency) */}
                        <div className="flex rounded-lg border border-slate-300 overflow-hidden shrink-0">
                            <button onClick={() => setPaymentStatusFilter('All')} className={`px-3 py-2 text-sm font-medium transition-colors ${paymentStatusFilter === 'All' ? 'bg-slate-100 text-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Tümü</button>
                            <div className="w-px bg-slate-100"></div>
                            <button onClick={() => setPaymentStatusFilter('unpaid')} className={`px-3 py-2 text-sm font-medium transition-colors ${paymentStatusFilter === 'unpaid' ? 'bg-orange-100 text-orange-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Borçlu</button>
                        </div>

                        {/* View Mode Toggle (Manual) */}
                        <div className="flex rounded-lg border border-slate-300 overflow-hidden shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 text-sm font-medium flex items-center gap-1 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-600'}`}
                            >
                                <Users size={16} /> Sınıflar
                            </button>
                            <div className="w-px bg-slate-300"></div>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 text-sm font-medium flex items-center gap-1 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-600'}`}
                            >
                                <User size={16} /> Liste
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA: GRID or LIST --- */}
            {viewMode === 'grid' ? (
                // *** GRID VIEW ***
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClassGroups
                        .filter(g => !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(group => {
                            const groupStudents = students.filter(s => s.classGroupId === group.id && s.status === 'Active');
                            const studentCount = groupStudents.length;
                            const schoolName = schools.find(s => s.id === group.schoolId)?.name || 'Okul Yok';

                            return (
                                <div
                                    key={group.id}
                                    onClick={() => handleClassCardClick(group.id)}
                                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-1 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Users size={24} />
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${studentCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {studentCount} Öğrenci
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{group.name}</h3>

                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                        <School size={12} />
                                        <span className="truncate">{schoolName}</span>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 mb-4"></div>

                                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                        Listeyi Görüntüle <ChevronRight size={16} />
                                    </div>
                                </div>
                            )
                        })
                    }
                    {filteredClassGroups.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <Users size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Görüntülenecek sınıf bulunamadı.</p>
                            {selectedSchoolId === 'all' && <p className="text-xs mt-1">Lütfen okul seçimi yapmayı deneyin.</p>}
                        </div>
                    )}
                </div>
            ) : (
                // *** LIST VIEW ***
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">ÖĞRENCİ</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">OKUL / SINIF</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">İLETİŞİM</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">DURUM</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">İŞLEMLER</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map(student => {
                                const group = classGroups.find(c => c.id === student.classGroupId);
                                const school = schools.find(s => s.id === student.schoolId);

                                return (
                                    <tr key={student.id}
                                        onClick={() => handleViewDetail(student)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{student.name}</div>
                                                    <div className="text-xs text-slate-400">ID: {student.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-500">{school?.name}</span>
                                                <span className="font-medium text-blue-600">{group?.name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600">{student.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${student.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                    {student.status === 'Active' ? 'Aktif' : 'Pasif'}
                                                </span>
                                                {student.last_payment_status === ('unpaid' as any) && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                                        Ödenmedi
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleViewDetail(student)}
                                                    className="flex items-center gap-1 text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-xs font-medium"
                                                >
                                                    <User size={14} /> Detay
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        Öğrenci bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- MODALS --- */}
            {selectedStudent && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="Öğrenci Detayı"
                >
                    <div className="space-y-6">
                        {/* Summary Header */}
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                                 ${selectedStudent.status === 'Active' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                        {schools.find(s => s.id === selectedStudent.schoolId)?.name}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">
                                        {classGroups.find(c => c.id === selectedStudent.classGroupId)?.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Telefon</span>
                                <span className="font-medium text-slate-900">{selectedStudent.phone || '-'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Veli E-posta</span>
                                <span className="font-medium text-slate-900 truncate" title={selectedStudent.parentEmail}>{selectedStudent.parentEmail || '-'}</span>
                            </div>

                            {/* Telegram Section */}
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2">
                                <span className="text-xs text-slate-500 block mb-2">İletişim & Bildirim</span>
                                {selectedStudent.telegramChatId ? (
                                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2 rounded text-sm text-emerald-700">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={16} />
                                            <span className="font-bold">Telegram Bağlı</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (confirm('Telegram bağlantısını koparmak istediğinize emin misiniz?')) {
                                                    useStore.getState().updateStudent(selectedStudent.id, { telegramChatId: null } as any);
                                                    setSelectedStudent({ ...selectedStudent, telegramChatId: null });
                                                }
                                            }}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            Bağlantıyı Kes
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {!connectCode ? (
                                            <button
                                                onClick={() => generateTelegramCode(selectedStudent.id)}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                            >
                                                <Link size={14} /> Bağlantı Kodu Oluştur
                                            </button>
                                        ) : (
                                            <div className="bg-white border border-blue-200 rounded p-3 text-center animate-in fade-in zoom-in duration-300">
                                                <div className="text-xs text-slate-500 mb-1">Veliye iletilecek kod:</div>
                                                <div className="text-2xl font-bold font-mono text-blue-600 tracking-widest select-all bg-slate-50 py-2 rounded mb-2">{connectCode}</div>

                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => verifyTelegramCode(selectedStudent.id)} disabled={isVerifying} className="bg-blue-600 text-white px-3 py-1 text-xs rounded hover:bg-blue-700 flex items-center gap-1">
                                                        {isVerifying ? <RefreshCw className="animate-spin" size={12} /> : 'Kontrol Et'}
                                                    </button>
                                                    <button onClick={() => setConnectCode(null)} className="text-slate-400 hover:text-slate-600 text-xs px-2">İptal</button>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-2">Bu kod 5 dakika geçerlidir.</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            {(user?.role === 'admin' || user?.role === 'manager') && (
                                <button
                                    onClick={() => navigate(`/student-panel/${selectedStudent.id}`)}
                                    className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Öğrenci Paneli
                                </button>
                            )}
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <EvaluateStudentModal
                isOpen={isEvaluationModalOpen}
                onClose={() => setIsEvaluationModalOpen(false)}
                student={selectedStudent}
            />

            <AddStudentModal
                isOpen={isAddStudentModalOpen}
                onClose={() => setIsAddStudentModalOpen(false)}
            />
        </div>
    );
}

