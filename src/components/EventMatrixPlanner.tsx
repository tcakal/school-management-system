
import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Plus, User, Calendar, Trash2 } from 'lucide-react';
import { AddLessonModal } from './AddLessonModal';
import type { ClassGroup } from '../types';

interface EventMatrixPlannerProps {
    schoolId: string;
    classGroups: ClassGroup[];
    eventDate?: string;
}

export function EventMatrixPlanner({ schoolId, classGroups, eventDate }: EventMatrixPlannerProps) {
    const { lessons, teachers, deleteLesson } = useStore();

    // Matrix Configuration
    // If eventDate is set, use it. Otherwise use today or let user pick? 
    // Plan assumes single-day event for now based on user description ("o tarihe ders ataması").
    // If multiple days, we need a date picker.
    const [selectedDate, setSelectedDate] = useState(eventDate || new Date().toISOString().split('T')[0]);

    // Time Slots (can be dynamic, but fixed for now)
    const timeSlots = Array.from({ length: 12 }, (_, i) => {
        const h = i + 9; // 09:00 to 20:00
        return `${h.toString().padStart(2, '0')}:00`;
    });

    // Modal State
    const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
    const [selectedCtx, setSelectedCtx] = useState<{
        time: string;
        classGroupId: string;
    } | null>(null);

    const handleCellClick = (time: string, classGroupId: string) => {
        setSelectedCtx({ time, classGroupId });
        setIsAddLessonModalOpen(true);
    };

    const handleDeleteLesson = async (e: React.MouseEvent, lessonId: string) => {
        e.stopPropagation();
        if (confirm('Dersi silmek istediğinize emin misiniz?')) {
            await deleteLesson(lessonId);
            useStore.getState().fetchData();
        }
    }

    // Filter logic
    const dayLessons = useMemo(() =>
        lessons.filter(l => l.date === selectedDate && (l.schoolId === schoolId || l.customLocation === 'event')), // Check both just in case
        [lessons, selectedDate, schoolId]
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header / Controls */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Calendar size={20} className="text-purple-600" />
                        <span>Planlama Tarihi:</span>
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 font-medium"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 italic">
                        *Hücrelere tıklayarak ders/etkinlik ekleyebilirsiniz.
                    </span>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-4 border-b border-r border-slate-200 bg-slate-50 w-24 text-center font-bold text-slate-600">
                                Saat
                            </th>
                            {classGroups.map(group => (
                                <th key={group.id} className="p-4 border-b border-r border-slate-200 bg-slate-50 text-left font-bold text-slate-800 min-w-[200px]">
                                    {group.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(time => (
                            <tr key={time} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 border-b border-r border-slate-200 text-center font-medium text-slate-500 bg-slate-50/30">
                                    {time}
                                </td>
                                {classGroups.map(group => {
                                    const timeH = parseInt(time.split(':')[0]);
                                    const timeM = parseInt(time.split(':')[1]);
                                    const slotStartMin = timeH * 60 + timeM;
                                    const slotEndMin = slotStartMin + 60; // 1 hour slots

                                    // Find lesson for this cell (overlapping)
                                    const cellLesson = dayLessons.find(l => {
                                        if (l.classGroupId !== group.id) return false;
                                        const lStartH = parseInt(l.startTime.split(':')[0]);
                                        const lStartM = parseInt(l.startTime.split(':')[1]);
                                        const lEndH = parseInt(l.endTime.split(':')[0]);
                                        const lEndM = parseInt(l.endTime.split(':')[1]);

                                        const lStartMin = lStartH * 60 + lStartM;
                                        const lEndMin = lEndH * 60 + lEndM;

                                        return lStartMin < slotEndMin && lEndMin > slotStartMin;
                                    });

                                    const teacher = teachers.find(t => t.id === cellLesson?.teacherId);

                                    // Calc continuation for styling
                                    let continuesUp = false;
                                    let continuesDown = false;
                                    let isStartBlock = true;

                                    if (cellLesson) {
                                        const lStartMin = parseInt(cellLesson.startTime.split(':')[0]) * 60 + parseInt(cellLesson.startTime.split(':')[1]);
                                        const lEndMin = parseInt(cellLesson.endTime.split(':')[0]) * 60 + parseInt(cellLesson.endTime.split(':')[1]);

                                        continuesUp = lStartMin < slotStartMin;
                                        continuesDown = lEndMin > slotEndMin;
                                        isStartBlock = !continuesUp; // Only show details on the first block
                                    }

                                    return (
                                        <td
                                            key={`${time}-${group.id}`}
                                            onClick={() => handleCellClick(time, group.id)}
                                            className="p-2 border-b border-r border-slate-200 cursor-pointer relative align-top h-24"
                                        >
                                            <div className="w-full h-full min-h-[80px] transition-all hover:ring-2 hover:ring-purple-400 flex flex-col justify-center items-center text-center gap-1 group/cell">
                                                {cellLesson ? (
                                                    <div className={`w-full h-full p-2 text-left flex flex-col gap-1 shadow-sm border relative 
                                                        ${cellLesson.status === 'cancelled' ? 'bg-red-50 border-red-200 opacity-60' : 'bg-purple-100 border-purple-200'}
                                                        ${continuesUp ? 'rounded-t-none border-t-0' : 'rounded-t-lg'}
                                                        ${continuesDown ? 'rounded-b-none border-b-0' : 'rounded-b-lg'}
                                                    `}>
                                                        {isStartBlock ? (
                                                            <>
                                                                <div className="font-bold text-purple-900 text-sm line-clamp-1">
                                                                    {cellLesson.topic || 'Etkinlik'}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-purple-700 font-medium">
                                                                    <User size={12} />
                                                                    {teacher?.name || 'Öğretmen Yok'}
                                                                </div>
                                                                {cellLesson.notes && (
                                                                    <div className="text-[10px] text-purple-600 italic line-clamp-2 mt-1 border-t border-purple-200/50 pt-1">
                                                                        {cellLesson.notes}
                                                                    </div>
                                                                )}

                                                                {/* Actions only on start block or if it's big enough? Let's keep on start block */}
                                                                <button
                                                                    onClick={(e) => handleDeleteLesson(e, cellLesson.id)}
                                                                    className="absolute top-1 right-1 p-1 text-purple-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover/cell:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            // Continuation block content
                                                            <div className="h-full flex items-center justify-center opacity-30">
                                                                <div className="w-1 h-4 bg-purple-300 rounded-full"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="opacity-0 group-hover:opacity-100 group-hover:bg-slate-100 text-slate-400 font-medium text-sm w-full h-full flex items-center justify-center rounded-lg border border-dashed border-transparent group-hover:border-slate-300">
                                                        <Plus size={16} /> Ekle
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Shared Modal for Adding */}
            {selectedCtx && (
                <AddLessonModal
                    isOpen={isAddLessonModalOpen}
                    onClose={() => setIsAddLessonModalOpen(false)}
                    initialSchoolId={schoolId}
                    initialDate={selectedDate}
                    initialStartTime={selectedCtx.time}
                    initialClassGroupId={selectedCtx.classGroupId}
                />
            )}
        </div>
    );
}
