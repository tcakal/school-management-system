import { useState, useMemo, useEffect } from 'react';
import { TimeSelect } from './TimeSelect';
import { useStore } from '../store/useStore';
import { X, Check, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Modal } from './Modal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Lesson } from '../types';

interface LessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    lesson: Lesson | null;
}

export function LessonModal({ isOpen, onClose, lesson }: LessonModalProps) {
    const { students, teachers, classGroups, saveAttendance, attendance, updateLesson, addLesson } = useStore();
    const [mode, setMode] = useState<'attendance' | 'manage'>('attendance');

    // Topic State
    const [topic, setTopic] = useState('');
    const [notes, setNotes] = useState(''); // New Notes State

    // Cancellation/Reschedule State
    const [cancelReason, setCancelReason] = useState('');
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleEndTime, setRescheduleEndTime] = useState('');

    // Attendance State
    const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

    // Effect to load data when lesson changes
    useEffect(() => {
        if (!lesson) return;

        setTopic(lesson.topic || '');
        setNotes(lesson.notes || '');
        setRescheduleDate(lesson.date);
        setRescheduleTime(lesson.startTime);
        setRescheduleEndTime(lesson.endTime);
        setRescheduleDate(lesson.date);
        setRescheduleTime(lesson.startTime);

        const groupStudents = students.filter(s => s.classGroupId === lesson.classGroupId);
        const existing = attendance.filter(a => a.lessonId === lesson.id);
        const initial: Record<string, any> = {};

        getAllStudents(groupStudents, existing, initial);
        setAttendanceState(initial);
    }, [lesson, attendance, students]);

    // Helper to avoid complex dependency logic inside effect if needed, 
    // but here it's simple enough.
    const getAllStudents = (groupStudents: any[], existing: any[], initial: any) => {
        groupStudents.forEach(s => {
            const found = existing.find(a => a.studentId === s.id);
            initial[s.id] = found ? found.status : 'present';
        });
    };

    // Safe date formatting
    const formattedDate = useMemo(() => {
        if (!lesson) return '';
        try {
            return format(new Date(lesson.date), 'dd MMMM yyyy', { locale: tr });
        } catch (e) {
            return lesson?.date || '';
        }
    }, [lesson?.date]);

    if (!lesson) return null;

    const group = classGroups.find(g => g.id === lesson.classGroupId);
    const teacher = teachers.find(t => t.id === lesson.teacherId);
    const groupStudents = students.filter(s => s.classGroupId === lesson.classGroupId);

    const handleSaveAttendance = async () => {
        const records = Object.entries(attendanceState).map(([studentId, status]) => ({
            studentId,
            status
        }));
        await saveAttendance(lesson.id, records);

        // Save topic as well if changed
        if (topic !== lesson.topic || notes !== lesson.notes) {
            await updateLesson(lesson.id, { topic, notes });
        }

        onClose();
    };

    const handleCancelLesson = async () => {
        if (!cancelReason) return;

        await updateLesson(lesson.id, {
            status: 'cancelled',
            cancelReason: cancelReason,
            topic // save topic too just in case
        });

        if (rescheduleDate && rescheduleTime) {
            await addLesson({
                id: crypto.randomUUID(),
                schoolId: lesson.schoolId,
                classGroupId: lesson.classGroupId,
                teacherId: lesson.teacherId,
                date: rescheduleDate,
                startTime: rescheduleTime,
                endTime: lesson.endTime,
                status: 'scheduled',
                type: 'makeup',
                topic: topic // carry over topic to makeup lesson
            });
        }
        onClose();
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${group?.name || 'Sınıf'} - ${teacher?.name || 'Öğretmen'}`}>
            <div className="mb-6">
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formattedDate}
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={16} />
                        {lesson.startTime} - {lesson.endTime}
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${lesson.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        lesson.type === 'makeup' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {lesson.status === 'cancelled' ? 'İptal' : lesson.type === 'makeup' ? 'Telafi Dersi' : 'Normal Ders'}
                    </div>
                </div>

                {/* Topic Input */}
                <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Ders Konusu / İçeriği</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Örn: Robotik Giriş, Sensörler..."
                        className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Ders Notları (Özel)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Öğretmen için özel notlar..."
                        rows={3}
                        className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                </div>

                <div className="flex border-b border-slate-200 mb-4">
                    <button
                        onClick={() => setMode('attendance')}
                        className={`pb-2 px-1 text-sm font-medium ${mode === 'attendance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                    >
                        Yoklama
                    </button>
                    <button
                        onClick={() => setMode('manage')}
                        className={`pb-2 px-1 text-sm font-medium ml-4 ${mode === 'manage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                    >
                        İptal / Telafi
                    </button>
                </div>

                {mode === 'attendance' && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {groupStudents.length > 0 ? (
                            groupStudents.map(student => (
                                <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="font-medium text-slate-900">{student.name}</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAttendanceState(prev => ({ ...prev, [student.id]: 'present' }))}
                                            className={`p-1.5 rounded-md transition-colors ${attendanceState[student.id] === 'present' ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:bg-slate-200'}`}
                                            title="Var"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => setAttendanceState(prev => ({ ...prev, [student.id]: 'late' }))}
                                            className={`p-1.5 rounded-md transition-colors ${attendanceState[student.id] === 'late' ? 'bg-yellow-100 text-yellow-700' : 'text-slate-400 hover:bg-slate-200'}`}
                                            title="Geç"
                                        >
                                            <Clock size={18} />
                                        </button>
                                        <button
                                            onClick={() => setAttendanceState(prev => ({ ...prev, [student.id]: 'absent' }))}
                                            className={`p-1.5 rounded-md transition-colors ${attendanceState[student.id] === 'absent' ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-slate-200'}`}
                                            title="Yok"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-sm">
                                Bu sınıfta henüz öğrenci yok.
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSaveAttendance}
                                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'manage' && (
                    <div className="space-y-6">
                        {/* Edit Date/Time Section */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="flex items-center gap-2 text-slate-800 font-medium mb-3">
                                <Clock size={18} />
                                Tarih ve Saat Düzenle
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Tarih</label>
                                    <input
                                        type="date"
                                        className="w-full text-sm border-slate-300 rounded-md text-slate-900"
                                        value={rescheduleDate}
                                        onChange={e => setRescheduleDate(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Başlangıç</label>
                                        <TimeSelect
                                            value={rescheduleTime}
                                            onChange={(val) => setRescheduleTime(val)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Bitiş</label>
                                        <TimeSelect
                                            value={rescheduleEndTime}
                                            onChange={(val) => setRescheduleEndTime(val)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!rescheduleDate || !rescheduleTime || !rescheduleEndTime) return;
                                    if (window.confirm('Ders saatini güncellemek istediğinize emin misiniz?')) {
                                        await updateLesson(lesson.id, {
                                            date: rescheduleDate,
                                            startTime: rescheduleTime,
                                            endTime: rescheduleEndTime
                                        });
                                        onClose();
                                    }
                                }}
                                disabled={!rescheduleDate || !rescheduleTime || !rescheduleEndTime || (rescheduleDate === lesson.date && rescheduleTime === lesson.startTime && rescheduleEndTime === lesson.endTime)}
                                className="mt-3 w-full bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                            >
                                Güncelle
                            </button>
                        </div>

                        {/* Cancel Lesson Section */}
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <h4 className="flex items-center gap-2 text-red-800 font-medium mb-2">
                                <AlertTriangle size={18} />
                                Dersi İptal Et
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-red-700 mb-1">İptal Sebebi</label>
                                    <select
                                        value={cancelReason}
                                        onChange={e => setCancelReason(e.target.value)}
                                        className="w-full text-sm border-red-200 rounded-md focus:ring-red-500 text-slate-900"
                                    >
                                        <option value="">Seçiniz...</option>
                                        <option value="teacher_sick">Öğretmen Raporlu</option>
                                        <option value="holiday">Resmi Tatil</option>
                                        <option value="trip">Okul Gezisi</option>
                                        <option value="other">Diğer</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                                <Calendar size={18} />
                                Telafi Dersi Planla (Opsiyonel)
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-blue-700 mb-1">Tarih</label>
                                    <input
                                        type="date"
                                        className="w-full text-sm border-blue-200 rounded-md text-slate-900"
                                        value={rescheduleDate}
                                        onChange={e => setRescheduleDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-700 mb-1">Saat</label>
                                    <TimeSelect
                                        value={rescheduleTime}
                                        onChange={(val) => setRescheduleTime(val)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={handleCancelLesson}
                                disabled={!cancelReason}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                İptal Et & Planla
                            </button>
                        </div>

                        <div className="pt-6 border-t border-slate-100 mt-6">
                            <button
                                onClick={() => {
                                    if (window.confirm('Bu dersi takvimden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
                                        useStore.getState().deleteLesson(lesson.id);
                                        onClose();
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                Dersi Takvimden Sil
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
