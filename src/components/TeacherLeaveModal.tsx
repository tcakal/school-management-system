import { useState, useMemo, useEffect } from 'react';
import { TimeSelect } from './TimeSelect';
import { useStore } from '../store/useStore';
import { Modal } from './Modal';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, AlertTriangle, Trash2, Clock } from 'lucide-react';
import type { Teacher, Lesson } from '../types';

interface TeacherLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacherId: string | null;
}

export function TeacherLeaveModal({ isOpen, onClose, teacherId }: TeacherLeaveModalProps) {
    const { teachers, lessons, addLeave, deleteLeave, leaves, updateLesson, findAvailableTeachers } = useStore();

    // Form State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState<'sick' | 'vacation' | 'other'>('sick');
    const [reason, setReason] = useState('');
    const [isFullDay, setIsFullDay] = useState(true);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Substitution State
    const [substitutions, setSubstitutions] = useState<Record<string, string>>({}); // lessonId -> teacherId

    // Active Tab
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

    const teacher = useMemo(() => teachers.find(t => t.id === teacherId), [teachers, teacherId]);
    const teacherLeaves = useMemo(() =>
        leaves.filter(l => l.teacherId === teacherId).sort((a, b) => b.startDate.localeCompare(a.startDate)),
        [leaves, teacherId]
    );

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            setEndDate(today);
            setIsFullDay(true);
            setStartTime('');
            setEndTime('');
            setType('sick');
            setReason('');
            setSubstitutions({});
            setActiveTab('new');
        }
    }, [isOpen, teacherId]);

    // Calculate Conflicts
    const conflicts = useMemo(() => {
        if (!startDate || !endDate || !teacherId) return [];

        // If not full day, ensure we have times
        if (!isFullDay && (!startTime || !endTime)) return [];

        return lessons.filter(l => {
            if (l.teacherId !== teacherId) return false;

            const inDateRange = l.date >= startDate && l.date <= endDate;
            if (!inDateRange) return false;
            if (l.status === 'cancelled') return false;

            // If Full Day, every lesson in date range is a conflict
            if (isFullDay) return true;

            // If Partial Day, check for time overlap
            // Lesson Time: l.startTime - l.endTime
            // Leave Time: startTime - endTime
            return (l.startTime < endTime && l.endTime > startTime);
        }).sort((a, b) => {
            const dateComp = a.date.localeCompare(b.date);
            if (dateComp !== 0) return dateComp;
            return a.startTime.localeCompare(b.startTime);
        });
    }, [lessons, teacherId, startDate, endDate, isFullDay, startTime, endTime]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherId || !startDate || !endDate) return;

        // 1. Create Leave Record
        await addLeave({
            teacherId,
            startDate,
            endDate,
            startTime: isFullDay ? undefined : startTime,
            endTime: isFullDay ? undefined : endTime,
            type,
            reason,
            createdAt: new Date().toISOString()
        });

        // 2. Process Substitutions
        const promises = Object.entries(substitutions).map(([lessonId, subId]) => {
            if (subId === 'ignore') return Promise.resolve();
            return updateLesson(lessonId, {
                teacherId: subId,
                originalTeacherId: teacherId, // Keep track of who was supposed to teach
                isSubstitute: true
            });
        });

        await Promise.all(promises);
        onClose();
    };

    const handleDeleteLeave = async (id: string) => {
        if (confirm('Bu izin kaydını silmek istediğinize emin misiniz?')) {
            await deleteLeave(id);
        }
    };

    if (!teacher) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${teacher.name} - İzin Yönetimi`}
        >
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('new')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'new' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    Yeni İzin Girişi
                    {activeTab === 'new' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    İzin Geçmişi
                    {activeTab === 'history' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
                    )}
                </button>
            </div>

            {activeTab === 'new' ? (
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center gap-2 pb-2">
                        <input
                            type="checkbox"
                            id="fullDay"
                            checked={isFullDay}
                            onChange={e => setIsFullDay(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 text-slate-900"
                        />
                        <label htmlFor="fullDay" className="text-sm font-medium text-slate-700">Tüm Gün</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Tarihi</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi</label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                min={startDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                    </div>

                    {!isFullDay && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Saati</label>
                                <TimeSelect
                                    value={startTime}
                                    onChange={(val) => setStartTime(val)}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Saati</label>
                                <TimeSelect
                                    value={endTime}
                                    onChange={(val) => setEndTime(val)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">İzin Türü</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            >
                                <option value="sick">Raporlu / Hastalık</option>
                                <option value="vacation">Yıllık İzin</option>
                                <option value="other">Diğer / Mazeret</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Örn: Grip, Cenaze..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Conflict Analysis */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle size={18} className={conflicts.length > 0 ? "text-orange-500" : "text-slate-400"} />
                            <h3 className="font-semibold text-slate-800">
                                {conflicts.length > 0
                                    ? `${conflicts.length} Ders Etkilenecek`
                                    : "Çakışan ders bulunamadı"}
                            </h3>
                        </div>

                        {conflicts.length > 0 && (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {conflicts.map(lesson => (
                                    <ConflictItem
                                        key={lesson.id}
                                        lesson={lesson}
                                        selectedSubId={substitutions[lesson.id]}
                                        onSelectSub={(subId) => setSubstitutions(prev => ({ ...prev, [lesson.id]: subId }))}
                                        findAvailableTeachers={findAvailableTeachers}
                                        teachers={teachers}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors"
                        >
                            İzni Kaydet {Object.keys(substitutions).filter(k => substitutions[k] !== 'ignore').length > 0 && `ve ${Object.keys(substitutions).filter(k => substitutions[k] !== 'ignore').length} Değişikliği Uygula`}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {teacherLeaves.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic">
                            Geçmiş izin kaydı bulunamadı.
                        </div>
                    ) : (
                        teacherLeaves.map(leave => (
                            <div key={leave.id} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center group">
                                <div>
                                    <div className="flex items-center gap-2 font-medium text-slate-900">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span>
                                            {format(parseISO(leave.startDate), 'd MMM yyyy', { locale: tr })} - {format(parseISO(leave.endDate), 'd MMM yyyy', { locale: tr })}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${leave.type === 'sick' ? 'bg-red-100 text-red-700' :
                                            leave.type === 'vacation' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                            {leave.type === 'sick' ? 'Raporlu' : leave.type === 'vacation' ? 'Yıllık İzin' : 'Diğer'}
                                        </span>
                                    </div>
                                    {leave.reason && (
                                        <p className="text-slate-500 text-sm mt-1">{leave.reason}</p>
                                    )}
                                    {leave.startTime && leave.endTime && (
                                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                            <Clock size={12} />
                                            <span>{leave.startTime} - {leave.endTime}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteLeave(leave.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="İzni Sil"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </Modal>
    );
}

function ConflictItem({ lesson, selectedSubId, onSelectSub, findAvailableTeachers }: {
    lesson: Lesson,
    selectedSubId: string | undefined,
    onSelectSub: (id: string) => void,
    findAvailableTeachers: (date: string, start: string, end: string) => Promise<Teacher[]>,
    teachers: Teacher[]
}) {
    const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            setIsLoading(true);
            try {
                const res = await findAvailableTeachers(lesson.date, lesson.startTime, lesson.endTime);
                if (mounted) setAvailableTeachers(res);
            } catch (error) {
                console.error("Failed to fetch teachers", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        fetch();
        return () => { mounted = false; };
    }, [lesson, findAvailableTeachers]);

    return (
        <div className="bg-white p-3 rounded border border-slate-200 text-sm">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="font-medium text-slate-700">
                        {format(parseISO(lesson.date), 'd MMMM EEEE', { locale: tr })}
                    </div>
                    <div className="text-slate-500 text-xs">
                        {lesson.startTime} - {lesson.endTime} ({getGroupName(lesson.classGroupId)})
                    </div>
                </div>
                <div className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">
                    Öğretmen Yok
                </div>
            </div>

            <div className="flex items-center gap-2">
                <select
                    value={selectedSubId || ""}
                    onChange={(e) => onSelectSub(e.target.value)}
                    disabled={isLoading}
                    className={`flex-1 px-2 py-1.5 border rounded text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 ${selectedSubId && selectedSubId !== 'ignore' ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-300'
                        }`}
                >
                    <option value="">{isLoading ? 'Kontrol ediliyor...' : 'İşlem Seçiniz...'}</option>
                    <option value="ignore">Yerine Kimseyi Atama (Boş Geçsin)</option>
                    <optgroup label="Uygun Öğretmenler">
                        {availableTeachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </optgroup>
                </select>
            </div>
        </div>
    );
}

// Helper to avoid heavy store dependency just for name lookup if possible
function getGroupName(id: string) {
    const { classGroups } = useStore.getState();
    return classGroups.find(c => c.id === id)?.name || 'Bilinmeyen Grup';
}
