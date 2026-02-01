import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { ArrowLeft, MapPin, Phone, Users, Plus, Calendar, Clock, User, Search, UserMinus, CheckCircle, Settings, Building2, Trash2 } from 'lucide-react';

import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { AssignmentModal } from '../components/AssignmentModal';
import { ShiftScheduleModal } from '../components/ShiftScheduleModal';
import { AddLessonModal } from '../components/AddLessonModal';
import type { ClassGroup, Student, EnrollmentType } from '../types';

export function BranchDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Store selectors
    const branches = useStore((state) => state.branches || []);
    const classGroups = useStore((state) => state.classGroups || []);
    const students = useStore((state) => state.students || []);
    const assignments = useStore((state) => state.assignments || []);
    const teachers = useStore((state) => state.teachers || []);

    // Actions
    const addClassGroup = useStore((state) => state.addClassGroup);
    const addStudent = useStore((state) => state.addStudent);
    const updateStudent = useStore((state) => state.updateStudent);
    const updateClassGroup = useStore((state) => state.updateClassGroup);
    const updateBranch = useStore((state) => state.updateBranch);
    const deleteAssignment = useStore((state) => state.deleteAssignment);
    const deleteClassGroup = useStore((state) => state.deleteClassGroup);

    // Initial Data Fetching
    useEffect(() => {
        if (branches.length === 0) {
            useStore.getState().fetchData();
        }
    }, [branches.length]);

    const branch = branches.find(b => b.id === id);

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
    // Shift Schedule & Add Lesson State
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);

    const [newStudentName, setNewStudentName] = useState('');
    const [newParentName, setNewParentName] = useState('');
    const [newStudentPhone, setNewStudentPhone] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [newStudentBirthDate, setNewStudentBirthDate] = useState('');
    const [newStudentGrade, setNewStudentGrade] = useState('');
    const [newStudentAddress, setNewStudentAddress] = useState('');
    const [newStudentPaymentStatus, setNewStudentPaymentStatus] = useState<'paid' | 'free' | 'discounted'>('paid');
    const [newStudentDiscount, setNewStudentDiscount] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [newStudentEnrollmentType, setNewStudentEnrollmentType] = useState<EnrollmentType>('4week');

    // Edit Student State
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editStudentName, setEditStudentName] = useState('');
    const [editParentName, setEditParentName] = useState('');
    const [editStudentPhone, setEditStudentPhone] = useState('');
    const [editStudentEmail, setEditStudentEmail] = useState('');
    const [editStudentBirthDate, setEditStudentBirthDate] = useState('');
    const [editStudentGrade, setEditStudentGrade] = useState('');
    const [editStudentAddress, setEditStudentAddress] = useState('');
    const [editStudentPaymentStatus, setEditStudentPaymentStatus] = useState<'paid' | 'free' | 'discounted'>('paid');
    const [editStudentDiscount, setEditStudentDiscount] = useState('');
    const [editStudentClassId, setEditStudentClassId] = useState('');
    const [editStudentEnrollmentType, setEditStudentEnrollmentType] = useState<EnrollmentType>('4week');

    // Student Search & Filter State
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [studentStatusFilter, setStudentStatusFilter] = useState<'Active' | 'Left' | 'All'>('Active');
    const [schoolGradeFilter, setSchoolGradeFilter] = useState<string>(''); // Okulda gittiği sınıf
    const [branchClassFilter, setBranchClassFilter] = useState<string>(''); // Şubede katıldığı sınıf

    // Student Left Modal State
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [selectedStudentForLeave, setSelectedStudentForLeave] = useState<string | null>(null);
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);

    // Handler functions
    const handleAddClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!branch || !newClassName) return;

        const newClass: ClassGroup = {
            id: crypto.randomUUID(),
            schoolId: branch.id, // Branch-specific class - use branch ID as schoolId
            branchId: branch.id,
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
        if (!branch || !newStudentName) return;

        // Class is required for 4week and 12week students
        const requiresClass = newStudentEnrollmentType === '4week' || newStudentEnrollmentType === '12week';
        if (requiresClass && !selectedClassId) {
            alert('4 Haftalık ve 12 Haftalık öğrenciler için sınıf seçimi zorunludur.');
            return;
        }

        addStudent({
            id: crypto.randomUUID(),
            schoolId: undefined, // Branch-specific student - no school
            branchId: branch.id,
            name: newStudentName,
            parentName: newParentName,
            phone: newStudentPhone,
            parentEmail: newStudentEmail,
            birthDate: newStudentBirthDate,
            gradeLevel: Number(newStudentGrade) || undefined,
            address: newStudentAddress,
            paymentStatus: newStudentPaymentStatus,
            discountPercentage: newStudentPaymentStatus === 'discounted' ? Number(newStudentDiscount) : (newStudentPaymentStatus === 'free' ? 100 : 0),
            classGroupId: selectedClassId || undefined,
            enrollmentType: newStudentEnrollmentType,
            status: 'Active',
            joinedDate: new Date().toISOString()
        });
        setNewStudentName('');
        setNewParentName('');
        setNewStudentPhone('');
        setNewStudentEmail('');
        setNewStudentBirthDate('');
        setNewStudentGrade('');
        setNewStudentAddress('');
        setNewStudentPaymentStatus('paid');
        setNewStudentDiscount('');
        setSelectedClassId('');
        setNewStudentEnrollmentType('4week');
        setIsAddStudentModalOpen(false);
    };

    const handleEditStudentClick = (student: Student) => {
        setEditingStudentId(student.id);
        setEditStudentName(student.name);
        setEditParentName(student.parentName || '');
        setEditStudentPhone(student.phone);
        setEditStudentEmail(student.parentEmail || '');
        setEditStudentBirthDate(student.birthDate || '');
        setEditStudentGrade(student.gradeLevel?.toString() || '');
        setEditStudentAddress(student.address || '');
        setEditStudentPaymentStatus(student.paymentStatus || 'paid');
        setEditStudentDiscount(student.discountPercentage?.toString() || '');
        setEditStudentClassId(student.classGroupId || '');
        setEditStudentEnrollmentType(student.enrollmentType || '4week');
        setIsEditStudentModalOpen(true);
    };

    const handleUpdateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudentId) return;

        // Class is required for 4week and 12week students
        const requiresClass = editStudentEnrollmentType === '4week' || editStudentEnrollmentType === '12week';
        if (requiresClass && !editStudentClassId) {
            alert('4 Haftalık ve 12 Haftalık öğrenciler için sınıf seçimi zorunludur.');
            return;
        }

        updateStudent(editingStudentId, {
            name: editStudentName,
            parentName: editParentName,
            phone: editStudentPhone,
            parentEmail: editStudentEmail,
            birthDate: editStudentBirthDate,
            gradeLevel: Number(editStudentGrade) || undefined,
            address: editStudentAddress,
            paymentStatus: editStudentPaymentStatus,
            discountPercentage: editStudentPaymentStatus === 'discounted' ? Number(editStudentDiscount) : (editStudentPaymentStatus === 'free' ? 100 : 0),
            classGroupId: editStudentClassId || undefined,
            enrollmentType: editStudentEnrollmentType
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

        await updateStudent(selectedStudentForLeave, {
            status: 'Left',
            leftReason: leaveReason,
            leftDate: leaveDate
        } as any);

        setIsLeaveModalOpen(false);
        setSelectedStudentForLeave(null);
        setLeaveReason('');
    };

    // Filter branch classes and students
    const branchClasses = useMemo(() => {
        if (!branch) return [];
        // Match either explicit branchId OR if the class is linked to this branch's ID as its schoolId
        return classGroups.filter(c => c.branchId === branch.id || c.schoolId === branch.id);
    }, [classGroups, branch]);

    const branchStudents = useMemo(() => {
        if (!branch) return [];
        return students.filter((s: Student) => s.branchId === branch.id);
    }, [students, branch]);

    const activeStudentCount = useMemo(() => {
        if (!branch) return 0;
        return students.filter(s => s.branchId === branch.id && s.status === 'Active').length;
    }, [students, branch]);

    // Get manager name
    const managerName = useMemo(() => {
        if (!branch?.managerId) return null;
        const manager = teachers.find(t => t.id === branch.managerId);
        return manager?.name || null;
    }, [branch, teachers]);

    if (!branch) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-200">Şube Bulunamadı</h2>
                <p className="text-slate-400 mt-2">Aradığınız şube sistemde kayıtlı değil.</p>
                <button
                    onClick={() => navigate('/schools')}
                    className="mt-4 text-blue-400 hover:text-blue-300 hover:underline"
                >
                    Geri Dön
                </button>
            </div>
        );
    }

    const baseTabs = [
        { id: 'classes', label: 'Sınıflar' },
        { id: 'all', label: 'Tümü' },
        { id: '4week', label: '4 Haftalık' },
        { id: '12week', label: '12 Haftalık' },
        { id: 'daily', label: 'Günlük' },
        { id: 'hourly', label: 'Saatlik' },
        { id: 'unassigned', label: 'Sınıflanmayan' },
    ];

    // Hide payments and settings tabs from teachers
    const tabs = user?.role === 'teacher'
        ? baseTabs
        : [...baseTabs, { id: 'payments', label: 'Ödemeler' }, { id: 'settings', label: 'Ayarlar' }];

    return (
        <div>
            <button
                onClick={() => navigate('/schools')}
                className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Geri Dön
            </button>

            {/* Header */}
            <div
                className="bg-white p-8 rounded-2xl shadow-sm border mb-8 relative overflow-hidden"
                style={{
                    borderColor: branch.color ? branch.color + '40' : '#e2e8f0',
                    backgroundColor: branch.color ? branch.color + '08' : '#ffffff'
                }}
            >
                {branch.color && (
                    <div
                        className="absolute top-0 right-0 w-64 h-64 rounded-full filter blur-3xl opacity-10 -mr-16 -mt-16 pointer-events-none"
                        style={{ backgroundColor: branch.color }}
                    />
                )}

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 size={24} style={{ color: branch.color || '#4f46e5' }} />
                            <span
                                className="px-2 py-1 rounded text-xs font-bold uppercase border"
                                style={{
                                    backgroundColor: branch.color ? branch.color + '20' : '#e0e7ff',
                                    color: branch.color || '#4338ca',
                                    borderColor: branch.color ? branch.color + '40' : '#c7d2fe'
                                }}
                            >
                                Şube
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">{branch.name}</h1>
                        <div className="flex flex-wrap items-center gap-6 mt-4 text-slate-500">
                            {branch.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} style={{ color: branch.color || '#4f46e5' }} />
                                    <span>{branch.address}</span>
                                </div>
                            )}
                            {branch.phone && (
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <Phone size={18} style={{ color: branch.color || '#4f46e5' }} />
                                    <span>{branch.phone}</span>
                                </div>
                            )}
                            {managerName && (
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <User size={18} style={{ color: branch.color || '#4f46e5' }} />
                                    <span>Yönetici: {managerName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'manager') && (
                            <>
                                {(user?.role === 'admin' || user?.role === 'manager') && (
                                    <button
                                        onClick={() => setIsShiftModalOpen(true)}
                                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg flex items-center gap-2 hover:bg-purple-200 transition-colors font-medium border border-purple-200"
                                    >
                                        <Calendar size={18} />
                                        <span className="hidden md:inline">Takvim / Tatil</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsAddLessonModalOpen(true)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors font-medium shadow-sm ml-2"
                                >
                                    <Plus size={18} />
                                    <span className="hidden md:inline">Ek Ders Ekle</span>
                                </button>
                            </>
                        )}
                        <div
                            className="px-4 py-2 rounded-lg flex items-center gap-2 border"
                            style={{
                                backgroundColor: branch.color ? branch.color + '15' : '#e0e7ff',
                                color: branch.color || '#4338ca',
                                borderColor: branch.color ? branch.color + '30' : '#c7d2fe'
                            }}
                        >
                            <Users size={18} />
                            <span className="font-bold">{activeStudentCount}</span> Aktif Öğrenci
                        </div>
                        {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'manager') && (
                            <button
                                onClick={() => setIsAddStudentModalOpen(true)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                            >
                                <Plus size={18} />
                                <span className="hidden md:inline">Öğrenci Ekle</span>
                            </button>
                        )}
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
                            {['admin', 'teacher', 'manager'].includes(user?.role || '') && (
                                <button
                                    onClick={() => setIsAddClassModalOpen(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Yeni Sınıf Ekle
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {branchClasses.map(c => {
                                const classAssignments = assignments.filter(a => a.classGroupId === c.id);
                                const classStudentCount = students.filter(s => s.classGroupId === c.id && s.status === 'Active').length;

                                return (
                                    <div
                                        key={c.id}
                                        className="relative group bg-white p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-all"
                                        style={{ borderColor: branch.color ? branch.color + '60' : '#818cf8' }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-lg text-slate-800">{c.name}</h4>
                                            <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                                                {c.schedule || 'Planlanmamış'}
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            {classAssignments.length > 0 ? (
                                                classAssignments
                                                    .sort((a, b) => {
                                                        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                                                        return a.startTime.localeCompare(b.startTime);
                                                    })
                                                    .map((a, index, array) => {
                                                        const teacher = teachers.find(t => t.id === a.teacherId);
                                                        const dayName = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][a.dayOfWeek - 1];

                                                        // Logic for break (Gap detection)
                                                        let breakElement = null;
                                                        const nextAssignment = array[index + 1];

                                                        if (nextAssignment && nextAssignment.dayOfWeek === a.dayOfWeek) {
                                                            const currentEnd = a.endTime || '10:00'; // Fallback logic
                                                            const nextStart = nextAssignment.startTime;

                                                            if (currentEnd < nextStart) {
                                                                const [endH, endM] = currentEnd.split(':').map(Number);
                                                                const [startH, startM] = nextStart.split(':').map(Number);
                                                                const diffInMinutes = (startH * 60 + startM) - (endH * 60 + endM);

                                                                if (diffInMinutes > 0) {
                                                                    let durationText = diffInMinutes + ' dk';
                                                                    if (diffInMinutes >= 60) {
                                                                        const h = Math.floor(diffInMinutes / 60);
                                                                        const m = diffInMinutes % 60;
                                                                        durationText = m > 0 ? h + ' sa ' + m + ' dk' : h + ' saat';
                                                                    }

                                                                    breakElement = (
                                                                        <div className="flex items-center gap-2 my-1 select-none opacity-90">
                                                                            <div className="h-px flex-1 border-t border-dashed border-green-300"></div>
                                                                            <div className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                                                                                <Clock size={8} />
                                                                                {durationText} Ara
                                                                            </div>
                                                                            <div className="h-px flex-1 border-t border-dashed border-green-300"></div>
                                                                        </div>
                                                                    );
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <div key={a.id}>
                                                                <div
                                                                    className="flex items-start justify-between text-sm p-2 rounded-lg"
                                                                    style={{
                                                                        backgroundColor: branch.color ? branch.color + '10' : '#eff6ff'
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <div className="font-medium text-slate-900">
                                                                            {teacher?.name || 'Unknown Teacher'}
                                                                        </div>
                                                                        <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                                                            <Calendar size={12} style={{ color: branch.color || '#64748b' }} />
                                                                            {dayName}
                                                                            <span className="opacity-40">|</span>
                                                                            <Clock size={12} style={{ color: branch.color || '#64748b' }} />
                                                                            {a.startTime} - {a.endTime}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => deleteAssignment(a.id)}
                                                                        className="opacity-50 hover:opacity-100 hover:text-red-500 transition-colors text-slate-400"
                                                                    >
                                                                        <User size={14} />
                                                                    </button>
                                                                </div>
                                                                {breakElement}
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
                                            className="w-full py-2 border border-dashed rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 text-slate-500 hover:text-slate-700"
                                            style={{
                                                borderColor: branch.color ? branch.color + '40' : '#cbd5e1'
                                            }}
                                        >
                                            <Plus size={16} />
                                            Öğretmen Ata
                                        </button>

                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                                            <span>{classStudentCount} Öğrenci</span>
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
                                                {(user?.role === 'admin' || user?.role === 'manager') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Bu sınıfı TAMAMEN silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                                                                deleteClassGroup(c.id);
                                                            }
                                                        }}
                                                        className="rounded-full p-1 border shadow-sm transition-colors text-slate-300 hover:text-red-500 bg-white hover:border-red-200"
                                                        title="Sınıfı Tamamen Sil"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {branchClasses.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500">Henüz hiç sınıf tanımlanmamış.</p>
                                    <button
                                        onClick={() => setIsAddClassModalOpen(true)}
                                        className="mt-4 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                                        style={{ backgroundColor: branch.color || '#4f46e5' }}
                                    >
                                        İlk sınıfı ekleyin
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* All Students Tab */}
                {activeTab === 'all' && (() => {
                    const enrollmentLabels: Record<string, string> = {
                        '4week': '4 Haftalık',
                        '12week': '12 Haftalık',
                        'daily': 'Günlük',
                        'hourly': 'Saatlik',
                        'unassigned': 'Sınıflandırılmamış'
                    };

                    const allStudents = branchStudents.filter(s =>
                        (studentStatusFilter === 'All' || s.status === studentStatusFilter) &&
                        (!studentSearchTerm || s.name.toLowerCase().includes(studentSearchTerm.toLowerCase())) &&
                        (!schoolGradeFilter || String(s.gradeLevel) === schoolGradeFilter) &&
                        (!branchClassFilter || s.classGroupId === branchClassFilter)
                    );

                    const availableGrades = [...new Set(branchStudents.map(s => s.gradeLevel).filter(g => g))].sort((a, b) => (a || 0) - (b || 0));

                    return (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-slate-800">Tüm Öğrenciler ({allStudents.length})</h3>
                                <div className="flex gap-3 flex-1 md:flex-none justify-end flex-wrap">
                                    <div className="relative">
                                        <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Öğrenci ara..."
                                            value={studentSearchTerm}
                                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-48 bg-white text-slate-800"
                                        />
                                    </div>
                                    <select
                                        value={schoolGradeFilter}
                                        onChange={(e) => setSchoolGradeFilter(e.target.value)}
                                        className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm"
                                    >
                                        <option value="">Okul Sınıfı</option>
                                        {availableGrades.map(g => (
                                            <option key={g} value={String(g)}>{g}. Sınıf</option>
                                        ))}
                                    </select>
                                    <select
                                        value={branchClassFilter}
                                        onChange={(e) => setBranchClassFilter(e.target.value)}
                                        className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm"
                                    >
                                        <option value="">Şube Sınıfı</option>
                                        {branchClasses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                                        <button onClick={() => setStudentStatusFilter('Active')} className={`px-3 py-2 text-sm font-medium transition-colors ${studentStatusFilter === 'Active' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Aktif</button>
                                        <div className="w-px bg-slate-300"></div>
                                        <button onClick={() => setStudentStatusFilter('Left')} className={`px-3 py-2 text-sm font-medium transition-colors ${studentStatusFilter === 'Left' ? 'bg-red-100 text-red-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Ayrılan</button>
                                        <div className="w-px bg-slate-300"></div>
                                        <button onClick={() => setStudentStatusFilter('All')} className={`px-3 py-2 text-sm font-medium transition-colors ${studentStatusFilter === 'All' ? 'bg-slate-200 text-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Tümü</button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Öğrenci</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kayıt Tipi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Okul Sınıfı</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Şube Sınıfı</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Veli</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Telefon</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Durum</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {allStudents.map(student => {
                                            const studentClass = classGroups.find(c => c.id === student.classGroupId);
                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-900">{student.name}</div>
                                                        {student.notes && <div className="text-xs text-slate-500">{student.notes}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{enrollmentLabels[student.enrollmentType || '4week']}</td>
                                                    <td className="px-4 py-3 text-slate-600">{student.gradeLevel ? `${student.gradeLevel}. Sınıf` : '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{studentClass?.name || '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{student.parentName || '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{student.phone || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                            {student.status === 'Active' ? 'Aktif' : 'Ayrıldı'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleEditStudentClick(student)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Düzenle"><Settings size={16} /></button>
                                                            {student.status === 'Active' && (
                                                                <button onClick={() => { setSelectedStudentForLeave(student.id); setIsLeaveModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Kaydını Sil"><UserMinus size={16} /></button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {allStudents.length === 0 && (
                                            <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">{studentSearchTerm ? 'Arama kriterlerine uygun öğrenci bulunamadı.' : 'Henüz öğrenci kaydı yok.'}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}

                {/* Enrollment Type Tabs (4week, 12week, daily, hourly) */}
                {['4week', '12week', 'daily', 'hourly'].includes(activeTab) && (() => {
                    const enrollmentType = activeTab as EnrollmentType;
                    const enrollmentLabels: Record<string, string> = {
                        '4week': '4 Haftalık',
                        '12week': '12 Haftalık',
                        'daily': 'Günlük',
                        'hourly': 'Saatlik',
                        'unassigned': 'Sınıflandırılmamış'
                    };

                    const typeStudents = branchStudents.filter(s =>
                        (s.enrollmentType || '4week') === enrollmentType &&
                        (studentStatusFilter === 'All' || s.status === studentStatusFilter) &&
                        (!studentSearchTerm || s.name.toLowerCase().includes(studentSearchTerm.toLowerCase())) &&
                        (!schoolGradeFilter || String(s.gradeLevel) === schoolGradeFilter) &&
                        (!branchClassFilter || s.classGroupId === branchClassFilter)
                    );

                    // Get unique grade levels from all branch students
                    const availableGrades = [...new Set(branchStudents.map(s => s.gradeLevel).filter(g => g))].sort((a, b) => (a || 0) - (b || 0));

                    return (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-slate-800">{enrollmentLabels[enrollmentType]} Öğrenciler</h3>
                                <div className="flex gap-3 flex-1 md:flex-none justify-end flex-wrap">
                                    <div className="relative">
                                        <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Öğrenci ara..."
                                            value={studentSearchTerm}
                                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-48 bg-white text-slate-800"
                                        />
                                    </div>
                                    <select
                                        value={schoolGradeFilter}
                                        onChange={(e) => setSchoolGradeFilter(e.target.value)}
                                        className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm"
                                    >
                                        <option value="">Okul Sınıfı</option>
                                        {availableGrades.map(g => (
                                            <option key={g} value={String(g)}>{g}. Sınıf</option>
                                        ))}
                                    </select>
                                    <select
                                        value={branchClassFilter}
                                        onChange={(e) => setBranchClassFilter(e.target.value)}
                                        className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm"
                                    >
                                        <option value="">Şube Sınıfı</option>
                                        {branchClasses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                                        <button onClick={() => setStudentStatusFilter('Active')} className={`px-3 py-2 text-sm font-medium transition-colors ${studentStatusFilter === 'Active' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Aktif</button>
                                        <div className="w-px bg-slate-300"></div>
                                        <button onClick={() => setStudentStatusFilter('Left')} className={`px-3 py-2 text-sm font-medium transition-colors ${studentStatusFilter === 'Left' ? 'bg-red-100 text-red-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Ayrılan</button>
                                        <div className="w-px bg-slate-300"></div>
                                        <button onClick={() => setStudentStatusFilter('All')} className={`px-3 py-2 text-sm font-medium transition-colors ${studentStatusFilter === 'All' ? 'bg-slate-200 text-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Tümü</button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Öğrenci</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Okul Sınıfı</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Şube Sınıfı</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Veli</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Telefon</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Durum</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {typeStudents.map(student => {
                                            const studentClass = classGroups.find(c => c.id === student.classGroupId);
                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-900">{student.name}</div>
                                                        {student.birthDate && <div className="text-xs text-slate-500">{new Date(student.birthDate).toLocaleDateString('tr-TR')}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{student.gradeLevel ? `${student.gradeLevel}. Sınıf` : '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{studentClass?.name || '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{student.parentName || '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{student.phone || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                            {student.status === 'Active' ? 'Aktif' : 'Ayrıldı'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleEditStudentClick(student)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Düzenle"><Settings size={16} /></button>
                                                            {student.status === 'Active' && (
                                                                <button onClick={() => { setSelectedStudentForLeave(student.id); setIsLeaveModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Kaydını Sil"><UserMinus size={16} /></button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {typeStudents.length === 0 && (
                                            <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">{studentSearchTerm ? 'Arama kriterlerine uygun öğrenci bulunamadı.' : `Henüz ${enrollmentLabels[enrollmentType]} öğrenci kaydı yok.`}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}

                {/* Unassigned Students Tab */}
                {activeTab === 'unassigned' && (() => {
                    const enrollmentLabels: Record<string, string> = {
                        '4week': '4 Haftalık',
                        '12week': '12 Haftalık',
                        'daily': 'Günlük',
                        'hourly': 'Saatlik',
                        'unassigned': 'Sınıflandırılmamış'
                    };
                    // Show ALL active students without a class assignment
                    const unassignedStudents = branchStudents.filter(s =>
                        !s.classGroupId &&
                        s.status === 'Active'
                    );
                    return (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800">Sınıflanmayan Öğrenciler ({unassignedStudents.length})</h3>
                            <p className="text-sm text-slate-500">Henüz bir sınıfa atanmamış tüm aktif öğrenciler.</p>
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Öğrenci</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kayıt Tipi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Veli</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Telefon</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {unassignedStudents.map(student => (
                                            <tr key={student.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3"><div className="font-medium text-slate-900">{student.name}</div></td>
                                                <td className="px-4 py-3 text-slate-600">{enrollmentLabels[student.enrollmentType || '4week']}</td>
                                                <td className="px-4 py-3 text-slate-600">{student.parentName || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{student.phone || '-'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleEditStudentClick(student)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Düzenle"><Settings size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {unassignedStudents.length === 0 && (
                                            <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">Sınıflanmamış öğrenci bulunmuyor.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-800">Ödeme Takibi</h3>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Öğrenci</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kayıt Tipi</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ücret</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Ödeme Durumu</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {branchStudents.filter(s => s.status === 'Active').map(student => {
                                        const enrollmentLabels: Record<string, string> = {
                                            '4week': '4 Haftalık',
                                            '12week': '12 Haftalık',
                                            'daily': 'Günlük',
                                            'hourly': 'Saatlik',
                                            'unassigned': 'Sınıflandırılmamış'
                                        };
                                        const priceMap: Record<string, number | undefined> = {
                                            '4week': branch.price4Week,
                                            '12week': branch.price12Week,
                                            'daily': branch.priceDaily,
                                            'hourly': branch.priceHourly,
                                            'unassigned': 0
                                        };
                                        const price = priceMap[student.enrollmentType || '4week'] || 0;
                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{student.name}</div>
                                                    {student.last_payment_status === 'paid' && (
                                                        <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                                                            <CheckCircle size={10} /> Son ödeme alındı
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    <div>{enrollmentLabels[student.enrollmentType || '4week']}</div>
                                                    <div className={`text-[10px] font-medium ${student.paymentStatus === 'paid' ? 'text-emerald-600' : student.paymentStatus === 'free' ? 'text-slate-500' : 'text-yellow-600'}`}>
                                                        {student.paymentStatus === 'paid' ? 'Ücretli' : student.paymentStatus === 'free' ? 'Ücretsiz' : `İndirimli (%${student.discountPercentage})`}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-700">{price > 0 ? `${price.toLocaleString('tr-TR')} ₺` : '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${student.last_payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                            student.last_payment_status === 'claimed' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                                                                'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {student.last_payment_status === 'paid' ? 'Ödendi' :
                                                                student.last_payment_status === 'claimed' ? 'Bildirim Var' :
                                                                    'Bekliyor'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {student.last_payment_status === 'claimed' && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm(`${student.name} için yapılan ödemeyi onaylıyor musunuz?`)) {
                                                                        await updateStudent(student.id, { last_payment_status: 'paid', last_payment_date: new Date().toISOString() } as any);
                                                                    }
                                                                }}
                                                                className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                            >
                                                                Onayla
                                                            </button>
                                                        )}
                                                        {student.last_payment_status !== 'paid' && student.last_payment_status !== 'claimed' && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm(`${student.name} için ödeme tahsil edildi mi?`)) {
                                                                        await updateStudent(student.id, { last_payment_status: 'paid', last_payment_date: new Date().toISOString() } as any);
                                                                    }
                                                                }}
                                                                className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                                            >
                                                                Tahsil Et
                                                            </button>
                                                        )}
                                                        {student.last_payment_status === 'paid' && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm(`${student.name} ödemesini "Bekliyor" durumuna geri almak istiyor musunuz?`)) {
                                                                        await updateStudent(student.id, { last_payment_status: 'pending' } as any);
                                                                    }
                                                                }}
                                                                className="p-1 px-2 text-slate-400 hover:text-slate-600 text-[10px]"
                                                            >
                                                                Sıfırla
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-800">Şube Fiyatlandırması</h3>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">4 Haftalık Ücret</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={branch.price4Week || ''} onChange={(e) => updateBranch(branch.id, { price4Week: parseFloat(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" />
                                        <span className="text-slate-500">₺</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">12 Haftalık Ücret</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={branch.price12Week || ''} onChange={(e) => updateBranch(branch.id, { price12Week: parseFloat(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" />
                                        <span className="text-slate-500">₺</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Günlük Ücret</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={branch.priceDaily || ''} onChange={(e) => updateBranch(branch.id, { priceDaily: parseFloat(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" />
                                        <span className="text-slate-500">₺</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Saatlik Ücret</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={branch.priceHourly || ''} onChange={(e) => updateBranch(branch.id, { priceHourly: parseFloat(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" />
                                        <span className="text-slate-500">₺</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Class Modal */}
            <Modal isOpen={isAddClassModalOpen} onClose={() => setIsAddClassModalOpen(false)} title="Yeni Sınıf Ekle">
                <form onSubmit={handleAddClass} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Adı *</label>
                        <input
                            type="text"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder="örn: Pazartesi Grubu"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
                        <input
                            type="text"
                            value={newClassSchedule}
                            onChange={(e) => setNewClassSchedule(e.target.value)}
                            placeholder="örn: Pazartesi 14:00-16:00"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsAddClassModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            Ekle
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Class Modal */}
            <Modal isOpen={isEditClassModalOpen} onClose={() => setIsEditClassModalOpen(false)} title="Sınıf Düzenle">
                <form onSubmit={handleUpdateClass} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Adı *</label>
                        <input
                            type="text"
                            value={editClassName}
                            onChange={(e) => setEditClassName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
                        <input
                            type="text"
                            value={editClassSchedule}
                            onChange={(e) => setEditClassSchedule(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsEditClassModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            Güncelle
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Shift Modal */}
            <ShiftScheduleModal
                isOpen={isShiftModalOpen}
                onClose={() => setIsShiftModalOpen(false)}
                schoolId={branch.id}
                contextName={branch.name}
            />

            {/* Add Lesson Modal */}
            <AddLessonModal
                isOpen={isAddLessonModalOpen}
                onClose={() => setIsAddLessonModalOpen(false)}
            />

            {/* Add Student Modal */}
            <Modal isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} title="Yeni Öğrenci Ekle">
                <form onSubmit={handleAddStudent} className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Öğrenci Adı *</label>
                            <input
                                type="text"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Veli Adı</label>
                            <input
                                type="text"
                                value={newParentName}
                                onChange={(e) => setNewParentName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                            <input
                                type="tel"
                                value={newStudentPhone}
                                onChange={(e) => setNewStudentPhone(e.target.value)}
                                placeholder="5xx xxx xxxx"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                            <input
                                type="email"
                                value={newStudentEmail}
                                onChange={(e) => setNewStudentEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                            <input
                                type="date"
                                value={newStudentBirthDate}
                                onChange={(e) => setNewStudentBirthDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kayıt Tipi *</label>
                            <select
                                value={newStudentEnrollmentType}
                                onChange={(e) => setNewStudentEnrollmentType(e.target.value as EnrollmentType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            >
                                <option value="4week">4 Haftalık</option>
                                <option value="12week">12 Haftalık</option>
                                <option value="daily">Günlük</option>
                                <option value="hourly">Saatlik</option>
                                <option value="unassigned">Sınıflandırılmamış</option>
                            </select>
                        </div>
                        {(newStudentEnrollmentType === '4week' || newStudentEnrollmentType === '12week') && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf *</label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    required
                                >
                                    <option value="">Sınıf Seçin</option>
                                    {branchClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                            <textarea
                                value={newStudentAddress}
                                onChange={(e) => setNewStudentAddress(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Durumu</label>
                            <select
                                value={newStudentPaymentStatus}
                                onChange={(e) => setNewStudentPaymentStatus(e.target.value as 'paid' | 'free' | 'discounted')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            >
                                <option value="paid">Ücretli</option>
                                <option value="discounted">İndirimli</option>
                                <option value="free">Ücretsiz</option>
                            </select>
                        </div>
                        {newStudentPaymentStatus === 'discounted' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">İndirim %</label>
                                <input
                                    type="number"
                                    value={newStudentDiscount}
                                    onChange={(e) => setNewStudentDiscount(e.target.value)}
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            Ekle
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Student Modal */}
            <Modal isOpen={isEditStudentModalOpen} onClose={() => setIsEditStudentModalOpen(false)} title="Öğrenci Düzenle">
                <form onSubmit={handleUpdateStudent} className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Öğrenci Adı *</label>
                            <input
                                type="text"
                                value={editStudentName}
                                onChange={(e) => setEditStudentName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Veli Adı</label>
                            <input
                                type="text"
                                value={editParentName}
                                onChange={(e) => setEditParentName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                            <input
                                type="tel"
                                value={editStudentPhone}
                                onChange={(e) => setEditStudentPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                            <input
                                type="email"
                                value={editStudentEmail}
                                onChange={(e) => setEditStudentEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                            <input
                                type="date"
                                value={editStudentBirthDate}
                                onChange={(e) => setEditStudentBirthDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kayıt Tipi *</label>
                            <select
                                value={editStudentEnrollmentType}
                                onChange={(e) => setEditStudentEnrollmentType(e.target.value as EnrollmentType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            >
                                <option value="4week">4 Haftalık</option>
                                <option value="12week">12 Haftalık</option>
                                <option value="daily">Günlük</option>
                                <option value="hourly">Saatlik</option>
                                <option value="unassigned">Sınıflandırılmamış</option>
                            </select>
                        </div>
                        {(editStudentEnrollmentType === '4week' || editStudentEnrollmentType === '12week') && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf *</label>
                                <select
                                    value={editStudentClassId}
                                    onChange={(e) => setEditStudentClassId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    required
                                >
                                    <option value="">Sınıf Seçin</option>
                                    {branchClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                            <textarea
                                value={editStudentAddress}
                                onChange={(e) => setEditStudentAddress(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Durumu</label>
                            <select
                                value={editStudentPaymentStatus}
                                onChange={(e) => setEditStudentPaymentStatus(e.target.value as 'paid' | 'free' | 'discounted')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            >
                                <option value="paid">Ücretli</option>
                                <option value="discounted">İndirimli</option>
                                <option value="free">Ücretsiz</option>
                            </select>
                        </div>
                        {editStudentPaymentStatus === 'discounted' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">İndirim %</label>
                                <input
                                    type="number"
                                    value={editStudentDiscount}
                                    onChange={(e) => setEditStudentDiscount(e.target.value)}
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsEditStudentModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            Güncelle
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Leave Modal */}
            <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Öğrenci Kaydını Sil">
                <form onSubmit={handleMarkAsLeft} className="space-y-4">
                    <p className="text-slate-300">Bu öğrenciyi "Ayrıldı" olarak işaretlemek üzeresiniz.</p>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ayrılma Sebebi *</label>
                        <textarea
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            placeholder="Ayrılma sebebini yazın..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ayrılma Tarihi</label>
                        <input
                            type="date"
                            value={leaveDate}
                            onChange={(e) => setLeaveDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsLeaveModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                            Kaydı Sil
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Assignment Modal */}
            {isAssignmentModalOpen && (
                <AssignmentModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    schoolId={id || ''} // Branch-specific
                    classGroupId={selectedClassIdForAssignment}
                />
            )}
        </div>
    );
}
