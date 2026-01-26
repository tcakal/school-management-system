
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useStore } from '../store/useStore';
import { X, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface ShiftScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    schoolId: string;
}

export function ShiftScheduleModal({ isOpen, onClose, schoolId }: ShiftScheduleModalProps) {
    const [targetDate, setTargetDate] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<{
        count: number;
        firstLessonDate: string;
        shiftDays: number;
        attendanceProtectedCount: number;
    } | null>(null);

    const [confirmStep, setConfirmStep] = useState(false);

    const allClassGroups = useStore((state) => state.classGroups);
    // Fix: Filter with useMemo to avoid infinite loop caused by new array reference in selector
    const classGroups = React.useMemo(() => allClassGroups.filter(c => c.schoolId === schoolId), [allClassGroups, schoolId]);

    useEffect(() => {
        if (isOpen) {
            setTargetDate('');
            setSelectedClassId('all');
            setPreviewData(null);
            setLoading(false);
            setConfirmStep(false);
        }
    }, [isOpen]);

    // Calculate preview when inputs change
    useEffect(() => {
        if (!targetDate || !schoolId) return;
        setConfirmStep(false);

        const calculatePreview = async () => {
            setLoading(true);
            try {
                // 1. Fetch relevant lessons (Status scheduled)
                let query = supabase
                    .from('lessons')
                    .select('id, date, status')
                    .eq('school_id', schoolId)
                    .eq('status', 'scheduled');

                if (selectedClassId !== 'all') {
                    query = query.eq('class_group_id', selectedClassId);
                }

                const { data: lessons, error } = await query;
                if (error) throw error;
                if (!lessons || lessons.length === 0) {
                    setPreviewData({ count: 0, firstLessonDate: '-', shiftDays: 0, attendanceProtectedCount: 0 });
                    return;
                }

                // 2. Filter out lessons with attendance
                const lessonIds = lessons.map(l => l.id);

                const { data: attendanceData, error: attError } = await supabase
                    .from('attendance')
                    .select('lesson_id')
                    .in('lesson_id', lessonIds);

                if (attError) throw attError;

                const attendedLessonIds = new Set(attendanceData?.map(a => a.lesson_id));
                const protectedCount = attendedLessonIds.size;

                // Filtered Lessons to Move
                const lessonsToMove = lessons.filter(l => !attendedLessonIds.has(l.id));

                if (lessonsToMove.length === 0) {
                    setPreviewData({ count: 0, firstLessonDate: '-', shiftDays: 0, attendanceProtectedCount: protectedCount });
                    return;
                }

                // 3. Find MIN date
                lessonsToMove.sort((a, b) => a.date.localeCompare(b.date));
                const currentStartStr = lessonsToMove[0].date;
                const currentStartDate = new Date(currentStartStr);

                // 4. Calculate Shift Logic
                const targetD = new Date(targetDate);
                const diffTime = targetD.getTime() - currentStartDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

                setPreviewData({
                    count: lessonsToMove.length,
                    firstLessonDate: currentStartStr,
                    shiftDays: diffDays,
                    attendanceProtectedCount: protectedCount
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(calculatePreview, 500); // Debounce
        return () => clearTimeout(timeoutId);

    }, [targetDate, selectedClassId, schoolId]);

    const handleShift = async () => {
        if (!previewData || previewData.count === 0) return;

        if (!confirmStep) {
            setConfirmStep(true);
            return;
        }

        setLoading(true);
        try {
            // 1. Fetch again to be safe
            let query = supabase
                .from('lessons')
                .select('id, date, status')
                .eq('school_id', schoolId)
                .eq('status', 'scheduled');

            if (selectedClassId !== 'all') {
                query = query.eq('class_group_id', selectedClassId);
            }

            const { data: lessons, error } = await query;
            if (error) throw error;

            const lessonIds = lessons?.map(l => l.id) || [];

            const { data: attendanceData, error: attError } = await supabase
                .from('attendance')
                .select('lesson_id')
                .in('lesson_id', lessonIds);

            if (attError) throw attError;

            const attendedLessonIds = new Set(attendanceData?.map(a => a.lesson_id));
            const lessonsToMove = lessons?.filter(l => !attendedLessonIds.has(l.id)) || [];

            // 2. Perform Updates - Client Side Loop
            const updates = lessonsToMove.map(l => {
                const oldDate = new Date(l.date);
                const newDate = new Date(oldDate);
                newDate.setDate(newDate.getDate() + previewData.shiftDays);
                return {
                    id: l.id,
                    date: newDate.toISOString().split('T')[0]
                };
            });

            // Parallelize updates in batches
            const batchSize = 10;
            for (let i = 0; i < updates.length; i += batchSize) {
                const batch = updates.slice(i, i + batchSize);
                await Promise.all(batch.map(u =>
                    supabase.from('lessons').update({ date: u.date }).eq('id', u.id)
                ));
            }

            alert('✅ Program başarıyla güncellendi.');
            onClose();
            useStore.getState().fetchData();

        } catch (err: any) {
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        Ders Programını Taşı
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {!confirmStep ? (
                        <>
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                                <AlertCircle size={20} className="shrink-0" />
                                <div>
                                    Dersleri ileri veya geri tarihe topluca taşıyabilirsiniz.
                                    <br />
                                    <strong>Not:</strong> Yoklama alınmış veya tamamlanmış dersler taşınmaz, oldukları günde kalır.
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Hangi dersler?
                                    </label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">Tüm Okul</option>
                                        {classGroups.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Yeni Başlangıç Tarihi
                                    </label>
                                    <input
                                        type="date"
                                        value={targetDate}
                                        onChange={(e) => setTargetDate(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        İlk dersin başlayacağı yeni tarihi seçin. Diğer dersler buna göre hesaplanacaktır.
                                    </p>
                                </div>
                            </div>

                            {loading && (
                                <div className="py-4 text-center text-slate-500 text-sm">
                                    Hesaplanıyor...
                                </div>
                            )}

                            {previewData && !loading && (
                                <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100">
                                    <h4 className="font-medium text-slate-800 text-sm">Önizleme:</h4>
                                    <ul className="text-sm space-y-1 text-slate-600">
                                        <li className="flex justify-between">
                                            <span>Planlanan İlk Ders:</span>
                                            <span className="font-mono font-medium">{previewData.firstLessonDate}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Taşınacak Ders Sayısı:</span>
                                            <span className="font-mono font-medium">{previewData.count}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Gün Farkı:</span>
                                            <span className={`font-mono font-medium ${previewData.shiftDays > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                                {previewData.shiftDays > 0 ? '+' : ''}{previewData.shiftDays} gün
                                            </span>
                                        </li>
                                        {previewData.attendanceProtectedCount > 0 && (
                                            <li className="flex justify-between text-blue-600 font-medium pt-2 border-t border-slate-200 mt-2">
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle size={14} /> Korunan Ders (Yoklamalı):
                                                </span>
                                                <span>{previewData.attendanceProtectedCount}</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                                <div className="p-4 bg-orange-100 text-orange-600 rounded-full">
                                    <AlertCircle size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800">Emin misiniz?</h4>
                                <p className="text-slate-600 max-w-xs">
                                    <strong>{previewData?.count}</strong> adet ders <strong>{previewData?.shiftDays}</strong> gün ötelenecek.
                                    <br />
                                    Bu işlem geri alınamaz.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={() => {
                            if (confirmStep) setConfirmStep(false);
                            else onClose();
                        }}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                        {confirmStep ? 'Geri Dön' : 'İptal'}
                    </button>
                    <button
                        onClick={handleShift}
                        disabled={!previewData || previewData.count === 0 || loading || previewData.shiftDays === 0}
                        className={`px-6 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${confirmStep ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'İşleniyor...' : (confirmStep ? 'Evet, Onaylıyorum' : 'Taşı ve Kaydet')}
                    </button>
                </div>
            </div>
        </div>
    );
}
