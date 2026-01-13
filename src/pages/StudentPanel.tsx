import { useParams, useNavigate } from 'react-router-dom';
import { StudentDashboardView } from '../components/StudentDashboardView';
import { ArrowLeft } from 'lucide-react';

export function StudentPanel() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();

    if (!studentId) {
        return <div className="p-8 text-center text-slate-500">Öğrenci ID'si belirtilmedi.</div>;
    }

    return (
        <div>
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-slate-500 hover:text-slate-800 mb-4 px-4 pt-4 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Geri Dön
            </button>
            <StudentDashboardView studentId={studentId} />
        </div>
    );
}
