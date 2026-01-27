
import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Plus, User, Calendar, Trash2, Clock } from 'lucide-react';
import { AddLessonModal } from './AddLessonModal';
import type { ClassGroup } from '../types';

interface EventMatrixPlannerProps {
    schoolId: string;
    classGroups: ClassGroup[];
    eventDate?: string;
    eventDates?: string[];
}

export function EventMatrixPlanner({ schoolId, classGroups, eventDate, eventDates }: EventMatrixPlannerProps) {
    const { lessons, teachers, deleteLesson } = useStore();

    // Determine initial date: try eventDates[0], then eventDate, then today
    const initialDate = (eventDates && eventDates.length > 0) ? eventDates[0] : (eventDate || new Date().toISOString().split('T')[0]);
    const [selectedDate, setSelectedDate] = useState(initialDate);

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
                    {eventDates && eventDates.length > 0 ? (
                        <div className="flex gap-2">
                            {eventDates.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setSelectedDate(d)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedDate === d
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 font-medium"
                        />
                    )}
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

                                    // Find lesson that STARTS in this time slot's hour
                                    // Each lesson should only appear once - at its start hour
                                    const cellLesson = dayLessons.find(l => {
                                        if (l.classGroupId !== group.id) return false;
                                        const lStartH = parseInt(l.startTime.split(':')[0]);
                                        // Only show lesson in the row where its start hour matches
                                        return lStartH === timeH;
                                    });

                                    const teacher = teachers.find(t => t.id === cellLesson?.teacherId);

                                    // Calc continuation for styling
                                    let continuesUp = false;
                                    let continuesDown = false;
                                    let isStartBlock = true;

                                    // Break Time variables
                                    let gapAfter = 0;

                                    if (cellLesson) {
                                        const lStartMin = parseInt(cellLesson.startTime.split(':')[0]) * 60 + parseInt(cellLesson.startTime.split(':')[1]);
                                        const lEndMin = parseInt(cellLesson.endTime.split(':')[0]) * 60 + parseInt(cellLesson.endTime.split(':')[1]);

                                        continuesUp = lStartMin < slotStartMin;
                                        continuesDown = lEndMin > slotEndMin;
                                        isStartBlock = !continuesUp; // Only show details on the first block

                                        if (cellLesson.teacherId) {
                                            // Filter lessons for this teacher on this day
                                            const teacherLessons = dayLessons.filter(l => l.teacherId === cellLesson.teacherId)
                                                .sort((a, b) => a.startTime.localeCompare(b.startTime));

                                            const currentIndex = teacherLessons.findIndex(l => l.id === cellLesson.id);

                                            // Check Next Lesson Gap
                                            if (currentIndex < teacherLessons.length - 1) {
                                                const next = teacherLessons[currentIndex + 1];
                                                const nextStart = parseInt(next.startTime.split(':')[0]) * 60 + parseInt(next.startTime.split(':')[1]);
                                                const currEnd = parseInt(cellLesson.endTime.split(':')[0]) * 60 + parseInt(cellLesson.endTime.split(':')[1]);
                                                gapAfter = nextStart - currEnd;
                                            }
                                        }
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
                                                                {/* Time Range */}
                                                                <div className="flex items-center gap-1 text-[10px] font-mono text-purple-600/80 mb-0.5">
                                                                    <Clock size={10} />
                                                                    {cellLesson.startTime} - {cellLesson.endTime}
                                                                </div>

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

                                                                {/* Actions */}
                                                                <button
                                                                    onClick={(e) => handleDeleteLesson(e, cellLesson.id)}
                                                                    className="absolute top-1 right-1 p-1 text-purple-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover/cell:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            // Continuation block content
                                                            <div className="flex-1 flex items-center justify-center opacity-30 py-1">
                                                                <div className="w-1 h-full bg-purple-300 rounded-full"></div>
                                                            </div>
                                                        )}

                                                        {/* Break After Indicator - Only on LAST block */}
                                                        {(!continuesDown && gapAfter > 0) && (
                                                            <div className="mt-auto pt-2 w-full">
                                                                <div className="w-full bg-blue-100 border border-blue-200 rounded flex items-center justify-center gap-1.5 py-0.5 text-[10px] text-blue-700 font-bold uppercase shadow-sm" title={`Sonraki derse kadar ${gapAfter} dk boşluk`}>
                                                                    <Clock size={10} className="text-blue-600" />
                                                                    {gapAfter} dk Ara
                                                                </div>
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
