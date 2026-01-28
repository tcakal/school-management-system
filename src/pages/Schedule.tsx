import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Wand2, Phone, Plus } from 'lucide-react';
import { LessonModal } from '../components/LessonModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AddLessonModal } from '../components/AddLessonModal';

import type { Lesson } from '../types';

export function Schedule() {
    const { lessons, classGroups, teachers, schools, generateLessons } = useStore();
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [generationWeeks, setGenerationWeeks] = useState(4);
    const [startDateGen, setStartDateGen] = useState(new Date().toISOString().split('T')[0]);
    const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);

    // Generate Calendar Grid
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const handleGenerate = async () => {
        if (confirm(`⚠️ DİKKAT: ${startDateGen} tarihinden itibaren ${generationWeeks} hafta boyunca ders programı yeniden oluşturulacak.\n\nBu işlem, seçilen tarih sonrasındaki mevcut programlanmış dersleri temizleyip tekrar oluşturur. Devam edilsin mi?`)) {
            await generateLessons(generationWeeks, undefined, startDateGen);
            alert('Takvim başarıyla oluşturuldu.');
            setCurrentDate(new Date(startDateGen)); // Jump to that date
        }
    };

    const handleLessonClick = (lesson: Lesson) => {
        setSelectedLesson(lesson);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Ders Programı</h2>
                    <p className="text-slate-500 mt-1">Haftalık ders takvimi ve yoklama yönetimi.</p>
                </div>
                <div className="flex gap-3">
                    {user?.role === 'admin' && (
                        <div className="flex items-center gap-2 bg-purple-50 p-1 rounded-lg border border-purple-100">
                            <div className="flex flex-col px-2">
                                <span className="text-[10px] text-purple-600 font-bold uppercase">Başlangıç</span>
                                <input
                                    type="date"
                                    value={startDateGen}
                                    onChange={(e) => setStartDateGen(e.target.value)}
                                    className="bg-transparent text-xs font-medium text-purple-900 border-none p-0 focus:ring-0 cursor-pointer w-24"
                                />
                            </div>
                            <div className="w-px h-8 bg-purple-200 mx-1"></div>
                            <select
                                value={generationWeeks}
                                onChange={(e) => setGenerationWeeks(Number(e.target.value))}
                                className="bg-transparent text-sm font-medium text-purple-700 border-none focus:ring-0 cursor-pointer"
                            >
                                <option value={1}>1 Hafta</option>
                                <option value={4}>4 Hafta</option>
                                <option value={8}>8 Hafta</option>
                                <option value={12}>12 Hafta</option>
                                <option value={16}>16 Hafta</option>
                            </select>
                            <button
                                onClick={handleGenerate}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium text-sm transition-colors"
                            >
                                <Wand2 size={16} />
                                Oluştur
                            </button>
                        </div>
                    )}

                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setIsAddLessonModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm transition-colors shadow-sm ml-2"
                        >
                            <Plus size={16} />
                            Ek Ders / Etkinlik Ekle
                        </button>
                    )}




                    <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                        <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 hover:bg-slate-50 rounded-md">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 py-2 font-medium min-w-[150px] text-center">
                            {format(weekStart, 'd MMMM', { locale: tr })} - {format(addDays(weekStart, 6), 'd MMMM', { locale: tr })}
                        </div>
                        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-slate-50 rounded-md">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
                    <div className="p-4 border-r border-slate-200 text-center font-medium text-slate-500">Saat</div>
                    {weekDays.map(day => (
                        <div key={day.toString()} className="p-4 border-r border-slate-200 last:border-r-0 text-center">
                            <div className="font-bold text-slate-900 mb-1">{format(day, 'EEEE', { locale: tr })}</div>
                            <div className="text-sm text-slate-500">{format(day, 'd MMM', { locale: tr })}</div>
                        </div>
                    ))}
                </div>

                <div className="relative">
                    {/* Time Slots - Extended to cover full day */}
                    {Array.from({ length: 15 }, (_, i) => i + 8).map(hour => {
                        const timeLabel = `${hour.toString().padStart(2, '0')}:00`;

                        return (
                            <div key={timeLabel} className="grid grid-cols-8 border-b border-slate-100 min-h-[100px]">
                                <div className="p-4 border-r border-slate-100 text-center text-sm font-medium text-slate-400">
                                    {timeLabel}
                                </div>
                                {weekDays.map(day => {
                                    const dayLessons = lessons.filter(l => {
                                        if (!isSameDay(parseISO(l.date), day)) return false;
                                        const lessonHour = parseInt(l.startTime.split(':')[0]);
                                        if (lessonHour !== hour) return false;

                                        // Manager Filter: Only show lessons for their school
                                        if (user?.role === 'manager') {
                                            const group = classGroups.find(g => g.id === l.classGroupId);
                                            if (group?.schoolId !== user.id) return false;
                                        }

                                        return true;
                                    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

                                    return (
                                        <div key={day.toString()} className="p-2 border-r border-slate-100 relative group">
                                            {dayLessons.map(lesson => {
                                                const group = classGroups.find(g => g.id === lesson.classGroupId);
                                                const teacher = teachers.find(t => t.id === lesson.teacherId);
                                                const school = schools.find(s => s.id === group?.schoolId);

                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={() => handleLessonClick(lesson)}
                                                        className={`w-full text-left p-2 rounded-lg text-xs mb-1 transition-all hover:scale-[1.02] active:scale-95 shadow-sm border ${lesson.status === 'cancelled'
                                                            ? 'bg-red-50 border-red-100 text-red-700 opacity-70 line-through decoration-red-500'
                                                            : school?.type === 'event'
                                                                ? 'bg-purple-100 border-purple-200 text-purple-700 shadow-purple-100' // Event Highlighting
                                                                : lesson.type === 'makeup'
                                                                    ? 'bg-orange-50 border-orange-100 text-orange-700'
                                                                    : 'bg-blue-50 border-blue-100 text-blue-700'
                                                            }`}
                                                    >
                                                        {/* Time Display for Granular Lessons */}
                                                        <div className="flex items-center gap-1 text-[10px] font-mono opacity-70 mb-0.5">
                                                            <span>{lesson.startTime}</span>
                                                            <span>-</span>
                                                            <span>{lesson.endTime}</span>
                                                        </div>

                                                        {school && <div className="text-[9px] text-slate-500 truncate font-semibold uppercase tracking-wider mb-0.5">{school.name}</div>}
                                                        <div className="font-bold truncate">{group?.name}</div>
                                                        <div className="truncate opacity-80">{teacher?.name}</div>

                                                        {lesson.status !== 'cancelled' && (
                                                            <div className="flex justify-end mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                                {user?.role === 'teacher' && user.id !== lesson.teacherId && (
                                                                    <div title="Düzenleme Yetkiniz Yok" className="p-1 rounded-full bg-slate-100 text-slate-500">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                                    </div>
                                                                )}
                                                                <div
                                                                    role="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const msg = `Merhaba, ${lesson.date} saat ${lesson.startTime} dersiniz için hatırlatmadır.`;
                                                                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                                                    }}
                                                                    className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 shadow-sm"
                                                                    title="WhatsApp Hatırlatma Gönder"
                                                                >
                                                                    <Phone size={12} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {lesson.status === 'cancelled' && (
                                                            <div className="text-[10px] mt-1 font-bold">İPTAL EDİLDİ</div>
                                                        )}
                                                        {lesson.topic && (
                                                            <div className="text-[10px] text-slate-500 italic truncate mt-0.5 border-t border-slate-200/50 pt-0.5">
                                                                {lesson.topic}
                                                            </div>
                                                        )}
                                                        {lesson.type === 'makeup' && (
                                                            <div className="text-[10px] mt-1 font-bold">TELAFİ</div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            <ErrorBoundary>
                <LessonModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    lesson={selectedLesson}
                />
            </ErrorBoundary>

            <AddLessonModal
                isOpen={isAddLessonModalOpen}
                onClose={() => setIsAddLessonModalOpen(false)}
            />
        </div>
    );
}
