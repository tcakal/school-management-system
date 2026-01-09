import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { ArrowLeft, MapPin, Phone, Users, Wallet, Plus, Calendar, Clock, User, Search, UserMinus, UserCheck, Settings } from 'lucide-react';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { AssignmentModal } from '../components/AssignmentModal';
import type { ClassGroup, Student } from '../types';

export function SchoolDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { schools, classGroups, students, assignments, teachers, addClassGroup, addStudent, updateSchool, deleteAssignment, updateStudent, updateClassGroup, updateAssignment } = useStore();
    const [activeTab, setActiveTab] = useState('classes');

    // Assignment State
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedClassIdForAssignment, setSelectedClassIdForAssignment] = useState('');

    // Add Class State
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassSchedule, setNewClassSchedule] = useState('');

    // Edit Class State
    const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
    const [editingClassId, setEditingClassId] = useState<string | null>(null);
    const [editClassName, setEditClassName] = useState('');
    const [editClassSchedule, setEditClassSchedule] = useState('');

    // Add Student State
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentPhone, setNewStudentPhone] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState(''); // Parent Email
    const [newStudentBirthDate, setNewStudentBirthDate] = useState('');
    const [newStudentGrade, setNewStudentGrade] = useState('');
    const [newStudentAddress, setNewStudentAddress] = useState('');
    const [newStudentMedical, setNewStudentMedical] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // Edit Student State
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editStudentName, setEditStudentName] = useState('');
    const [editStudentPhone, setEditStudentPhone] = useState('');
    const [editStudentEmail, setEditStudentEmail] = useState('');
    const [editStudentBirthDate, setEditStudentBirthDate] = useState('');
    const [editStudentGrade, setEditStudentGrade] = useState('');
    const [editStudentAddress, setEditStudentAddress] = useState('');
    const [editStudentMedical, setEditStudentMedical] = useState('');
    const [editStudentClassId, setEditStudentClassId] = useState('');

    // Student Search & Filter State
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [studentStatusFilter, setStudentStatusFilter] = useState<'Active' | 'Left' | 'All'>('Active');

    // Student Left Modal State
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [selectedStudentForLeave, setSelectedStudentForLeave] = useState<string | null>(null);
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);

    // Financial Settings State
    const school = schools.find(s => s.id === id);
    const [price, setPrice] = useState(school?.defaultPrice?.toString() || '');
    const [paymentTerms, setPaymentTerms] = useState(school?.paymentTerms || '');

    const handleAddClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!school || !newClassName) return;

        const newClass: ClassGroup = {
            id: crypto.randomUUID(),
            schoolId: school.id,
            name: newClassName,
            schedule: newClassSchedule
        };

        addClassGroup(newClass);
        setIsAddClassModalOpen(false);
        setNewClassName('');
        setNewClassSchedule('');
    };

    const handleEditClassClick = (group: ClassGroup) => {
        setEditingClassId(group.id);
        setEditClassName(group.name);
        setEditClassSchedule(group.schedule || '');
        setIsEditClassModalOpen(true);
    };

    const handleUpdateClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClassId) return;

        updateClassGroup(editingClassId, {
            name: editClassName,
            schedule: editClassSchedule
        });

        setIsEditClassModalOpen(false);
        setEditingClassId(null);
    };

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!school || !newStudentName || !selectedClassId) return;

        addStudent({
            id: crypto.randomUUID(),
            schoolId: school.id,
            name: newStudentName,
            phone: newStudentPhone,
            parentEmail: newStudentEmail,
            birthDate: newStudentBirthDate,
            gradeLevel: Number(newStudentGrade) || undefined,
            address: newStudentAddress,
            medicalNotes: newStudentMedical,
            classGroupId: selectedClassId || undefined,
            status: 'Active',
            joinedDate: new Date().toISOString()
        });
        setNewStudentName('');
        setNewStudentPhone('');
        setNewStudentEmail('');
        setNewStudentBirthDate('');
        setNewStudentGrade('');
        setNewStudentAddress('');
        setNewStudentMedical('');
        setSelectedClassId('');
        setIsAddStudentModalOpen(false);
    };

    const handleEditStudentClick = (student: Student) => {
        setEditingStudentId(student.id);
        setEditStudentName(student.name);
        setEditStudentPhone(student.phone);
        setEditStudentEmail(student.parentEmail || '');
        setEditStudentBirthDate(student.birthDate || '');
        setEditStudentGrade(student.gradeLevel?.toString() || '');
        setEditStudentAddress(student.address || '');
        setEditStudentMedical(student.medicalNotes || '');
        setEditStudentClassId(student.classGroupId || '');
        setIsEditStudentModalOpen(true);
    };

    const handleUpdateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudentId) return;

        updateStudent(editingStudentId, {
            name: editStudentName,
            phone: editStudentPhone,
            parentEmail: editStudentEmail,
            birthDate: editStudentBirthDate,
            gradeLevel: Number(editStudentGrade) || undefined,
            address: editStudentAddress,
            medicalNotes: editStudentMedical,
            classGroupId: editStudentClassId || undefined
        });

        setIsEditStudentModalOpen(false);
        setEditingStudentId(null);
    };

    const handleMarkAsLeft = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentForLeave) return;

        if (!leaveReason.trim()) {
            alert('Lütfen kaydın silinme sebebini belirtiniz.');
            return;
        }

        // Ensure leaveDate is up-to-date before the update
        setLeaveDate(new Date().toISOString().split('T')[0]);

        await updateStudent(selectedStudentForLeave, {
            status: 'Left',
            leftReason: leaveReason,
            leftDate: leaveDate
        } as any);

        setIsLeaveModalOpen(false);
        setSelectedStudentForLeave(null);
        setLeaveReason('');
    };

    const handleSaveFinancials = () => {
        if (!school) return;
        updateSchool(school.id, {
            defaultPrice: Number(price),
            paymentTerms: paymentTerms
        });
        alert('Ayarlar kaydedildi.');
    };

    const filteredStudents = useMemo(() => {
        if (!school) return [];
        return students.filter(s => {
            if (s.schoolId !== school.id) return false;

            // Filter by Status
            if (studentStatusFilter !== 'All' && s.status !== studentStatusFilter) return false;

            // Filter by Search Term
            if (studentSearchTerm && !s.name.toLowerCase().includes(studentSearchTerm.toLowerCase())) return false;

            return true;
        });
    }, [students, school, studentSearchTerm, studentStatusFilter]);

    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';

    if (!school) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-800">Okul Bulunamadı</h2>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    Panele Dön
                </button>
            </div>
        );
    }

    const schoolClasses = classGroups.filter(c => c.schoolId === school.id);
    const activeStudentCount = students.filter(s => s.schoolId === school.id && s.status === 'Active').length;

    const tabs = [
        { id: 'classes', label: 'Sınıflar / Gruplar' },
        { id: 'students', label: 'Öğrenciler' },
    ];

    if (!isTeacher) {
        tabs.push({ id: 'financials', label: 'Finansal Ayarlar' });
    }

    return (
        <div>
            <button
                onClick={() => navigate('/')}
                className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Geri Dön
            </button>

            {/* Header */}
            <div
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8 relative overflow-hidden"
                style={{
                    backgroundColor: school.color ? `${school.color}20` : undefined, // Increased from 10 to 20
                    borderColor: school.color ? `${school.color}50` : undefined // Increased from 30 to 50
                }}
            >
                {/* Background Pattern or Image */}
                {school.imageUrl && (
                    <div
                        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center pointer-events-none"
                        style={{ backgroundImage: `url(${school.imageUrl})` }}
                    />
                )}
                {/* Fallback decorative gradient if no image but color exists */}
                {!school.imageUrl && school.color && (
                    <div
                        className="absolute top-0 right-0 w-64 h-64 rounded-full filter blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"
                        style={{ backgroundColor: school.color }}
                    />
                )}

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
                    <div className="flex-1">
                        <h1
                            className="text-3xl font-bold text-slate-900"
                            style={{ color: school.color }}
                        >
                            {school.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 mt-4 text-slate-500">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} style={{ color: school.color }} />
                                <span>{school.address}</span>
                            </div>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                                <Phone size={18} style={{ color: school.color }} />
                                <span>{school.phone}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div
                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2"
                            style={{
                                backgroundColor: school.color ? `${school.color}15` : undefined,
                                color: school.color
                            }}
                        >
                            <Users size={18} />
                            <span className="font-bold">{activeStudentCount}</span> Aktif Öğrenci
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={tabs}
            />

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'classes' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Tanımlı Sınıflar</h3>
                            <button
                                onClick={() => setIsAddClassModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Yeni Sınıf Ekle
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {schoolClasses.map(c => {
                                const classAssignments = assignments.filter(a => a.classGroupId === c.id);

                                return (
                                    <div key={c.id} className={`relative group bg-white p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${c.status === 'archived' ? 'opacity-90 bg-orange-50/30 border-orange-300' : 'border-green-400'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold text-lg ${c.status === 'archived' ? 'text-slate-500' : 'text-slate-800'}`}>{c.name}</h4>
                                                {c.status === 'archived' && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-orange-100 text-orange-600 rounded-full border border-orange-200">Arşiv</span>
                                                )}
                                            </div>
                                            <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                                                {c.schedule || 'Planlanmamış'}
                                            </div>
                                        </div>


                                        <div className="space-y-3 mb-4">
                                            {classAssignments.length > 0 ? (
                                                classAssignments.map(a => {
                                                    const teacher = teachers.find(t => t.id === a.teacherId);
                                                    const dayName = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][a.dayOfWeek - 1];

                                                    return (
                                                        <div key={a.id} className="flex items-start justify-between text-sm bg-blue-50 p-2 rounded-lg">
                                                            <div>
                                                                <div className="font-medium text-blue-900">{teacher?.name || 'Unknown Teacher'}</div>
                                                                <div className="text-blue-700 text-xs flex items-center gap-1 mt-0.5">
                                                                    <Calendar size={12} />
                                                                    {dayName}
                                                                    <span className="text-blue-300">|</span>
                                                                    <Clock size={12} />
                                                                    {a.startTime} - {a.endTime}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => deleteAssignment(a.id)}
                                                                className="text-blue-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <User size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-sm text-slate-400 italic">Henüz öğretmen atanmamış</div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedClassIdForAssignment(c.id);
                                                setIsAssignmentModalOpen(true);
                                            }}
                                            className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} />
                                            Öğretmen Ata
                                        </button>

                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                                            <span>
                                                {students.filter(s => s.classGroupId === c.id && s.status === 'Active').length} Öğrenci
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClassClick(c);
                                                    }}
                                                    className="rounded-full p-1 border shadow-sm transition-colors text-slate-400 hover:text-blue-500 bg-white hover:border-blue-200"
                                                    title="Sınıfı Düzenle"
                                                >
                                                    <Settings size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(c.status === 'archived' ? 'Bu sınıfı tekrar aktif etmek istiyor musunuz?' : 'Bu sınıfı arşivlemek istiyor musunuz? Gelecek dersler takvimden silinecek ama geçmiş kayıtlar tutulacaktır.')) {
                                                            useStore.getState().toggleClassStatus(c.id, c.status === 'archived' ? 'active' : 'archived');
                                                        }
                                                    }}
                                                    className={`rounded-full p-1 border shadow-sm transition-colors ${c.status === 'archived'
                                                        ? 'text-slate-400 hover:text-green-600 bg-white hover:border-green-200'
                                                        : 'text-slate-300 hover:text-orange-500 bg-white hover:border-orange-200'
                                                        }`}
                                                    title={c.status === 'archived' ? "Sınıfı Aktif Et" : "Sınıfı Arşivle"}
                                                >
                                                    {c.status === 'archived' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1z"></path><path d="M10 12h4"></path></svg>
                                                    )}
                                                </button>
                                                {useAuth.getState().user?.role === 'admin' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Bu sınıfı TAMAMEN silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                                                                const { deleteClassGroup } = useStore.getState();
                                                                deleteClassGroup(c.id);
                                                            }
                                                        }}
                                                        className="text-slate-300 hover:text-red-500 bg-white rounded-full p-1 border border-slate-100 shadow-sm"
                                                        title="Sınıfı Tamamen Sil"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {schoolClasses.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500">Henüz hiç sınıf tanımlanmamış.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-slate-800">Kayıtlı Öğrenciler</h3>

                            <div className="flex gap-3 flex-1 md:flex-none justify-end">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Öğrenci ara..."
                                        value={studentSearchTerm}
                                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 text-slate-900"
                                    />
                                </div>

                                <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                                    <button
                                        onClick={() => setStudentStatusFilter('Active')}
                                        className={`px-3 py-2 text-sm font-medium transition-colors ${studentStatusFilter === 'Active' ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Aktif
                                    </button>
                                    <div className="w-px bg-slate-300"></div>
                                    <button
                                        onClick={() => setStudentStatusFilter('Left')}
                                        className={`px-3 py-2 text-sm font-medium transition-colors ${studentStatusFilter === 'Left' ? 'bg-red-50 text-red-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Ayrılan
                                    </button>
                                    <div className="w-px bg-slate-300"></div>
                                    <button
                                        onClick={() => setStudentStatusFilter('All')}
                                        className={`px-3 py-2 text-sm font-medium transition-colors ${studentStatusFilter === 'All' ? 'bg-slate-100 text-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Tümü
                                    </button>
                                </div>

                                <button
                                    onClick={() => setIsAddStudentModalOpen(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    <span className="hidden md:inline">Yeni Kayıt</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Adı Soyadı</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sınıfı</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Telefon</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Durum</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.map(student => {
                                        const group = classGroups.find(c => c.id === student.classGroupId);
                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">
                                                    {student.name}
                                                    {student.status === 'Left' && (
                                                        <div className="text-xs text-red-500 font-normal mt-0.5">
                                                            {student.leftDate ? new Date(student.leftDate).toLocaleDateString('tr-TR') : ''} tarihinde ayrıldı ({student.leftReason || 'Sebep belirtilmedi'})
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {group ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {group.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-mono text-sm">{student.phone}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {student.status === 'Active' ? 'Aktif' : 'Ayrıldı'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {student.status === 'Active' ? (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedStudentForLeave(student.id);
                                                                    setIsLeaveModalOpen(true);
                                                                }}
                                                                className="text-sm font-medium text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1"
                                                                title="Ayrıldı Olarak İşaretle"
                                                            >
                                                                <UserMinus size={16} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => updateStudent(student.id, { status: 'Active', leftDate: undefined, leftReason: undefined } as any)}
                                                                className="text-sm font-medium text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
                                                                title="Tekrar Aktif Et"
                                                            >
                                                                <UserCheck size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEditStudentClick(student)}
                                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 ml-2"
                                                        >
                                                            Düzenle
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                {students.length > 0
                                                    ? 'Arama kriterlerine uygun öğrenci bulunamadı.'
                                                    : 'Bu okulda henüz kayıtlı öğrenci yok.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Wallet size={20} className="text-emerald-600" />
                            Varsayılan Ödeme Ayarları
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Öğrenci Başı Aylık Ücret (TL)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Planı Açıklaması</label>
                                <textarea
                                    value={paymentTerms}
                                    onChange={(e) => setPaymentTerms(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-slate-900"
                                    placeholder="Örn: 9 Taksit, Ayın 15'inde ödenir."
                                ></textarea>
                            </div>
                            <button
                                onClick={handleSaveFinancials}
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                            >
                                Ayarları Kaydet
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal
                isOpen={isAddClassModalOpen}
                onClose={() => setIsAddClassModalOpen(false)}
                title="Yeni Sınıf Ekle"
            >
                <form onSubmit={handleAddClass} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Adı</label>
                        <input
                            type="text"
                            required
                            placeholder="Örn: Robotik A"
                            value={newClassName}
                            onChange={e => setNewClassName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Program (Bilgi amaçlı)</label>
                        <input
                            type="text"
                            placeholder="Örn: Salı 14:00"
                            value={newClassSchedule}
                            onChange={e => setNewClassSchedule(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Ekle
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={isAddStudentModalOpen}
                onClose={() => setIsAddStudentModalOpen(false)}
                title="Yeni Öğrenci Kaydet"
            >
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Adı Soyadı</label>
                            <input
                                type="text"
                                required
                                placeholder="Ad Soyad"
                                value={newStudentName}
                                onChange={e => setNewStudentName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                            <input
                                type="tel"
                                placeholder="0555 555 5555"
                                value={newStudentPhone}
                                onChange={e => setNewStudentPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                            <input
                                type="date"
                                value={newStudentBirthDate}
                                onChange={e => setNewStudentBirthDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Seviyesi</label>
                            <select
                                value={newStudentGrade}
                                onChange={e => setNewStudentGrade(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            >
                                <option value="">Seçiniz</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                                    <option key={g} value={g}>{g}. Sınıf</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Veli E-posta <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            required
                            placeholder="veli@ornek.com"
                            value={newStudentEmail}
                            onChange={e => setNewStudentEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                        <textarea
                            rows={2}
                            placeholder="Açık adres..."
                            value={newStudentAddress}
                            onChange={e => setNewStudentAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Özel Notlar / Sağlık</label>
                        <textarea
                            rows={2}
                            placeholder="Alerji, ilaç kullanımı vb..."
                            value={newStudentMedical}
                            onChange={e => setNewStudentMedical(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Seçimi</label>
                        <select
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        >
                            <option value="">Sınıf Seçilmedi</option>
                            {schoolClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Kaydet
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={isEditStudentModalOpen}
                onClose={() => setIsEditStudentModalOpen(false)}
                title="Öğrenci Düzenle"
            >
                <form onSubmit={handleUpdateStudent} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Adı Soyadı</label>
                            <input
                                type="text"
                                required
                                placeholder="Ad Soyad"
                                value={editStudentName}
                                onChange={e => setEditStudentName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                            <input
                                type="tel"
                                placeholder="0555 555 5555"
                                value={editStudentPhone}
                                onChange={e => setEditStudentPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                            <input
                                type="date"
                                value={editStudentBirthDate}
                                onChange={e => setEditStudentBirthDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Seviyesi</label>
                            <select
                                value={editStudentGrade}
                                onChange={e => setEditStudentGrade(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            >
                                <option value="">Seçiniz</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                                    <option key={g} value={g}>{g}. Sınıf</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Veli E-posta <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            required
                            placeholder="veli@ornek.com"
                            value={editStudentEmail}
                            onChange={e => setEditStudentEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                        <textarea
                            rows={2}
                            placeholder="Açık adres..."
                            value={editStudentAddress}
                            onChange={e => setEditStudentAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Özel Notlar / Sağlık</label>
                        <textarea
                            rows={2}
                            placeholder="Alerji, ilaç kullanımı vb..."
                            value={editStudentMedical}
                            onChange={e => setEditStudentMedical(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Seçimi</label>
                        <select
                            value={editStudentClassId}
                            onChange={e => setEditStudentClassId(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        >
                            <option value="">Sınıf Seçiniz</option>
                            {schoolClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsEditStudentModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                        >
                            Güncelle
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                title="Öğrenci Kaydını Sonlandır"
            >
                <form onSubmit={handleMarkAsLeft} className="space-y-4">
                    <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg mb-4">
                        Bu öğrenciyi "Ayrıldı" olarak işaretlemek üzeresiniz. Bu işlem sonrası öğrenci "Ayrılanlar" listesine taşınacaktır.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ayrılma Tarihi</label>
                        <input
                            type="date"
                            required
                            value={leaveDate}
                            onChange={e => setLeaveDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ayrılma Sebebi</label>
                        <textarea
                            placeholder="Örn: Taşınma, Maddi Nedenler, Memnuniyetsizlik..."
                            value={leaveReason}
                            onChange={e => setLeaveReason(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-slate-900"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsLeaveModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                        >
                            Ayrıldı Olarak İşaretle
                        </button>
                    </div>
                </form>
            </Modal>

            <AssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                schoolId={school.id}
                classGroupId={selectedClassIdForAssignment}
            />

            {/* Edit Class Modal */}
            <Modal
                isOpen={isEditClassModalOpen}
                onClose={() => setIsEditClassModalOpen(false)}
                title="Sınıf Düzenle"
            >
                <div className="space-y-6">
                    <form onSubmit={handleUpdateClass} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Adı</label>
                            <input
                                type="text"
                                required
                                className="w-full border-slate-300 rounded-lg text-slate-900"
                                value={editClassName}
                                onChange={e => setEditClassName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ders Programı (Görünen İsim)</label>
                            <input
                                type="text"
                                className="w-full border-slate-300 rounded-lg text-slate-900"
                                value={editClassSchedule}
                                onChange={e => setEditClassSchedule(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                İsim Güncelle
                            </button>
                        </div>
                    </form>

                    <div className="pt-6 border-t border-slate-200">
                        <h4 className="font-medium text-slate-900 mb-4">Ders Programı ve Öğretmenler</h4>
                        <div className="space-y-3">
                            {assignments.filter(a => a.classGroupId === editingClassId).map(assignment => {
                                const teacher = teachers.find(t => t.id === assignment.teacherId);
                                return (
                                    <div key={assignment.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">Gün</label>
                                                <select
                                                    className="w-full text-sm border-slate-300 rounded-md text-slate-900"
                                                    value={assignment.dayOfWeek}
                                                    onChange={(e) => {
                                                        const newVal = parseInt(e.target.value);
                                                        if (window.confirm('Ders gününü değiştirmek istiyor musunuz? Gelecek dersler yeniden oluşturulacak.')) {
                                                            updateAssignment(assignment.id, { dayOfWeek: newVal }, true);
                                                        }
                                                    }}
                                                >
                                                    <option value={1}>Pazartesi</option>
                                                    <option value={2}>Salı</option>
                                                    <option value={3}>Çarşamba</option>
                                                    <option value={4}>Perşembe</option>
                                                    <option value={5}>Cuma</option>
                                                    <option value={6}>Cumartesi</option>
                                                    <option value={7}>Pazar</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">Saatler (Başlangıç - Bitiş)</label>
                                                <div className="flex gap-2 items-center">
                                                    <select
                                                        className="w-full text-sm border-slate-300 rounded-md text-slate-900"
                                                        value={assignment.startTime}
                                                        onChange={(e) => {
                                                            if (window.confirm('Ders saatini değiştirmek istiyor musunuz? Gelecek dersler güncellenecek.')) {
                                                                updateAssignment(assignment.id, { startTime: e.target.value }, true);
                                                            }
                                                        }}
                                                    >
                                                        {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                    <span className="text-slate-400">-</span>
                                                    <select
                                                        className="w-full text-sm border-slate-300 rounded-md text-slate-900"
                                                        value={assignment.endTime || '10:00'}
                                                        onChange={(e) => {
                                                            if (window.confirm('Ders bitiş saatini değiştirmek istiyor musunuz? Gelecek dersler güncellenecek.')) {
                                                                updateAssignment(assignment.id, { endTime: e.target.value }, true);
                                                            }
                                                        }}
                                                    >
                                                        {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                            <span>Öğretmen: <strong>{teacher?.name}</strong></span>
                                            <button
                                                onClick={() => deleteAssignment(assignment.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Kaldır
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {assignments.filter(a => a.classGroupId === editingClassId).length === 0 && (
                                <div className="text-sm text-slate-400 text-center py-2">
                                    Atanmış ders yok.
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setIsEditClassModalOpen(false);
                                    setSelectedClassIdForAssignment(editingClassId || '');
                                    setIsAssignmentModalOpen(true);
                                }}
                                className="w-full py-2 bg-white border border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <Plus size={14} />
                                Yeni Ders/Öğretmen Ekle
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
