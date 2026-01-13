import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import type { Student } from '../types';
import { X, Star } from 'lucide-react';

interface EvaluateStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
}

export function EvaluateStudentModal({ isOpen, onClose, student }: EvaluateStudentModalProps) {
    const { addStudentEvaluation } = useStore();
    const { user } = useAuth();

    const [score, setScore] = useState(5);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !student) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        console.log('Submitting evaluation for:', { studentId: student.id, evaluatorId: user?.id }); // Debug Log
        try {
            await addStudentEvaluation({
                studentId: student.id,
                teacherId: user.role === 'teacher' ? user.id : null,
                evaluatorId: user.id, // Record who evaluated
                score: score * 10,
                // DB checks 0-100. Let's use 1-10 scale for UI but maybe multiply by 10 for storage if we want percentage? 
                // Or just store 1-10. The DB check is <= 100. Storing 5 means 5/100 or 5 points?
                // Let's assume 0-100 scale for granularity. 1 Star = 20 points?
                // Let's use a 1-10 input and store as is, but maybe the "Score" is 0-100. 
                // User said "Score". Let's use 1-100 slider.
                note: note
            });
            onClose();
            setNote('');
            setScore(5);
            alert('Değerlendirme kaydedildi.');
        } catch (error: any) {
            console.error('Evaluation error details:', {
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code
            });
            alert(`Bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Öğrenci Değerlendir</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                            {student.name.substring(0, 1)}
                        </div>
                        <div>
                            <div className="font-medium text-slate-900">{student.name}</div>
                            <div className="text-xs text-slate-500">Performans Değerlendirmesi</div>
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
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Geliştirilmeli (0)</span>
                            <span>Mükemmel (100)</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Öğretmen Notu
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full text-sm border-slate-300 rounded-lg focus:ring-blue-500 h-24 resize-none"
                            placeholder="Öğrencinin gelişimi ve derse katılımı hakkında notlarınız..."
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Star size={18} className="fill-blue-400 text-blue-100" />
                            {isSubmitting ? 'Kaydediliyor...' : 'Puanla ve Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
