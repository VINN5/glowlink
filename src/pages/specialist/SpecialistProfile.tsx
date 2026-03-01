import { useState, useEffect } from 'react';
import { specialistsAPI } from '../../services/api';
import { User, MapPin, Briefcase, Save, Plus, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import PortfolioUpload from '../../components/portfolio/PortfolioUpload';
import ProfilePictureUpload from '../../components/common/ProfilePictureUpload';

const categories = ['hair', 'makeup', 'nails', 'skincare', 'massage', 'lashes', 'brows', 'other'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SpecialistProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    bio: '',
    city: '',
    location: '',
    years_of_experience: '',
    categories: [] as string[],
    availability: [] as { day: string; start_time: string; end_time: string }[],
  });

  useEffect(() => {
    specialistsAPI.getMyProfile()
      .then(res => {
        setProfile(res.data);
        setForm({
          bio: res.data.bio || '',
          city: res.data.city || '',
          location: res.data.location || '',
          years_of_experience: String(res.data.years_of_experience || ''),
          categories: res.data.categories || [],
          availability: res.data.availability || [],
        });
      })
      .catch(() => setIsNew(true))
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (cat: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const addAvailability = () => {
    setForm(prev => ({
      ...prev,
      availability: [...prev.availability, { day: 'Monday', start_time: '09:00', end_time: '17:00' }],
    }));
  };

  const removeAvailability = (i: number) => {
    setForm(prev => ({ ...prev, availability: prev.availability.filter((_, idx) => idx !== i) }));
  };

  const updateAvailability = (i: number, field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      availability: prev.availability.map((a, idx) => idx === i ? { ...a, [field]: value } : a),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : undefined };
      if (isNew) {
        const res = await specialistsAPI.createProfile(data);
        setProfile(res.data);
        setIsNew(false);
        toast.success('Profile created!');
      } else {
        await specialistsAPI.updateProfile(data);
        toast.success('Profile updated!');
      }
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">
          {isNew ? 'Set up your specialist profile to start receiving bookings' : 'Manage your public specialist profile'}
        </p>
      </div>

      {/* Profile picture + stats */}
      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5 mb-6 flex items-center gap-5">
        <ProfilePictureUpload size="lg" gradientFrom="from-violet-400" gradientTo="to-purple-500" />
        <div>
          <p className="font-bold text-gray-800">Profile Photo</p>
          <p className="text-sm text-gray-400 mt-0.5">Click your photo to upload a new one</p>
          {profile && (
            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-gray-800 text-sm">{profile.rating?.toFixed(1)}</span>
                <span className="text-xs text-gray-400">rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-800 text-sm">{profile.total_reviews}</span>
                <span className="text-xs text-gray-400">reviews</span>
              </div>
              {profile.is_verified && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Verified</span>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-violet-400" /> Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                rows={4}
                placeholder="Tell clients about yourself, your experience, and your style..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-sm resize-none"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. New York"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Years of Experience</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={form.years_of_experience}
                    onChange={e => setForm({ ...form, years_of_experience: e.target.value })}
                    placeholder="e.g. 5"
                    min="0"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 text-sm mb-4">Speciality Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  form.categories.includes(cat)
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-violet-50 hover:text-violet-600 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-sm">Availability</h2>
            <button
              type="button"
              onClick={addAvailability}
              className="flex items-center gap-1.5 text-violet-500 text-xs font-semibold hover:text-violet-600"
            >
              <Plus className="w-3.5 h-3.5" /> Add Slot
            </button>
          </div>
          {form.availability.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No availability set. Add your working hours.</p>
          ) : (
            <div className="space-y-3">
              {form.availability.map((slot, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                  <select
                    value={slot.day}
                    onChange={e => updateAvailability(i, 'day', e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-400"
                  >
                    {days.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={e => updateAvailability(i, 'start_time', e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-400"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={e => updateAvailability(i, 'end_time', e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-400"
                  />
                  <button type="button" onClick={() => removeAvailability(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-400 transition-colors ml-auto">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isNew ? 'Create Profile' : 'Save Changes'}
        </button>
      </form>

      {/* Portfolio section - only show after profile is created */}
      {!isNew && (
        <div className="mt-6">
          <PortfolioUpload />
        </div>
      )}
    </div>
  );
};

export default SpecialistProfile;
