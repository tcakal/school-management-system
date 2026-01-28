import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { format, startOfMonth, endOfMonth, parseISO, isFuture } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ExcelExportBtn } from '../components/ExcelExportBtn';
import { Modal } from '../components/Modal';
import { School, Users, User, Copy, Check, Star, AlertTriangle } from 'lucide-react';

export function Reports() {
    const { lessons, attendance, schools, teachers, classGroups, students, payments, teacherEvaluations, studentEvaluations } = useStore();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'attendance' | 'financial' | 'teachers' | 'class_overview' | 'contacts' | 'evaluations' | 'events'>('attendance');

    // Attendance Filter State
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    // @ts-ignore
    const [selectedSchoolId, setSelectedSchoolId] = useState('all');
    const [selectedTeacherId, setSelectedTeacherId] = useState('all');

    // Event Filter State
    const [eventYear, setEventYear] = useState(new Date().getFullYear());

    // Contacts Filter State
    const [contactSchoolId, setContactSchoolId] = useState(user?.role === 'manager' ? user.id : 'all');
    const [contactClassId, setContactClassId] = useState('all');
    const [contactGrade, setContactGrade] = useState('all');
    const [copiedEmails, setCopiedEmails] = useState(false);

    // Evaulation Report State
    const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
    const [isEvalDetailModalOpen, setIsEvalDetailModalOpen] = useState(false);

    // Teacher Detail State
    const [selectedTeacherReport, setSelectedTeacherReport] = useState<any | null>(null);
    const [isTeacherDetailModalOpen, setIsTeacherDetailModalOpen] = useState(false);
    const [teacherDetailTab, setTeacherDetailTab] = useState<'history' | 'trends'>('history');

    // --- EVENT REPORT LOGIC ---
    const eventReportData = useMemo(() => {
        if (activeTab !== 'events') return [];

        // Filter schools that are Type 'event'
        const eventSchools = schools.filter(s => s.type === 'event');

        return eventSchools.map(event => {
            // Find lessons for this event in the selected year
            // Events usually have 'eventDates' array.
            // Check if any date in eventDates falls into selectedYear
            const eventDates = event.eventDates || [];

            // If legacy style (single date)
            if (event.eventDate) eventDates.push(event.eventDate);

            // Filter dates within selected year
            const datesInYear = eventDates.filter(d => new Date(d).getFullYear() === eventYear);

            if (datesInYear.length === 0) return null;

            // Get lessons for this school/event
            const eventLessons = lessons.filter(l => l.schoolId === event.id);

            // Calculate Stats
            const uniqueTeacherIds = [...new Set(eventLessons.map(l => l.teacherId))];
            const teacherNames = uniqueTeacherIds.map(tid => {
                const t = teachers.find(teacher => teacher.id === tid);
                return t ? t.name : 'Bilinmiyor';
            });

            // Date Range String
            const sortedDates = datesInYear.sort();
            const dateRange = sortedDates.length > 0
                ? (sortedDates.length === 1 ? format(new Date(sortedDates[0]), 'dd MMMM yyyy', { locale: tr }) : `${format(new Date(sortedDates[0]), 'dd MMM', { locale: tr })} - ${format(new Date(sortedDates[sortedDates.length - 1]), 'dd MMM yyyy', { locale: tr })}`)
                : '-';

            return {
                id: event.id,
                name: event.name,
                manager: event.managerName || '-', // Location or Manager
                dateRange: dateRange,
                lessonCount: eventLessons.length,
                teachers: teacherNames,
                notes: event.notes || '',
                excelData: {
                    'Etkinlik Adı': event.name,
                    'Yetkili / Yer': event.managerName,
                    'Tarih': dateRange,
                    'Ders Sayısı': eventLessons.length,
                    'Öğretmenler': teacherNames.join(', '),
                    'Notlar': event.notes
                }
            };
        }).filter(Boolean) as any[]; // Remove nulls
    }, [schools, lessons, teachers, activeTab, eventYear]);

    const eventStats = useMemo(() => {
        if (activeTab !== 'events') return { totalEvents: 0, totalLessons: 0, uniqueTeachers: 0 };

        return {
            totalEvents: eventReportData.length,
            totalLessons: eventReportData.reduce((acc, curr) => acc + curr.lessonCount, 0),
            uniqueTeachers: new Set(eventReportData.flatMap(e => e.teachers)).size
        };
    }, [eventReportData, activeTab]);

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

    // --- EVALUATIONS LOGIC ---
    const evaluationReportData = useMemo(() => {
        if (activeTab !== 'evaluations') return [];

        let filteredStudents = students.filter(s => s.status === 'Active');

        // Reuse Contact Filters for Evaluations
        if (contactSchoolId !== 'all') {
            filteredStudents = filteredStudents.filter(s => s.schoolId === contactSchoolId);
        }
        if (contactClassId !== 'all') {
            filteredStudents = filteredStudents.filter(s => s.classGroupId === contactClassId);
        }
        if (contactGrade !== 'all') {
            filteredStudents = filteredStudents.filter(s => s.gradeLevel?.toString() === contactGrade);
        }

        const reportRows: any[] = [];

        filteredStudents.forEach(student => {
            const studentEvals = studentEvaluations.filter(e => e.studentId === student.id);
            if (studentEvals.length === 0) return;

            const school = schools.find(s => s.id === student.schoolId);
            const group = classGroups.find(c => c.id === student.classGroupId);

            studentEvals.forEach(ev => {
                let evaluatorName = 'Bilinmiyor';
                if (ev.teacherId) {
                    const teacher = teachers.find(t => t.id === ev.teacherId);
                    evaluatorName = teacher ? teacher.name : 'Silinmiş Öğretmen';
                } else if (ev.evaluatorId === 'super-admin') {
                    evaluatorName = 'Süper Yönetici';
                } else if (ev.evaluatorId) {
                    // Try to find if it matches a teacher ID (admin role teacher)
                    const teacher = teachers.find(t => t.id === ev.evaluatorId);
                    evaluatorName = teacher ? `${teacher.name} (Yönetici)` : 'Yönetici';
                }

                reportRows.push({
                    id: ev.id,
                    date: ev.createdAt,
                    displayDate: format(new Date(ev.createdAt), 'dd MMM yyyy HH:mm', { locale: tr }),
                    studentName: student.name,
                    schoolName: school?.name || '-',
                    className: group?.name || '-',
                    grade: student.gradeLevel ? `${student.gradeLevel}. Sınıf` : '-',
                    evaluatorName: evaluatorName,
                    score: ev.score, // Stored as 0-100
                    note: ev.note,
                    excelData: {
                        'Tarih': format(new Date(ev.createdAt), 'dd.MM.yyyy HH:mm'),
                        'Öğrenci': student.name,
                        'Okul': school?.name,
                        'Sınıf': group?.name,
                        'Değerlendiren': evaluatorName,
                        'Puan': ev.score,
                        'Not': ev.note
                    }
                });
            });
        });

        return reportRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [students, studentEvaluations, schools, classGroups, teachers, contactSchoolId, contactClassId, contactGrade, activeTab]);

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
    const [viewMode, setViewMode] = useState<'lessons' | 'students'>('lessons');

    // --- ATTENDANCE LOGIC ---
    const filteredLessons = useMemo(() => {
        if (activeTab !== 'attendance' && activeTab !== 'class_overview') return [];

        return lessons.filter(l => {
            // RBAC: If teacher, only show own lessons
            if (user?.role === 'teacher' && l.teacherId !== user.id) return false;

            // RBAC: If manager, only show own school
            if (user?.role === 'manager' && l.schoolId !== user.id) return false;

            const date = parseISO(l.date);
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            const isDateInRange = date >= start && date <= end;

            if (!isDateInRange) return false;
            if (selectedSchoolId !== 'all' && l.schoolId !== selectedSchoolId) return false;
            // Manager is handled by user.id check above, but if they selected 'all' (which they shouldn't be able to change), it's fine.
            // Actually better to enforce selectedSchoolId for manager in UI or here.

            if (selectedTeacherId !== 'all' && l.teacherId !== selectedTeacherId) return false;

            return true;
        });
    }, [lessons, user, startDate, endDate, selectedSchoolId, selectedTeacherId, activeTab]);

    const attendanceData = useMemo(() => {
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
    }, [filteredLessons, attendance, schools, teachers, classGroups]);

    const studentAttendanceStats = useMemo(() => {
        if (viewMode !== 'students') return [];

        const stats: Record<string, { present: number, absent: number, late: number, excused: number, total: number }> = {};
        const relevantLessonIds = filteredLessons.map(l => l.id);

        // Filter attendance records for these lessons
        const relevantAttendance = attendance.filter(a => relevantLessonIds.includes(a.lessonId));

        relevantAttendance.forEach(a => {
            if (!stats[a.studentId]) {
                stats[a.studentId] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
            }
            stats[a.studentId][a.status]++;
            stats[a.studentId].total++;
        });

        // Map to array
        return Object.entries(stats).map(([studentId, counts]) => {
            const student = students.find(s => s.id === studentId);
            const school = schools.find(s => s.id === student?.schoolId);
            const group = classGroups.find(c => c.id === student?.classGroupId);

            return {
                id: studentId,
                name: student?.name || 'Bilinmiyor',
                schoolName: school?.name || '-',
                className: group?.name || '-',
                ...counts,
                risk: counts.absent >= 2, // Risk flag
                excelData: {
                    'Öğrenci': student?.name,
                    'Okul': school?.name,
                    'Sınıf': group?.name,
                    'Toplam Ders': counts.total,
                    'Var': counts.present,
                    'Yok': counts.absent,
                    'Geç': counts.late,
                    'İzinli': counts.excused
                }
            };
        }).sort((a, b) => b.absent - a.absent); // Sort by absent count descending
    }, [filteredLessons, attendance, students, schools, classGroups, viewMode]);

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
                    <button
                        onClick={() => setActiveTab('teachers')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'teachers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <User size={18} />
                        Öğretmen Performansı
                    </button>
                )}
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'financial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <School size={18} />
                        Finansal Rapor
                    </button>
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
                    Öğrenci İletişim
                </button>
                {user?.role !== 'manager' && (
                    <button
                        onClick={() => setActiveTab('evaluations')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'evaluations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Star size={18} />
                        Öğrenci Değerlendirmeleri
                    </button>
                )}
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'events' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Star size={18} />
                        Etkinlik Raporları
                    </button>
                )}
            </div>

            {/* SHARED FILTERS (Contacts & Evaluations & Events) */}
            {(activeTab === 'contacts' || activeTab === 'evaluations' || activeTab === 'events') && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        {activeTab === 'events' ? (
                            <div className="flex-1 max-w-xs">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Yıl</label>
                                <select
                                    className="w-full text-sm border-slate-300 rounded-lg"
                                    value={eventYear}
                                    onChange={e => setEventYear(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <>
                                {user?.role !== 'manager' && (
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
                                )}
                                <div className="flex-[2]">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Sınıf Grubu</label>
                                    <select
                                        className="w-full text-sm border-slate-300 rounded-lg"
                                        value={contactClassId}
                                        onChange={e => setContactClassId(e.target.value)}
                                    >
                                        <option value="all">Tüm Sınıflar</option>
                                        {classGroups
                                            .filter(c => contactSchoolId === 'all' || c.schoolId === contactSchoolId)
                                            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                            </>
                        )}
                    </div>

                    <div className="shrink-0 flex gap-2">
                        {activeTab === 'contacts' && (
                            <button
                                onClick={handleCopyEmails}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium text-sm transition-colors"
                                title="E-postaları Panoya Kopyala"
                            >
                                {copiedEmails ? <Check size={16} /> : <Copy size={16} />}
                                {copiedEmails ? 'Kopyalandı' : 'E-postaları Kopyala'}
                            </button>
                        )}
                        <ExcelExportBtn
                            data={
                                activeTab === 'contacts' ? contactsData.map(x => x.excelData) :
                                    activeTab === 'events' ? eventReportData.map(x => x.excelData) :
                                        evaluationReportData.map(x => x.excelData)
                            }
                            fileName={
                                activeTab === 'contacts' ? 'Iletisim_Listesi' :
                                    activeTab === 'events' ? `Etkinlik_Raporu_${eventYear}` :
                                        'Ogrenci_Degerlendirmeleri'
                            }
                            label="Excel"
                        />
                    </div>
                </div>
            )}

            {/* EVENT REPORT CONTENT */}
            {activeTab === 'events' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Event Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
                            <div className="text-sm text-slate-500">Toplam Etkinlik</div>
                            <div className="text-2xl font-bold text-purple-700">{eventStats.totalEvents}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
                            <div className="text-sm text-slate-500">Toplam Ders Saati</div>
                            <div className="text-2xl font-bold text-blue-700">{eventStats.totalLessons}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
                            <div className="text-sm text-slate-500">Görevli Öğretmen</div>
                            <div className="text-2xl font-bold text-indigo-700">{eventStats.uniqueTeachers}</div>
                        </div>
                    </div>

                    {/* Events Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-500">Etkinlik Adı</th>
                                    <th className="px-6 py-4 font-bold text-slate-500">Tarihler</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-center">Ders Saati</th>
                                    <th className="px-6 py-4 font-bold text-slate-500">Öğretmenler</th>
                                    <th className="px-6 py-4 font-bold text-slate-500">Malzemeler / Notlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {eventReportData.length > 0 ? (
                                    eventReportData.map(event => (
                                        <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{event.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{event.manager}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-700 font-mono text-xs bg-slate-100 px-2 py-1 rounded inline-block">
                                                    {event.dateRange}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block text-xs">
                                                    {event.lessonCount} Ders
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {event.teachers.map((t: string, idx: number) => (
                                                        <span key={idx} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs border border-indigo-100">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs italic max-w-xs truncate" title={event.notes}>
                                                {event.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            {eventYear} yılında yapılmış etkinlik bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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

                        {
                            user?.role === 'manager' ? (
                                // Manager cannot see school selector
                                null
                            ) : (
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
                            )
                        }
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
                    </div >

                    <div className="shrink-0 flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
                            <button
                                onClick={() => setViewMode('lessons')}
                                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'lessons' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Ders Bazlı
                            </button>
                            <button
                                onClick={() => setViewMode('students')}
                                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'students' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Öğrenci Bazlı
                            </button>
                        </div>

                        <ExcelExportBtn
                            data={viewMode === 'lessons' ? attendanceData.map(x => x.excelData) : studentAttendanceStats.map(x => x.excelData)}
                            fileName={`Rapor_${viewMode}_${startDate}_${endDate}`}
                            label="Excele Aktar"
                        />
                    </div>
                </div >
            )}

            {activeTab === 'attendance' && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
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

                    {/* Table View */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-6">
                        {viewMode === 'lessons' ? (
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
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Öğrenci</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Okul / Sınıf</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Toplam Ders</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Var</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Yok</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Geç</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">İzinli</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {studentAttendanceStats.length > 0 ? (
                                        studentAttendanceStats.map(stat => (
                                            <tr key={stat.id} className={`hover:bg-slate-50 transition-colors ${stat.risk ? 'bg-red-50/50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900 flex items-center gap-2">
                                                        {stat.risk && <AlertTriangle size={16} className="text-red-500" />}
                                                        {stat.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-900 text-sm">{stat.schoolName}</div>
                                                    <div className="text-xs text-blue-600">{stat.className}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium text-slate-700">{stat.total}</td>
                                                <td className="px-6 py-4 text-center text-green-600 font-bold">{stat.present}</td>
                                                <td className="px-6 py-4 text-center text-red-600 font-bold">
                                                    {stat.absent}
                                                </td>
                                                <td className="px-6 py-4 text-center text-yellow-600 font-bold">{stat.late}</td>
                                                <td className="px-6 py-4 text-center text-blue-600 font-bold">{stat.excused}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                                Bu kriterlere uygun öğrenci kaydı bulunamadı.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )
            }



            {
                activeTab === 'teachers' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Öğretmen Performans Raporu</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 font-medium text-slate-500">Öğretmen</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-center">Toplam Ders</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-center">Tamamlanan</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-center">Yoklama Oranı</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-center">Not Detayı</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-center">Yönetici Puanı</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-center">Başarı Puanı</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {teachers
                                            .filter(t => t.role === 'teacher')
                                            .map(teacher => {
                                                // Get past lessons for this teacher
                                                const teacherLessons = lessons.filter(l =>
                                                    l.teacherId === teacher.id &&
                                                    !isFuture(parseISO(`${l.date}T${l.startTime}`)) &&
                                                    l.status !== 'cancelled'
                                                );

                                                const totalLessons = teacherLessons.length;

                                                // 1. Attendance Check
                                                const lessonsWithAttendance = teacherLessons.filter(l =>
                                                    attendance.some(a => a.lessonId === l.id)
                                                ).length;

                                                const attendanceRate = totalLessons > 0 ? (lessonsWithAttendance / totalLessons) * 100 : 0;

                                                // 2. Note Detail Check
                                                // Check length of topic + notes
                                                const filledNotesCount = teacherLessons.filter(l =>
                                                    (l.topic && l.topic.length > 5) || (l.notes && l.notes.length > 5)
                                                ).length;

                                                const noteRate = totalLessons > 0 ? (filledNotesCount / totalLessons) * 100 : 0;

                                                // 3. Admin Evaluation Score
                                                const myEvaluations = teacherEvaluations?.filter(e => e.teacherId === teacher.id) || [];
                                                const adminScoreAvg = myEvaluations.length > 0
                                                    ? myEvaluations.reduce((sum, e) => sum + e.score, 0) / myEvaluations.length
                                                    : 0;

                                                // Score Calculation (40% Attendance, 30% Notes, 30% Admin Score)
                                                // If no admin score, rebalance? For now, let's just make it cumulative or separate.
                                                // Let's keep the original "System Score" as implies by logic, and show Admin Score separately.
                                                // Actually, user might want a combined one. But let's show Admin Score in its own column first.

                                                const systemScore = Math.round((attendanceRate * 0.6) + (noteRate * 0.4));

                                                // Color coding for System Score
                                                const scoreColor = systemScore >= 80 ? 'text-green-600' : systemScore >= 50 ? 'text-yellow-600' : 'text-red-600';
                                                const scoreBg = systemScore >= 80 ? 'bg-green-50' : systemScore >= 50 ? 'bg-yellow-50' : 'bg-red-50';

                                                // Initials
                                                const names = teacher.name.split(' ');
                                                const initials = names.length >= 2
                                                    ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                                                    : teacher.name.substring(0, 2).toUpperCase();

                                                return (
                                                    <tr
                                                        key={teacher.id}
                                                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setSelectedTeacherReport({ ...teacher, initials, totalLessons, lessonsWithAttendance, attendanceRate, filledNotesCount, noteRate, adminScoreAvg, systemScore, reviews: myEvaluations });
                                                            setTeacherDetailTab('history');
                                                            setIsTeacherDetailModalOpen(true);
                                                        }}
                                                    >
                                                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                                {initials}
                                                            </div>
                                                            {teacher.name}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-slate-600">{totalLessons}</td>
                                                        <td className="px-6 py-4 text-center text-slate-600">{lessonsWithAttendance}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                    <div className="bg-blue-500 h-full" style={{ width: `${attendanceRate}%` }}></div>
                                                                </div>
                                                                <span className="text-xs text-slate-500">%{Math.round(attendanceRate)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                    <div className="bg-purple-500 h-full" style={{ width: `${noteRate}%` }}></div>
                                                                </div>
                                                                <span className="text-xs text-slate-500">%{Math.round(noteRate)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <Star size={14} className={myEvaluations.length > 0 ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} />
                                                                <span className="font-bold text-slate-700">{myEvaluations.length > 0 ? Math.round(adminScoreAvg) : '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreBg} ${scoreColor}`}>
                                                                {systemScore}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'financial' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Finansal Durum Raporu (Aylık)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 font-medium text-slate-500">Okul</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-center">Öğrenci</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Aylık Beklenen</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Bu Ay Tahsilat</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Geçen Ay Tahsilat</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Toplam Tahsilat</th>
                                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Bu Ay Bakiye</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {schools
                                            .filter(s => user?.role === 'manager' ? s.id === user.id : true) // Manager sees only their school
                                            .map(school => {
                                                const schoolStudents = students.filter(s => s.schoolId === school.id && s.status === 'Active');

                                                // Calculate Monthly Expected
                                                const monthlyExpected = schoolStudents.reduce((total, student) => {
                                                    if (student.paymentStatus === 'free') return total;
                                                    if (student.paymentStatus === 'discounted' && student.discountPercentage) {
                                                        return total + ((school.defaultPrice || 0) * (100 - student.discountPercentage) / 100);
                                                    }
                                                    return total + (school.defaultPrice || 0);
                                                }, 0);

                                                // Current Month Collected
                                                const currentMonthKey = format(new Date(), 'yyyy-MM');
                                                const collectedThisMonth = payments
                                                    .filter((p: any) => p.schoolId === school.id && p.month === currentMonthKey)
                                                    .reduce((acc: number, p: any) => acc + p.amount, 0);

                                                // Previous Month Collected
                                                const prevMonthKey = format(startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1))), 'yyyy-MM');
                                                const collectedLastMonth = payments
                                                    .filter((p: any) => p.schoolId === school.id && p.month === prevMonthKey)
                                                    .reduce((acc: number, p: any) => acc + p.amount, 0);

                                                // Total Collected (All Time)
                                                const totalCollected = payments
                                                    .filter((p: any) => p.schoolId === school.id)
                                                    .reduce((acc: number, p: any) => acc + p.amount, 0);

                                                // Estimated Total Balance (Assumption: Expected * Months since start could be complex. 
                                                // Simplified: Just show Monthly Gap for now, or Total Collected. 
                                                // User asked "Kalan Ödemeler". Without a "Debt" ledger, this is MonthlyExpected - CollectedThisMonth.
                                                // If they want "Total Debt", we need a "Start Date" for the school to calculate "Months * Monthly".
                                                // For now, let's show "This Month Balance".
                                                const balanceThisMonth = monthlyExpected - collectedThisMonth;

                                                return (
                                                    <tr key={school.id} className="hover:bg-slate-50">
                                                        <td className="px-6 py-4 font-medium text-slate-900">{school.name}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                                                                {schoolStudents.length}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-medium text-slate-600">
                                                            {monthlyExpected.toLocaleString('tr-TR')} ₺
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="font-bold text-slate-900">{collectedThisMonth.toLocaleString('tr-TR')} ₺</div>
                                                            <div className="text-xs text-slate-400">
                                                                %{monthlyExpected > 0 ? Math.round((collectedThisMonth / monthlyExpected) * 100) : 0}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-slate-600">
                                                            {collectedLastMonth.toLocaleString('tr-TR')} ₺
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                                            {totalCollected.toLocaleString('tr-TR')} ₺
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={`font-bold ${balanceThisMonth > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {balanceThisMonth > 0 ? '-' : '+'}{Math.abs(balanceThisMonth).toLocaleString('tr-TR')} ₺
                                                            </span>
                                                            <div className="text-xs text-slate-400">Bu Ay Kalan</div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        {schools.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-8 text-slate-400">
                                                    Kayıtlı okul bulunamadı.
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

            {
                activeTab === 'evaluations' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-slate-500">Tarih</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Öğrenci</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Okul / Sınıf</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Değerlendiren</th>
                                    <th className="px-6 py-4 font-medium text-slate-500 text-center">Puan</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Not</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {evaluationReportData.map(row => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setSelectedEvaluation(row);
                                            setIsEvalDetailModalOpen(true);
                                        }}
                                    >
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap text-xs">
                                            {row.displayDate}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{row.studentName}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900">{row.schoolName}</div>
                                            <div className="text-xs text-slate-500">{row.className}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 text-xs">
                                            {row.evaluatorName}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${row.score >= 80 ? 'bg-green-100 text-green-700' : row.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {row.score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 italic text-xs max-w-xs truncate" title="Detay için tıklayın">
                                            {row.note}
                                        </td>
                                    </tr>
                                ))}
                                {evaluationReportData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            }

            {/* Evaluation Detail Modal */}
            <Modal
                isOpen={isEvalDetailModalOpen}
                onClose={() => setIsEvalDetailModalOpen(false)}
                title="Değerlendirme Detayı"
            >
                {selectedEvaluation && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedEvaluation.studentName}</h3>
                                <div className="text-sm text-slate-500 mt-1">
                                    {selectedEvaluation.schoolName} • {selectedEvaluation.className}
                                </div>
                            </div>
                            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 ${selectedEvaluation.score >= 80 ? 'border-green-100 text-green-700 bg-green-50' : selectedEvaluation.score >= 50 ? 'border-yellow-100 text-yellow-700 bg-yellow-50' : 'border-red-100 text-red-700 bg-red-50'}`}>
                                <span className="text-xl font-bold">{selectedEvaluation.score}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Puan</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Değerlendiren</div>
                                <div className="text-sm font-medium text-slate-700">{selectedEvaluation.evaluatorName}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Tarih</div>
                                <div className="text-sm font-medium text-slate-700">{selectedEvaluation.displayDate}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-bold text-slate-900 mb-2">Değerlendirme Notu</div>
                            <div className="p-4 bg-yellow-50 text-slate-700 rounded-xl text-sm leading-relaxed border border-yellow-100">
                                {selectedEvaluation.note}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setIsEvalDetailModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Teacher Detail Modal (History & Trends) */}
            <Modal
                isOpen={isTeacherDetailModalOpen}
                onClose={() => setIsTeacherDetailModalOpen(false)}
                title="Öğretmen Performans Detayı"
            >
                {selectedTeacherReport && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                                {selectedTeacherReport.initials}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedTeacherReport.name}</h3>
                                <div className="text-sm text-slate-500">
                                    Başarı Puanı: <span className="font-bold text-slate-900">{selectedTeacherReport.systemScore}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 mb-4">
                            <button
                                onClick={() => setTeacherDetailTab('history')}
                                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${teacherDetailTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Değerlendirme Geçmişi
                            </button>
                            <button
                                onClick={() => setTeacherDetailTab('trends')}
                                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${teacherDetailTab === 'trends' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Aylık Gelişim Grafiği
                            </button>
                        </div>

                        {/* Content: History */}
                        {teacherDetailTab === 'history' && (
                            <div className="space-y-4">
                                {selectedTeacherReport.reviews && selectedTeacherReport.reviews.length > 0 ? (
                                    selectedTeacherReport.reviews.map((rev: any) => (
                                        <div key={rev.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-xs text-slate-500 font-bold uppercase">
                                                    {format(new Date(rev.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                                                </div>
                                                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded text-yellow-800 text-xs font-bold">
                                                    <Star size={12} className="fill-yellow-600" />
                                                    {rev.score}
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-700 leading-relaxed">
                                                {rev.note}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        Henüz bir değerlendirme yapılmamış.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content: Trends */}
                        {teacherDetailTab === 'trends' && (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-lg border border-slate-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 font-medium text-slate-500">Ay</th>
                                                <th className="px-4 py-3 font-medium text-slate-500 text-center">Ders</th>
                                                <th className="px-4 py-3 font-medium text-slate-500 text-center">Yoklama</th>
                                                <th className="px-4 py-3 font-medium text-slate-500 text-center">Not</th>
                                                <th className="px-4 py-3 font-medium text-slate-500 text-center">Yönetici</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(() => {
                                                // Calculate Monthly Trends
                                                const myLessons = lessons.filter(l => l.teacherId === selectedTeacherReport.id && l.status !== 'cancelled' && !isFuture(parseISO(`${l.date}T${l.startTime}`)));

                                                // Group by Month
                                                const months: Record<string, any> = {};
                                                myLessons.forEach(l => {
                                                    const mKey = l.date.substring(0, 7); // YYYY-MM
                                                    if (!months[mKey]) months[mKey] = { lessons: [], date: l.date };
                                                    months[mKey].lessons.push(l);
                                                });

                                                // Sort months descending
                                                const sortedMonths = Object.keys(months).sort().reverse();

                                                if (sortedMonths.length === 0) return (
                                                    <tr><td colSpan={5} className="py-8 text-center text-slate-400">Veri yok.</td></tr>
                                                );

                                                return sortedMonths.map(mKey => {
                                                    const mData = months[mKey];
                                                    const total = mData.lessons.length;

                                                    // Attendance
                                                    const withAtt = mData.lessons.filter((l: any) => attendance.some(a => a.lessonId === l.id)).length;
                                                    const attRate = total > 0 ? (withAtt / total) * 100 : 0;

                                                    // Notes
                                                    const withNote = mData.lessons.filter((l: any) => (l.topic && l.topic.length > 5) || (l.notes && l.notes.length > 5)).length;
                                                    const noteRate = total > 0 ? (withNote / total) * 100 : 0;

                                                    // Admin Score for this month
                                                    // Filter evaluations created in this month
                                                    const monthlyEvals = selectedTeacherReport.reviews.filter((r: any) => r.createdAt.startsWith(mKey));
                                                    const avgScore = monthlyEvals.length > 0
                                                        ? monthlyEvals.reduce((a: number, b: any) => a + b.score, 0) / monthlyEvals.length
                                                        : null;

                                                    return (
                                                        <tr key={mKey} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                                {format(parseISO(mData.date), 'MMMM yyyy', { locale: tr })}
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-slate-600">{total}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-xs font-bold ${attRate < 50 ? 'text-red-600' : 'text-slate-700'}`}>%{Math.round(attRate)}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-xs font-bold ${noteRate < 50 ? 'text-red-600' : 'text-slate-700'}`}>%{Math.round(noteRate)}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {avgScore !== null ? (
                                                                    <span className="font-bold text-indigo-600">{Math.round(avgScore)}</span>
                                                                ) : <span className="text-slate-300">-</span>}
                                                            </td>
                                                        </tr>
                                                    )
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setIsTeacherDetailModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
}
