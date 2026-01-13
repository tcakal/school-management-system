import { useState } from 'react';
import { useAuth } from '../store/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Phone } from 'lucide-react';

export function Login() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(phone, password);
        if (success) {
            const user = useAuth.getState().user;
            if (user?.role === 'parent') {
                navigate('/parent');
            } else {
                navigate('/');
            }
        } else {
            setError(true);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300 relative z-10">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/logo_v3.png"
                            alt="Logo"
                            className="h-24 object-contain drop-shadow-md"
                            onError={(e) => {
                                // Fallback to icon if image fails
                                e.currentTarget.style.display = 'none';
                                document.getElementById('fallback-icon')?.classList.remove('hidden');
                            }}
                        />
                        <div id="fallback-icon" className="hidden w-20 h-20 bg-slate-700/50 rounded-2xl items-center justify-center text-blue-500">
                            <Lock size={40} />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white">Giriş Yap</h1>
                    <p className="text-slate-400 mt-2">Hesabınıza erişmek için bilgilerinizi giriniz.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Telefon Numarası</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input
                                type="tel"
                                required
                                autoFocus
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    setError(false);
                                }}
                                className="w-full pl-10 pr-4 py-3 !bg-slate-900/50 !border-slate-700 !text-white placeholder:!text-slate-600 rounded-xl outline-none focus:!ring-2 focus:!ring-blue-500 focus:!border-transparent transition-all"
                                placeholder="5554443322"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(false);
                                }}
                                className={`w-full pl-10 pr-4 py-3 !bg-slate-900/50 !text-white placeholder:!text-slate-600 rounded-xl outline-none focus:!ring-2 transition-all ${error ? '!border-red-500/50 !ring-red-500/20' : '!border-slate-700 focus:!ring-blue-500 focus:!border-transparent'
                                    }`}
                                placeholder="••••••••"
                            />
                        </div>
                        {error && (
                            <p className="text-red-400 text-sm mt-2 animate-in slide-in-from-left-2">
                                Hatalı telefon veya şifre.
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group mt-4 shadow-lg shadow-blue-500/20"
                    >
                        Giriş Yap
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                </form>
            </div>
        </div>
    );
}
