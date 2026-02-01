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
    const { user, login, updatePassword } = useAuth(); // Destructure updatePassword
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

        // 1. Handle Password Update (Universal)
        if (password) {
            const success = await updatePassword(password);
            if (!success) {
                alert('Şifre güncellenemedi. Lütfen tekrar deneyin.');
                return;
            }
        }

        // 2. Handle Profile Information Update (Teachers/Admins/Managers only)
        // Parents usually shouldn't edit their main record name/phone here without admin oversight, 
        // or we need a restricted updateStudent method. For now, we limit it.
        if (user.role === 'admin' || user.role === 'teacher' || user.role === 'manager') {
            // Special handling for Super Admin migration logic (legacy)
            if (user.id === 'super-admin') {
                const newId = crypto.randomUUID();
                const newAdmin: Teacher = {
                    id: newId,
                    name: name,
                    phone: phone,
                    email: email,
                    role: 'admin',
                    password: password || 'Atolye8008.',
                    specialties: [],
                    color: 'bg-purple-100',
                    isActive: true
                };

                await addTeacher(newAdmin);
                await login(phone, password || 'Atolye8008.');
                onClose();
                alert('Profiliniz oluşturuldu. Yeni bilgilerinizle giriş yaptınız.');
                return;
            }

            // Normal Teacher Update
            // Check if info actually changed to avoid unnecessary calls
            if (name !== user.name || phone !== (useStore.getState().teachers.find(t => t.id === user.id)?.phone) || email !== user.email) {
                await updateTeacher(user.id, {
                    name,
                    phone,
                    email
                });
            }
        } else if (user.role === 'parent') {
            // Optional: Allow parents to update email if we want
        }

        if (password) {
            alert('Şifreniz güncellendi. Lütfen tekrar giriş yapın.');
            window.location.reload();
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon (Kullanıcı Adı)</label>
                    <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre</label>
                    <input
                        type="text"
                        placeholder="Değiştirmek istemiyorsanız boş bırakın"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-900"
                    />
                    <p className="text-xs text-slate-500 mt-1">Şifrenizi değiştirirseniz tekrar giriş yapmanız gerekecektir.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
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
