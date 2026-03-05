import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  Briefcase, Search, Star, Shield, ShieldOff, Trash2,
  MapPin, RefreshCw, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSpecialists = () => {
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchSpecialists = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSpecialists({ search, verified: filterVerified === 'all' ? undefined : filterVerified === 'verified' });
      setSpecialists(res.data?.specialists || res.data || []);
    } catch {
      setSpecialists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSpecialists(); }, [search, filterVerified]);

  const handleToggleVerify = async (specialistId: string, currentlyVerified: boolean) => {
    setActionLoading(specialistId);
    try {
      await adminAPI.verifySpecialist(specialistId, !currentlyVerified);
      setSpecialists(prev => prev.map(s => s.id === specialistId ? { ...s, is_verified: !currentlyVerified } : s));
      toast.success(currentlyVerified ? 'Verification revoked' : 'Specialist verified! ✓');
    } catch {
      toast.error('Failed to update verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (specialistId: string) => {
    if (!confirm('Delete this specialist profile? This cannot be undone.')) return;
    setActionLoading(specialistId);
    try {
      await adminAPI.deleteSpecialist(specialistId);
      setSpecialists(prev => prev.filter(s => s.id !== specialistId));
      toast.success('Specialist deleted');
    } catch {
      toast.error('Failed to delete specialist');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = specialists.filter(s => {
    const matchSearch = !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase());
    const matchVerified = filterVerified === 'all' || (filterVerified === 'verified' ? s.is_verified : !s.is_verified);
    return matchSearch && matchVerified;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Specialists</h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} specialist profiles</p>
        </div>
        <button
          onClick={fetchSpecialists}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-600"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'verified', 'unverified'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterVerified(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filterVerified === f
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-44 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-14 text-center">
          <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No specialists found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s: any) => {
            const avatarUrl = s.profile_picture
              ? (s.profile_picture.startsWith('http') ? s.profile_picture : `${BASE_URL}${s.profile_picture}`)
              : null;

            return (
              <div
                key={s.id}
                className={`bg-slate-900 rounded-2xl border transition-all overflow-hidden ${
                  actionLoading === s.id ? 'opacity-50' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card top */}
                <div className="h-16 bg-gradient-to-br from-slate-800 to-slate-700 relative">
                  {s.is_verified && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                      <Shield className="w-3 h-3" /> Verified
                    </div>
                  )}
                  <div className="absolute -bottom-5 left-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg border-2 border-slate-900 overflow-hidden">
                      {avatarUrl
                        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        : s.full_name?.charAt(0).toUpperCase()
                      }
                    </div>
                  </div>
                </div>

                <div className="pt-8 p-4">
                  <p className="font-bold text-slate-100 text-sm">{s.full_name || 'Specialist'}</p>

                  {s.city && (
                    <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
                      <MapPin className="w-3 h-3" /> {s.city}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-slate-300">{s.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-xs text-slate-500">{s.total_reviews || 0} reviews</span>
                  </div>

                  {s.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.categories.slice(0, 3).map((cat: string) => (
                        <span key={cat} className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs px-1.5 py-0.5 rounded-lg capitalize font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleToggleVerify(s.id, s.is_verified)}
                      disabled={!!actionLoading}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        s.is_verified
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                      }`}
                    >
                      {s.is_verified ? <><ShieldOff className="w-3 h-3" /> Revoke</> : <><Shield className="w-3 h-3" /> Verify</>}
                    </button>
                    <Link
                      to={`/specialists/${s.id}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={!!actionLoading}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminSpecialists;
