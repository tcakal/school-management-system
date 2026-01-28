
import React, { useState, useEffect } from 'react';
import { X, Calendar, User, School as SchoolIcon, MapPin } from 'lucide-react';
import { supabase } from '../supabase';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import type { School, Teacher, ClassGroup } from '../types';
import { TimeSelect } from './TimeSelect';

interface AddLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Optional pre-selected context
    initialSchoolId?: string;
    initialDate?: string;
    initialStartTime?: string;
    initialClassGroupId?: string;
    onSuccess?: () => void;
}

export function AddLessonModal({ isOpen, onClose, initialSchoolId, initialDate, initialStartTime, initialClassGroupId, onSuccess }: AddLessonModalProps) {
    const { schools, teachers, classGroups, fetchData } = useStore();

    // Form State
    const [mode, setMode] = useState<'existing' | 'custom'>('existing'); // 'existing' (School) or 'custom' (Other)
    const [schoolId, setSchoolId] = useState('');
    const [customLocation, setCustomLocation] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [teacherId, setTeacherId] = useState('');
    const [classGroupId, setClassGroupId] = useState('all'); // 'all' or specific ID
    const [topic, setTopic] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialSchoolId) {
                setMode('existing');
                setSchoolId(initialSchoolId);
            } else {
                setMode('existing');
                setSchoolId('');
            }
            setCustomLocation('');
            setDate(initialDate || new Date().toISOString().split('T')[0]);
            setStartTime(initialStartTime || '09:00');
            setEndTime('10:00');

            const currentUser = useAuth.getState().user;
            if (currentUser?.role === 'teacher') {
                setTeacherId(currentUser.id);
            } else {
                setTeacherId('');
            }

            setClassGroupId(initialClassGroupId || 'all');
            setTopic('');
            setNotes('');
        }
    }, [isOpen, initialSchoolId, initialDate, initialStartTime, initialClassGroupId]);

    // Use Memo for filtering
    const availableClasses = React.useMemo(() =>
        classGroups.filter(c => c.schoolId === schoolId && c.status === 'active'),
        [classGroups, schoolId]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'existing' && !schoolId) {
            alert('Lütfen bir okul seçin.');
            return;
        }
        if (mode === 'custom' && !customLocation) {
            alert('Lütfen etkinlik yeri/müşteri adı girin.');
            return;
        }

        if (!date || !startTime || !endTime || !teacherId) {
            alert('Lütfen gerekli alanları doldurun.');
            return;
        }

        setLoading(true);
        try {
            let payload: any = {
                teacher_id: teacherId,
                date,
                start_time: startTime,
                end_time: endTime,
                type: 'extra',
                topic: topic || (mode === 'custom' ? customLocation : 'Ekstra Ders / Etkinlik'),
                notes: notes
            };

            if (mode === 'existing') {
                payload.school_id = schoolId;

                // Handle Class Group Logic
                let targetClasses: string[] = [];
                if (classGroupId === 'all') {
                    if (availableClasses.length > 0) {
                        targetClasses = [availableClasses[0].id];
                    } else {
                        // Fallback: If no classes exist, maybe just insert without class_group_id if DB allows?
                        // DB is now updated to allow NULL class_group_id. 
                        // So we can send null if no classes found.
                        targetClasses = [null as any];
                    }
                } else {
                    targetClasses = [classGroupId];
                }
                payload.class_group_id = targetClasses[0];
            } else {
                // Custom Mode
                payload.custom_location = customLocation;
                payload.school_id = null;
                payload.class_group_id = null;
            }

            const { error } = await supabase.from('lessons').insert(payload);
            if (error) throw error;

            alert('Ekstra ders/etkinlik başarıyla eklendi.');
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

                    {/* Mode Selection */}
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="mode"
                                value="existing"
                                checked={mode === 'existing'}
                                onChange={() => setMode('existing')}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-slate-700">Kayıtlı Okul</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="mode"
                                value="custom"
                                checked={mode === 'custom'}
                                onChange={() => setMode('custom')}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-slate-700">Diğer / Özel Etkinlik</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {mode === 'existing' ? 'Okul' : 'Etkinlik Yeri / Müşteri'}
                            </label>

                            {mode === 'existing' ? (
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
                            ) : (
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={customLocation}
                                        onChange={(e) => setCustomLocation(e.target.value)}
                                        placeholder="Örn: Turkcell Plaza, Bilim Merkezi..."
                                        className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            )}
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

                        {!initialDate && (
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
                        )}

                        {mode === 'existing' && (
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
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Başlangıç Saati
                            </label>
                            <TimeSelect
                                value={startTime}
                                onChange={setStartTime}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Bitiş Saati
                            </label>
                            <TimeSelect
                                value={endTime}
                                onChange={setEndTime}
                                className="w-full"
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
                                    disabled={useAuth.getState().user?.role === 'teacher'}
                                    className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
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
