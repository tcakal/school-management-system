import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Bell, Phone, X, Send } from 'lucide-react';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import { TelegramService } from '../services/TelegramService';

export const NotificationCenter: React.FC = () => {
    const { lessons, notificationTemplates, classGroups, students, systemSettings, teachers } = useStore();
    const [dueNotifications, setDueNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);

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
                    if (template.isActive === false) return; // Skip inactive
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
                    // allow up to 60 mins late, but don't send early (diff < 0 means target is in future)
                    // limit early send to 2 mins just in case of clock drift
                    if (diff >= -2 && diff <= 60) {
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
                                schoolId: lesson.schoolId,
                                classGroupId: lesson.classGroupId,
                                targetRoles: template.targetRoles || ['student'],
                                lessonTeacherId: lesson.teacherId // Pass teacher info
                            });
                        }
                    }
                });
            });

            // 2. Process "End of Day" / "Fixed Time" Templates (Loop though templates)
            notificationTemplates.forEach(template => {
                if (template.isActive === false) return; // Skip inactive
                // Skip if day filter exists and today is not in it
                if (template.daysFilter && !template.daysFilter.includes(currentDay)) return;

                if (template.triggerType === 'fixed_time' && template.triggerTime) {
                    const [hours, minutes] = template.triggerTime.split(':').map(Number);
                    const targetTime = new Date(now);
                    targetTime.setHours(hours, minutes, 0, 0);

                    const diff = differenceInMinutes(now, targetTime);
                    if (diff >= -2 && diff <= 60) {
                        const id = `fixed-${template.id}-${format(now, 'yyyy-MM-dd')}`;
                        if (!dueNotifications.some(n => n.id === id)) {
                            pending.push({
                                id,
                                title: `Zamanlı Bildirim`,
                                message: template.messageTemplate
                                    .replace('{class_name}', template.classGroupId
                                        ? classGroups.find(c => c.id === template.classGroupId)?.name || 'Sınıf'
                                        : 'Tüm Sınıflar')
                                    .replace('{start_time}', template.triggerTime),
                                targetTime,
                                type: 'fixed_time',
                                schoolId: template.schoolId,
                                classGroupId: template.classGroupId,
                                targetRoles: template.targetRoles || ['student']
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
                    if (diff >= -2 && diff <= 60) {
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
                                schoolId: template.schoolId,
                                classGroupId: template.classGroupId || undefined,
                                targetRoles: template.targetRoles || ['student'],
                                lessonTeacherId: lastLesson.teacherId
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


    // Track sent notifications to prevent duplicates using LocalStorage
    // Key format: "sent_notifications_yyyy-MM-dd" -> JSON array of IDs
    const getSentIds = (): Set<string> => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const key = `sent_notifications_${today}`;
        const stored = localStorage.getItem(key);
        return new Set(stored ? JSON.parse(stored) : []);
    };

    const addSentId = (id: string) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const key = `sent_notifications_${today}`;
        const current = getSentIds();
        current.add(id);
        localStorage.setItem(key, JSON.stringify(Array.from(current)));
    };

    // Auto-send effect
    useEffect(() => {
        const sentIds = getSentIds();
        dueNotifications.forEach(notif => {
            if (!sentIds.has(notif.id)) {
                addSentId(notif.id);
                handleSendTelegram(notif, true); // True = auto send
            }
        });
    }, [dueNotifications]);

    const handleSendTelegram = async (notif: any, isAuto = false) => {
        if (!systemSettings?.telegramBotToken) {
            if (!isAuto) alert('Telegram Bot Token ayarlanmamış! Lütfen ayarlardan kurunuz.');
            return;
        }

        if (!isAuto) setSendingId(notif.id);

        try {
            // Find recipients based on Target Roles
            const recipientChatIds = new Set<string>();
            const roles = notif.targetRoles || ['student'];

            // 1. Students / Parents
            if (roles.includes('student')) {
                const studentRecipients = students.filter(s => {
                    if (s.schoolId !== notif.schoolId) return false;
                    if (notif.classGroupId && s.classGroupId !== notif.classGroupId) return false;
                    return !!s.telegramChatId;
                });
                studentRecipients.forEach(s => recipientChatIds.add(s.telegramChatId!));
            }

            // 2. Teachers
            if (roles.includes('teacher')) {
                // If it's a specific lesson notification, prioritize that lesson's teacher
                if (notif.lessonTeacherId) {
                    const teacher = teachers.find(t => t.id === notif.lessonTeacherId);
                    if (teacher?.telegramChatId) recipientChatIds.add(teacher.telegramChatId);
                }
            }

            // 3. Managers
            // 3. Managers
            /*
            if (roles.includes('manager')) {
                const school = schools.find(s => s.id === notif.schoolId);
                // Also find teachers with manager role in this school
                const managerTeachers = teachers.filter(t => t.role === 'manager' && t.schoolIds.includes(notif.schoolId) && t.telegramChatId);
                managerTeachers.forEach(m => recipientChatIds.add(m.telegramChatId!));

                if (school?.telegramChatId) recipientChatIds.add(school.telegramChatId);
            }
            */

            // 4. Admins
            if (roles.includes('admin')) {
                // Admins get everything regardless of school/class constraints
                const admins = teachers.filter(t => t.role === 'admin' && t.telegramChatId);
                admins.forEach(a => recipientChatIds.add(a.telegramChatId!));

                // Also include Super Admin from System Settings
                if (systemSettings?.adminChatId) {
                    recipientChatIds.add(systemSettings.adminChatId);
                }
            }

            if (recipientChatIds.size === 0) {
                if (!isAuto) {
                    alert('Seçilen hedef kitlede Telegram kullanan kimse bulunamadı.');
                    setSendingId(null);
                }
                return;
            }

            if (!isAuto) {
                if (!confirm(`${recipientChatIds.size} kişiye Telegram mesajı gönderilecek. Onaylıyor musunuz?`)) {
                    setSendingId(null);
                    return;
                }
            }

            console.log(`Sending auto notification to ${recipientChatIds.size} recipients...`);

            let successCount = 0;
            let failCount = 0;

            await Promise.all(Array.from(recipientChatIds).map(async (chatId) => {
                const res = await TelegramService.sendMessage(
                    systemSettings.telegramBotToken!,
                    chatId,
                    notif.message
                );
                if (res.success) successCount++;
                else failCount++;
            }));

            if (!isAuto) {
                alert(`İşlem Tamamlandı!\n\n✅ Başarılı: ${successCount}\n❌ Hatalı: ${failCount}`);
            } else {
                console.log(`Auto-send complete. Success: ${successCount}, Fail: ${failCount}`);
            }

        } catch (error) {
            console.error('Telegram send error:', error);
            if (!isAuto) alert('Toplu gönderim sırasında bir hata oluştu.');
        } finally {
            if (!isAuto) setSendingId(null);
        }
    };

    // Filter out old notifications (older than 1 hour)
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const now = new Date();
            setDueNotifications(prev => prev.filter(n => {
                const diff = differenceInMinutes(now, n.targetTime);
                return diff < 60; // Keep only if less than 60 mins age
            }));
        }, 60000); // Check every minute
        return () => clearInterval(cleanupInterval);
    }, []);

    const handleClearAll = () => {
        setDueNotifications([]);
        setIsOpen(false);
    };

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
                        <div className="flex gap-2">
                            {dueNotifications.length > 0 && (
                                <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">
                                    Temizle
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        </div>
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

                                {systemSettings?.telegramBotToken && (
                                    <button
                                        onClick={() => handleSendTelegram(notif)}
                                        disabled={sendingId === notif.id}
                                        className="w-full py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        {sendingId === notif.id ? (
                                            <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Send className="h-3 w-3" />
                                        )}
                                        {sendingId === notif.id ? 'Gönderiliyor...' : 'Telegram (Otomatik)'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
