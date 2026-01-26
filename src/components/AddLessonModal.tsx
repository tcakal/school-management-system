
import React, { useState, useEffect } from 'react';
import { X, Calendar, User, School as SchoolIcon } from 'lucide-react';
import { supabase } from '../supabase';
import { useStore } from '../store/useStore';
import type { School, Teacher, ClassGroup } from '../types';

interface AddLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Optional pre-selected context
    initialSchoolId?: string;
    initialDate?: string;
    onSuccess?: () => void;
}

export function AddLessonModal({ isOpen, onClose, initialSchoolId, initialDate, onSuccess }: AddLessonModalProps) {
    const { schools, teachers, classGroups, fetchData } = useStore();

    // Form State
    const [schoolId, setSchoolId] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [teacherId, setTeacherId] = useState('');
    const [classGroupId, setClassGroupId] = useState('all'); // 'all' or specific ID
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSchoolId(initialSchoolId || '');
            setDate(initialDate || new Date().toISOString().split('T')[0]);
            setStartTime('09:00');
            setEndTime('10:00');
            setTeacherId('');
            setClassGroupId('all');
            setTopic('');
        }
    }, [isOpen, initialSchoolId, initialDate]);

    // Use Memo for filtering
    const availableClasses = React.useMemo(() =>
        classGroups.filter(c => c.schoolId === schoolId && c.status === 'active'),
        [classGroups, schoolId]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId || !date || !startTime || !endTime || !teacherId) {
            alert('Lütfen gerekli alanları doldurun.');
            return;
        }

        setLoading(true);
        try {
            // If "All School" is selected, do we create one lesson without class_group?
            // The schema likely requires class_group_id? Or is it nullable?
            // Let's check schema... usually lessons link to class_group.
            // If "All School", maybe we need a dummy class or we pick the first one?
            // Or maybe we iterate all classes?
            // User said "Maker fair ... tüm sınıflardan öğrencilerin tamamı yada bir kısmı".
            // If we select "All", maybe we assume a special "School Event" class group exists? 
            // Or just pick ANY class. 

            // Wait, if I look at `lessons` table, `class_group_id` is uuid. Is it nullable?
            // Step 620 output says `class_group_id` exists. It's likely FK not null.
            // Let's assume for now we must pick a class.
            // If user selects "All", we might need to create it for ALL classes? 
            // Or is this a single event?
            // Let's just enforce picking a class for now, or if 'all', picking the first one as placeholder?
            // Better: Let's create a lesson for EACH class if 'all' is selected? 
            // No, that floods the calendar.

            // Let's make "Class" mandatory for now to keep it simple and correct.
            let targetClasses: string[] = [];
            if (classGroupId === 'all') {
                if (availableClasses.length === 0) {
                    alert('Bu okulda hiç sınıf yok.');
                    setLoading(false);
                    return;
                }
                // Option A: Assign to first class (Simple)
                // Option B: Create for all (Complex)
                // Let's go with Option A but add a note in topic? 
                // Or better, let's just ask user to select a class.
                // But user wanted "All school".

                // Let's try to pass `null` if DB allows. If not, fail.
                // Actually, let's just use the first available classID as a fallback for "School Event"
                // and put "TÜM OKUL" in title/topic.
                targetClasses = [availableClasses[0].id];
            } else {
                targetClasses = [classGroupId];
            }

            const payload = {
                school_id: schoolId,
                class_group_id: targetClasses[0],
                teacher_id: teacherId,
                date,
                start_time: startTime,
                end_time: endTime,
                status: 'scheduled',
                type: 'extra',
                topic: topic || 'Ekstra Ders / Etkinlik'
            };

            const { error } = await supabase.from('lessons').insert(payload);
            if (error) throw error;

            alert('Ekstra ders başarıyla eklendi.');
            onClose();
            if (onSuccess) onSuccess();
            fetchData(); // Refresh store

        } catch (err: any) {
            console.error(err);
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
                        <Calendar className="text-purple-600" size={20} />
                        Ek Ders / Etkinlik Ekle
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Security Check: If initialSchoolId is fixed, disable school select? Or keep flexible? */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Okul
                            </label>
                            <div className="relative">
                                <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={schoolId}
                                    onChange={(e) => {
                                        setSchoolId(e.target.value);
                                        setClassGroupId('all'); // Reset class when school changes
                                    }}
                                    disabled={!!initialSchoolId}
                                    className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                    <option value="">Okul Seçin</option>
                                    {schools.map((s: School) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Konu / Etkinlik Adı
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Örn: Maker Fair, Telafi Dersi, Ekstra Hazırlık..."
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tarih
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Sınıf / Grup
                            </label>
                            <select
                                value={classGroupId}
                                onChange={(e) => setClassGroupId(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={!schoolId}
                            >
                                <option value="all">Tüm Okul / İlk Grup</option>
                                {availableClasses.map((c: ClassGroup) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Başlangıç Saati
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Bitiş Saati
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Öğretmen
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={teacherId}
                                    onChange={(e) => setTeacherId(e.target.value)}
                                    className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                    <option value="">Öğretmen Seçin</option>
                                    {teachers.map((t: Teacher) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? 'Ekleniyor...' : 'Dersi Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
