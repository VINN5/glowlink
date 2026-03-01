import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../services/api';
import { User, Mail, Phone, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfilePictureUpload from '../../components/common/ProfilePictureUpload';

const ClientSettings = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersAPI.updateMe(form);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm overflow-hidden mb-4">
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-rose-400" /> Personal Information
          </h2>
        </div>

        {/* Avatar */}
        <div className="p-5 border-b border-gray-50 flex items-center gap-4">
          <ProfilePictureUpload size="lg" gradientFrom="from-rose-300" gradientTo="to-pink-400" />
          <div>
            <p className="font-bold text-gray-800">{user?.full_name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-rose-50 text-rose-500 px-2.5 py-0.5 rounded-full font-medium capitalize">
              {user?.role}
            </span>
            <p className="text-xs text-gray-400 mt-1">Click photo to change</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Security Card */}
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-rose-400" /> Account Security
        </h2>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-gray-700">Auth Provider</p>
            <p className="text-xs text-gray-400 mt-0.5">How you sign in to GlowLink</p>
          </div>
          <span className="text-xs bg-rose-50 text-rose-500 px-3 py-1 rounded-full font-semibold capitalize">
            Google
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
