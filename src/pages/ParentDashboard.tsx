import { useAuth } from '../store/useAuth';
import { StudentDashboardView } from '../components/StudentDashboardView';

export function ParentDashboard() {
    const { user } = useAuth();

    if (!user || user.role !== 'parent' || !user.linkedStudentId) {
        return <div className="p-8 text-center text-slate-500">Öğrenci bilgisi bulunamadı.</div>;
    }

    return <StudentDashboardView studentId={user.linkedStudentId} />;
}
