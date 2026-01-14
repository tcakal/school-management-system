import { useState, useMemo, useEffect } from 'react';
import { TimeSelect } from './TimeSelect';
import { supabase } from '../supabase';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { X, Check, AlertTriangle, Calendar, Clock, Lock, FileText, Link, Trash2 } from 'lucide-react';
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
    const { user } = useAuth();
    const [mode, setMode] = useState<'attendance' | 'manage'>('attendance');

    // Topic State
    const [topic, setTopic] = useState('');
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<{ name: string; url: string; type: 'pdf' | 'link' }[]>([]);

    // New Attachment Input State
    const [newAttachmentType, setNewAttachmentType] = useState<'pdf' | 'link'>('pdf');
    const [newAttachmentName, setNewAttachmentName] = useState('');
    const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

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
        setAttachments(lesson.attachments || []);
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

    // Permission Check
    const canEdit = user?.role === 'admin' || (user?.role === 'teacher' && user.id === lesson.teacherId);

    const handleSaveAttendance = async () => {
        if (!canEdit) return; // double check

        const records = Object.entries(attendanceState).map(([studentId, status]) => ({
            studentId,
            status
        }));
        await saveAttendance(lesson.id, records);

        // Save topic as well if changed
        // Save topic as well if changed
        if (topic !== lesson.topic || notes !== lesson.notes || JSON.stringify(attachments) !== JSON.stringify(lesson.attachments)) {
            await updateLesson(lesson.id, { topic, notes, attachments });
        }

        onClose();
    };

    const handleCancelLesson = async () => {
        if (!canEdit) return;
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
                {!canEdit && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                        <Lock size={16} />
                        Bu dersi düzenleme yetkiniz yok. Sadece kendi derslerinizi yönetebilirsiniz.
                    </div>
                )}
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
                        disabled={!canEdit}
                        placeholder="Örn: Robotik Giriş, Sensörler..."
                        className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Ders Notları (Özel)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={!canEdit}
                        placeholder="Öğretmen için özel notlar..."
                        rows={3}
                        className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                </div>

                {/* Attachments Section */}
                <div className="mb-6">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Ders Materyalleri</label>
                    <div className="space-y-2 mb-3">
                        {attachments.map((att, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {att.type === 'pdf' ? <FileText size={16} className="text-red-500 shrink-0" /> : <Link size={16} className="text-blue-500 shrink-0" />}
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline">
                                        {att.name}
                                    </a>
                                </div>
                                {canEdit && (
                                    <button
                                        onClick={async () => {
                                            if (!window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;

                                            // If it's a PDF and likely a Supabase URL, try to delete from storage
                                            if (att.type === 'pdf') {
                                                try {
                                                    // Extract filename from URL
                                                    // Supabase URLs usually end with /object/public/bucket/filename
                                                    // We just need the last part, but we should be careful if it's a full URL
                                                    const urlParts = att.url.split('/');
                                                    const fileName = urlParts[urlParts.length - 1];

                                                    if (fileName) {
                                                        const { error } = await supabase.storage
                                                            .from('lesson-attachments')
                                                            .remove([fileName]);

                                                        if (error) {
                                                            console.error('Error deleting file:', error);
                                                            // We still remove from UI but warn user? 
                                                            // For now just log it, as we want to clean up the UI regardless
                                                        }
                                                    }
                                                } catch (err) {
                                                    console.error('Delete operation failed:', err);
                                                }
                                            }

                                            setAttachments(prev => prev.filter((_, i) => i !== index));
                                        }}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {canEdit && (
                        <div className="flex gap-2 items-start">
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                    <select
                                        value={newAttachmentType}
                                        onChange={(e) => {
                                            setNewAttachmentType(e.target.value as any);
                                            setNewAttachmentUrl('');
                                            setNewAttachmentName('');
                                        }}
                                        className="text-xs border-slate-300 rounded-md focus:ring-blue-500 py-1.5"
                                    >
                                        <option value="pdf">PDF</option>
                                        <option value="link">Link</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Dosya Adı"
                                        value={newAttachmentName}
                                        onChange={(e) => setNewAttachmentName(e.target.value)}
                                        className="flex-1 text-xs border-slate-300 rounded-md focus:ring-blue-500 py-1.5 px-2"
                                    />
                                </div>
                                {newAttachmentType === 'pdf' ? (
                                    <div className="flex gap-2 items-center">
                                        <label className="cursor-pointer bg-slate-50 text-slate-600 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-100 hover:text-blue-600 transition-colors flex items-center gap-2 border border-slate-200 whitespace-nowrap">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                            Dosya Seç
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    try {
                                                        setIsUploading(true);
                                                        setNewAttachmentName(file.name);

                                                        // Upload to Supabase
                                                        const fileExt = file.name.split('.').pop();
                                                        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                                                        const filePath = `${fileName}`;

                                                        const { error: uploadError } = await supabase.storage
                                                            .from('lesson-attachments')
                                                            .upload(filePath, file, {
                                                                upsert: true
                                                            });

                                                        if (uploadError) {
                                                            console.error('Supabase Upload Detailed Error:', uploadError);
                                                            throw uploadError;
                                                        }

                                                        const { data } = supabase.storage
                                                            .from('lesson-attachments')
                                                            .getPublicUrl(filePath);

                                                        setNewAttachmentUrl(data.publicUrl);

                                                        // Auto-add to list
                                                        setAttachments(prev => [...prev, { name: file.name, url: data.publicUrl, type: 'pdf' }]);

                                                        // Reset
                                                        setNewAttachmentName('');
                                                        setNewAttachmentUrl('');
                                                    } catch (error) {
                                                        console.error('Upload error:', error);
                                                        alert('Dosya yüklenirken bir hata oluştu.');
                                                        setNewAttachmentName('');
                                                        setNewAttachmentUrl('');
                                                    } finally {
                                                        setIsUploading(false);
                                                        // Reset file input so same file can be selected again if needed
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </label>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 italic">
                                                {newAttachmentName ? (
                                                    isUploading ? 'Yükleniyor...' : 'Dosya yüklendi'
                                                ) : 'PDF seçilmedi'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={newAttachmentUrl}
                                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                                        className="w-full text-xs border-slate-300 rounded-md focus:ring-blue-500 py-1.5 px-2"
                                    />
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    if (newAttachmentName && newAttachmentUrl) {
                                        setAttachments([...attachments, { name: newAttachmentName, url: newAttachmentUrl, type: newAttachmentType }]);
                                        setNewAttachmentName('');
                                        setNewAttachmentUrl('');
                                    }
                                }}
                                disabled={!newAttachmentName || !newAttachmentUrl || isUploading}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-0.5 text-xs font-bold transition-colors whitespace-nowrap"
                            >
                                {isUploading ? '...' : 'Ekle'}
                            </button>
                        </div>
                    )}
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
                                            onClick={() => canEdit && setAttendanceState(prev => ({ ...prev, [student.id]: 'present' }))}
                                            disabled={!canEdit}
                                            className={`p-1.5 rounded-md transition-colors ${attendanceState[student.id] === 'present' ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:bg-slate-200'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title="Var"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => canEdit && setAttendanceState(prev => ({ ...prev, [student.id]: 'late' }))}
                                            disabled={!canEdit}
                                            className={`p-1.5 rounded-md transition-colors ${attendanceState[student.id] === 'late' ? 'bg-yellow-100 text-yellow-700' : 'text-slate-400 hover:bg-slate-200'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title="Geç"
                                        >
                                            <Clock size={18} />
                                        </button>
                                        <button
                                            onClick={() => canEdit && setAttendanceState(prev => ({ ...prev, [student.id]: 'absent' }))}
                                            disabled={!canEdit}
                                            className={`p-1.5 rounded-md transition-colors ${attendanceState[student.id] === 'absent' ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-slate-200'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                        {canEdit && (
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleSaveAttendance}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
                                >
                                    Kaydet
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'manage' && (
                    <div className="space-y-6">
                        {!canEdit && (
                            <div className="p-4 bg-slate-50 text-slate-500 text-center rounded-lg text-sm">
                                Bu dersi yönetme yetkiniz bulunmamaktadır.
                            </div>
                        )}

                        {canEdit && (
                            <>
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
                            </>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
