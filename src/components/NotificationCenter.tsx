import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Bell, Phone, X, Send } from 'lucide-react';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import { TelegramService } from '../services/TelegramService';

export const NotificationCenter: React.FC = () => {
    const { lessons, notificationTemplates, classGroups, students, systemSettings, teachers, schools, logAction } = useStore();
    const [dueNotifications, setDueNotifications] = useState<any[]>([]);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const [isOpen, setIsOpen] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher' | 'manager' | 'admin'>('all');

    // Auto-Send Tracking (LocalStorage to prevent reprocessing)
    const [autoSentIds, setAutoSentIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('autoSentNotificationIds');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Persist autoSentIds
    useEffect(() => {
        localStorage.setItem('autoSentNotificationIds', JSON.stringify(Array.from(autoSentIds)));
    }, [autoSentIds]);

    // Single Effect to Calculate Notifications
    useEffect(() => {
        const calculateNotifications = () => {
            const now = new Date();
            const currentDay = now.getDay(); // 0=Sun
            const todayStr = format(now, 'yyyy-MM-dd');
            const yesterdayStr = format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd');

            const active: any[] = [];

            // 1. Process "Lesson-Based" Templates
            lessons.forEach(lesson => {
                if (lesson.status === 'cancelled') return;

                // Check Today AND Yesterday (to handle midnight overlap)
                if (lesson.date !== todayStr && lesson.date !== yesterdayStr) return;

                const lessonStart = parseISO(`${lesson.date}T${lesson.startTime}`);
                const lessonEnd = parseISO(`${lesson.date}T${lesson.endTime}`);

                notificationTemplates.forEach(template => {
                    if (template.schoolId !== lesson.schoolId) return;
                    if (template.isActive === false) return;
                    if (template.classGroupId && template.classGroupId !== lesson.classGroupId) return;
                    if (template.daysFilter && !template.daysFilter.includes(new Date(lesson.date).getDay())) return; // Use lesson day, not current day for safety? Or stick to currentDay? Standard is currentDay check? Actually lesson day is better for consistency.

                    if (['fixed_time', 'last_lesson_end'].includes(template.triggerType)) return;

                    let targetTime: Date;
                    const offset = template.offsetMinutes || 0;

                    if (template.triggerType === 'lesson_start') {
                        targetTime = new Date(lessonStart.getTime() + offset * 60000);
                    } else if (template.triggerType === 'lesson_end') {
                        targetTime = new Date(lessonEnd.getTime() + offset * 60000);
                    } else {
                        targetTime = new Date(lessonStart.getTime() + offset * 60000);
                    }

                    const diff = differenceInMinutes(now, targetTime);
                    // Window: -2 mins (future) to 60 mins (past)
                    // diff = now - target. 
                    // If now=10:00, target=10:05. diff = -5. (Too early)
                    // If now=10:02, target=10:00. diff = 2. (Show)
                    // If now=11:00, target=10:00. diff = 60. (Show)
                    // If now=11:01, target=10:00. diff = 61. (Hide)
                    if (diff >= -2 && diff <= 60) {
                        const id = `${lesson.id}-${template.id}`;
                        if (!dismissedIds.has(id)) {
                            const group = classGroups.find(g => g.id === lesson.classGroupId);
                            active.push({
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
                                lessonTeacherId: lesson.teacherId
                            });
                        }
                    }
                });
            });

            // 2. Process "End of Day" / "Fixed Time"
            notificationTemplates.forEach(template => {
                if (template.isActive === false) return;
                // For fixed time, we key off TODAY's date.
                // If it's a fixed time at 23:30, and now is 00:15, "today's" 23:30 hasn't happened. "yesterday's" did.
                // We should check both today instance and yesterday instance?
                // For simplicity, let's stick to Today for fixed times, assuming they don't overlap midnight often.
                // Or checking yesterday is safer. Let's start with just Today for now to avoid complexity, unless needed.

                if (template.daysFilter && !template.daysFilter.includes(currentDay)) return;

                // Fixed Time
                if (template.triggerType === 'fixed_time' && template.triggerTime) {
                    const [hours, minutes] = template.triggerTime.split(':').map(Number);
                    const targetTime = new Date(now);
                    targetTime.setHours(hours, minutes, 0, 0);

                    const diff = differenceInMinutes(now, targetTime);
                    if (diff >= -2 && diff <= 60) {
                        const id = `fixed-${template.id}-${format(now, 'yyyy-MM-dd')}`;
                        if (!dismissedIds.has(id)) {
                            active.push({
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

                // Last Lesson End
                if (template.triggerType === 'last_lesson_end') {
                    // Check logic for Today's lessons
                    const todaysLessons = lessons.filter(l =>
                        l.schoolId === template.schoolId &&
                        l.date === todayStr && // Strict on date for 'End of Day'
                        l.status !== 'cancelled' &&
                        (!template.classGroupId || l.classGroupId === template.classGroupId)
                    );

                    if (todaysLessons.length > 0) {
                        todaysLessons.sort((a, b) => b.endTime.localeCompare(a.endTime));
                        const lastLesson = todaysLessons[0];
                        const lastLessonEnd = parseISO(`${lastLesson.date}T${lastLesson.endTime}`);

                        const offset = template.offsetMinutes || 0;
                        const targetTime = new Date(lastLessonEnd.getTime() + offset * 60000);

                        const diff = differenceInMinutes(now, targetTime);
                        if (diff >= -2 && diff <= 60) {
                            const id = `last-${template.id}-${lastLesson.id}`;
                            if (!dismissedIds.has(id)) {
                                active.push({
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
                }
            });

            // Update State (Replace entire list)
            setDueNotifications(active);

            // AUTO SEND LOGIC REMOVED (Moved to Server-Side pg_cron)
            // active.forEach(notif => {
            //     const diff = differenceInMinutes(now, notif.targetTime);

            //     // Fix: Check strictly that NOW is after TARGET to prevent premature sending (-0 issue)
            //     // And ensure it's not too old (within last 2 mins)
            //     const isTime = now.getTime() >= notif.targetTime.getTime() && diff <= 2;

            //     if (isTime && !autoSentIds.has(notif.id)) {
            //         console.log(`Auto-sending notification: ${notif.title}`);
            //         handleSendTelegram(notif, true); // Send automatically

            //         // Mark as sent immediately
            //         setAutoSentIds(prev => {
            //             const next = new Set(prev);
            //             next.add(notif.id);
            //             return next;
            //         });
            //     }
            // });
        };

        calculateNotifications();
        const interval = setInterval(calculateNotifications, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [lessons, notificationTemplates, classGroups, dismissedIds, autoSentIds]); // Added autoSentIds dep


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
                studentRecipients.forEach(s => recipientChatIds.add(s.telegramChatId!.trim()));
            }

            // 2. Teachers
            if (roles.includes('teacher')) {
                // If it's a specific lesson notification, prioritize that lesson's teacher
                if (notif.lessonTeacherId) {
                    const teacher = teachers.find(t => t.id === notif.lessonTeacherId);
                    if (teacher?.telegramChatId) recipientChatIds.add(teacher.telegramChatId.trim());
                }
            }

            // 3. Managers
            if (roles.includes('manager')) {
                const school = schools.find(s => s.id === notif.schoolId);
                // Send to School Account (Principal)
                if (school?.telegramChatId) {
                    recipientChatIds.add(school.telegramChatId.trim());
                }

                // TODO: If we track which teachers manage which schools, add them here.
                // Currently 'Teacher' object doesn't have schoolIds linkage for managers.
            }

            // 4. Admins
            if (roles.includes('admin')) {
                // Admins get everything regardless of school/class constraints
                const admins = teachers.filter(t => t.role === 'admin' && t.telegramChatId);
                admins.forEach(a => recipientChatIds.add(a.telegramChatId!.trim()));

                // Also include Super Admin from System Settings
                if (systemSettings?.adminChatId) {
                    recipientChatIds.add(systemSettings.adminChatId.trim());
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

            // LOG ACTION TO DB
            if (successCount > 0) {
                logAction(
                    'BILDIRIM_GONDER',
                    `${notif.title} - ${successCount} kişiye gönderildi. (${isAuto ? 'Otomatik' : 'Manuel'})`,
                    'notification',
                    notif.id
                );
            }

            // LOG ACTION TO DB
            if (successCount > 0) {
                logAction(
                    'BILDIRIM_GONDER',
                    `${notif.title} - ${successCount} kişiye gönderildi. (${isAuto ? 'Otomatik' : 'Manuel'})`,
                    'notification',
                    notif.id
                );
            }

        } catch (error) {
            console.error('Telegram send error:', error);
            if (!isAuto) alert('Toplu gönderim sırasında bir hata oluştu.');
        } finally {
            if (!isAuto) setSendingId(null);
        }
    };

    const handleDismiss = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDismissedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        // Optimistically remove from view immediately via state update triggered by useEffect
    };

    const handleClearAll = () => {
        // Mark all current due IDs as dismissed
        const newDismissed = new Set(dismissedIds);
        dueNotifications.forEach(n => newDismissed.add(n.id));
        setDismissedIds(newDismissed);

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
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-[9999] p-4">
                    <div className="flex flex-col mb-4 border-b pb-2 gap-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Bekleyenler ({dueNotifications.length})</h3>
                            <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">
                                Temizle
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                            <button onClick={() => setFilterRole('all')} className={`px-2 py-1 text-[10px] rounded-full border ${filterRole === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>Tümü</button>
                            <button onClick={() => setFilterRole('student')} className={`px-2 py-1 text-[10px] rounded-full border ${filterRole === 'student' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>Veliler</button>
                            <button onClick={() => setFilterRole('teacher')} className={`px-2 py-1 text-[10px] rounded-full border ${filterRole === 'teacher' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-200'}`}>Öğretmenler</button>
                            <button onClick={() => setFilterRole('manager')} className={`px-2 py-1 text-[10px] rounded-full border ${filterRole === 'manager' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-500 border-slate-200'}`}>Müdürler</button>
                            <button onClick={() => setFilterRole('admin')} className={`px-2 py-1 text-[10px] rounded-full border ${filterRole === 'admin' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200'}`}>Admin</button>
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
                        {dueNotifications
                            .filter(n => filterRole === 'all' || n.targetRoles?.includes(filterRole))
                            .map((notif, idx) => (
                                <div key={idx} className="p-3 border rounded-lg bg-slate-50 flex flex-col gap-2 relative group">
                                    <button
                                        onClick={(e) => handleDismiss(notif.id, e)}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Bildirimi Kapat"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div>
                                        <h4 className="font-semibold text-sm pr-6">{notif.title}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {format(notif.targetTime, 'HH:mm')} ({notif.type})
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                window.open(`https://wa.me/?text=${encodeURIComponent(notif.message)}`, '_blank');
                                            }}
                                            className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1"
                                        >
                                            <Phone className="h-3 w-3" />
                                            WP
                                        </button>

                                        {systemSettings?.telegramBotToken && (
                                            <button
                                                onClick={() => handleSendTelegram(notif)}
                                                disabled={sendingId === notif.id}
                                                className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                {sendingId === notif.id ? (
                                                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Send className="h-3 w-3" />
                                                )}
                                                {sendingId === notif.id ? '...' : 'Telegram'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};
