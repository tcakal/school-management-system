import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { ChevronRight, ChevronLeft, CheckCircle, XCircle, Clock, Save } from 'lucide-react';

export function AttendanceManager() {
    const { user } = useAuth();
    const { schools, classGroups, students, attendance, saveAttendance, lessons } = useStore();

    // Only for managers (or admins viewing as manager view style)
    // If Admin, they need to pick a school first, but simpler to just use schoolId filter if implemented globally.
    // For now, assume this page is primarily for the logged-in Manager.

    const schoolId = user?.role === 'manager' ? user.id : schools[0]?.id; // Fallback for admin dev

    const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initial Load - Select first class if available
    useMemo(() => {
        if (!selectedClassGroupId && schoolId) {
            const firstClass = classGroups.find(c => c.schoolId === schoolId);
            if (firstClass) setSelectedClassGroupId(firstClass.id);
        }
    }, [schoolId, classGroups, selectedClassGroupId]);

    const activeStudents = useMemo(() => {
        if (!selectedClassGroupId) return [];
        return students.filter(s => s.classGroupId === selectedClassGroupId && s.status === 'Active');
    }, [students, selectedClassGroupId]);

    const schoolClasses = useMemo(() => {
        return classGroups.filter(c => c.schoolId === schoolId);
    }, [classGroups, schoolId]);

    // Check if attendance already taken for this date/class
    // We need to resolve a specific Lesson ID for this date/class to save attendance correctly in standard table
    // Simplification: We look for a scheduled lesson on this date for this group.
    const currentLesson = useMemo(() => {
        return lessons.find(l =>
            l.classGroupId === selectedClassGroupId &&
            l.date === selectedDate &&
            l.status !== 'cancelled'
        );
    }, [lessons, selectedClassGroupId, selectedDate]);

    // Load existing status
    useMemo(() => {
        if (currentLesson) {
            const existing = attendance.filter(a => a.lessonId === currentLesson.id);
            const map: Record<string, any> = {};
            existing.forEach(a => map[a.studentId] = a.status);
            if (Object.keys(map).length > 0) setAttendanceState(map);
            else setAttendanceState({}); // Reset if no attendance found for this lesson
        } else {
            setAttendanceState({});
        }
    }, [currentLesson, attendance]);


    const handleToggle = (studentId: string, current: string | undefined) => {
        const statuses: ('present' | 'absent' | 'late')[] = ['present', 'absent', 'late'];
        const next = !current ? 'present' : statuses[(statuses.indexOf(current as any) + 1) % statuses.length];
        setAttendanceState(prev => ({ ...prev, [studentId]: next }));
    };

    const markAll = (status: 'present' | 'absent') => {
        const map: Record<string, any> = {};
        activeStudents.forEach(s => map[s.id] = status);
        setAttendanceState(map);
    }

    const handleSave = async () => {
        if (!currentLesson) {
            alert('Bu tarih ve grup için planlanmış bir derse rastlanmadı. Önce ders programında ders olmalı.');
            return;
        }

        setIsSaving(true);
        try {
            const records = Object.entries(attendanceState).map(([sid, status]) => ({
                studentId: sid,
                status
            }));
            await saveAttendance(currentLesson.id, records);
            alert('Yoklama kaydedildi!');
        } catch (error) {
            console.error(error);
            alert('Hata oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!schoolId) return <div className="p-6">Yönetilecek okul bulunamadı.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Hızlı Yoklama</h2>
                    <p className="text-slate-500 text-sm">Sınıf seçin ve bugünün yoklamasını alın.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() - 1);
                        setSelectedDate(d.toISOString().split('T')[0]);
                    }} className="p-1 hover:bg-slate-100 rounded">
                        <ChevronLeft size={20} />
                    </button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="border-none outline-none text-slate-900 font-medium"
                    />
                    <button onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() + 1);
                        setSelectedDate(d.toISOString().split('T')[0]);
                    }} className="p-1 hover:bg-slate-100 rounded">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Class Selector */}
            <div className="flex gap-2 check-scroll overflow-x-auto pb-2">
                {schoolClasses.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedClassGroupId(c.id)}
                        className={`px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${selectedClassGroupId === c.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'
                            }`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {/* Student List */}
            {selectedClassGroupId && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">
                            {schoolClasses.find(c => c.id === selectedClassGroupId)?.name} Listesi ({activeStudents.length})
                        </h3>
                        {!currentLesson ? (
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                                Bu tarihte ders yok
                            </span>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => markAll('present')} className="text-xs text-blue-600 hover:underline">Tümü Geldi</button>
                                <span className="text-slate-300">|</span>
                                <button onClick={() => markAll('absent')} className="text-xs text-red-600 hover:underline">Tümü Gelmedi</button>
                            </div>
                        )}
                    </div>

                    <div className="divide-y divide-slate-100">
                        {activeStudents.map(student => {
                            const status = attendanceState[student.id];
                            return (
                                <div key={student.id}
                                    onClick={() => handleToggle(student.id, status)}
                                    className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer select-none transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${status === 'present' ? 'bg-emerald-100 text-emerald-600' :
                                            status === 'absent' ? 'bg-red-100 text-red-600' :
                                                status === 'late' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-slate-100 text-slate-400'
                                            }`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className={`font-medium ${status === 'present' ? 'text-emerald-900' :
                                                status === 'absent' ? 'text-red-900' :
                                                    status === 'late' ? 'text-orange-900' :
                                                        'text-slate-900'
                                                }`}>{student.name}</p>
                                            <p className="text-xs text-slate-400">{student.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {status === 'present' && <div className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full"><CheckCircle size={16} /> Geldi</div>}
                                        {status === 'absent' && <div className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full"><XCircle size={16} /> Gelmedi</div>}
                                        {status === 'late' && <div className="flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full"><Clock size={16} /> Geç</div>}
                                        {!status && <div className="text-slate-300 text-sm">İşaretlenmedi</div>}
                                    </div>
                                </div>
                            );
                        })}
                        {activeStudents.length === 0 && (
                            <div className="p-8 text-center text-slate-400">Bu sınıfta öğrenci yok.</div>
                        )}
                    </div>

                    {currentLesson && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-200"
                            >
                                <Save size={20} />
                                {isSaving ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
