import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Modal } from './Modal';
import type { TeacherAssignment } from '../types';
import { Clock, Calendar, User } from 'lucide-react';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    schoolId: string;
    classGroupId: string;
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

const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9; // Start from 09:00
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
}).filter(t => parseInt(t.split(':')[0]) <= 21); // End at 21:00

export function AssignmentModal({ isOpen, onClose, schoolId, classGroupId }: AssignmentModalProps) {
    const { teachers, addAssignment } = useStore();
    const [teacherId, setTeacherId] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(1);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

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
        setDayOfWeek(1);
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
                        {teachers.map((t) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.specialties?.join(', ')})</option>
                        ))}
                    </select>
                </div>

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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" />
                                Başlangıç
                            </div>
                        </label>
                        <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        >
                            {TIME_SLOTS.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" />
                                Bitiş
                            </div>
                        </label>
                        <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        >
                            {TIME_SLOTS.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
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
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm"
                    >
                        Ata
                    </button>
                </div>
            </form>
        </Modal>
    );
}
