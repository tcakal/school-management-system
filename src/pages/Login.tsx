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
            navigate('/');
        } else {
            setError(true);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Giriş Yap</h1>
                    <p className="text-slate-500 mt-2">Hesabınıza erişmek için bilgilerinizi giriniz.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon Numarası</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="tel"
                                required
                                autoFocus
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    setError(false);
                                }}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="5XX XXX XX XX"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(false);
                                }}
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all ${error ? 'border-red-300 ring-2 ring-red-100 placeholder-red-300' : 'border-slate-300 focus:ring-blue-500'
                                    }`}
                                placeholder="••••••••"
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm mt-2 animate-in slide-in-from-left-2">
                                Hatalı telefon veya şifre.
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group mt-4"
                    >
                        Giriş Yap
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-xs text-slate-400">
                            Demo Admin: 5364606500 / Atolye8008.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
