import { useState, useEffect } from 'react';
import { servicesAPI, specialistsAPI } from '../../services/api';
import { Scissors, Plus, Pencil, Trash2, X, Check, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const categories = ['hair', 'makeup', 'nails', 'skincare', 'massage', 'lashes', 'brows', 'other'];

const emptyForm = { name: '', description: '', price: '', duration_minutes: '', category: 'hair' };

const SpecialistServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const pRes = await specialistsAPI.getMyProfile();
        setProfile(pRes.data);
        const sRes = await servicesAPI.getBySpecialist(pRes.data.user_id);
        setServices(sRes.data);
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, price: parseFloat(form.price), duration_minutes: parseInt(form.duration_minutes) };
      if (editingId) {
        await servicesAPI.update(editingId, data);
        setServices(prev => prev.map(s => s.id === editingId ? { ...s, ...data } : s));
        toast.success('Service updated!');
      } else {
        const res = await servicesAPI.create(data);
        setServices(prev => [...prev, res.data]);
        toast.success('Service added!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch {
      toast.error('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s: any) => {
    setForm({ name: s.name, description: s.description || '', price: String(s.price), duration_minutes: String(s.duration_minutes), category: s.category });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    setDeleting(id);
    try {
      await servicesAPI.delete(id);
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Service deleted');
    } catch {
      toast.error('Failed to delete service');
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
          <p className="text-gray-400 text-sm mt-1">Add and manage the services you offer</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">{editingId ? 'Edit Service' : 'New Service'}</h2>
            <button onClick={handleCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Hair Braiding"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 text-sm capitalize bg-white"
                >
                  {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (KSh) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">KSh</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    required
                    min="0"
                    step="1"
                    placeholder="500"
                    className="w-full pl-14 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (minutes) *</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                    required
                    min="15"
                    step="15"
                    placeholder="60"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Describe your service..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <Check className="w-4 h-4" /> {saving ? 'Saving...' : editingId ? 'Update Service' : 'Add Service'}
              </button>
              <button type="button" onClick={handleCancel} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-purple-50" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-50 p-12 text-center">
          <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-6 h-6 text-violet-300" />
          </div>
          <p className="font-semibold text-gray-600">No services yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Add the services you offer to start receiving bookings</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Service
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5 hover:border-violet-200 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-4 h-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{s.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-lg font-medium capitalize">{s.category}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.duration_minutes} min
                      </span>
                    </div>
                    {s.description && <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-md">{s.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-lg font-bold text-violet-600">KSh {Number(s.price).toLocaleString()}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-2 hover:bg-violet-50 rounded-lg text-gray-400 hover:text-violet-500 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecialistServices;
