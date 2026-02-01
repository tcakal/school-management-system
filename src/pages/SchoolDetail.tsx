import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { ArrowLeft, MapPin, Phone, Users, Wallet, Plus, Calendar, Clock, User, Search, UserMinus, UserCheck, Settings, RefreshCw, Package, Trash2, Edit2 } from 'lucide-react';

import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { AddLessonModal } from '../components/AddLessonModal';
import { ShiftScheduleModal } from '../components/ShiftScheduleModal';


import { AssignmentModal } from '../components/AssignmentModal';
import { TimeSelect } from '../components/TimeSelect';
import { MakerFairTab } from '../components/MakerFairTab';
import { EventMatrixPlanner } from '../components/EventMatrixPlanner';
import type { ClassGroup, Student } from '../types';

export function SchoolDetail({ schoolId: propSchoolId }: { schoolId?: string }) {
    const { id: paramId } = useParams<{ id: string }>();
    const id = propSchoolId || paramId;
    const { user } = useAuth(); // Needed for security check
    const navigate = useNavigate();

    // Security Check: Specific redirect for Managers trying to access other schools
    useEffect(() => {
        if (user?.role === 'manager' && id !== user.id) {
            navigate('/manager-dashboard'); // Redirect to their safe dashboard
        }
    }, [user, id, navigate]);
    // Granular Selectors to prevent infinite loops (Error #185)
    // We select only what we need, and use shallow comparison where appropriate if returning objects
    const schools = useStore((state) => state.schools || []);
    const classGroups = useStore((state) => state.classGroups || []);
    const students = useStore((state) => state.students || []);
    const assignments = useStore((state) => state.assignments || []);
    const teachers = useStore((state) => state.teachers || []);

    // Actions (stable references)
    const addClassGroup = useStore((state) => state.addClassGroup);
    const addStudent = useStore((state) => state.addStudent);
    const updateSchool = useStore((state) => state.updateSchool);
    const deleteAssignment = useStore((state) => state.deleteAssignment);
    const updateStudent = useStore((state) => state.updateStudent);
    const updateClassGroup = useStore((state) => state.updateClassGroup);
    const updateAssignment = useStore((state) => state.updateAssignment);

    // Initial Data Fetching Check
    useEffect(() => {
        // If we are on this page and schools are empty (e.g. hard refresh), force fetch
        if (schools.length === 0) {
            useStore.getState().fetchData();
        }
    }, [schools.length]);

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
    const [newParentName, setNewParentName] = useState(''); // New Parent Name State
    const [newStudentPhone, setNewStudentPhone] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState(''); // Parent Email
    const [newStudentBirthDate, setNewStudentBirthDate] = useState('');
    const [newStudentGrade, setNewStudentGrade] = useState('');
    const [newStudentAddress, setNewStudentAddress] = useState('');
    // Removed medical notes state
    const [newStudentPaymentStatus, setNewStudentPaymentStatus] = useState<'paid' | 'free' | 'discounted'>('paid');
    const [newStudentDiscount, setNewStudentDiscount] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // Edit Student State
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editStudentName, setEditStudentName] = useState('');
    const [editParentName, setEditParentName] = useState(''); // New Parent Name State
    const [editStudentPhone, setEditStudentPhone] = useState('');
    const [editStudentEmail, setEditStudentEmail] = useState('');
    const [editStudentBirthDate, setEditStudentBirthDate] = useState('');
    const [editStudentGrade, setEditStudentGrade] = useState('');
    const [editStudentAddress, setEditStudentAddress] = useState('');
    // Removed medical notes state
    const [editStudentPaymentStatus, setEditStudentPaymentStatus] = useState<'paid' | 'free' | 'discounted'>('paid');
    const [editStudentDiscount, setEditStudentDiscount] = useState('');
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

    // Calendar / Holiday Shift State
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);

    // Inventory State
    // Fix: Select raw inventory and filter with useMemo to avoid infinite loop (Error #185) caused by new array reference in useSyncExternalStore
    const allInventory = useStore((state) => state.inventory || []);
    const inventory = useMemo(() => activeTab === 'inventory' ? allInventory.filter(i => i.schoolId === id) : [], [allInventory, id, activeTab]);

    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('');
    const [newItemNotes, setNewItemNotes] = useState('');

    useEffect(() => {
        if (activeTab === 'inventory' && id) {
            useStore.getState().fetchInventory(id);
        }
    }, [activeTab, id]);

    const handleAddInventory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        useStore.getState().addInventoryItem({
            id: crypto.randomUUID(),
            schoolId: id,
            name: newItemName,
            quantity: Number(newItemQuantity) || 0,
            category: newItemCategory,
            notes: newItemNotes,
            createdAt: new Date().toISOString()
        });

        setIsInventoryModalOpen(false);
        resetInventoryForm();
    };

    const handleUpdateInventory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingInventoryId) return;

        useStore.getState().updateInventoryItem(editingInventoryId, {
            name: newItemName,
            quantity: Number(newItemQuantity) || 0,
            category: newItemCategory,
            notes: newItemNotes
        });

        setIsInventoryModalOpen(false);
        setEditingInventoryId(null);
        resetInventoryForm();
    };

    const handleEditInventoryClick = (item: any) => {
        setEditingInventoryId(item.id);
        setNewItemName(item.name);
        setNewItemQuantity(item.quantity.toString());
        setNewItemCategory(item.category || '');
        setNewItemNotes(item.notes || '');
        setIsInventoryModalOpen(true);
    };

    const handleDeleteInventory = async (itemId: string) => {
        if (confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) {
            await useStore.getState().deleteInventoryItem(itemId);
        }
    };

    const resetInventoryForm = () => {
        setNewItemName('');
        setNewItemQuantity('');
        setNewItemCategory('');
        setNewItemNotes('');
        setEditingInventoryId(null);
    };


    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'CreditCard'>('Cash');
    const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);

    // handleOpenPaymentModal removed (unused)

    const handleProcessPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentForPayment || !school) return;

        const amount = Number(paymentAmount);

        // 1. Create Payment Record
        // addPayment is available from useStore now
        const { addPayment } = useStore.getState();
        await addPayment({
            id: crypto.randomUUID(),
            schoolId: school.id,
            studentId: selectedStudentForPayment.id,
            amount: amount,
            date: new Date().toISOString(),
            type: 'Tuition',
            method: paymentMethod,
            month: new Date().toISOString().slice(0, 7),
            status: 'paid',
            paidAt: new Date().toISOString(),
            notes: `Öğrenci: ${selectedStudentForPayment.name} için manuel tahsilat.`
        });

        // 2. Update Student Status
        await updateStudent(selectedStudentForPayment.id, {
            last_payment_status: 'paid',
            last_payment_date: new Date().toISOString()
        } as any);

        setIsPaymentModalOpen(false);
        setSelectedStudentForPayment(null);
        // Remove alert or keep it, user prefers feedback. Keeping it minimal.
    };

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
            parentName: newParentName, // Include parent name
            phone: newStudentPhone,
            parentEmail: newStudentEmail,
            birthDate: newStudentBirthDate,
            gradeLevel: Number(newStudentGrade) || undefined,
            address: newStudentAddress,
            // Removed medicalNotes
            paymentStatus: newStudentPaymentStatus,
            discountPercentage: newStudentPaymentStatus === 'discounted' ? Number(newStudentDiscount) : (newStudentPaymentStatus === 'free' ? 100 : 0),
            classGroupId: selectedClassId || undefined,
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
        // Removed medicalNotes reset
        setNewStudentPaymentStatus('paid');
        setNewStudentDiscount('');
        setSelectedClassId('');
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
        // Removed medical notes set
        setEditStudentPaymentStatus(student.paymentStatus || 'paid');
        setEditStudentDiscount(student.discountPercentage?.toString() || '');
        setEditStudentClassId(student.classGroupId || '');
        setIsEditStudentModalOpen(true);
    };

    const handleUpdateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudentId) return;

        updateStudent(editingStudentId, {
            name: editStudentName,
            parentName: editParentName,
            phone: editStudentPhone,
            parentEmail: editStudentEmail,
            birthDate: editStudentBirthDate,
            gradeLevel: Number(editStudentGrade) || undefined,
            address: editStudentAddress,
            // Removed medicalNotes logic
            paymentStatus: editStudentPaymentStatus,
            discountPercentage: editStudentPaymentStatus === 'discounted' ? Number(editStudentDiscount) : (editStudentPaymentStatus === 'free' ? 100 : 0),
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
        }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    }, [students, school, studentSearchTerm, studentStatusFilter]);

    // const { user } = useAuth(); // Removed duplicate declaration

    if (!school) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-200">Okul Bulunamadı</h2>
                <p className="text-slate-400 mt-2">Aradığınız okul sistemde kayıtlı değil veya bilgiler yüklenemedi.</p>
                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                        Panele Dön
                    </button>
                    <button
                        onClick={() => { useStore.getState().fetchData(); window.location.reload(); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Verileri Yenile
                    </button>
                </div>
            </div>
        );
    }

    const schoolClasses = classGroups.filter(c => c.schoolId === school.id);
    const activeStudentCount = students.filter(s => s.schoolId === school.id && s.status === 'Active').length;

    const tabs = [
        { id: 'classes', label: school.type === 'event' ? 'Gruplar / Atölyeler' : 'Sınıflar / Gruplar' },
        { id: 'students', label: school.type === 'event' ? 'Katılımcılar' : 'Öğrenciler' },
    ];

    // Permissions: Financials only for Admin and Manager
    if (['admin', 'manager'].includes(user?.role || '')) {
        tabs.push({ id: 'financials', label: 'Finansal Ayarlar' });
    }

    // Permissions: Inventory for Admin, Manager and Teacher
    if (['admin', 'manager', 'teacher'].includes(user?.role || '')) {
        tabs.push({ id: 'inventory', label: 'Envanter' });
    }

    // Maker Fair Tab (Everyone can see, but content differs)
    if (school.type !== 'event') {
        tabs.push({ id: 'maker-fair', label: 'Maker Fair' });
    }

    if (school.type === 'event') {
        const matrixTab = { id: 'matrix', label: 'Planlama Tablosu' };
        // Insert matrix as second tab
        tabs.splice(1, 0, matrixTab);
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
                    backgroundColor: school.color ? `${school.color}20` : undefined,
                    borderColor: school.color ? `${school.color}50` : undefined
                }}
            >
                {/* Background Pattern or Image */}
                {school.imageUrl && (
                    <div
                        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center pointer-events-none"
                        style={{ backgroundImage: `url(${school.imageUrl})` }}
                    />
                )}
                {!school.imageUrl && school.color && (
                    <div
                        className="absolute top-0 right-0 w-64 h-64 rounded-full filter blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"
                        style={{ backgroundColor: school.color }}
                    />
                )}

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            {school.type === 'event' && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold uppercase border border-purple-200">
                                    Etkinlik
                                </span>
                            )}
                        </div>
                        <h1
                            className="text-3xl font-bold text-slate-900"
                            style={{ color: school.color }}
                        >
                            {school.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 mt-4 text-slate-500">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} style={{ color: school.color }} />
                                <span>{school.address || (school.type === 'event' ? 'Konum belirtilmedi' : 'Adres belirtilmedi')}</span>
                            </div>

                            {school.type !== 'event' && (
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <Phone size={18} style={{ color: school.color }} />
                                    <span>{school.phone}</span>
                                </div>
                            )}

                            {school.type === 'event' && (
                                <div className="flex items-center gap-2 whitespace-nowrap text-purple-700 font-medium">
                                    <Calendar size={18} />
                                    <span>
                                        {school.eventDates && school.eventDates.length > 0
                                            ? school.eventDates.join(', ')
                                            : (school.eventDate || 'Tarih seçilmedi')}
                                    </span>
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
                                {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'manager') && (
                                    <button
                                        onClick={() => setIsAddLessonModalOpen(true)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors font-medium shadow-sm"
                                    >
                                        <Plus size={18} />
                                        <span className="hidden md:inline">Ek Ders Ekle</span>
                                    </button>
                                )}
                            </>
                        )}
                        <div
                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2"
                            style={{
                                backgroundColor: school.color ? `${school.color}15` : undefined,
                                color: school.color
                            }}
                        >
                            <Users size={18} />
                            <span className="font-bold">{activeStudentCount}</span> {school.type === 'event' ? 'Katılımcı' : 'Aktif Öğrenci'}
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
                {activeTab === 'matrix' && school.type === 'event' && (
                    <EventMatrixPlanner
                        schoolId={school.id}
                        classGroups={schoolClasses}
                        eventDate={school.eventDate}
                        eventDates={school.eventDates}
                    />
                )}

                {activeTab === 'classes' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">{school.type === 'event' ? 'Tanımlı Gruplar' : 'Tanımlı Sınıflar'}</h3>
                            {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'manager') && (
                                <button
                                    onClick={() => setIsAddClassModalOpen(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    {school.type === 'event' ? 'Yeni Grup Ekle' : 'Yeni Sınıf Ekle'}
                                </button>
                            )}
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
                                                classAssignments
                                                    .sort((a, b) => {
                                                        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                                                        return a.startTime.localeCompare(b.startTime);
                                                    })
                                                    .map((a, index, array) => {
                                                        const teacher = teachers.find(t => t.id === a.teacherId);
                                                        const dayName = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][a.dayOfWeek - 1];

                                                        // Calculate Break Time Logic
                                                        let breakElement = null;
                                                        const nextAssignment = array[index + 1];

                                                        if (nextAssignment && nextAssignment.dayOfWeek === a.dayOfWeek) {
                                                            const currentEnd = a.endTime || '10:00';
                                                            const nextStart = nextAssignment.startTime;

                                                            if (currentEnd < nextStart) {
                                                                const [endH, endM] = currentEnd.split(':').map(Number);
                                                                const [startH, startM] = nextStart.split(':').map(Number);
                                                                const diffInMinutes = (startH * 60 + startM) - (endH * 60 + endM);

                                                                if (diffInMinutes > 0) {
                                                                    let durationText = `${diffInMinutes} dk`;
                                                                    if (diffInMinutes >= 60) {
                                                                        const h = Math.floor(diffInMinutes / 60);
                                                                        const m = diffInMinutes % 60;
                                                                        durationText = m > 0 ? `${h} sa ${m} dk` : `${h} saat`;
                                                                    }

                                                                    breakElement = (
                                                                        <div className="flex items-center gap-2 my-1 select-none opacity-70">
                                                                            <div className="h-px bg-purple-200 flex-1 border-t border-dashed border-purple-300"></div>
                                                                            <div className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold uppercase rounded border border-purple-200 flex items-center gap-1">
                                                                                <Clock size={8} />
                                                                                {durationText} Ara
                                                                            </div>
                                                                            <div className="h-px bg-purple-200 flex-1 border-t border-dashed border-purple-300"></div>
                                                                        </div>
                                                                    );
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <div key={a.id}>
                                                                <div className="flex items-start justify-between text-sm bg-blue-50 p-2 rounded-lg">
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

                                {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'manager') && (
                                    <button
                                        onClick={() => setIsAddStudentModalOpen(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        <span className="hidden md:inline">Yeni Kayıt</span>
                                    </button>
                                )}
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
                                            <tr key={student.id} className={`hover:bg-slate-50 transition-colors border-l-4 ${
                                                // Payment Status Border Coloring (Traffic Light)
                                                student.last_payment_status === 'paid'
                                                    ? 'border-green-500' // Green: Paid
                                                    : student.last_payment_status === 'claimed'
                                                        ? 'border-blue-500' // Blue: Claimed
                                                        : 'border-orange-400' // Orange: Pending
                                                }`}>
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
                                                    <div className="flex items-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {student.status === 'Active' ? 'Aktif' : 'Ayrıldı'}
                                                        </span>
                                                        {/* Payment Status Badge */}
                                                        {/* Payment Status Badge - Visible to Admin & Manager Only */}
                                                        {['admin', 'manager'].includes(useAuth.getState().user?.role || '') && student.last_payment_status === 'claimed' && (
                                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                                                                Ödeme Bildirimi
                                                            </span>
                                                        )}
                                                    </div>
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

                                                    {/* Payment Action Button (Only for claimed) */}
                                                    {['admin', 'manager'].includes(useAuth.getState().user?.role || '') && student.last_payment_status === 'claimed' && student.status === 'Active' && (
                                                        <div className="flex justify-end mt-2">
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm(`${student.name} için yapılan ödemeyi onaylıyor musunuz?`)) {
                                                                        await updateStudent(student.id, { last_payment_status: 'paid', last_payment_date: new Date().toISOString() } as any);
                                                                    }
                                                                }}
                                                                className="text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-full shadow-sm transition-colors"
                                                            >
                                                                Ödemeyi Onayla
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Manual Collection Button REMOVED as per request */}
                                                    {/* {student.status === 'Active' && student.last_payment_status !== 'paid' && student.last_payment_status !== 'claimed' && (
                                                        <div className="flex justify-end mt-2">
                                                            <button
                                                                onClick={() => handleOpenPaymentModal(student)}
                                                                className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full shadow-sm transition-colors border border-slate-200"
                                                            >
                                                                Tahsil Et
                                                            </button>
                                                        </div>
                                                    )} */}
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {school.type === 'event' ? 'Etkinlik Günü' : 'Program (Bilgi amaçlı)'}
                        </label>

                        {school.type === 'event' && school.eventDates && school.eventDates.length > 0 ? (
                            <select
                                value={newClassSchedule}
                                onChange={e => setNewClassSchedule(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                            >
                                <option value="">Bir tarih seçin...</option>
                                {school.eventDates.map(date => (
                                    <option key={date} value={date}>
                                        {new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                placeholder={school.type === 'event' ? 'Örn: 20 Mayıs 2024' : 'Örn: Salı 14:00'}
                                value={newClassSchedule}
                                onChange={e => setNewClassSchedule(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        )}
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Veli Adı Soyadı</label>
                            <input
                                type="text"
                                placeholder="Veli Adı Soyadı"
                                value={newParentName}
                                onChange={e => setNewParentName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                            <input
                                type="tel"
                                placeholder="5554443322"
                                value={newStudentPhone}
                                onChange={e => setNewStudentPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Başında 0 olmadan 10 hane giriniz.</p>
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
                    {/* Removed Special Notes Field */}
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Veli Adı Soyadı</label>
                            <input
                                type="text"
                                placeholder="Veli Adı Soyadı"
                                value={editParentName}
                                onChange={e => setEditParentName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Telefon <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                placeholder="0555 555 5555"
                                value={editStudentPhone}
                                onChange={e => setEditStudentPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                            <p className="text-xs text-slate-500 mt-1">Veli Paneli girişi için kullanılacaktır.</p>
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
                    {/* Removed Special Notes Field */}
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

                    {['admin', 'manager'].includes(useAuth.getState().user?.role || '') && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Ödeme Durumu</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditStudentPaymentStatus('paid')}
                                    className={`py-2 text-sm font-medium rounded-lg border transition-all ${editStudentPaymentStatus === 'paid'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-500/20'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    Tam Ücret
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditStudentPaymentStatus('discounted');
                                        if (!editStudentDiscount) setEditStudentDiscount('50');
                                    }}
                                    className={`py-2 text-sm font-medium rounded-lg border transition-all ${editStudentPaymentStatus === 'discounted'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 ring-2 ring-blue-500/20'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    İndirimli
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditStudentPaymentStatus('free')}
                                    className={`py-2 text-sm font-medium rounded-lg border transition-all ${editStudentPaymentStatus === 'free'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200 ring-2 ring-purple-500/20'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    Ücretsiz
                                </button>
                            </div>
                            {editStudentPaymentStatus === 'discounted' && (
                                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs text-slate-500 mb-1">İndirim Oranı (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={editStudentDiscount}
                                            onChange={e => setEditStudentDiscount(e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                            placeholder="Örn: 50"
                                        />
                                        <span className="absolute right-3 top-2 text-slate-400 font-medium">%</span>
                                    </div>
                                </div>
                            )}
                            {editStudentPaymentStatus === 'free' && (
                                <p className="mt-2 text-xs text-purple-600 font-medium flex items-center gap-1">
                                    ✨ Bu öğrenci okul ödemesine dahil edilmeyecek.
                                </p>
                            )}
                        </div>
                    )}
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
                eventDate={school.type === 'event' ? schoolClasses.find(c => c.id === selectedClassIdForAssignment)?.schedule : undefined}
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
                            {assignments
                                .filter(a => a.classGroupId === editingClassId)
                                .sort((a, b) => {
                                    // Sort by Day then Start Time
                                    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                                    return a.startTime.localeCompare(b.startTime);
                                })
                                .map((assignment, index, array) => {
                                    const teacher = teachers.find(t => t.id === assignment.teacherId);

                                    // Calculate Break Time Logic
                                    let breakElement = null;
                                    const nextAssignment = array[index + 1];

                                    // If next assignment exists and is on the SAME day
                                    if (nextAssignment && nextAssignment.dayOfWeek === assignment.dayOfWeek) {
                                        const currentEnd = assignment.endTime || '10:00'; // Default end if missing
                                        const nextStart = nextAssignment.startTime;

                                        if (currentEnd < nextStart) {
                                            // Calculate duration in minutes
                                            const [endH, endM] = currentEnd.split(':').map(Number);
                                            const [startH, startM] = nextStart.split(':').map(Number);
                                            const diffInMinutes = (startH * 60 + startM) - (endH * 60 + endM);

                                            if (diffInMinutes > 0) {
                                                let durationText = `${diffInMinutes} dk`;
                                                if (diffInMinutes >= 60) {
                                                    const h = Math.floor(diffInMinutes / 60);
                                                    const m = diffInMinutes % 60;
                                                    durationText = m > 0 ? `${h} saat ${m} dk` : `${h} saat`;
                                                }

                                                breakElement = (
                                                    <div className="flex items-center gap-2 my-2 select-none">
                                                        <div className="h-px bg-purple-200 flex-1 border-t border-dashed border-purple-300"></div>
                                                        <div className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase rounded border border-purple-200 shadow-sm flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {durationText} Ara
                                                        </div>
                                                        <div className="h-px bg-purple-200 flex-1 border-t border-dashed border-purple-300"></div>
                                                    </div>
                                                );
                                            }
                                        }
                                    }

                                    return (
                                        <div key={assignment.id}>
                                            <AssignmentItem
                                                assignment={assignment}
                                                teacher={teacher}
                                                updateAssignment={updateAssignment}
                                                deleteAssignment={deleteAssignment}
                                            />
                                            {breakElement}
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


            {useAuth.getState().user?.role === 'admin' && (
                <Modal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    title="Ödeme Tahsil Et"
                >
                    <form onSubmit={handleProcessPayment} className="space-y-4">
                        <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
                            <strong>{selectedStudentForPayment?.name}</strong> için ödeme girişi yapıyorsunuz.
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tutar (TL)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Yöntemi</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['Cash', 'Transfer', 'CreditCard'] as const).map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setPaymentMethod(m)}
                                        className={`py-2 text-sm font-medium rounded-lg border ${paymentMethod === m
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {m === 'Cash' ? 'Nakit' : m === 'Transfer' ? 'Havale' : 'Kredi Kartı'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium mt-4"
                        >
                            Tahsil Et ve Onayla
                        </button>
                    </form>
                </Modal>
            )}

            {/* Inventory Tab Content */}
            {activeTab === 'inventory' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">Okul Envanteri</h3>
                        <button
                            onClick={() => { resetInventoryForm(); setIsInventoryModalOpen(true); }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Yeni Malzeme Ekle
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="p-4 font-semibold text-slate-600 w-1/4">Malzeme Adı</th>
                                    <th className="p-4 font-semibold text-slate-600 w-24">Adet</th>
                                    <th className="p-4 font-semibold text-slate-600 w-1/4">Kategori</th>
                                    <th className="p-4 font-semibold text-slate-600">Notlar</th>
                                    <th className="p-4 font-semibold text-slate-600 w-24 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900">{item.name}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600">{item.category || '-'}</td>
                                        <td className="p-4 text-slate-500 text-sm">{item.notes || '-'}</td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditInventoryClick(item)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteInventory(item.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {inventory.length === 0 && (
                            <div className="p-12 text-center text-slate-400 border-t border-slate-100">
                                <Package size={48} className="mx-auto mb-4 text-slate-200" />
                                <p>Henüz envanter kaydı bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'maker-fair' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MakerFairTab school={school} />
                </div>
            )}

            {/* Inventory Modal */}
            <Modal
                isOpen={isInventoryModalOpen}
                onClose={() => setIsInventoryModalOpen(false)}
                title={editingInventoryId ? "Malzeme Düzenle" : "Yeni Malzeme Ekle"}
            >
                <form onSubmit={editingInventoryId ? handleUpdateInventory : handleAddInventory} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Malzeme Adı</label>
                        <input
                            required
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            placeholder="Örn: Pinoo Tam Set"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Adet</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={newItemQuantity}
                                onChange={(e) => setNewItemQuantity(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                            <input
                                type="text"
                                value={newItemCategory}
                                onChange={(e) => setNewItemCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                placeholder="Örn: Elektronik"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notlar</label>
                        <textarea
                            value={newItemNotes}
                            onChange={(e) => setNewItemNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 h-24 resize-none"
                            placeholder="Durum vs. hakkında notlar..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium mt-4 flex items-center justify-center gap-2"
                    >
                        <Package size={18} />
                        {editingInventoryId ? "Güncelle" : "Kaydet"}
                    </button>
                </form>
            </Modal>

            {/* Shift Schedule Modal */}
            <ShiftScheduleModal
                isOpen={isShiftModalOpen}
                onClose={() => setIsShiftModalOpen(false)}
                schoolId={school.id}
                contextName={school.name}
            />
            {/* Add Lesson Modal */}
            <AddLessonModal
                isOpen={isAddLessonModalOpen}
                onClose={() => setIsAddLessonModalOpen(false)}
                initialSchoolId={id}
            />
        </div >
    );
}



function AssignmentItem({ assignment, teacher, updateAssignment, deleteAssignment }: { assignment: any, teacher: any, updateAssignment: any, deleteAssignment: any }) {
    const [localDay, setLocalDay] = useState(assignment.dayOfWeek);
    const [localStart, setLocalStart] = useState(assignment.startTime);
    const [localEnd, setLocalEnd] = useState(assignment.endTime || '10:00');

    // Update local state when prop changes (external update)
    useEffect(() => {
        setLocalDay(assignment.dayOfWeek);
        setLocalStart(assignment.startTime);
        setLocalEnd(assignment.endTime || '10:00');
    }, [assignment]);

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        // Check if new focus is still within this component
        if (e.currentTarget.contains(e.relatedTarget)) {
            return;
        }

        // Focus left the component -> Check for changes
        if (
            localDay !== assignment.dayOfWeek ||
            localStart !== assignment.startTime ||
            localEnd !== (assignment.endTime || '10:00')
        ) {
            if (window.confirm('Değişiklikleri kaydetmek istiyor musunuz? Gelecek dersler güncellenecek.')) {
                updateAssignment(assignment.id, {
                    dayOfWeek: localDay,
                    startTime: localStart,
                    endTime: localEnd
                }, true);
            } else {
                // Revert changes
                setLocalDay(assignment.dayOfWeek);
                setLocalStart(assignment.startTime);
                setLocalEnd(assignment.endTime || '10:00');
            }
        }
    };

    return (
        <div
            className="bg-slate-50 p-3 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
            onBlur={handleBlur}
            tabIndex={-1} // Allow focus handling
        >
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Gün</label>
                    <select
                        className="w-full text-sm border-slate-300 rounded-md text-slate-900 cursor-pointer"
                        value={localDay}
                        onChange={(e) => setLocalDay(parseInt(e.target.value))}
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
                <div className="w-full sm:w-2/3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Saatler (Başlangıç - Bitiş)</label>
                    <div className="flex gap-2 items-center">
                        <TimeSelect
                            value={localStart}
                            onChange={setLocalStart}
                            className="flex-1"
                        />
                        <span className="text-slate-400">-</span>
                        <TimeSelect
                            value={localEnd}
                            onChange={setLocalEnd}
                            className="flex-1"
                        />
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
}
