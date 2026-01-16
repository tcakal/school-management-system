
import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../supabase';
import { Plus, Trash2, RefreshCw, Database, Palette, Phone, Edit2, Copy, ToggleLeft, ToggleRight, PlayCircle, Send, Upload, Loader2 } from 'lucide-react';
import { TelegramService } from '../services/TelegramService';
import { useAuth } from '../store/useAuth';
import type { NotificationTemplate } from '../types';
import { Tabs } from '../components/Tabs';

export function Settings() {
    const { notificationTemplates, schools, addNotificationTemplate, deleteNotificationTemplate, updateNotificationTemplate } = useStore();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('notifications');

    // Notification State
    const [newTemplate, setNewTemplate] = useState<Partial<NotificationTemplate>>({
        triggerType: 'lesson_start',
        offsetMinutes: 0,
        messageTemplate: '',
        targetRoles: ['teacher'], // Default
        isActive: true
    });
    const [selectedSchoolId, setSelectedSchoolId] = useState(schools[0]?.id || '');
    const [editId, setEditId] = useState<string | null>(null);

    // Sync selectedSchoolId when schools load
    useEffect(() => {
        if (!selectedSchoolId && schools.length > 0) {
            setSelectedSchoolId(schools[0].id);
        }
    }, [schools, selectedSchoolId]);

    if (user?.role !== 'admin') {
        return (
            <div className="p-8 text-center bg-white rounded-xl border border-red-200">
                <h3 className="text-red-600 font-bold">Yetkisiz Erişim</h3>
                <p className="text-slate-500">Bu sayfayı görüntüleme yetkiniz yok.</p>
            </div>
        );
    }

    const handleSave = async () => {
        console.log('Saving template for School:', selectedSchoolId);
        if (!selectedSchoolId || !newTemplate.messageTemplate) {
            alert('Lütfen Okul ve Mesaj şablonunu doldurunuz.');
            return;
        }

        if (editId) {
            // Update
            await updateNotificationTemplate(editId, {
                ...newTemplate,
                schoolId: selectedSchoolId, // Allow moving schools? Maybe.
            });
            setEditId(null);
        } else {
            // Create New
            const templateData = {
                id: crypto.randomUUID(),
                schoolId: selectedSchoolId,
                classGroupId: newTemplate.classGroupId,
                triggerType: newTemplate.triggerType as any,
                messageTemplate: newTemplate.messageTemplate || '',
                offsetMinutes: newTemplate.offsetMinutes || 0,
                triggerTime: newTemplate.triggerTime,
                daysFilter: newTemplate.daysFilter,
                targetRoles: newTemplate.targetRoles,
                isActive: newTemplate.isActive ?? true
            };
            console.log('Template Data:', templateData);
            await addNotificationTemplate(templateData);
        }

        // Reset Form
        setNewTemplate({
            triggerType: 'lesson_start',
            offsetMinutes: 0,
            messageTemplate: '',
            targetRoles: ['teacher'],
            isActive: true
        });
    };

    const loadExample = (type: string) => {
        if (type === 'lesson_reminder') {
            setNewTemplate({
                triggerType: 'lesson_start',
                offsetMinutes: -30, // 30 mins before
                targetRoles: ['student', 'teacher'],
                isActive: true,
                messageTemplate: `🔔 Ders Hatırlatması\n\nSayın Velimiz,\n\n{class_name} dersi 30 dakika sonra başlayacaktır.\n\nİyi dersler dileriz.`
            });
        }
        else if (type === 'daily_summary') {
            setNewTemplate({
                triggerType: 'last_lesson_end',
                offsetMinutes: 60, // 1 hour after last lesson
                targetRoles: ['admin', 'manager'],
                isActive: true,
                messageTemplate: `📊 Gün Sonu Raporu\n\nBugünkü dersler tamamlanmıştır.\nLütfen yoklamaları kontrol ediniz.`
            });
        }
        else if (type === 'teacher_schedule') {
            setNewTemplate({
                triggerType: 'fixed_time',
                triggerTime: '08:00',
                targetRoles: ['teacher'],
                isActive: true,
                messageTemplate: `Günaydın Hocam ☀️\n\nBugünkü ders programınızı kontrol etmeyi unutmayınız.\n\nİyi çalışmalar.`
            });
        }
    };

    const templates = notificationTemplates.filter(t => t.schoolId === selectedSchoolId);
    console.log(`Visible Templates: ${templates.length} / Total: ${notificationTemplates.length}`);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Ayarlar</h2>
                <p className="text-slate-500 mt-1">Sistem yapılandırması ve yönetim araçları.</p>
            </div>

            <Tabs
                tabs={[
                    { id: 'appearance', label: 'Görünüm', icon: Palette },
                    { id: 'notifications', label: 'Bildirim Şablonları' },
                    { id: 'telegram', label: 'Telegram & İletişim', icon: Phone },
                    { id: 'data', label: 'Veri Yönetimi', icon: Database }
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {activeTab === 'notifications' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Bildirim Şablonları</h3>

                    <div className="mb-6 flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Okul Seçin</label>
                            <select
                                value={selectedSchoolId}
                                onChange={e => setSelectedSchoolId(e.target.value)}
                                className="p-2 border border-slate-300 rounded-lg text-sm w-full bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* List */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-slate-900">Mevcut Şablonlar</h4>
                            {templates.length === 0 && <p className="text-sm text-slate-400">Tanımlı şablon yok.</p>}
                            {templates.map(t => (
                                <div key={t.id} className={`p-3 border rounded-lg flex flex-col gap-2 transition-colors ${t.isActive === false ? 'bg-slate-100 border-slate-200 opacity-75' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${t.isActive === false ? 'bg-slate-400' : 'bg-green-500'}`} />
                                                <div className="text-xs font-bold text-blue-600 uppercase">
                                                    {t.triggerType === 'fixed_time' ? `Saat: ${t.triggerTime}` :
                                                        t.triggerType === 'last_lesson_end' ? 'Son Ders Bitimi' :
                                                            t.triggerType === 'lesson_start' ? 'Ders Başlangıcı' :
                                                                t.triggerType === 'lesson_end' ? 'Ders Bitişi' :
                                                                    'Zaman Ayarlı'}
                                                    {t.triggerType !== 'fixed_time' && ` (${t.offsetMinutes} dk)`}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {t.classGroupId
                                                    ? `Özel: ${useStore.getState().classGroups.find(c => c.id === t.classGroupId)?.name}`
                                                    : 'Genel (Tüm Sınıflar)'
                                                }
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {/* Toggle Active */}
                                            <button
                                                onClick={() => updateNotificationTemplate(t.id, { isActive: !t.isActive })}
                                                className={`p-1 rounded hover:bg-slate-200 ${t.isActive === false ? 'text-slate-400' : 'text-green-600'}`}
                                                title={t.isActive === false ? "Aktifleştir" : "Pasifleştir"}
                                            >
                                                {t.isActive === false ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
                                            </button>

                                            {/* Edit */}
                                            <button
                                                onClick={() => {
                                                    setEditId(t.id);
                                                    setNewTemplate({
                                                        triggerType: t.triggerType,
                                                        messageTemplate: t.messageTemplate,
                                                        offsetMinutes: t.offsetMinutes,
                                                        triggerTime: t.triggerTime,
                                                        daysFilter: t.daysFilter,
                                                        targetRoles: t.targetRoles,
                                                        classGroupId: t.classGroupId,
                                                        isActive: t.isActive
                                                    });
                                                }}
                                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="Düzenle"
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            {/* Clone */}
                                            <button
                                                onClick={() => {
                                                    setEditId(null); // Ensure creation mode
                                                    setNewTemplate({
                                                        triggerType: t.triggerType,
                                                        messageTemplate: t.messageTemplate,
                                                        offsetMinutes: t.offsetMinutes,
                                                        triggerTime: t.triggerTime,
                                                        daysFilter: t.daysFilter,
                                                        targetRoles: t.targetRoles,
                                                        classGroupId: t.classGroupId,
                                                        isActive: true
                                                    });
                                                }}
                                                className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                                title="Kopyasını Oluştur"
                                            >
                                                <Copy size={16} />
                                            </button>

                                            {/* Test Send */}
                                            <button
                                                onClick={async () => {
                                                    let targetChatId = user?.telegramChatId;
                                                    if (!targetChatId && user?.role === 'admin' && user?.id === 'super-admin') {
                                                        targetChatId = useStore.getState().systemSettings?.adminChatId;
                                                    }

                                                    if (!targetChatId) {
                                                        alert('Telegram Chat ID\'niz bulunamadı. Lütfen önce kendi profilinize Telegram bağlayın.');
                                                        return;
                                                    }

                                                    if (!confirm('Bu şablonu test etmek için kendinize bir mesaj göndermek istiyor musunuz?')) return;

                                                    // Replace variables with dummy data for test
                                                    const testMessage = t.messageTemplate
                                                        .replace('{class_name}', 'TEST GRUBU')
                                                        .replace('{start_time}', '12:00');

                                                    const res = await TelegramService.sendMessage(
                                                        targetChatId,
                                                        `[TEST MESAJI]\n\n${testMessage}`
                                                    );

                                                    if (res.success) alert('Test mesajı başarıyla gönderildi!');
                                                    else alert('Mesaj gönderilemedi. Bot Token veya Chat ID hatalı olabilir.');
                                                }}
                                                className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                title="Test Mesajı Gönder"
                                            >
                                                <Send size={16} />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => deleteNotificationTemplate(t.id)}
                                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-1 flex-wrap">
                                        {t.targetRoles && t.targetRoles.map(role => (
                                            <span key={role} className={`text-[10px] px-1 rounded border ${role === 'student' ? 'bg-green-50 text-green-700 border-green-200' :
                                                role === 'teacher' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}>
                                                {role === 'student' ? 'Veli/Öğrenci' : role === 'teacher' ? 'Öğretmen' : role === 'manager' ? 'Yönetici' : 'Admin'}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-700 line-clamp-2">{t.messageTemplate}</p>
                                </div>
                            ))}
                        </div>

                        {/* Add/Edit Form */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-fit sticky top-4">
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
                                {editId ? 'Şablonu Düzenle' : 'Yeni Şablon Ekle'}
                                {editId && (
                                    <button
                                        onClick={() => {
                                            setEditId(null);
                                            setNewTemplate({ triggerType: 'lesson_start', offsetMinutes: 0, messageTemplate: '', targetRoles: ['teacher'], isActive: true });
                                        }}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        İptal
                                    </button>
                                )}
                            </h4>

                            {!editId && (
                                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                                    <button onClick={() => loadExample('lesson_reminder')} className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs hover:border-blue-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                        <PlayCircle size={12} /> Ders Hatırlatması
                                    </button>
                                    <button onClick={() => loadExample('teacher_schedule')} className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs hover:border-purple-400 hover:text-purple-600 flex items-center gap-1 transition-colors">
                                        <PlayCircle size={12} /> Hoca Programı
                                    </button>
                                    <button onClick={() => loadExample('daily_summary')} className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs hover:border-orange-400 hover:text-orange-600 flex items-center gap-1 transition-colors">
                                        <PlayCircle size={12} /> Yönetici Raporu
                                    </button>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Durum</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setNewTemplate(prev => ({ ...prev, isActive: !prev.isActive }))}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${newTemplate.isActive !== false
                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                : 'bg-slate-100 border-slate-200 text-slate-500'
                                                }`}
                                        >
                                            {newTemplate.isActive !== false ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                            <span className="text-xs font-bold">{newTemplate.isActive !== false ? 'AKTİF' : 'PASİF'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Özel Grup (Opsiyonel)</label>
                                    <select
                                        className="w-full text-sm border-slate-300 rounded-md bg-white text-slate-900"
                                        value={newTemplate.classGroupId || ''}
                                        onChange={e => setNewTemplate(prev => ({ ...prev, classGroupId: e.target.value || undefined }))}
                                    >
                                        <option value="">Tüm Sınıflar</option>
                                        {useStore.getState().classGroups
                                            .filter(c => c.schoolId === selectedSchoolId)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Tetikleyici Zamanı</label>
                                    <select
                                        className="w-full text-sm border-slate-300 rounded-md bg-white text-slate-900"
                                        value={newTemplate.triggerType}
                                        onChange={e => {
                                            const type = e.target.value as any;
                                            setNewTemplate(prev => ({
                                                ...prev,
                                                triggerType: type,
                                                offsetMinutes: type === '15_min_before' ? -15 : 0
                                            }));
                                        }}
                                    >
                                        <option value="lesson_start">Tam Ders Başlangıcında (0 dk)</option>
                                        <option value="lesson_end">Tam Ders Bitişinde (0 dk)</option>
                                        <option value="15_min_before">Zaman Ayarlı (Örn: 15dk Önce)</option>
                                        <option value="last_lesson_end">Günün Son Dersi Bitişinde</option>
                                        <option value="fixed_time">Sabit Saatte (Örn: 18:00)</option>
                                    </select>
                                </div>

                                {/* Dynamic Offset UI */}
                                {(newTemplate.triggerType === '15_min_before' || newTemplate.triggerType === 'last_lesson_end' || newTemplate.triggerType === 'lesson_start' || newTemplate.triggerType === 'lesson_end') && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Zaman Farkı (Dakika)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-full text-sm border-slate-300 rounded-md bg-white text-slate-900"
                                                value={newTemplate.offsetMinutes}
                                                onChange={e => setNewTemplate(prev => ({ ...prev, offsetMinutes: Number(e.target.value) }))}
                                                placeholder="0"
                                            />
                                            <span className="text-xs text-slate-400 whitespace-nowrap">dk</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Negatif: Öncesi, Pozitif: Sonrası.
                                        </p>
                                    </div>
                                )}

                                {/* Fixed Time Input */}
                                {newTemplate.triggerType === 'fixed_time' && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Saat Seçin (24 Saat)</label>
                                        <div className="flex gap-2">
                                            {/* Hours */}
                                            <select
                                                className="w-20 p-2 border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newTemplate.triggerTime?.split(':')[0] || '09'}
                                                onChange={e => {
                                                    const currentMin = newTemplate.triggerTime?.split(':')[1] || '00';
                                                    setNewTemplate({ ...newTemplate, triggerTime: `${e.target.value}:${currentMin}` });
                                                }}
                                            >
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <option key={i} value={i.toString().padStart(2, '0')}>
                                                        {i.toString().padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>
                                            <span className="self-center text-slate-400">:</span>
                                            {/* Minutes */}
                                            <select
                                                className="w-20 p-2 border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newTemplate.triggerTime?.split(':')[1] || '00'}
                                                onChange={e => {
                                                    const currentHour = newTemplate.triggerTime?.split(':')[0] || '09';
                                                    setNewTemplate({ ...newTemplate, triggerTime: `${currentHour}:${e.target.value}` });
                                                }}
                                            >
                                                {Array.from({ length: 60 }).map((_, i) => (
                                                    <option key={i} value={i.toString().padStart(2, '0')}>
                                                        {i.toString().padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Days Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-2">Gün Filtresi (Opsiyonel)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day, idx) => {
                                            const isSelected = !newTemplate.daysFilter || newTemplate.daysFilter.includes(idx);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        const current = newTemplate.daysFilter || [0, 1, 2, 3, 4, 5, 6];
                                                        let next;
                                                        if (current.includes(idx)) {
                                                            next = current.filter(d => d !== idx);
                                                        } else {
                                                            next = [...current, idx];
                                                        }
                                                        setNewTemplate(prev => ({ ...prev, daysFilter: next }));
                                                    }}
                                                    className={`px-2 py-1 text-xs rounded border ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-500'}`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Seçili günlerde çalışır.</p>
                                </div>

                                {/* Target Roles Selection */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-2">Hedef Kitle</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'student', label: 'Veli/Öğrenci' },
                                            { id: 'teacher', label: 'Öğretmen' },
                                            { id: 'manager', label: 'Yönetici' },
                                            { id: 'admin', label: 'Admin (Ben)' }
                                        ].map((role) => {
                                            const isSelected = newTemplate.targetRoles?.includes(role.id as any);
                                            return (
                                                <button
                                                    key={role.id}
                                                    onClick={() => {
                                                        const current = newTemplate.targetRoles || [];
                                                        let next;
                                                        if (current.includes(role.id as any)) {
                                                            next = current.filter(r => r !== role.id);
                                                        } else {
                                                            next = [...current, role.id];
                                                        }
                                                        setNewTemplate(prev => ({ ...prev, targetRoles: next as any }));
                                                    }}
                                                    className={`px-2 py-1 text-xs rounded border transition-colors ${isSelected
                                                        ? 'bg-slate-800 border-slate-700 text-white font-medium'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {isSelected ? '✓ ' : ''}{role.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Mesaj otomatik olarak kimlere gidecek?</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Mesaj Metni</label>
                                    <textarea
                                        className="w-full text-sm border-slate-300 rounded-md bg-white text-slate-900"
                                        rows={3}
                                        value={newTemplate.messageTemplate}
                                        onChange={e => setNewTemplate(prev => ({ ...prev, messageTemplate: e.target.value }))}
                                        placeholder="Merhaba {class_name}, dersiniz {start_time} saatinde..."
                                    />
                                    <div className="text-[10px] text-slate-400 mt-1">
                                        Değişkenler: {'{class_name}'}, {'{start_time}'}
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        await handleSave();
                                        alert(editId ? 'Şablon güncellendi!' : 'Şablon başarıyla kaydedildi!');
                                    }}
                                    className={`w-full py-2 rounded-md text-sm font-medium flex justify-center items-center gap-2 ${editId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                                        }`}
                                >
                                    {editId ? <Edit2 size={16} /> : <Plus size={16} />}
                                    {editId ? 'Değişiklikleri Kaydet' : 'Şablonu Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-6">
                        <h4 className="font-bold text-slate-900 mb-2">Sistem Logları</h4>
                        <DebugLogs />
                    </div>
                </div>
            )}

            {activeTab === 'data' && (
                <div className="space-y-6">
                    {/* Regenerate Schedule */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Ders Programı Onarımı</h3>
                                <p className="text-sm text-slate-500">Mevcut öğretmen atamalarına göre ders takvimini yeniden oluşturur.</p>
                            </div>
                            <RegenerateButton />
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                            <strong>Ne zaman kullanılır?</strong> Eğer takvimde dersler görünmüyorsa veya hatalı görünüyorsa bu işlemi çalıştırın.
                            Gelecek 4 haftanın ders programını mevcut atamalara (gün/saat) göre sıfırdan hesaplar.
                            Geçmiş derslere veya "Ders Yapıldı" olarak işaretlenmiş derslere dokunmaz.
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'appearance' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Marka ve Logo</h3>
                        <SettingsForm />
                    </div>
                </div>
            )}

            {activeTab === 'telegram' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Telegram Entegrasyonu</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Sistemin otomatik mesaj gönderebilmesi için Telegram Bot kurulumu yapılması gerekir.
                            Bu işlem sadece 1 kere yapılır.
                        </p>
                        <TelegramSettings />
                    </div>
                </div>
            )}

        </div>
    );
}

function SettingsForm() {
    const { systemSettings, updateSystemSettings } = useStore();
    const [name, setName] = useState(systemSettings?.systemName || '');
    const [logo, setLogo] = useState(systemSettings?.logoUrl || '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);


    useEffect(() => {
        if (systemSettings) {
            setName(systemSettings.systemName || '');
            setLogo(systemSettings.logoUrl || '');
        }
    }, [systemSettings]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Lütfen sadece resim dosyası seçiniz.');
            return;
        }

        // Limit size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Dosya boyutu 2MB\'dan küçük olmalıdır.');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('school-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('school-assets')
                .getPublicUrl(filePath);

            setLogo(publicUrl);
        } catch (error: any) {
            console.error('Upload Error:', error);
            alert('Yükleme hatası: ' + error.message);
        } finally {
            setUploading(false);
            // Clear input value
            if (event.target) event.target.value = '';
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSystemSettings({ systemName: name, logoUrl: logo });
            alert('Ayarlar başarıyla kaydedildi!');
        } catch (err: any) {
            console.error(err);
            alert('Kaydetme hatası: ' + (err.message || 'Bilinmeyen hata'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4 max-w-lg">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sistem Başlığı</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Atölye Vizyon"
                />
                <p className="text-xs text-slate-500 mt-1">Sol menüde üst kısımda görünen ana başlık.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            placeholder="https://..."
                            value={logo}
                            onChange={(e) => setLogo(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                        <button
                            type="button"
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-2 transition-colors"
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            <span className="text-sm font-medium">Yükle</span>
                        </button>
                    </div>
                </div>

                {/* Preview */}
                {logo && (
                    <div className="mt-2 p-2 bg-slate-100 rounded border border-slate-200 inline-block">
                        <img src={logo} alt="Logo Önizleme" className="h-12 object-contain" />
                    </div>
                )}

                <p className="text-xs text-slate-500 mt-1">
                    Şeffaf PNG veya SVG formatında bir görsel yükleyiniz veya URL giriniz.
                </p>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
        </div>
    );
}

function RegenerateButton() {
    const [regenerating, setRegenerating] = useState(false);
    const { generateLessons } = useStore();

    const handleRegenerate = async () => {
        if (!confirm('Tüm mevcut atamalara göre gelecek 4 haftalık ders programı yeniden oluşturulacak. Bu işlem biraz zaman alabilir. Devam etmek istiyor musunuz?')) return;

        setRegenerating(true);
        try {
            await generateLessons(); // Parametresiz = Tüm sınıflar
            alert('Ders programı başarıyla güncellendi!');
        } catch (e) {
            console.error(e);
            alert('Bir hata oluştu.');
        } finally {
            setRegenerating(false);
        }
    };

    return (
        <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
        >
            {regenerating ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            {regenerating ? 'Onarılıyor...' : 'Programı Onar / Yenile'}
        </button>
    );
}

function TelegramSettings() {
    const { systemSettings, updateSystemSettings, updateTeacher } = useStore();
    const { user } = useAuth();

    const [botToken, setBotToken] = useState(systemSettings?.telegramBotToken || '');
    const [myChatId, setMyChatId] = useState(user?.telegramChatId || '');

    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        if (systemSettings?.telegramBotToken) setBotToken(systemSettings.telegramBotToken);

        // Auto-fill Chat ID for Super Admin
        if (user?.role === 'admin' && user?.id === 'super-admin' && systemSettings?.adminChatId) {
            setMyChatId(systemSettings.adminChatId);
        }
    }, [systemSettings, user]);

    const handleSaveToken = async () => {
        setSaving(true);
        try {
            await updateSystemSettings({ telegramBotToken: botToken });
            alert('Bot Token kaydedildi!');
        } catch (e: any) {
            console.error(e);
            alert('Hata oluştu: ' + (e.message || 'Bilinmeyen hata'));
        } finally {
            setSaving(false);
        }
    };

    const handleTestMessage = async () => {
        if (!botToken || !myChatId) {
            alert('Lütfen önce Bot Token ve Chat ID giriniz.');
            return;
        }
        setTesting(true);
        const res = await TelegramService.sendMessage(myChatId, "🔔 *Deneme Mesajı* \n\nSistemden başarıyla mesaj alıyorsunuz.");
        setTesting(false);

        if (res.success) {
            alert('Mesaj başarıyla gönderildi! Telegramınızı kontrol edin.');
        } else {
            alert('Mesaj gönderilemedi: ' + res.error);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* 1. Bot Token Configuration */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">1. Bot Tanımlama (Sadece Yönetici)</h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Bot Token</label>
                        <input
                            type="text"
                            className="w-full text-sm border-slate-300 rounded-md p-2 bg-white text-slate-900"
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            value={botToken}
                            onChange={e => setBotToken(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            @BotFather üzerinden aldığınız token.
                        </p>
                    </div>
                    <button
                        onClick={handleSaveToken}
                        disabled={saving}
                        className="bg-slate-900 text-white px-4 py-2 rounded text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                    >
                        {saving ? 'Kaydediliyor...' : 'Tokeni Kaydet'}
                    </button>
                </div>
            </div>

            {/* 2. User Connection */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2">2. Kendi Hesabını Bağla</h4>
                <div className="space-y-3">
                    <p className="text-xs text-blue-800">
                        Bildirimleri alabilmek için Telegram Chat ID'nizi girmeniz gerekir.
                        <br />
                        Botunuzu başlattıktan sonra size ID'nizi söylemesini sağlayabilir veya @userinfobot kullanabilirsiniz.
                    </p>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 text-sm border-blue-200 rounded-md p-2 text-slate-900"
                            placeholder="Örn: 14752899"
                            value={myChatId}
                            onChange={e => setMyChatId(e.target.value)}
                        />
                        <button
                            onClick={handleTestMessage}
                            disabled={testing}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Phone size={14} />
                            {testing ? 'Gönderiliyor...' : 'Test Mesajı Gönder'}
                        </button>

                        <button
                            onClick={async () => {
                                if (!user?.id || !myChatId) return;

                                try {
                                    if (user.role === 'admin' && user.id === 'super-admin') {
                                        await updateSystemSettings({ adminChatId: myChatId });
                                        alert('Chat ID sistem ayarlarına kaydedildi (Super Admin).');
                                    } else {
                                        await updateTeacher(user.id, { telegramChatId: myChatId });
                                        alert('Chat ID profilinize kaydedildi!');
                                    }
                                } catch (error: any) {
                                    console.error('Save error:', error);
                                    alert('Kaydetme başarısız: ' + (error.message || 'Bilinmeyen hata'));
                                }
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded text-xs font-medium hover:bg-green-700 flex items-center gap-2"
                        >
                            <Database size={14} />
                            Kaydet
                        </button>
                    </div>

                    <p className="text-[10px] text-blue-400">
                        * "Kaydet" derseniz bu ID profilinize işlenir ve Admin bildirimlerini alırsınız.
                    </p>
                </div>
            </div>

            {/* Guide Step */}
            <div className="text-sm text-slate-600 space-y-2 border-t pt-4">
                <p><strong>Nasıl Kurulur?</strong></p>
                <ol className="list-decimal pl-4 space-y-1 text-xs">
                    <li>Telegram'da <strong>@BotFather</strong>'ı bulun ve başlatın.</li>
                    <li><code>/newbot</code> komutunu gönderin.</li>
                    <li>Botunuza bir isim (Örn: Okul Bilgilendirme) ve kullanıcı adı (Örn: OkulXBot) verin.</li>
                    <li>Size verilen <strong>HTTP API Token</strong>'ı yukarıdaki 1. alana yapıştırıp kaydedin.</li>
                    <li>Kendi oluşturduğunuz botu Telegram'da aratıp <strong>Başlat (Start)</strong> deyin.</li>
                    <li>ID'nizi öğrenip 2. alanda test edin.</li>
                </ol>
                <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                        Bildirim sisteminin durumunu kontrol etmek için sistem loglarını inceleyebilirsiniz.
                    </p>
                    <DebugLogs />
                </div>
            </div>
        </div>
    );
}

function DebugLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('debug_notification_logs')
                .select('*')
                .order('id', { ascending: false })
                .limit(20);

            if (error) throw error;
            setLogs(data || []);
        } catch (err: any) {
            console.error('Log fetch error:', err);
            // Ignore error if table doesn't exist (user might not have run the SQL yet)
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                <h5 className="font-bold text-xs text-slate-700">Sistem Logları (Son 20)</h5>
                <button
                    onClick={fetchLogs}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Yenile
                </button>
            </div>
            <div className="max-h-60 overflow-y-auto bg-slate-900 text-slate-50 p-2 text-[10px] font-mono">
                {logs.length === 0 ? (
                    <div className="text-slate-500 italic p-2 text-center">
                        Henüz log bulunamadı veya "Yenile" butonuna basınız.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {logs.map(log => (
                            <div key={log.id} className="border-b border-slate-800 pb-1 mb-1 last:border-0">
                                <span className="text-yellow-500">[{new Date(log.log_time).toLocaleTimeString()}]</span>{' '}
                                <span className="text-green-400">{log.message}</span>
                                {log.details && (
                                    <pre className="text-slate-400 mt-0.5 overflow-x-auto">
                                        {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
