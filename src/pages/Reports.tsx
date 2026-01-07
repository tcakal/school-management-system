import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { format, startOfMonth, endOfMonth, parseISO, isFuture } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ExcelExportBtn } from '../components/ExcelExportBtn';
import { School, Users, User, Mail, Copy, Check } from 'lucide-react';

export function Reports() {
    const { lessons, attendance, schools, teachers, classGroups, students } = useStore();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'attendance' | 'financial' | 'teachers' | 'class_overview' | 'contacts'>('attendance');

    // Attendance Filter State
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [selectedSchoolId, setSelectedSchoolId] = useState('all');
    const [selectedTeacherId, setSelectedTeacherId] = useState('all');

    // Contacts Filter State
    const [contactSchoolId, setContactSchoolId] = useState('all');
    const [contactClassId, setContactClassId] = useState('all');
    const [contactGrade, setContactGrade] = useState('all');
    const [copiedEmails, setCopiedEmails] = useState(false);

    // --- CONTACTS LOGIC ---
    const contactsData = useMemo(() => {
        if (activeTab !== 'contacts') return [];

        let filtered = students.filter(s => s.status === 'Active');

        if (contactSchoolId !== 'all') {
            filtered = filtered.filter(s => s.schoolId === contactSchoolId);
        }
        if (contactClassId !== 'all') {
            filtered = filtered.filter(s => s.classGroupId === contactClassId);
        }
        if (contactGrade !== 'all') {
            filtered = filtered.filter(s => s.gradeLevel?.toString() === contactGrade);
        }

        return filtered.map(student => {
            const school = schools.find(s => s.id === student.schoolId);
            const group = classGroups.find(c => c.id === student.classGroupId);
            return {
                id: student.id,
                name: student.name,
                schoolName: school?.name || '-',
                className: group?.name || '-',
                grade: student.gradeLevel ? `${student.gradeLevel}. Sınıf` : '-',
                parentName: student.parentName || '-', // Assuming parentName exists or use logic
                email: student.parentEmail || '-',
                phone: student.phone || '-',
                excelData: {
                    'Öğrenci Adı': student.name,
                    'Okul': school?.name,
                    'Sınıf': group?.name,
                    'Seviye': student.gradeLevel ? `${student.gradeLevel}. Sınıf` : '-',
                    'Veli E-posta': student.parentEmail,
                    'Telefon': student.phone
                }
            };
        });
    }, [students, schools, classGroups, contactSchoolId, contactClassId, contactGrade, activeTab]);

    const handleCopyEmails = () => {
        const emails = contactsData
            .map(c => c.email)
            .filter(e => e && e !== '-' && e.includes('@'))
            .join(', ');

        navigator.clipboard.writeText(emails);
        setCopiedEmails(true);
        setTimeout(() => setCopiedEmails(false), 2000);
    };

    // --- ATTENDANCE LOGIC ---
    const attendanceData = useMemo(() => {
        if (activeTab !== 'attendance' && activeTab !== 'class_overview') return [];

        // 1. Filter Lessons based on Date Range, School, Teacher
        const filteredLessons = lessons.filter(l => {
            // RBAC: If teacher, only show own lessons
            if (user?.role === 'teacher' && l.teacherId !== user.id) return false;

            const date = parseISO(l.date);
            const start = parseISO(startDate);
            const end = parseISO(endDate);

            // Fix: end date should be inclusive, so we might need to set time to end of day or just compare dates strings if simple
            // Using isWithinInterval is robust but requires Date objects
            const isDateInRange = date >= start && date <= end; // Simple date object comparison works if times are 00:00

            if (!isDateInRange) return false;
            if (selectedSchoolId !== 'all' && l.schoolId !== selectedSchoolId) return false;
            if (selectedTeacherId !== 'all' && l.teacherId !== selectedTeacherId) return false;

            // Only consider scheduled or completed lessons (not cancelled?) 
            // Actually, cancelled lessons might be relevant for reports too, but usually attendance is null.
            // Let's include everything but maybe flag cancelled ones.
            return true;
        });

        // 2. Map formatted data for display and export
        return filteredLessons.map(lesson => {
            const school = schools.find(s => s.id === lesson.schoolId);
            const teacher = teachers.find(t => t.id === lesson.teacherId);
            const group = classGroups.find(c => c.id === lesson.classGroupId);
            const lessonAttendance = attendance.filter(a => a.lessonId === lesson.id);

            const presentCount = lessonAttendance.filter(a => a.status === 'present').length;
            const absentCount = lessonAttendance.filter(a => a.status === 'absent').length;
            const lateCount = lessonAttendance.filter(a => a.status === 'late').length;
            const totalRecorded = lessonAttendance.length;

            const isFutureLesson = isFuture(parseISO(`${lesson.date}T${lesson.startTime}`));
            const statusLabel = lesson.status === 'cancelled' ? 'İptal' : (isFutureLesson ? 'Planlandı' : 'Yapıldı');

            return {
                id: lesson.id,
                date: lesson.date,
                displayDate: format(new Date(lesson.date), 'dd MMM yyyy', { locale: tr }),
                startTime: lesson.startTime,
                schoolName: school?.name || 'Bilinmiyor',
                className: group?.name || 'Bilinmiyor',
                teacherName: teacher?.name || 'Bilinmiyor',
                topic: lesson.topic || '-',
                status: lesson.status,
                isFuture: isFutureLesson,
                attendance: {
                    present: presentCount,
                    absent: absentCount,
                    late: lateCount,
                    total: totalRecorded
                },
                // Flattened for Excel
                excelData: {
                    Tarih: lesson.date,
                    Saat: lesson.startTime,
                    Okul: school?.name,
                    Sınıf: group?.name,
                    Öğretmen: teacher?.name,
                    Konu: lesson.topic || '-',
                    Durum: statusLabel,
                    Var: presentCount,
                    Yok: absentCount,
                    Geç: lateCount
                }
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [lessons, attendance, schools, teachers, classGroups, startDate, endDate, selectedSchoolId, selectedTeacherId, activeTab]);

    const totalStats = useMemo(() => {
        return attendanceData.reduce((acc, curr) => ({
            lessons: acc.lessons + 1,
            present: acc.present + curr.attendance.present,
            absent: acc.absent + curr.attendance.absent,
            late: acc.late + curr.attendance.late
        }), { lessons: 0, present: 0, absent: 0, late: 0 });
    }, [attendanceData]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Raporlar</h2>
                <p className="text-slate-500 mt-1">Okul genelindeki tüm aktivitelerin detaylı analizi.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={18} />
                    Yoklama & Dersler
                </button>
                {user?.role === 'admin' && (
                    <>
                        <button
                            onClick={() => setActiveTab('teachers')}
                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'teachers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <User size={18} />
                            Öğretmen Performansı
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'financial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <School size={18} />
                            Finansal Rapor
                        </button>
                    </>
                )}
                {/* New Tab for Teachers: Class Overview */}
                {user?.role === 'teacher' && (
                    <button
                        onClick={() => setActiveTab('class_overview')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'class_overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <School size={18} />
                        Sınıf Gelişim Raporu (4 Hafta)
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('contacts')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contacts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Mail size={18} />
                    Öğrenci İletişim
                </button>
            </div>

            {/* CONTACTS FILTERS */}
            {activeTab === 'contacts' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex-[2]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Okul</label>
                            <select
                                className="w-full text-sm border-slate-300 rounded-lg"
                                value={contactSchoolId}
                                onChange={e => setContactSchoolId(e.target.value)}
                            >
                                <option value="all">Tüm Okullar</option>
                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-[2]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Sınıf Grubu</label>
                            <select
                                className="w-full text-sm border-slate-300 rounded-lg"
                                value={contactClassId}
                                onChange={e => setContactClassId(e.target.value)}
                            >
                                <option value="all">Tüm Sınıflar</option>
                                {classGroups.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Sınıf Seviyesi</label>
                            <select
                                className="w-full text-sm border-slate-300 rounded-lg"
                                value={contactGrade}
                                onChange={e => setContactGrade(e.target.value)}
                            >
                                <option value="all">Hepsi</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                                    <option key={g} value={g}>{g}. Sınıf</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="shrink-0 flex gap-2">
                        <button
                            onClick={handleCopyEmails}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium text-sm transition-colors"
                            title="E-postaları Panoya Kopyala"
                        >
                            {copiedEmails ? <Check size={16} /> : <Copy size={16} />}
                            {copiedEmails ? 'Kopyalandı' : 'E-postaları Kopyala'}
                        </button>
                        <ExcelExportBtn
                            data={contactsData.map(x => x.excelData)}
                            fileName={`Iletisim_Listesi`}
                            label="Excel"
                        />
                    </div>
                </div>
            )}

            {/* FILTERS AREA (Attendance Only) */}
            {activeTab === 'attendance' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Başlangıç</label>
                            <input
                                type="date"
                                className="w-full text-sm border-slate-300 rounded-lg"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Bitiş</label>
                            <input
                                type="date"
                                className="w-full text-sm border-slate-300 rounded-lg"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-[2]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Okul</label>
                            <select
                                className="w-full text-sm border-slate-300 rounded-lg"
                                value={selectedSchoolId}
                                onChange={e => setSelectedSchoolId(e.target.value)}
                            >
                                <option value="all">Tüm Okullar</option>
                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-[2]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Öğretmen</label>
                            <select
                                className="w-full text-sm border-slate-300 rounded-lg"
                                value={selectedTeacherId}
                                onChange={e => setSelectedTeacherId(e.target.value)}
                            >
                                <option value="all">Tüm Öğretmenler</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="shrink-0">
                        <ExcelExportBtn
                            data={attendanceData.map(x => x.excelData)}
                            fileName={`Yoklama_Raporu_${startDate}_${endDate}`}
                            label="Excel Çıktısı Al"
                        />
                    </div>
                </div>
            )}

            {/* ATTENDANCE TAB CONTENT */}
            {
                activeTab === 'attendance' && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-sm text-slate-500">Toplam Ders</div>
                                <div className="text-2xl font-bold text-slate-900">{totalStats.lessons}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-green-500">
                                <div className="text-sm text-slate-500">Toplam Var</div>
                                <div className="text-2xl font-bold text-green-700">{totalStats.present}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                                <div className="text-sm text-slate-500">Toplam Yok</div>
                                <div className="text-2xl font-bold text-red-700">{totalStats.absent}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-yellow-500">
                                <div className="text-sm text-slate-500">Toplam Geç</div>
                                <div className="text-2xl font-bold text-yellow-700">{totalStats.late}</div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tarih</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Okul / Sınıf</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Öğretmen</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Konu</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Katılım</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {attendanceData.length > 0 ? (
                                        attendanceData.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{item.displayDate}</div>
                                                    <div className="text-xs text-slate-500">{item.startTime}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-700">{item.schoolName}</div>
                                                    <div className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                                        {item.className}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 text-sm">
                                                    {item.teacherName}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 text-sm italic">
                                                    {item.topic}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex text-xs font-medium gap-2">
                                                            <span className="text-green-600" title="Var">{item.attendance.present}</span>
                                                            <span className="text-slate-300">/</span>
                                                            <span className="text-red-600" title="Yok">{item.attendance.absent}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.status === 'cancelled' ? (
                                                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">İptal</span>
                                                    ) : item.isFuture ? (
                                                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Planlı</span>
                                                    ) : (
                                                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Yapıldı</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                Bu kriterlere uygun kayıt bulunamadı.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )
            }

            {
                activeTab === 'teachers' && (
                    <div className="p-8 text-center bg-white rounded-xl border-slate-200 border border-dashed">
                        <User size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Öğretmen Performans Raporları</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            Bu modül, öğretmenlerin ders saatlerini, katılım oranlarını ve konularını analiz etmenizi sağlayacak. Geliştirme aşamasındadır.
                        </p>
                    </div>
                )
            }
            {
                activeTab === 'financial' && (
                    <div className="p-8 text-center bg-white rounded-xl border-slate-200 border border-dashed">
                        <School size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Finansal Raporlar</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            Okul ödemeleri, gecikmeler ve tahmini gelir raporları burada yer alacak. Geliştirme aşamasındadır.
                        </p>
                    </div>
                )
            }
            {
                activeTab === 'class_overview' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Sınıf Gelişim Özeti (4 Haftalık)</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Sadece kendi derslerinizi görmektesiniz. Aşağıdaki liste, seçilen tarih aralığındaki derslerinizi, işlenen konuları ve notları içerir.
                            </p>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-slate-500">Tarih</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Okul / Sınıf</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Konu</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Notlar</th>
                                            <th className="px-4 py-3 font-medium text-slate-500 text-center">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {attendanceData.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    {item.displayDate}
                                                    <div className="text-xs text-slate-400">{item.startTime}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-slate-900">{item.schoolName}</div>
                                                    <div className="text-xs text-blue-600">{item.className}</div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">{item.topic}</td>
                                                <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate" title="Tam not içeriği için tıklayın (YAPILACAK)">
                                                    - {/* Notes alanı henüz Lesson modelinde tam kullanılmıyor, buraya eklenebilir */}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.status === 'cancelled' ? (
                                                        <span className="text-red-600 font-bold text-xs">İptal</span>
                                                    ) : item.isFuture ? (
                                                        <span className="text-slate-400 font-bold text-xs">Planlı</span>
                                                    ) : (
                                                        <span className="text-green-600 font-bold text-xs">Tamamlandı</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {attendanceData.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                                    Kayıt bulunamadı.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                activeTab === 'contacts' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-slate-500">Öğrenci</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Okul / Sınıf</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Seviye</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Veli E-posta</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Telefon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {contactsData.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{student.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900">{student.schoolName}</div>
                                            <div className="text-xs text-slate-500">{student.className}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{student.grade}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{student.email}</td>
                                        <td className="px-6 py-4 text-slate-600">{student.phone}</td>
                                    </tr>
                                ))}
                                {contactsData.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            }
        </div >
    );
}
