import { useState, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';

export function TelegramOnboardingModal() {
    const { user } = useAuth();
    const { teachers, students, schools } = useStore();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // 1. Check if user is logged in
        if (!user) return;

        // 2. Check LocalStorage preference
        const hidePermanently = localStorage.getItem('hideTelegramOnboarding');
        const hideUntil = localStorage.getItem('snoozeTelegramOnboarding');

        if (hidePermanently === 'true') return;
        if (hideUntil && new Date(hideUntil) > new Date()) return;

        // 3. Check if user already has Telegram connected
        let hasTelegram = false;

        if (user.role === 'teacher' || user.role === 'admin' || user.role === 'manager') {
            const teacherRecord = teachers.find(t => t.id === user.id);
            if (teacherRecord && teacherRecord.telegramChatId) {
                hasTelegram = true;
            } else if (user.role === 'manager') {
                const schoolRecord = schools.find(s => s.id === user.id);
                if (schoolRecord?.telegramChatId) hasTelegram = true;
            } else if (user.role === 'admin') {
                // Also check system settings for Super Admin
                const { systemSettings } = useStore.getState();
                if (systemSettings?.adminChatId) hasTelegram = true;
            }
        } else if (user.role === 'parent' || user.role === 'student') {
            const studentRecord = students.find(s => s.id === user.id);
            if (studentRecord?.telegramChatId) hasTelegram = true;
        }

        // 4. Force show if no telegram and no suppression
        if (!hasTelegram) {
            // Small delay to not overwhelm on initial load
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user, teachers, students, schools]);

    const handleClose = (permanently: boolean) => {
        setIsOpen(false);
        if (permanently) {
            localStorage.setItem('hideTelegramOnboarding', 'true');
        } else {
            // Snooze for 24 hours
            const tomorrow = new Date();
            tomorrow.setHours(tomorrow.getHours() + 24);
            localStorage.setItem('snoozeTelegramOnboarding', tomorrow.toISOString());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative border border-slate-200">
                {/* Decorative Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 pt-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>

                    <button
                        onClick={() => handleClose(false)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4 text-blue-600">
                        <Send size={32} className="-ml-1 mt-1 fill-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Bildirimleri Kaçırmayın!</h2>
                    <p className="text-blue-100 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                        Ders hatırlatmaları, yoklama bildirimleri ve duyurular cebinize gelsin.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="bg-blue-100 text-blue-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm">1</div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Botu Başlatın</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Telegram'da <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">@AtolyeVizyon_Bot</span> kullanıcısını bulun veya "Selam" yazın.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="bg-blue-100 text-blue-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm">2</div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Telefonunuzu Paylaşın</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Sohbet ekranında çıkan <strong>"📱 Telefon Numaramı Paylaş"</strong> butonuna tıklayın.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3 rounded-xl bg-green-50 border border-green-100">
                            <div className="bg-green-100 text-green-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm">3</div>
                            <div>
                                <h4 className="font-bold text-green-800 text-sm">Otomatik Eşleşme</h4>
                                <p className="text-xs text-green-700 mt-1">
                                    Sistem numaranızı tanır ve hesabınızı saniyeler içinde bağlar. Kod girmenize gerek yoktur!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-2">
                        <a
                            href="https://t.me/AtolyeVizyon_Bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform active:scale-95"
                        >
                            <MessageCircle size={18} />
                            Hemen Başla (Telegram'ı Aç)
                        </a>

                        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                            <button onClick={() => handleClose(false)} className="hover:text-slate-600 underline decoration-slate-300 underline-offset-2">
                                Daha Sonra Hatırlat
                            </button>
                            <button onClick={() => handleClose(true)} className="hover:text-red-500">
                                Bir Daha Gösterme
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
