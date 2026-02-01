import { useState } from 'react';
import { Modal } from './Modal';
import { Send } from 'lucide-react';
import type { Teacher } from '../types';

interface MessageModalProps {
    teacher: Teacher;
    onClose: () => void;
    onSend: (message: string) => Promise<{ success: boolean; error?: string }>;
}

export function MessageModal({ teacher, onClose, onSend }: MessageModalProps) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
        if (!message.trim()) return;
        setSending(true);
        setError(null);

        const result = await onSend(message.trim());

        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'Mesaj gönderilemedi.');
            setSending(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`${teacher.name} - Mesaj Gönder`}>
            <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                        <Send size={18} />
                    </div>
                    <div>
                        <p className="text-sm text-blue-800 font-medium">Telegram üzerinden doğrudan mesaj gönderin.</p>
                        <p className="text-xs text-blue-600 mt-0.5">Öğretmen mesajı anlık olarak alacaktır.</p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">Mesajınız</label>
                    <textarea
                        autoFocus
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Örn: Merhaba, bugünkü dersiniz için bir hatırlatmadır..."
                        className="w-full h-32 p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none"
                    />
                </div>

                {error && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !message.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all shadow-md shadow-blue-900/10"
                    >
                        {sending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Mesajı Gönder
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
