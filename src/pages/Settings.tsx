import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useAuth } from '../store/useAuth';
import type { NotificationTemplate } from '../types';
import { Tabs } from '../components/Tabs';

export function Settings() {
    const { notificationTemplates, schools, addNotificationTemplate, deleteNotificationTemplate, deleteOrphanData } = useStore();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('notifications');

    // Notification State
    const [newTemplate, setNewTemplate] = useState<Partial<NotificationTemplate>>({
        triggerType: 'lesson_start',
        offsetMinutes: 0,
        messageTemplate: ''
    });
    const [selectedSchoolId, setSelectedSchoolId] = useState(schools[0]?.id || '');

    // Data Management State
    const [orphanCounts, setOrphanCounts] = useState<{ students: number; payments: number; classes: number } | null>(null);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        if (activeTab === 'data' && !orphanCounts) {
            handleScan();
        }
    }, [activeTab]);

    if (user?.role !== 'admin') {
        return (
            <div className="p-8 text-center bg-white rounded-xl border border-red-200">
                <h3 className="text-red-600 font-bold">Yetkisiz Erişim</h3>
                <p className="text-slate-500">Bu sayfayı görüntüleme yetkiniz yok.</p>
            </div>
        );
    }

    const handleAdd = async () => {
        if (!selectedSchoolId || !newTemplate.messageTemplate) return;

        await addNotificationTemplate({
            id: crypto.randomUUID(),
            schoolId: selectedSchoolId,
            triggerType: newTemplate.triggerType as any,
            messageTemplate: newTemplate.messageTemplate || '',
            offsetMinutes: newTemplate.offsetMinutes || 0,
            triggerTime: newTemplate.triggerTime
        });

        setNewTemplate({
            triggerType: 'lesson_start',
            offsetMinutes: 0,
            messageTemplate: ''
        });
    };

    const handleScan = async () => {
        setScanning(true);
        // Simulate a small delay for better UX
        setTimeout(async () => {
            const result = await deleteOrphanData();
            setOrphanCounts(result);
            setScanning(false);
        }, 500);
    };

    const templates = notificationTemplates.filter(t => t.schoolId === selectedSchoolId);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Ayarlar</h2>
                <p className="text-slate-500 mt-1">Sistem yapılandırması ve yönetim araçları.</p>
            </div>

            <Tabs
                tabs={[
                    { id: 'notifications', label: 'Bildirim Şablonları' },
                    { id: 'data', label: 'Veri Yönetimi' }
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {activeTab === 'notifications' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Bildirim Şablonları</h3>

                    <div className="mb-6 flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Okul Seçin</label>
                            <select
                                value={selectedSchoolId}
                                onChange={e => setSelectedSchoolId(e.target.value)}
                                className="p-2 border border-slate-300 rounded-lg text-sm w-full"
                            >
                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* List */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-slate-900">Mevcut Şablonlar</h4>
                            {templates.length === 0 && <p className="text-sm text-slate-400">Tanımlı şablon yok.</p>}
                            {templates.map(t => (
                                <div key={t.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-start group">
                                    <div>
                                        <div className="text-xs font-bold text-blue-600 uppercase mb-1">
                                            {t.triggerType === 'fixed_time' ? `Saat: ${t.triggerTime}` :
                                                t.triggerType === 'last_lesson_end' ? 'Son Ders Bitimi' :
                                                    t.triggerType === 'lesson_start' ? 'Ders Başlangıcı' :
                                                        t.triggerType === 'lesson_end' ? 'Ders Bitişi' :
                                                            'Zaman Ayarlı'}
                                            {t.triggerType !== 'fixed_time' && ` (${t.offsetMinutes} dk)`}
                                        </div>
                                        <div className="text-xs text-slate-400 mb-1">
                                            {t.classGroupId
                                                ? `Özel: ${useStore.getState().classGroups.find(c => c.id === t.classGroupId)?.name}`
                                                : 'Genel (Tüm Sınıflar)'
                                            }
                                        </div>
                                        {t.daysFilter && (
                                            <div className="flex gap-1 mb-1">
                                                {t.daysFilter.map(d => (
                                                    <span key={d} className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">
                                                        {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d]}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-sm text-slate-700">{t.messageTemplate}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteNotificationTemplate(t.id)}
                                        className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Form */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-fit">
                            <h4 className="font-medium text-slate-900 mb-3">Yeni Şablon Ekle</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Özel Grup (Opsiyonel)</label>
                                    <select
                                        className="w-full text-sm border-slate-300 rounded-md"
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
                                        className="w-full text-sm border-slate-300 rounded-md"
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
                                                className="w-full text-sm border-slate-300 rounded-md"
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
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Saat Seçin (24 Saat ve 15dk aralıklı)</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="w-20 text-sm border-slate-300 rounded-md"
                                                value={newTemplate.triggerTime ? newTemplate.triggerTime.split(':')[0] : '09'}
                                                onChange={e => {
                                                    const currentMinute = newTemplate.triggerTime ? newTemplate.triggerTime.split(':')[1] : '00';
                                                    setNewTemplate(prev => ({ ...prev, triggerTime: `${e.target.value}:${currentMinute}` }));
                                                }}
                                            >
                                                {Array.from({ length: 24 }).map((_, i) => {
                                                    const val = i.toString().padStart(2, '0');
                                                    return <option key={val} value={val}>{val}</option>;
                                                })}
                                            </select>
                                            <span className="self-center font-bold text-slate-400">:</span>
                                            <select
                                                className="w-20 text-sm border-slate-300 rounded-md"
                                                value={newTemplate.triggerTime ? newTemplate.triggerTime.split(':')[1] : '00'}
                                                onChange={e => {
                                                    const currentHour = newTemplate.triggerTime ? newTemplate.triggerTime.split(':')[0] : '09';
                                                    setNewTemplate(prev => ({ ...prev, triggerTime: `${currentHour}:${e.target.value}` }));
                                                }}
                                            >
                                                <option value="00">00</option>
                                                <option value="15">15</option>
                                                <option value="30">30</option>
                                                <option value="45">45</option>
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

                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Mesaj Metni</label>
                                    <textarea
                                        className="w-full text-sm border-slate-300 rounded-md"
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
                                        await handleAdd();
                                        alert('Şablon başarıyla kaydedildi!');
                                    }}
                                    className="w-full bg-slate-900 text-white py-2 rounded-md text-sm font-medium hover:bg-slate-800 flex justify-center items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Şablonu Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'data' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Veri Temizliği</h3>
                                <p className="text-sm text-slate-500">Silinmiş okullardan kalan artık verileri temizler.</p>
                            </div>
                            <button
                                onClick={handleScan}
                                disabled={scanning}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                            >
                                {scanning ? <RefreshCw className="animate-spin" size={18} /> : <Database size={18} />}
                                {scanning ? 'İşleniyor...' : 'Verileri Tara ve Temizle'}
                            </button>
                        </div>

                        {orphanCounts && (
                            <div className={`p-4 rounded-lg border flex items-start gap-3 ${(orphanCounts.students + orphanCounts.payments + orphanCounts.classes) > 0
                                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                }`}>
                                {(orphanCounts.students + orphanCounts.payments + orphanCounts.classes) > 0 ? (
                                    <AlertTriangle className="shrink-0 mt-0.5" />
                                ) : (
                                    <CheckCircle className="shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <h4 className="font-bold mb-1">İşlem Sonucu</h4>
                                    {(orphanCounts.students + orphanCounts.payments + orphanCounts.classes) > 0 ? (
                                        <p className="text-sm">
                                            Temizlik tamamlandı. Toplamda:
                                            <ul className="list-disc ml-5 mt-1">
                                                <li>{orphanCounts.students} öğrenci</li>
                                                <li>{orphanCounts.payments} ödeme kaydı</li>
                                                <li>{orphanCounts.classes} sınıf grubu</li>
                                            </ul>
                                            başarıyla silindi.
                                        </p>
                                    ) : (
                                        <p className="text-sm">Sistemde yetim veri bulunamadı. Veritabanı temiz durumda.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 p-4 bg-slate-50 rounded-lg text-xs text-slate-500">
                            <strong>Bilgi:</strong> Okul silme işlemi sırasında bazen bağlantılı veriler (öğrenciler, ödemeler) tam olarak silinemeyebilir.
                            Bu araç, herhangi bir okula bağlı olmayan bu "hayalet" verileri tespit eder ve kalıcı olarak siler.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
