import { useStore } from '../store/useStore';
import { Calendar, MapPin } from 'lucide-react';

export function TeacherReport() {
    const { teachers, assignments, schools, classGroups } = useStore();

    // Helper to days
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Öğretmen Raporları</h2>
                <p className="text-slate-500 mt-2">Tüm öğretmenlerin ders programı ve okullara göre dağılımı.</p>
            </div>

            <div className="space-y-6">
                {teachers.map(teacher => {
                    const teacherAssignments = assignments.filter(a => a.teacherId === teacher.id);
                    // Sort by day and time
                    teacherAssignments.sort((a, b) => {
                        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                        return a.startTime.localeCompare(b.startTime);
                    });

                    return (
                        <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-slate-700 font-bold text-xl ${teacher.color}`}>
                                        {teacher.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{teacher.name}</h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                            <span>{teacher.phone}</span>
                                            {teacher.specialties && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span>{teacher.specialties.join(', ')}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-900">{teacherAssignments.length}</div>
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ders Saati / Hafta</div>
                                </div>
                            </div>

                            <div className="p-6">
                                {teacherAssignments.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {teacherAssignments.map(assignment => {
                                            const school = schools.find(s => s.id === assignment.schoolId);
                                            const group = classGroups.find(c => c.id === assignment.classGroupId);

                                            return (
                                                <div key={assignment.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                                                    <div className="mt-1 bg-blue-100 text-blue-700 p-1.5 rounded-md">
                                                        <Calendar size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                                            {days[assignment.dayOfWeek - 1]}
                                                            <span className="text-slate-300 font-light">|</span>
                                                            <span className="font-mono text-blue-600">{assignment.startTime} - {assignment.endTime}</span>
                                                        </div>
                                                        <div className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                                                            <MapPin size={14} className="text-slate-400" />
                                                            {school?.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5 ml-5">
                                                            {group?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400 italic">
                                        Bu öğretmene henüz ders atanmamış.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {teachers.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 mb-2">Henüz öğretmen kaydı bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
