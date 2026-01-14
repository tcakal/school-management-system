import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Bell, Phone, X } from 'lucide-react';
import { differenceInMinutes, parseISO, format } from 'date-fns';

export const NotificationCenter: React.FC = () => {
    const { lessons, notificationTemplates, classGroups } = useStore();
    const [dueNotifications, setDueNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkNotifications = () => {
            const now = new Date();
            const currentDay = now.getDay(); // 0=Sun, 6=Sat
            const pending: any[] = [];

            // 1. Process "Lesson-Based" Templates (Loop through lessons)
            lessons.forEach(lesson => {
                if (lesson.status === 'cancelled') return;

                // Parse lesson time
                const lessonStart = parseISO(`${lesson.date}T${lesson.startTime}`);
                const lessonEnd = parseISO(`${lesson.date}T${lesson.endTime}`);

                // Only relevant if lesson is today (roughly check to optimize)
                if (lesson.date !== format(now, 'yyyy-MM-dd')) return;

                notificationTemplates.forEach(template => {
                    if (template.schoolId !== lesson.schoolId) return;
                    if (template.classGroupId && template.classGroupId !== lesson.classGroupId) return;
                    // Skip if day filter exists and today is not in it
                    if (template.daysFilter && !template.daysFilter.includes(currentDay)) return;

                    // Skip non-lesson types here
                    if (['fixed_time', 'last_lesson_end'].includes(template.triggerType)) return;

                    let targetTime: Date;
                    const offset = template.offsetMinutes || 0;

                    if (template.triggerType === 'lesson_start') {
                        targetTime = new Date(lessonStart.getTime() + offset * 60000);
                    } else if (template.triggerType === 'lesson_end') {
                        targetTime = new Date(lessonEnd.getTime() + offset * 60000);
                    } else {
                        // 15_min_before fallback
                        targetTime = new Date(lessonStart.getTime() + offset * 60000);
                    }

                    const diff = differenceInMinutes(now, targetTime);
                    if (Math.abs(diff) <= 2) { // 2 min window
                        const group = classGroups.find(g => g.id === lesson.classGroupId);
                        const id = `${lesson.id}-${template.id}`;
                        if (!dueNotifications.some(n => n.id === id)) {
                            pending.push({
                                id,
                                title: `Ders Bildirimi: ${group?.name}`,
                                message: template.messageTemplate
                                    .replace('{class_name}', group?.name || '')
                                    .replace('{start_time}', lesson.startTime),
                                targetTime,
                                type: template.triggerType,
                                schoolId: lesson.schoolId
                            });
                        }
                    }
                });
            });

            // 2. Process "End of Day" / "Fixed Time" Templates (Loop though templates)
            notificationTemplates.forEach(template => {
                // Skip if day filter exists and today is not in it
                if (template.daysFilter && !template.daysFilter.includes(currentDay)) return;

                if (template.triggerType === 'fixed_time' && template.triggerTime) {
                    const [hours, minutes] = template.triggerTime.split(':').map(Number);
                    const targetTime = new Date(now);
                    targetTime.setHours(hours, minutes, 0, 0);

                    const diff = differenceInMinutes(now, targetTime);
                    if (Math.abs(diff) <= 2) {
                        const id = `fixed-${template.id}-${format(now, 'yyyy-MM-dd')}`;
                        if (!dueNotifications.some(n => n.id === id)) {
                            pending.push({
                                id,
                                title: `Zamanlı Bildirim`,
                                message: template.messageTemplate
                                    .replace('{class_name}', 'Tüm Sınıflar')
                                    .replace('{start_time}', template.triggerTime),
                                targetTime,
                                type: 'fixed_time',
                                schoolId: template.schoolId
                            });
                        }
                    }
                }

                if (template.triggerType === 'last_lesson_end') {
                    // Find last lesson of TODAY for this school (and class if specified)
                    const todayStr = format(now, 'yyyy-MM-dd');
                    const todaysLessons = lessons.filter(l =>
                        l.schoolId === template.schoolId &&
                        l.date === todayStr &&
                        l.status !== 'cancelled' &&
                        (!template.classGroupId || l.classGroupId === template.classGroupId)
                    );

                    if (todaysLessons.length === 0) return;

                    // Sort by end time descending
                    todaysLessons.sort((a, b) => b.endTime.localeCompare(a.endTime));
                    const lastLesson = todaysLessons[0];
                    const lastLessonEnd = parseISO(`${lastLesson.date}T${lastLesson.endTime}`);

                    const offset = template.offsetMinutes || 0;
                    const targetTime = new Date(lastLessonEnd.getTime() + offset * 60000);

                    const diff = differenceInMinutes(now, targetTime);
                    if (Math.abs(diff) <= 2) {
                        const id = `last-${template.id}-${lastLesson.id}`;
                        if (!dueNotifications.some(n => n.id === id)) {
                            pending.push({
                                id,
                                title: `Gün Sonu Bildirimi`,
                                message: template.messageTemplate
                                    .replace('{class_name}', 'Son Ders')
                                    .replace('{start_time}', lastLesson.endTime),
                                targetTime,
                                type: 'last_lesson_end',
                                schoolId: template.schoolId
                            });
                        }
                    }
                }
            });

            if (pending.length > 0) {
                setDueNotifications(prev => {
                    // Merge new pending with existing, avoiding dupes
                    const combined = [...prev];
                    pending.forEach(p => {
                        if (!combined.some(c => c.id === p.id)) combined.push(p);
                    });
                    return combined;
                });
            }
        };

        checkNotifications();
        const interval = setInterval(checkNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [lessons, notificationTemplates, classGroups]);

    // if (dueNotifications.length === 0) return null; // REMOVED: Always show bell

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-full transition-colors ${dueNotifications.length > 0
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200'
                    }`}
                title={dueNotifications.length > 0 ? "Bekleyen Bildirimler" : "Bildirim Yok"}
            >
                <Bell className="h-5 w-5" />
                {dueNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 border-2 border-white rounded-full animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="font-bold text-slate-900 border-b-0">Bekleyenler ({dueNotifications.length})</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {dueNotifications.length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                <p>Şu an bekleyen bildirim yok.</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Ders zamanı yaklaştığında veya ayarlı saatlerde burada görünecektir.
                                </p>
                            </div>
                        )}
                        {dueNotifications.map((notif, idx) => (
                            <div key={idx} className="p-3 border rounded-lg bg-slate-50 flex flex-col gap-2">
                                <div>
                                    <h4 className="font-semibold text-sm">{notif.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {format(notif.targetTime, 'HH:mm')} ({notif.type})
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        window.open(`https://wa.me/?text=${encodeURIComponent(notif.message)}`, '_blank');
                                    }}
                                    className="w-full py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1"
                                >
                                    <Phone className="h-3 w-3" />
                                    WhatsApp İle Gönder
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
