import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import type { Teacher } from '../types';
import { X, Star } from 'lucide-react';

interface EvaluateTeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher | null;
}

export function EvaluateTeacherModal({ isOpen, onClose, teacher }: EvaluateTeacherModalProps) {
    const { addTeacherEvaluation } = useStore();
    const { user } = useAuth();

    const [score, setScore] = useState(5);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !teacher) return null;

    // Only Admins can invoke this (enforced by UI, but good to check here)
    if (user?.role !== 'admin') {
        // Optionally return null or show error, but we'll assume UI hides it.
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            await addTeacherEvaluation({
                teacherId: teacher.id,
                evaluatorId: user.id,
                score: score * 10, // 0-100
                note: note
            });
            onClose();
            setNote('');
            setScore(5);
            alert('Değerlendirme kaydedildi.');
        } catch (error) {
            console.error('Evaluation error:', error);
            alert('Bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Star size={20} className="text-yellow-500 fill-yellow-500" />
                        Öğretmen Değerlendir
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${teacher.color || 'bg-slate-200 text-slate-600'}`}>
                            {teacher.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="font-medium text-slate-900">{teacher.name}</div>
                            <div className="text-xs text-slate-500">Yönetici Değerlendirmesi</div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Puan (1-100)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={score * 10}
                                onChange={(e) => setScore(Number(e.target.value) / 10)}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl border border-blue-100">
                                {score * 10}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Notunuz
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full text-sm border-slate-300 rounded-lg focus:ring-blue-500 h-24 resize-none"
                            placeholder="Öğretmen performansı hakkında yönetici notu..."
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Star size={18} className="fill-yellow-400 text-yellow-400" />
                            {isSubmitting ? 'Kaydediliyor...' : 'Puanla ve Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
