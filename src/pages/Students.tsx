import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { Search, ArrowRight, User } from 'lucide-react';
import { Modal } from '../components/Modal';
import { EvaluateStudentModal } from '../components/EvaluateStudentModal';
import { Star, Plus } from 'lucide-react';
import { AddStudentModal } from '../components/AddStudentModal';
import { TelegramService } from '../services/TelegramService';
import { Link, RefreshCw, CheckCircle2 } from 'lucide-react';


export function Students() {
    const { students, schools, classGroups, studentEvaluations, teachers } = useStore();
    const navigate = useNavigate();

    const { user } = useAuth(); // Import useAuth
    const [searchTerm, setSearchTerm] = useState('');
    // Initialize with manager's school ID if manager, else 'all'
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>(user?.role === 'manager' ? user.id : 'all');
    const [statusFilter, setStatusFilter] = useState<'Active' | 'Left' | 'All'>('All');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | 'paid' | 'claimed' | 'unpaid'>('All'); // New Filter

    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);



    // Telegram Connect State
    const [connectCode, setConnectCode] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

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
                // Update local state temporarily
                if (selectedStudent && selectedStudent.id === studentId) {
                    setSelectedStudent({ ...selectedStudent, telegramChatId: res.chat_id.toString() });
                }
                setConnectCode(null);
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

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // Filter by School
            if (selectedSchoolId !== 'all' && student.schoolId !== selectedSchoolId) return false;

            // Filter by Status
            if (statusFilter !== 'All' && student.status !== statusFilter) return false;

            // Filter by Payment Status
            if (paymentStatusFilter !== 'All') {
                if (paymentStatusFilter === 'paid' && student.last_payment_status !== 'paid') return false;
                if (paymentStatusFilter === 'claimed' && student.last_payment_status !== 'claimed') return false;
                if (paymentStatusFilter === 'unpaid' && (student.last_payment_status === 'paid' || student.last_payment_status === 'claimed')) return false;
            }

            // Filter by Search Term
            if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            return true;
        });
    }, [students, selectedSchoolId, statusFilter, searchTerm, paymentStatusFilter]);

    const handleViewDetail = (student: any) => {
        setSelectedStudent(student);
        setConnectCode(null); // Reset
        setIsDetailModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Tüm Öğrenciler</h2>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-slate-500">Sistemdeki kayıtlı tüm öğrencileri görüntüleyin ve arayın.</p>
                    <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                    >
                        <Plus size={18} />
                        Yeni Öğrenci
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="İsim ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                        {user?.role !== 'manager' && (
                            <select
                                value={selectedSchoolId}
                                onChange={(e) => setSelectedSchoolId(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-slate-900"
                            >
                                <option value="all">Tüm Okullar</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>{school.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Payment Status Filter */}
                        <div className="flex rounded-lg border border-slate-300 overflow-hidden shrink-0">
                            <button
                                onClick={() => setPaymentStatusFilter('All')}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${paymentStatusFilter === 'All' ? 'bg-slate-100 text-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                Tümü
                            </button>
                            <div className="w-px bg-slate-300"></div>
                            <button
                                onClick={() => setPaymentStatusFilter('paid')}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${paymentStatusFilter === 'paid' ? 'bg-green-50 text-green-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                Ödenen
                            </button>
                            <div className="w-px bg-slate-300"></div>
                            <button
                                onClick={() => setPaymentStatusFilter('claimed')}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${paymentStatusFilter === 'claimed' ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                Bildirilen
                            </button>
                            <div className="w-px bg-slate-300"></div>
                            <button
                                onClick={() => setPaymentStatusFilter('unpaid')}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${paymentStatusFilter === 'unpaid' ? 'bg-orange-50 text-orange-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                Bekleyen
                            </button>
                        </div>

                        <div className="flex rounded-lg border border-slate-300 overflow-hidden shrink-0">
                            <button
                                onClick={() => setStatusFilter('All')}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${statusFilter === 'All' ? 'bg-slate-100 text-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                Tümü
                            </button>
                            <div className="w-px bg-slate-300"></div>
                            <button
                                onClick={() => setStatusFilter('Active')}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${statusFilter === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                Aktif
                            </button>
                            <div className="w-px bg-slate-300"></div>
                            <button
                                onClick={() => setStatusFilter('Left')}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${statusFilter === 'Left' ? 'bg-red-50 text-red-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                Ayrılan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Öğrenci</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Okul</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sınıf</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Veli E-posta</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Durum</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Detay</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map(student => {
                            const school = schools.find(s => s.id === student.schoolId);
                            const activeClassInfo = classGroups.find(c => c.id === student.classGroupId);

                            return (
                                <tr key={student.id}
                                    className={`hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${student.last_payment_status === 'paid'
                                        ? 'border-green-500' // Green: Paid
                                        : student.last_payment_status === 'claimed'
                                            ? 'border-blue-500' // Blue: Claimed
                                            : 'border-orange-400' // Orange: Pending
                                        }`}
                                    onClick={() => handleViewDetail(student)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{student.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{student.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                        {school?.name || 'Bilinmiyor'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {activeClassInfo ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {activeClassInfo.name}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {student.parentEmail || <span className="text-slate-300 italic">-</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {student.status === 'Active' ? 'Aktif' : 'Ayrıldı'}
                                            </span>
                                            {student.last_payment_status === 'claimed' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 animate-pulse">
                                                    Bildirim
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedStudent(student);
                                                setIsEvaluationModalOpen(true);
                                            }}
                                            className="text-slate-400 hover:text-yellow-500 transition-colors p-1"
                                            title="Öğrenciyi Değerlendir"
                                        >
                                            <Star size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetail(student);
                                            }}
                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                            title="Detay Görüntüle"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                        {(user?.role === 'admin' || user?.role === 'manager') && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/student-panel/${student.id}`);
                                                }}
                                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                                title="Öğrenci Paneline Git"
                                            >
                                                <User size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    Aradığınız kriterlere uygun öğrenci bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="text-right text-xs text-slate-400 mt-2">
                Toplam {filteredStudents.length} kayıt listeleniyor
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="Öğrenci Detayı"
                >
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                                ${selectedStudent.status === 'Active' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Okul</span>
                                <span className="font-medium text-slate-900">
                                    {schools.find(s => s.id === selectedStudent.schoolId)?.name}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Sınıf</span>
                                <span className="font-medium text-slate-900">
                                    {classGroups.find(c => c.id === selectedStudent.classGroupId)?.name || '-'}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Telefon</span>
                                <span className="font-medium text-slate-900">
                                    {selectedStudent.phone || '-'}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Veli E-posta</span>
                                <span className="font-medium text-slate-900">
                                    {selectedStudent.parentEmail || '-'}
                                </span>
                            </div>

                            {/* Telegram Connect Section */}
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2">
                                <span className="text-xs text-slate-500 block mb-1">Telegram Bildirim</span>
                                {selectedStudent.telegramChatId ? (
                                    <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                                        <CheckCircle2 size={16} />
                                        <span>Bağlı (ID: {selectedStudent.telegramChatId})</span>
                                        <button
                                            onClick={() => {
                                                if (confirm('Bağlantıyı koparmak istediğinize emin misiniz?')) {
                                                    // Ideally call an API to clear it. For now just UI or assume updateStudent works.
                                                    useStore.getState().updateStudent(selectedStudent.id, { telegramChatId: null } as any);
                                                    setSelectedStudent({ ...selectedStudent, telegramChatId: null });
                                                }
                                            }}
                                            className="text-[10px] text-red-500 hover:underline ml-auto"
                                        >
                                            Kaldır
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {!connectCode ? (
                                            <button
                                                onClick={() => generateTelegramCode(selectedStudent.id)}
                                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                <Link size={14} />
                                                Telegram'ı Bağla (Veli İçin)
                                            </button>
                                        ) : (
                                            <div className="mt-2 bg-white border border-blue-100 rounded-lg p-3 space-y-2">
                                                <div className="text-xs text-blue-800 font-medium text-center">
                                                    Veliye iletilecek kod:
                                                </div>
                                                <div className="text-xl font-bold font-mono text-center text-blue-900 tracking-wider bg-slate-50 py-1 rounded border border-blue-50 select-all">
                                                    {connectCode}
                                                </div>
                                                <div className="text-[10px] text-slate-500 text-center">
                                                    Veli bu kodu 5 dakika içinde Telegram botuna göndermelidir.
                                                </div>
                                                <div className="flex gap-2 justify-center pt-1">
                                                    <button
                                                        onClick={() => verifyTelegramCode(selectedStudent.id)}
                                                        disabled={isVerifying}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded hover:bg-blue-100 flex items-center gap-1"
                                                    >
                                                        {isVerifying ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                        Kontrol Et
                                                    </button>
                                                    <button
                                                        onClick={() => setConnectCode(null)}
                                                        className="text-xs text-slate-400 hover:text-red-500"
                                                    >
                                                        İptal
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedStudent.status === 'Left' && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                                    ⚠️ Ayrılma Bilgisi
                                </h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-xs text-red-600 font-bold block">Ayrılma Tarihi</span>
                                        <span className="text-sm text-red-900">
                                            {selectedStudent.leftDate ? new Date(selectedStudent.leftDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-red-600 font-bold block">Ayrılma Nedeni</span>
                                        <p className="text-sm text-red-900 bg-white/50 p-2 rounded mt-1 border border-red-100">
                                            {selectedStudent.leftReason || 'Sebep belirtilmedi.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Evaluations List */}
                        <div className="border-t border-slate-100 pt-4">
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                Gelişim Notları
                            </h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {studentEvaluations.filter(e => e.studentId === selectedStudent.id).length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">Henüz değerlendirme yapılmamış.</p>
                                ) : (
                                    studentEvaluations
                                        .filter(e => e.studentId === selectedStudent.id)
                                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                        .map(evaluation => {
                                            const teacherName = teachers.find(t => t.id === evaluation.teacherId)?.name || 'Eski Öğretmen';
                                            return (
                                                <div key={evaluation.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-slate-700">{teacherName}</span>
                                                        <span className="text-xs text-slate-400">{new Date(evaluation.createdAt).toLocaleDateString('tr-TR')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex bg-white px-2 py-0.5 rounded border border-slate-200">
                                                            <span className="text-sm font-bold text-blue-600">{evaluation.score / 10}/10</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{evaluation.note}</p>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    navigate(`/school/${selectedStudent.schoolId}`);
                                }}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm transition-colors"
                            >
                                Okul Sayfasına Git
                            </button>
                            {(user?.role === 'admin' || user?.role === 'manager') && (
                                <button
                                    onClick={() => {
                                        navigate(`/student-panel/${selectedStudent.id}`);
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-medium text-sm transition-all"
                                >
                                    Öğrenci Paneline Git
                                </button>
                            )}
                            {selectedStudent.status === 'Left' && (
                                <button
                                    onClick={() => {
                                        useStore.getState().updateStudent(selectedStudent.id, {
                                            status: 'Active',
                                            leftDate: undefined,
                                            leftReason: undefined
                                        } as any);
                                        setIsDetailModalOpen(false);
                                    }}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors"
                                >
                                    Tekrar Aktif Et
                                </button>
                            )}
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors"
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
