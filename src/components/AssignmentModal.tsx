import { useState, useEffect } from 'react';
import { TimeSelect } from './TimeSelect';
import { useStore } from '../store/useStore';
import { Modal } from './Modal';
import type { TeacherAssignment } from '../types';
import { Clock, Calendar, User } from 'lucide-react';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    schoolId: string;
    classGroupId: string;
    eventDate?: string; // Specific event date for this class group
}

const DAYS = [
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
    { value: 7, label: 'Pazar' },
];



export function AssignmentModal({ isOpen, onClose, schoolId, classGroupId, eventDate }: AssignmentModalProps) {
    const { teachers, schools, addAssignment, findAvailableTeachers } = useStore();
    const school = schools.find(s => s.id === schoolId);
    const isEvent = school?.type === 'event';
    // Use provided eventDate prop first, fall back to school.eventDate
    const effectiveEventDate = eventDate || school?.eventDate;

    const [teacherId, setTeacherId] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(1);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    // Auto-set day for events
    useEffect(() => {
        if (isEvent && school?.eventDate) {
            const date = new Date(school.eventDate);
            const day = date.getDay() || 7; // Convert 0 (Sun) to 7
            setDayOfWeek(day);
        }
    }, [isEvent, school?.eventDate]);

    // Check availability when timing changes
    useState(() => {
        // Initial check logic if needed, but better in useEffect
    });

    const getNextDayDate = (dayIndex: number) => {
        // If event, use the specific event date for this class group
        if (isEvent && effectiveEventDate) return effectiveEventDate;

        const today = new Date();
        const currentDay = today.getDay() || 7; // 1-7
        const diff = dayIndex - currentDay + (dayIndex <= currentDay ? 7 : 0); // Always next occurrence
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + diff);
        return nextDate.toISOString().split('T')[0];
    };



    useEffect(() => {
        const check = async () => {
            setIsChecking(true);
            const date = getNextDayDate(dayOfWeek);
            // Verify findAvailableTeachers exists in store, assuming generic store type has it
            if (findAvailableTeachers) {
                const available = await findAvailableTeachers(date, startTime, endTime);
                setAvailableTeachers(available);
            }
            setIsChecking(false);
        };
        const timer = setTimeout(check, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [dayOfWeek, startTime, endTime, findAvailableTeachers, isEvent, school?.eventDate]); // Added deps

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherId) return;

        const newAssignment: TeacherAssignment = {
            id: crypto.randomUUID(),
            schoolId,
            classGroupId,
            teacherId,
            dayOfWeek,
            startTime,
            endTime
        };

        await addAssignment(newAssignment);
        onClose();
        // Reset form
        setTeacherId('');
        // For events, keep the fixed day. For regular, reset to Monday?
        if (!isEvent) setDayOfWeek(1);
        setStartTime('09:00');
        setEndTime('10:00');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Öğretmen Ata">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            Öğretmen
                        </div>
                    </label>
                    <select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    >
                        <option value="">Seçiniz...</option>
                        {teachers.filter(t => t.role === 'teacher').map((t) => {
                            const isAvailable = availableTeachers.some(at => at.id === t.id);
                            // If we strictly enforce availability:
                            // if (!isAvailable) return null; 
                            // But usually better to show unavailable ones as disabled or marked
                            return (
                                <option key={t.id} value={t.id} disabled={!isAvailable && !isChecking} className={!isAvailable ? 'text-slate-400 bg-slate-100' : ''}>
                                    {t.name} {isChecking ? '(Kontrol ediliyor...)' : !isAvailable ? '(Müsait Değil)' : ''}
                                </option>
                            );
                        })}
                    </select>
                    {isChecking && <p className="text-xs text-blue-500 mt-1">Müsaitlik durumu kontrol ediliyor...</p>}
                </div>

                {!isEvent && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-slate-400" />
                                Gün
                            </div>
                        </label>
                        <select
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        >
                            {DAYS.map((d) => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" />
                                Başlangıç
                            </div>
                        </label>
                        <TimeSelect
                            value={startTime}
                            onChange={(val) => setStartTime(val)}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" />
                                Bitiş
                            </div>
                        </label>
                        <TimeSelect
                            value={endTime}
                            onChange={(val) => setEndTime(val)}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={isChecking}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm disabled:opacity-50"
                    >
                        Ata
                    </button>
                </div>
            </form>
        </Modal>
    );
}
