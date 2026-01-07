import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';
import { Modal } from './Modal';
import type { Teacher } from '../types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, login } = useAuth(); // We might need login to update session user after edit
    const { updateTeacher, addTeacher } = useStore();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setPhone(user.email === 'admin@okul.com' && user.id === 'super-admin' ? '5364606500' : (useStore.getState().teachers.find(t => t.id === user.id)?.phone || ''));
            // Email is stored in user object but phone is primary login
            setEmail(user.email);
            // Password is not stored in user context for security, allow reset
            setPassword('');
        }
    }, [user, isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Special handling for Super Admin migration
        if (user.id === 'super-admin') {
            const newId = crypto.randomUUID();
            const newAdmin: Teacher = {
                id: newId,
                name: name,
                phone: phone,
                email: email,
                role: 'admin',
                password: password || 'Atolye8008.', // Keep old one if not changed? Actually logic implies we want to change it.
                specialties: [],
                color: 'bg-purple-100'
            };

            await addTeacher(newAdmin);

            // Re-login seamlessly
            await login(phone, password || 'Atolye8008.');
            onClose();
            alert('Profiliniz oluşturuldu ve güncellendi. Yeni bilgilerinizle giriş yaptınız.');
            return;
        }

        // Regular Update
        await updateTeacher(user.id, {
            name,
            phone,
            email,
            ...(password ? { password } : {})
        });

        // Trigger re-login or manual state update if needed?
        // Ideally we should update the useAuth user state too if name/email changed
        // For now, simpler to just close. The sidebar updates on refresh or we can force update.
        // Let's re-login to be safe and refresh state
        if (password) {
            alert('Şifreniz güncellendi. Lütfen tekrar giriş yapın.');
            window.location.reload(); // Simple logout/refresh
        } else {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Profil Düzenle">
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon (Kullanıcı Adı)</label>
                    <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre</label>
                    <input
                        type="text"
                        placeholder="Değiştirmek istemiyorsanız boş bırakın"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                    <p className="text-xs text-slate-500 mt-1">Şifrenizi değiştirirseniz tekrar giriş yapmanız gerekecektir.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm"
                    >
                        Değişiklikleri Kaydet
                    </button>
                </div>
            </form>
        </Modal>
    );
}
