import { useState } from 'react';
import { Book, Users, School, FileText, CheckSquare, Upload, Shield, LogOut, Star, Play, X, MessageCircle, Send, Banknote, Calendar } from 'lucide-react';
import { useAuth } from '../store/useAuth';

// Video Imports
// Note: In Vite/React, we can reference public assets directly by string path in img src
// or import them if we want to ensure they exist.
// For simplicity in this project's structure, we'll use direct paths but I'll add a comment.


export function Guide() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'teacher' | 'manager' | 'admin' | 'parent' | 'event'>(
        user?.role === 'manager' ? 'manager' : (user?.role === 'teacher' ? 'teacher' : 'general')
    );
    const [selectedVideo, setSelectedVideo] = useState<{ src: string; title: string } | null>(null);

    const tabs = [
        { id: 'general', label: 'Genel Bakış', icon: <Book size={18} /> },
        { id: 'manager', label: 'Şube Yöneticileri', icon: <School size={18} /> },
        { id: 'teacher', label: 'Öğretmenler İçin', icon: <Users size={18} /> },
        { id: 'event', label: 'Etkinlik Yönetimi', icon: <Star size={18} /> },
        { id: 'parent', label: 'Veliler İçin', icon: <Shield size={18} /> },
        { id: 'admin', label: 'Yöneticiler', icon: <Shield size={18} /> },
    ];

    // Filter tabs based on role if needed, or keep all visible for transparency
    // For now, let's keep all visible so everyone knows how the system works

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                    <Book size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Kullanım Kılavuzu & Yardım Merkezi</h1>
                    <p className="text-slate-500 text-sm">Sistemi nasıl kullanacağınıza dair detaylı rehber.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">

                {/* GENERAL SECTION */}
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Book size={22} className="text-blue-600" />
                                Sisteme Hoşgeldiniz
                            </h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                Bu sistem, okul süreçlerini dijitalleştirmek, öğrenci takibini kolaylaştırmak ve veli-öğretmen iletişimini güçlendirmek için tasarlanmıştır.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mt-6">
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-2">Nasıl Giriş Yapılır?</h3>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                        <li><strong>Öğretmenler:</strong> Yöneticinizin size verdiği telefon ve şifre ile.</li>
                                        <li><strong>Okul Müdürleri:</strong> Kayıtlı telefon numaranız ve şifreniz (genellikle numaranın son 4 hanesi) ile.</li>
                                        <li><strong>Veliler:</strong> Öğrenci adına kayıtlı telefon numarası ve şifre (numaranın son 4 hanesi) ile.</li>
                                    </ul>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <h3 className="font-bold text-blue-800 mb-2">Mobil Uyumlu</h3>
                                    <p className="text-sm text-blue-700">
                                        Sistemi bilgisayarınızdan, tabletinizden veya telefonunuzdan (tarayıcı üzerinden) rahatlıkla kullanabilirsiniz. Uygulama marketinden indirmenize gerek yoktur.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* EVENT SECTION */}
                {activeTab === 'event' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 p-6 rounded-r-xl shadow-sm">
                            <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                                <Star size={24} />
                                Etkinlik ve Atölye Yönetimi
                            </h3>
                            <p className="text-purple-800 mt-2">
                                Tek seferlik veya kısa süreli etkinlikleri yönetmek için özel araçlar.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Card 1: Create Event */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-purple-600">
                                            <School size={20} />
                                        </div>
                                        Etkinlik Oluşturma
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Adım 1</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Yeni bir etkinlik veya kamp eklemek için:</p>
                                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                                        <li>"Okullar" sayfasında sağ üstteki <strong>"Okul Ekle"</strong> butonuna basın.</li>
                                        <li>Tür olarak <strong>"Etkinlik / Atölye"</strong> seçeneğini işaretleyin.</li>
                                        <li>Tarih, mekan ve yetkili bilgilerini girin.</li>
                                        <li><strong>Kaydet</strong> butonuna basın.</li>
                                    </ol>
                                    <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-100">
                                        Etkinlikler "Okullar" listesinde ayrı bir sekmede görünür.
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Planning with Matrix */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-blue-600">
                                            <CheckSquare size={20} />
                                        </div>
                                        Planlama ve Atama
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Adım 2</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Öğretmen ve saat planlaması:</p>
                                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                                        <li>Etkinlik kartındaki <strong>"Planla"</strong> butonuna basın.</li>
                                        <li>Açılan Takvimde (Matris) ilgili gün ve saate tıklayın.</li>
                                        <li>Dersi verecek öğretmeni seçin ve saat aralığını belirleyin.</li>
                                        <li>Ders eklendikten sonra öğretmen otomatik bilgilendirilir (Telegram açıksa).</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Card 3: Notes & Material */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-indigo-600">
                                            <FileText size={20} />
                                        </div>
                                        Notlar ve Malzemeler
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Detay</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Götürülecek malzemeleri takip edin:</p>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                        <li>Etkinlik detayında <strong>"Notlar"</strong> alanına götürülecek malzemeleri (Robot setleri, bilgisayar sayısı vb.) yazın.</li>
                                        <li>Bu notlar <strong>Raporlar {'>'} Etkinlikler</strong> altında yıllık dökümde listelenir.</li>
                                        <li>Böylece yıl sonunda "Hangi etkinliğe ne götürdük?" sorusuna cevap bulabilirsiniz.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Card 4: Reporting */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-green-600">
                                            <Banknote size={20} />
                                        </div>
                                        Raporlama
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Analiz</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Yıllık performans takibi:</p>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                        <li><strong>Raporlar</strong> sayfasına gidin.</li>
                                        <li><strong>"Etkinlik Raporları"</strong> sekmesini seçin.</li>
                                        <li>Yıl seçimi yaparak (2024, 2025...) o yıl yapılan tüm etkinlik sayısını, ders saatini ve görev alan öğretmenleri görebilirsiniz.</li>
                                        <li>Excel'e aktar butonunu kullanarak listeyi alabilirsiniz.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TEACHER SECTION - VISUAL GUIDE */}
                {activeTab === 'teacher' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm">
                            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                <Users size={24} />
                                Öğretmen Masası
                            </h3>
                            <p className="text-blue-800 mt-2">
                                Burası sizin dijital asistanınız. Aşağıdaki kartlardan yapmak istediğiniz işlemi seçin.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Card 1: Attendance */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-green-600">
                                            <CheckSquare size={20} />
                                        </div>
                                        Yoklama Almak
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Adım 1</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Dersinize başladığınızda öğrencilerin durumunu girin.</p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 text-sm">
                                            <div className="min-w-[24px] h-[24px] bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                            <div>
                                                <span className="font-semibold text-slate-900">Dersi Açın:</span>
                                                <p className="text-slate-500 text-xs mt-0.5">Takvimden ilgili dersin kutucuğuna tıklayın.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <div className="min-w-[24px] h-[24px] bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                            <div>
                                                <span className="font-semibold text-slate-900">Durumu Seçin:</span>
                                                <div className="flex gap-2 mt-2">
                                                    <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs border border-green-200">Var</div>
                                                    <div className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs border border-yellow-200">Geç</div>
                                                    <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs border border-red-200">Yok</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <div className="min-w-[24px] h-[24px] bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                            <div>
                                                <span className="font-semibold text-slate-900">Kaydedin:</span>
                                                <p className="text-slate-500 text-xs mt-0.5">Sağ alttaki "Kaydet" butonuna mutlaka basın.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: File Upload */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-blue-600">
                                            <Upload size={20} />
                                        </div>
                                        Materyal Yükleme
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Adım 2</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Ödev, sunum veya PDF föylerini derse ekleyin.</p>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="border border-dashed border-slate-300 rounded-lg p-3 flex flex-col items-center justify-center text-center bg-slate-50">
                                            <FileText size={20} className="text-slate-400 mb-1" />
                                            <span className="text-[10px] text-slate-500">PDF Dosyaları</span>
                                        </div>
                                        <div className="border border-dashed border-slate-300 rounded-lg p-3 flex flex-col items-center justify-center text-center bg-slate-50">
                                            <Upload size={20} className="text-slate-400 mb-1" />
                                            <span className="text-[10px] text-slate-500">Otomatik Yüklenir</span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <strong>İpucu:</strong> "Dosya Seç" butonuna bastığınız an dosya yüklenir ve listeye eklenir. Ekstra bir işlem yapmanıza gerek yoktur.
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Cancellation */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-red-600">
                                            <LogOut size={20} />
                                        </div>
                                        İptal ve Telafi
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Özel Durum</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Ders yapılamadıysa durumu sisteme işleyin.</p>
                                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                                        <li>Ders detayında <strong>"İptal / Telafi"</strong> sekmesine tıklayın.</li>
                                        <li>İptal sebebini seçin (Rapor, Tatil vb.).</li>
                                        <li>Eğer telafi yapacaksanız, hemen altından yeni tarih ve saati seçin.</li>
                                        <li><strong>"İptal Et & Planla"</strong> butonuna basın.</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Card 4: Evaluation */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-yellow-500">
                                            <Star size={20} />
                                        </div>
                                        Gelişim Raporu
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Dönemlik</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Öğrencinin genel durumunu ve becerilerini puanlayın.</p>
                                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded text-xs text-slate-600 font-mono">
                                        Öğrenciler {'>'} Öğrenci Detay {'>'} Değerlendir
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Öğrenci listesinden isme tıklayın, açılan panelde <strong>Yıldız İkonuna</strong> tıklayarak değerlendirme yapabilirsiniz.
                                    </p>
                                </div>
                            </div>
                            {/* Card 5: Student Management & Data Importance */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group col-span-1 md:col-span-2">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-indigo-600">
                                            <Users size={20} />
                                        </div>
                                        Öğrenci Kaydı ve Verilerin Önemi
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Kritik Bilgi</span>
                                </div>
                                <div className="p-5">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <p className="text-sm text-slate-600">
                                                Yeni öğrenci eklerken veya sınıfa atarken girdiğiniz bilgilerin her biri sistemin işleyişi için kritiktir.
                                            </p>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-3 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                    <span className="font-bold text-blue-700 min-w-[120px]">Veli Telefonu:</span>
                                                    <span className="text-blue-800">
                                                        Bu numara velinin <strong>Kullanıcı Adı</strong> olur. Ayrıca numaranın son 4 hanesi velinin sisteme giriş <strong>Şifresi</strong> olarak otomatik atanır. Hatalı girilirse veli giriş yapamaz.
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-3 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <span className="font-bold text-slate-700 min-w-[120px]">Veli Adı:</span>
                                                    <span className="text-slate-600">SMS bildirimlerinde ve sistemdeki hitaplarda kullanılır.</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="flex-1 border-l border-slate-100 pl-6 md:block hidden">
                                            <h5 className="font-bold text-slate-800 mb-3 text-sm">Öğrenci Ekleme Adımları</h5>
                                            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                                                <li>Sol menüden <strong>Öğrenciler</strong> sayfasına gidin.</li>
                                                <li>Sağ üstteki <strong>"Yeni Öğrenci"</strong> butonuna basın.</li>
                                                <li>İlgili Okulu ve Sınıfı seçin.</li>
                                                <li>Bilgileri eksiksiz doldurup kaydedin.</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 6: Icon Glossary */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group col-span-1 md:col-span-2">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-600">
                                            <Book size={20} />
                                        </div>
                                        İkon Sözlüğü (Ne Anlama Geliyor?)
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Referans</span>
                                </div>
                                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Attendance Icons */}
                                    <div className="col-span-2 md:col-span-4 mb-2">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Yoklama Durumları</h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="flex items-center gap-2 p-2 rounded bg-green-50 border border-green-100">
                                                <div className="w-5 h-5 rounded flex items-center justify-center bg-green-200 text-green-700"><CheckSquare size={14} /></div>
                                                <span className="text-xs font-medium text-green-800">Geldi / Var</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2 rounded bg-yellow-50 border border-yellow-100">
                                                <div className="w-5 h-5 rounded flex items-center justify-center bg-yellow-200 text-yellow-700 font-bold text-[10px]">L</div>
                                                <span className="text-xs font-medium text-yellow-800">Geç Kaldı</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2 rounded bg-red-50 border border-red-100">
                                                <div className="w-5 h-5 rounded flex items-center justify-center bg-red-200 text-red-700 font-bold text-[10px]">X</div>
                                                <span className="text-xs font-medium text-red-800">Gelmedi / Yok</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Icons */}
                                    <div className="col-span-2 md:col-span-4">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">İşlem Butonları</h5>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <div className="flex items-center gap-2 p-2">
                                                <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded text-blue-600"><Upload size={14} /></div>
                                                <span className="text-xs text-slate-600">Dosya Yükle</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2">
                                                <div className="w-6 h-6 flex items-center justify-center bg-red-100 rounded text-red-600"><LogOut size={14} /></div>
                                                <span className="text-xs text-slate-600">İptal / Telafi</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2">
                                                <div className="w-6 h-6 flex items-center justify-center bg-yellow-100 rounded text-yellow-600"><Star size={14} /></div>
                                                <span className="text-xs text-slate-600">Değerlendir</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2">
                                                <div className="w-6 h-6 flex items-center justify-center bg-red-100 rounded text-red-600"><LogOut size={14} /></div>
                                                <span className="text-xs text-slate-600">Sil / Çıkar</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Telegram Guide for Teachers */}
                        <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mt-6">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                    <Send size={32} className="text-white fill-white" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-lg font-bold mb-2">Ders Bildirimlerini Cebinize İsteyin!</h4>
                                    <p className="text-blue-100 text-sm mb-4">
                                        Telegram botumuz ile ders saatinden önce hatırlatmalar alın, yoklamayı unutmayın.
                                    </p>
                                    <div className="bg-black/20 rounded-lg p-3 inline-block text-left">
                                        <div className="text-xs text-blue-200 uppercase font-bold mb-1">Kurulum (Tek Seferlik):</div>
                                        <ol className="list-decimal list-inside text-sm space-y-1">
                                            <li>Telegram'da <strong>@AtolyeVizyon_Bot</strong>'u aratın.</li>
                                            <li>Sohbeti başlatıp <strong>"Merhaba"</strong> yazın.</li>
                                            <li>Gelen <strong>"📱 Telefon Numaramı Paylaş"</strong> butonuna basın.</li>
                                            <li><span className="text-green-300">İşlem Tamam!</span> Sistem sizi numaranızdan tanıyacaktır.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MANAGER SECTION */}
                {activeTab === 'manager' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 p-6 rounded-r-xl shadow-sm">
                            <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                <School size={24} />
                                Şube Yönetim Rehberi
                            </h3>
                            <p className="text-indigo-800 mt-2">
                                Şube müdürü olarak kendi biriminizdeki tüm operasyonel süreçleri buradan yönetebilirsiniz.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Card 1: Lesson Shifting */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-purple-600">
                                            <Calendar size={20} />
                                        </div>
                                        Ders Takvimi Kaydırma
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Yeni</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Tatil veya özel günlerde tüm şube programını ötelemek için:</p>
                                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                                        <li>Şube detay sayfasında <strong>"Takvim / Tatil"</strong> butonuna basın.</li>
                                        <li>Hangi günden itibaren kaydırma yapılacağını seçin.</li>
                                        <li><strong>"Tüm Grup ve Sınıflar"</strong> seçeneği ile tüm şubeyi etkileyebilirsiniz.</li>
                                        <li>"Haftalık Ötele" modu ile günleri (Örn: Cumartesi) koruyarak kaydırabilirsiniz.</li>
                                    </ol>
                                    <button
                                        onClick={() => setSelectedVideo({ src: '/videos/lesson_shifting_demo.webp', title: 'Ders Kaydırma Nasıl Yapılır?' })}
                                        className="w-full mt-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-purple-100"
                                    >
                                        <Play size={14} className="fill-purple-700" />
                                        Video Rehberi İzle
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Enrollment Types */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-emerald-600">
                                            <Users size={20} />
                                        </div>
                                        Kayıt Tipleri ve Ücretler
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Önemli</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Öğrencileri türlerine göre ayırın:</p>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                        <li><strong>Süreli Kayıtlar:</strong> 4 Haftalık veya 12 Haftalık paketler.</li>
                                        <li><strong>Serbest Kayıtlar:</strong> Saatlik veya Günlük atölye katılımları.</li>
                                        <li>Şube detayda her tip için ayrı sekmeler bulunur.</li>
                                        <li>Ödemeler bu tiplere göre otomatik hesaplanır.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Card 3: Messaging */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-blue-600">
                                            <MessageCircle size={20} />
                                        </div>
                                        Öğretmen İletişimi
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Anlık</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Kendi şubenizdeki öğretmenlere mesaj atın:</p>
                                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                                        <li><strong>Kadro Yönetimi</strong> sayfasına gidin.</li>
                                        <li>Telegram bağlı olan öğretmenlerin yanında <strong>"Mesaj Gönder"</strong> butonunu göreceksiniz.</li>
                                        <li>Duyuru veya hatırlatmaları anlık olarak iletebilirsiniz.</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Card 4: Reports */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-orange-600">
                                            <FileText size={20} />
                                        </div>
                                        Şube Raporları
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">Finans</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-slate-600">Performans ve finansman takibi:</p>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                        <li><strong>Raporlar</strong> sekmesinden şubenizin gelir dökümünü alabilirsiniz.</li>
                                        <li>Bekleyen ödemeleri "Tahsilat" sekmesinden takip edebilirsiniz.</li>
                                        <li>Tüm listeleri Excel olarak indirebilirsiniz.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Telegram Guide for Managers */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                    <Send size={32} className="text-white fill-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold mb-2">Otomatik Bildirim Şablonları</h4>
                                    <p className="text-indigo-100 text-sm mb-4">
                                        Artık kendi şubenize özel hatırlatma mesajları kurgulayabilirsiniz.
                                    </p>
                                    <div className="bg-black/20 rounded-lg p-3 inline-block">
                                        <ul className="list-disc list-inside text-sm space-y-1">
                                            <li><strong>Ayarlar</strong> sayfasına gidin.</li>
                                            <li>Sadece "Bildirim Şablonları" sekmesi sizin için açıktır.</li>
                                            <li>Yeni şablon ekleyerek veli veya öğretmenlere gidecek otomatik mesajları özelleştirin.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PARENT SECTION */}
                {activeTab === 'parent' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Veli Bilgilendirme Sistemi</h2>
                            <p className="text-slate-600 mb-4">
                                Çocuğunuzun eğitim sürecini şeffaf bir şekilde takip etmeniz için tasarlanmıştır.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="border border-slate-200 rounded-lg p-5">
                                    <h3 className="font-bold text-lg mb-2 text-blue-700">Neleri Görebilirim?</h3>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
                                        <li><strong>Geçmiş Dersler:</strong> Hangi gün, hangi konu işlendi.</li>
                                        <li><strong>Devamsızlık:</strong> Öğrencinin derse katılıp katılmadığı.</li>
                                        <li><strong>Ödev ve Dosyalar:</strong> Öğretmenin yüklediği PDF ve kaynaklar.</li>
                                        <li><strong>Değerlendirmeler:</strong> Dönemlik gelişim raporları.</li>
                                    </ul>
                                </div>
                                <div className="border border-slate-200 rounded-lg p-5 bg-yellow-50">
                                    <h3 className="font-bold text-lg mb-2 text-yellow-800">Sık Sorulan Sorular</h3>
                                    <p className="text-sm text-slate-700 mb-2"><strong>Şifremi unuttum?</strong></p>
                                    <p className="text-xs text-slate-600 mb-4">Genellikle kayıtlı telefon numaranızın son 4 hanesidir. Okul yönetimi ile iletişime geçebilirsiniz.</p>
                                </div>
                            </div>
                        </section>

                        {/* Telegram Guide for Parents */}
                        <section className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <Send size={20} className="fill-white" />
                                    Anlık Bildirim Sistemi
                                </h3>
                                <p className="text-green-50 text-sm mb-4">
                                    Çocuğunuzun derse katılım bilgisi, ödevler ve duyurular Telegram üzerinden cebinize gelsin.
                                </p>
                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                                    <h4 className="font-bold text-sm mb-2 text-white">Nasıl Aktif Ederim?</h4>
                                    <ul className="text-sm space-y-2">
                                        <li className="flex gap-2">
                                            <div className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</div>
                                            <span>Telegram uygulamasını açın ve <strong>@AtolyeVizyon_Bot</strong> kullanıcısını bulun.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <div className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</div>
                                            <span>Bota <strong>"Merhaba"</strong> yazıp gönderin.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <div className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-xs">3</div>
                                            <span>Klavye alanında çıkan <strong>"Telefon Numaramı Paylaş"</strong> butonuna tıklayın.</span>
                                        </li>
                                    </ul>
                                    <div className="mt-3 text-xs text-green-200 bg-black/20 p-2 rounded">
                                        * Bot, sistemdeki kayıtlı numaranızla sizi otomatik eşleştirir. Şifre veya kod gerekmez.
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* ADMIN SECTION */}
                {activeTab === 'admin' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <p className="text-slate-600">
                            <strong>Ayarlar</strong> menüsünden logo, tema ve diğer sistem tercihlerini değiştirebilirsiniz.
                        </p>

                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                <Send size={16} />
                                Sistem Yöneticisi Bildirimleri
                            </h4>
                            <p className="text-sm text-yellow-700">
                                Sistem hataları ve kritik uyarıları almak için <strong>@AtolyeVizyon_Bot</strong> ile "Paylaş" yöntemini kullanarak eşleşin.
                                Ayrıca <strong>Ayarlar {'>'} Telegram</strong> sayfasından "Şimdi Kontrol Et" butonu ile botun çalışmasını manuel tetikleyebilirsiniz.
                            </p>
                        </div>
                    </div>
                )}

                {/* VIDEO GALLERY SECTION - COMMON RESOURCE */}
                <div className="mt-10 pt-8 border-t border-slate-200">
                    <div className="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="relative z-10 mb-6 border-b border-slate-700 pb-4 flex justify-between items-end">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <div className="p-2 bg-red-600 rounded-lg">
                                        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-0.5"></div>
                                    </div>
                                    Video Dersler
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">Uygulamalı anlatım videoları.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Video 1: Student Creation */}
                            <div
                                onClick={() => setSelectedVideo({ src: '/videos/student_creation_tutorial.webp', title: 'Yeni Öğrenci Ekleme' })}
                                className="bg-slate-800 rounded-lg overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer relative"
                            >
                                <div className="aspect-video bg-slate-700 flex items-center justify-center relative group-hover:bg-slate-900 transition-colors">
                                    <img
                                        src="/videos/student_creation_tutorial.webp"
                                        alt="Öğrenci Ekleme Tutorial"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Play className="text-white fill-white ml-1" size={24} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono">00:48</div>
                                </div>
                                <div className="p-3">
                                    <h5 className="font-bold text-sm text-slate-200 group-hover:text-blue-400 transition-colors">Yeni Öğrenci Ekleme</h5>
                                    <p className="text-xs text-slate-500 mt-1">Sisteme yeni öğrenci kaydetme adımları.</p>
                                </div>
                            </div>

                            {/* Video 2: Attendance */}
                            <div
                                onClick={() => setSelectedVideo({ src: '/videos/attendance_tutorial.webp', title: 'Yoklama Alma' })}
                                className="bg-slate-800 rounded-lg overflow-hidden group hover:ring-2 hover:ring-green-500 transition-all cursor-pointer relative"
                            >
                                <div className="aspect-video bg-slate-700 flex items-center justify-center relative group-hover:bg-slate-900 transition-colors">
                                    <img
                                        src="/videos/attendance_tutorial.webp"
                                        alt="Yoklama Tutorial"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Play className="text-white fill-white ml-1" size={24} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono">02:50</div>
                                </div>
                                <div className="p-3">
                                    <h5 className="font-bold text-sm text-slate-200 group-hover:text-green-400 transition-colors">Yoklama Alma</h5>
                                    <p className="text-xs text-slate-500 mt-1">Ders kaydı ve öğrenci durumları.</p>
                                </div>
                            </div>

                            {/* Video 3: Evaluations */}
                            <div
                                onClick={() => setSelectedVideo({ src: '/videos/evaluation_tutorial.webp', title: 'Gelişim Raporları' })}
                                className="bg-slate-800 rounded-lg overflow-hidden group hover:ring-2 hover:ring-yellow-500 transition-all cursor-pointer relative"
                            >
                                <div className="aspect-video bg-slate-700 flex items-center justify-center relative group-hover:bg-slate-900 transition-colors">
                                    <img
                                        src="/videos/evaluation_tutorial.webp"
                                        alt="Değerlendirme Tutorial"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Play className="text-white fill-white ml-1" size={24} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono">00:45</div>
                                </div>
                                <div className="p-3">
                                    <h5 className="font-bold text-sm text-slate-200 group-hover:text-yellow-400 transition-colors">Gelişim Raporları</h5>
                                    <p className="text-xs text-slate-500 mt-1">Puanlama ve değerlendirme sistemi.</p>
                                </div>
                            </div>

                            {/* Video 4: Cancellation */}
                            <div
                                onClick={() => setSelectedVideo({ src: '/videos/cancellation_tutorial.webp', title: 'Ders İptal ve Telafi' })}
                                className="bg-slate-800 rounded-lg overflow-hidden group hover:ring-2 hover:ring-red-500 transition-all cursor-pointer relative"
                            >
                                <div className="aspect-video bg-slate-700 flex items-center justify-center relative group-hover:bg-slate-900 transition-colors">
                                    <img
                                        src="/videos/cancellation_tutorial.webp"
                                        alt="İptal Tutorial"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Play className="text-white fill-white ml-1" size={24} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono">00:55</div>
                                </div>
                                <div className="p-3">
                                    <h5 className="font-bold text-sm text-slate-200 group-hover:text-red-400 transition-colors">Ders İptal ve Telafi</h5>
                                    <p className="text-xs text-slate-500 mt-1">Ders iptali ve telafi dersi oluşturma.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                            <div className="p-1.5 bg-green-500/20 rounded-full text-green-400">
                                <CheckSquare size={14} />
                            </div>
                            <span>Tüm videolar günceldir. Yeni özellikler eklendikçe videolar güncellenecektir.</span>
                        </div>

                        {/* Telegram Setup for Managers */}
                        <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mt-6">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                    <Send size={32} className="text-white fill-white" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-lg font-bold mb-2">Şube Yöneticisi Telegram Kurulumu</h4>
                                    <p className="text-blue-100 text-sm mb-4">
                                        Admin ve veli bildirimlerini anlık alabilmek için botu kurmanız gerekmektedir.
                                    </p>
                                    <div className="bg-black/20 rounded-lg p-3 inline-block text-left">
                                        <div className="text-xs text-blue-200 uppercase font-bold mb-1">Kurulum (Tek Seferlik):</div>
                                        <ol className="list-decimal list-inside text-sm space-y-1">
                                            <li>Telegram'da <strong>@AtolyeVizyon_Bot</strong>'u aratın.</li>
                                            <li>Sohbeti başlatıp <strong>"Merhaba"</strong> yazın.</li>
                                            <li>Gelen <strong>"📱 Telefon Numaramı Paylaş"</strong> butonuna basın.</li>
                                            <li><span className="text-green-300">İşlem Tamam!</span> Sistem sizi yönetici profilinizle eşleştirecektir.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Video Modal */}
            {
                selectedVideo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedVideo(null)}>
                        <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={() => setSelectedVideo(null)}
                                    className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors backdrop-blur-md"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="aspect-video w-full flex items-center justify-center bg-black">
                                <img
                                    key={selectedVideo.src}
                                    src={`${selectedVideo.src}?t=${Date.now()}`}
                                    alt={selectedVideo.title}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="p-4 bg-slate-900 border-t border-white/10">
                                <h3 className="text-white font-bold text-lg">{selectedVideo.title}</h3>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
