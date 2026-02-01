import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { Building2, Plus, Edit, Trash2, User, MapPin, Phone } from 'lucide-react';
import { Modal } from './Modal';
import type { Branch } from '../types';

export function BranchesTab() {
    const { branches, teachers, fetchBranches, addBranch, updateBranch, deleteBranch } = useStore();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [managerId, setManagerId] = useState('');
    const [color, setColor] = useState('#f97316'); // Default Orange

    // Get available managers (role='manager')
    const availableManagers = teachers.filter(t => t.role === 'manager' && t.isActive !== false);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const openModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setName(branch.name);
            setAddress(branch.address || '');
            setPhone(branch.phone || '');
            setManagerId(branch.managerId || '');
            setColor(branch.color || '#f97316');
        } else {
            setEditingBranch(null);
            setName('');
            setAddress('');
            setPhone('');
            setManagerId('');
            setColor('#f97316');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
    };

    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        setSaving(true);
        try {
            if (editingBranch) {
                await updateBranch(editingBranch.id, {
                    name,
                    address,
                    phone,
                    managerId: managerId || undefined,
                    color
                });
            } else {
                await addBranch({
                    name,
                    address,
                    phone,
                    managerId: managerId || undefined,
                    color
                });
            }
            closeModal();
        } catch (error: any) {
            console.error('Error saving branch:', error);
            alert('Şube kaydedilemedi: ' + (error?.message || 'Bilinmeyen hata. Lütfen SQL migration dosyasını Supabase\'de çalıştırın.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu şubeyi silmek istediğinize emin misiniz?')) return;
        try {
            await deleteBranch(id);
        } catch (error) {
            console.error('Error deleting branch:', error);
        }
    };

    // Base access check: teachers cannot see this
    if (user?.role === 'teacher') {
        return (
            <div className="text-center py-12 text-slate-500">
                Bu bölümü görüntüleme yetkiniz bulunmamaktadır.
            </div>
        );
    }

    const filteredBranches = user?.role === 'manager' && user.branchId
        ? branches.filter(b => b.id === user.branchId)
        : branches;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Şubeler</h3>
                    <p className="text-slate-500 text-sm">Şirket şubelerinizi yönetin.</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => openModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Yeni Şube Ekle
                    </button>
                )}
            </div>

            {/* Branch Cards */}
            {filteredBranches.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">Henüz şube eklenmemiş.</p>
                    <button
                        onClick={() => openModal()}
                        className="mt-4 text-indigo-600 hover:underline font-medium"
                    >
                        İlk şubenizi ekleyin
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches.map(branch => {
                        const manager = teachers.find(t => t.id === branch.managerId);
                        const branchColor = branch.color || '#f97316';

                        return (
                            <div
                                key={branch.id}
                                onClick={() => navigate(`/branch/${branch.id}`)}
                                className="bg-white p-6 rounded-xl shadow-sm border-2 hover:shadow-md transition-all cursor-pointer group"
                                style={{ borderColor: `${branchColor}40` }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
                                            style={{ backgroundColor: `${branchColor}20`, color: branchColor }}
                                        >
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{branch.name}</h4>
                                            {manager && (
                                                <div className="flex items-center gap-1 text-sm text-slate-500">
                                                    <User size={14} />
                                                    {manager.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {user?.role === 'admin' && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openModal(branch); }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(branch.id); }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {branch.address && (
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                        <MapPin size={14} />
                                        {branch.address}
                                    </div>
                                )}
                                {branch.phone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Phone size={14} />
                                        {branch.phone}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingBranch ? 'Şube Düzenle' : 'Yeni Şube Ekle'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Şube Adı *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="örn: Kurtköy Şubesi"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Şube Yöneticisi</label>
                        <select
                            value={managerId}
                            onChange={e => setManagerId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Yönetici Seçin</option>
                            {availableManagers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        {availableManagers.length === 0 && (
                            <p className="text-xs text-orange-500 mt-1">
                                Henüz şube yöneticisi tanımlı değil. Kadro sayfasından "Şube Yöneticisi" rolünde kişi ekleyin.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Şube adresi"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="örn: 5301234567"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tema Rengi</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="h-10 w-20 p-1 border border-slate-300 rounded-lg cursor-pointer"
                            />
                            <span className="text-sm text-slate-500 uppercase">{color}</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {saving ? 'Kaydediliyor...' : (editingBranch ? 'Güncelle' : 'Ekle')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
