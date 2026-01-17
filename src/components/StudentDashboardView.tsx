import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, parseISO, isFuture } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Star, FileText, CheckCircle, XCircle, Clock, Link, Download } from 'lucide-react';
import { Modal } from './Modal';

interface StudentDashboardViewProps {
    studentId: string;
}

export function StudentDashboardView({ studentId }: StudentDashboardViewProps) {
    const { students, schools, lessons, attendance, studentEvaluations, teachers, updateStudent } = useStore();
    const [activeTab, setActiveTab] = useState<'lessons' | 'evaluations'>('lessons');
    const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
    const [isEvalDetailModalOpen, setIsEvalDetailModalOpen] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    // Get Student Data
    const student = useMemo(() => {
        return students.find(s => s.id === studentId);
    }, [studentId, students]);

    const school = useMemo(() => {
        if (!student) return null;
        return schools.find(s => s.id === student.schoolId);
    }, [student, schools]);

    // Get Lesson History (Attendance & Notes)
    const lessonHistory = useMemo(() => {
        if (!student) return [];
        // Find all lessons for this student's class
        const studentLessons = lessons.filter(l =>
            l.classGroupId === student.classGroupId &&
            l.status !== 'cancelled' &&
            !isFuture(parseISO(`${l.date}T${l.startTime}`))
        );

        return studentLessons.map(lesson => {
            const att = attendance.find(a => a.lessonId === lesson.id && a.studentId === student.id);
            const teacher = teachers.find(t => t.id === lesson.teacherId);

            return {
                id: lesson.id,
                date: lesson.date,
                startTime: lesson.startTime,
                topic: lesson.topic,
                notes: lesson.notes, // Class notes
                attachments: lesson.attachments || [],
                teacherName: teacher?.name || 'Bilinmiyor',
                attendanceStatus: att?.status || 'unknown', // present, absent, late, excused
                attendanceNote: att?.note
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [student, lessons, attendance, teachers]);

    // Get Evaluations
    const myEvaluations = useMemo(() => {
        if (!student) return [];
        return studentEvaluations
            .filter(e => e.studentId === student.id)
            .map(e => {
                const evaluator = teachers.find(t => t.id === e.evaluatorId) || teachers.find(t => t.id === e.teacherId);
                return {
                    id: e.id,
                    date: e.createdAt,
                    score: e.score,
                    note: e.note,
                    evaluatorName: e.evaluatorId === 'super-admin' ? 'Yönetici' : (evaluator?.name || 'Eğitmen')
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [student, studentEvaluations, teachers]);

    if (!student) {
        return <div className="p-8 text-center text-slate-500">Öğrenci bilgisi bulunamadı.</div>;
    }

    return (
        <div className="bg-slate-50 pb-20">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="font-medium text-blue-600">{school?.name}</span>
                            <span>•</span>
                            <span>Öğrenci Paneli</span>
                        </div>
                    </div>
                </div>
                {/* School Card */}
                {school && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative group">
                        <div className={`h-2 w-full`} style={{ backgroundColor: school.color || '#3b82f6' }}></div>
                        <div className="p-5 flex items-start gap-4">
                            {school.imageUrl ? (
                                <img src={school.imageUrl} alt={school.name} className="w-16 h-16 rounded-lg object-cover border border-slate-100 shadow-sm" />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                    <FileText size={24} />
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{school.name}</h3>
                                {school.address && <p className="text-sm text-slate-500 mt-0.5">{school.address}</p>}
                                <div className="flex gap-4 mt-3 text-xs font-medium text-slate-500">
                                    {school.phone && (
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                            <span className="text-slate-400">📞</span> {school.phone}
                                        </div>
                                    )}
                                    {school.managerName && (
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                            <span className="text-slate-400">👤</span> {school.managerName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Katılım</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">
                                {lessonHistory.filter(l => l.attendanceStatus === 'present').length}
                            </span>
                            <span className="text-xs text-slate-400">/ {lessonHistory.length} Ders</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Ort. Başarı</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-indigo-600">
                                {myEvaluations.length > 0
                                    ? Math.round(myEvaluations.reduce((a, b) => a + b.score, 0) / myEvaluations.length)
                                    : '-'}
                            </span>
                            <span className="text-xs text-slate-400">Puan</span>
                        </div>
                    </div>
                </div>

                {/* Payment Status Card (New) */}
                <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between mb-4 ${student.last_payment_status === 'paid'
                    ? 'bg-green-50 border-green-200'
                    : student.last_payment_status === 'claimed'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                    <div className="mb-3">
                        <div className={`text-xs uppercase font-bold mb-1 ${student.last_payment_status === 'paid' ? 'text-green-600' : student.last_payment_status === 'claimed' ? 'text-blue-600' : 'text-orange-600'}`}>
                            Ödeme Durumu
                        </div>
                        <div className="font-bold text-slate-900 text-lg">
                            {student.last_payment_status === 'paid'
                                ? 'Ödendi ✅'
                                : student.last_payment_status === 'claimed'
                                    ? 'İnceleme Bekliyor 🕒'
                                    : 'Ödeme Bekleniyor ⚠️'}
                        </div>
                        {student.last_payment_date && student.last_payment_status === 'paid' && (
                            <div className="text-xs text-green-700 mt-1">
                                Son Ödeme: {format(parseISO(student.last_payment_date), 'dd MMMM', { locale: tr })}
                            </div>
                        )}
                    </div>

                    {student.last_payment_status !== 'paid' && student.last_payment_status !== 'claimed' && (
                        <button
                            disabled={paymentProcessing}
                            onClick={async () => {
                                if (window.confirm('Ödeme yaptığınızı bildirmek istiyor musunuz? Okul yönetimine bilgi verilecektir.')) {
                                    setPaymentProcessing(true);
                                    try {
                                        // Update student status
                                        await updateStudent(student.id, {
                                            last_payment_status: 'claimed',
                                            last_claim_date: new Date().toISOString()
                                        } as any);
                                        // alert('Ödeme bildiriminiz alındı. Teşekkürler!'); // UI refreshes automatically
                                    } catch (error) {
                                        console.error('Payment claim error:', error);
                                        alert('Bir hata oluştu.');
                                    } finally {
                                        setPaymentProcessing(false);
                                    }
                                }
                            }}
                            className="w-full py-2 bg-white border border-orange-300 text-orange-700 rounded-lg text-sm font-bold shadow-sm hover:bg-orange-50 transition-colors disabled:opacity-50"
                        >
                            {paymentProcessing ? 'İşleniyor...' : 'Ödeme Yaptım ₺'}
                        </button>
                    )}

                    {student.last_payment_status === 'claimed' && (
                        <div className="text-xs text-blue-600 font-medium bg-blue-100/50 p-2 rounded-lg">
                            Okul yönetimi onayladığında durum güncellenecektir.
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-slate-200/50 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setActiveTab('lessons')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'lessons' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Ders Geçmişi & Notlar
                    </button>
                    <button
                        onClick={() => setActiveTab('evaluations')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'evaluations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Değerlendirmeler
                    </button>
                </div>

                {/* Content: Lessons */}
                {activeTab === 'lessons' && (
                    <div className="space-y-4">
                        {lessonHistory.map(lesson => (
                            <div key={lesson.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="p-4 flex items-start justify-between border-b border-slate-50 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg border border-slate-100 text-center min-w-[3.5rem]">
                                            <div className="text-xs text-slate-400 font-bold uppercase">
                                                {format(parseISO(lesson.date), 'MMM', { locale: tr })}
                                            </div>
                                            <div className="text-xl font-bold text-slate-900 leading-none mt-0.5">
                                                {format(parseISO(lesson.date), 'dd')}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{lesson.topic || 'Konu girilmemiş'}</div>
                                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                                <Clock size={12} />
                                                {lesson.startTime} • {lesson.teacherName}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {lesson.attendanceStatus === 'present' && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                <CheckCircle size={14} />
                                                Katıldı
                                            </div>
                                        )}
                                        {lesson.attendanceStatus === 'absent' && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                                                <XCircle size={14} />
                                                Gelmedi
                                            </div>
                                        )}
                                        {lesson.attendanceStatus === 'late' && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                                                <Clock size={14} />
                                                Geç Kaldı
                                            </div>
                                        )}
                                        {lesson.attendanceStatus === 'excused' && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                                <FileText size={14} />
                                                İzinli
                                            </div>
                                        )}
                                        {lesson.attendanceStatus === 'unknown' && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                                <Clock size={14} />
                                                Yoklama Yok
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {(lesson.notes || lesson.attendanceNote) && (
                                    <div className="p-4 bg-yellow-50/50">
                                        {lesson.notes && (
                                            <div className="mb-2">
                                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Ders Notu</div>
                                                <p className="text-sm text-slate-700 leading-relaxed">{lesson.notes}</p>
                                            </div>
                                        )}
                                        {lesson.attendanceNote && (
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Yoklama Notu</div>
                                                <p className="text-sm text-slate-600 italic">"{lesson.attendanceNote}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Attachments Display */}
                                {lesson.attachments && lesson.attachments.length > 0 && (
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {lesson.attachments.map((att: any, idx: number) => (
                                                <a
                                                    key={idx}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                                                >
                                                    {att.type === 'pdf' ? (
                                                        <FileText size={14} className="text-red-500" />
                                                    ) : (
                                                        <Link size={14} className="text-blue-500" />
                                                    )}
                                                    <span className="text-sm text-slate-700 group-hover:text-blue-700 font-medium">{att.name}</span>
                                                    <Download size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {lessonHistory.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                Henüz işlenen ders bulunmuyor.
                            </div>
                        )}
                    </div>
                )}

                {/* Content: Evaluations */}
                {activeTab === 'evaluations' && (
                    <div className="space-y-4">
                        {myEvaluations.map(ev => (
                            <div
                                key={ev.id}
                                onClick={() => {
                                    setSelectedEvaluation(ev);
                                    setIsEvalDetailModalOpen(true);
                                }}
                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            {format(new Date(ev.date), 'dd MMMM yyyy', { locale: tr })}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            • {ev.evaluatorName}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${ev.score >= 80 ? 'bg-green-100 text-green-700' : ev.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        <Star size={12} className={ev.score >= 80 ? 'fill-green-600' : 'fill-yellow-600'} />
                                        {ev.score} Puan
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">{ev.note}</p>
                            </div>
                        ))}
                        {myEvaluations.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                Henüz değerlendirme yapılmamış.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Evaluation Detail Modal */}
            <Modal
                isOpen={isEvalDetailModalOpen}
                onClose={() => setIsEvalDetailModalOpen(false)}
                title="Değerlendirme Detayı"
            >
                {selectedEvaluation && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Değerlendirme Raporu</h3>
                                <div className="text-sm text-slate-500">{format(new Date(selectedEvaluation.date), 'dd MMMM yyyy', { locale: tr })}</div>
                            </div>
                            <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-4 ${selectedEvaluation.score >= 80 ? 'border-green-100 text-green-700 bg-green-50' : selectedEvaluation.score >= 50 ? 'border-yellow-100 text-yellow-700 bg-yellow-50' : 'border-red-100 text-red-700 bg-red-50'}`}>
                                <span className="text-lg font-bold">{selectedEvaluation.score}</span>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-bold text-slate-900 mb-2">Değerlendirme Notu</div>
                            <div className="p-4 bg-slate-50 text-slate-700 rounded-xl text-sm leading-relaxed border border-slate-100">
                                {selectedEvaluation.note}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setIsEvalDetailModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
