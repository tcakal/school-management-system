import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, ArrowRight, User } from 'lucide-react';
import { Modal } from '../components/Modal';

export function Students() {
    const { students, schools, classGroups } = useStore();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'Active' | 'Left' | 'All'>('All');

    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // Filter by School
            if (selectedSchoolId !== 'all' && student.schoolId !== selectedSchoolId) return false;

            // Filter by Status
            if (statusFilter !== 'All' && student.status !== statusFilter) return false;

            // Filter by Search Term
            if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            return true;
        });
    }, [students, selectedSchoolId, statusFilter, searchTerm]);

    const handleViewDetail = (student: any) => {
        setSelectedStudent(student);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Tüm Öğrenciler</h2>
                <p className="text-slate-500 mt-1">Sistemdeki kayıtlı tüm öğrencileri görüntüleyin ve arayın.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="İsim ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <select
                        value={selectedSchoolId}
                        onChange={(e) => setSelectedSchoolId(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-slate-900"
                    >
                        <option value="all">Tüm Okullar</option>
                        {schools.map(school => (
                            <option key={school.id} value={school.id}>{school.name}</option>
                        ))}
                    </select>

                    <div className="flex rounded-lg border border-slate-300 overflow-hidden shrink-0">
                        <button
                            onClick={() => setStatusFilter('All')}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${statusFilter === 'All' ? 'bg-slate-100 text-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            Tümü
                        </button>
                        <div className="w-px bg-slate-300"></div>
                        <button
                            onClick={() => setStatusFilter('Active')}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${statusFilter === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            Aktif
                        </button>
                        <div className="w-px bg-slate-300"></div>
                        <button
                            onClick={() => setStatusFilter('Left')}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${statusFilter === 'Left' ? 'bg-red-50 text-red-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            Ayrılan
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Öğrenci</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Okul</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sınıf</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Veli E-posta</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Durum</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Detay</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map(student => {
                            const school = schools.find(s => s.id === student.schoolId);
                            const activeClassInfo = classGroups.find(c => c.id === student.classGroupId);

                            return (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleViewDetail(student)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{student.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{student.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                        {school?.name || 'Bilinmiyor'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {activeClassInfo ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {activeClassInfo.name}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {student.parentEmail || <span className="text-slate-300 italic">-</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {student.status === 'Active' ? 'Aktif' : 'Ayrıldı'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetail(student);
                                            }}
                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                            title="Detay Görüntüle"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    Aradığınız kriterlere uygun öğrenci bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="text-right text-xs text-slate-400 mt-2">
                Toplam {filteredStudents.length} kayıt listeleniyor
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="Öğrenci Detayı"
                >
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                                ${selectedStudent.status === 'Active' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Okul</span>
                                <span className="font-medium text-slate-900">
                                    {schools.find(s => s.id === selectedStudent.schoolId)?.name}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Sınıf</span>
                                <span className="font-medium text-slate-900">
                                    {classGroups.find(c => c.id === selectedStudent.classGroupId)?.name || '-'}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Telefon</span>
                                <span className="font-medium text-slate-900">
                                    {selectedStudent.phone || '-'}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">Veli E-posta</span>
                                <span className="font-medium text-slate-900">
                                    {selectedStudent.parentEmail || '-'}
                                </span>
                            </div>
                        </div>

                        {selectedStudent.status === 'Left' && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                                    ⚠️ Ayrılma Bilgisi
                                </h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-xs text-red-600 font-bold block">Ayrılma Tarihi</span>
                                        <span className="text-sm text-red-900">
                                            {selectedStudent.leftDate ? new Date(selectedStudent.leftDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-red-600 font-bold block">Ayrılma Nedeni</span>
                                        <p className="text-sm text-red-900 bg-white/50 p-2 rounded mt-1 border border-red-100">
                                            {selectedStudent.leftReason || 'Sebep belirtilmedi.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    navigate(`/school/${selectedStudent.schoolId}`);
                                }}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm transition-colors"
                            >
                                Okul Sayfasına Git
                            </button>
                            {selectedStudent.status === 'Left' && (
                                <button
                                    onClick={() => {
                                        useStore.getState().updateStudent(selectedStudent.id, {
                                            status: 'Active',
                                            leftDate: undefined,
                                            leftReason: undefined
                                        } as any);
                                        setIsDetailModalOpen(false);
                                    }}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors"
                                >
                                    Tekrar Aktif Et
                                </button>
                            )}
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
