import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  ShieldCheck, ShieldX, MapPin, Star, Briefcase,
  Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Image
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminVerify = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'verified' | 'all'>('pending');

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSpecialists({});
      setQueue(res.data?.specialists || res.data || []);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const filtered = queue.filter(s => {
    if (tab === 'pending') return !s.is_verified;
    if (tab === 'verified') return s.is_verified;
    return true;
  });

  const handleVerify = async (id: string, verify: boolean) => {
    setActionLoading(id);
    try {
      await adminAPI.verifySpecialist(id, verify);
      setQueue(prev => prev.map(s => s.id === id ? { ...s, is_verified: verify } : s));
      toast.success(verify ? '✓ Specialist verified!' : 'Verification revoked');
      if (expanded === id) setExpanded(null);
    } catch {
      toast.error('Failed to update verification');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = queue.filter(s => !s.is_verified).length;
  const verifiedCount = queue.filter(s => s.is_verified).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Verification Queue</h1>
        <p className="text-slate-400 text-sm mt-1">Review and approve specialist profiles</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4">
          <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting Review</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{verifiedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Verified</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
          <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center mb-3">
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-white">{queue.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Specialists</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'verified', label: `Verified (${verifiedCount})` },
          { key: 'all', label: 'All' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === key
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Queue list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-14 text-center">
          {tab === 'pending' ? (
            <>
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="font-semibold text-slate-300">All caught up!</p>
              <p className="text-slate-500 text-sm mt-1">No specialists awaiting verification</p>
            </>
          ) : (
            <p className="text-slate-500">No specialists found</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s: any) => {
            const isExpanded = expanded === s.id;
            const avatarUrl = s.profile_picture
              ? (s.profile_picture.startsWith('http') ? s.profile_picture : `${BASE_URL}${s.profile_picture}`)
              : null;

            return (
              <div
                key={s.id}
                className={`bg-slate-900 rounded-2xl border transition-all overflow-hidden ${
                  s.is_verified ? 'border-emerald-500/20' : 'border-amber-500/15 hover:border-amber-500/30'
                } ${actionLoading === s.id ? 'opacity-50' : ''}`}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 p-5">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex items-center justify-center text-violet-300 font-bold text-lg flex-shrink-0 overflow-hidden border border-violet-500/20">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      : s.full_name?.charAt(0).toUpperCase()
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-100">{s.full_name || 'Specialist'}</p>
                      {s.is_verified ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {s.city && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {s.city}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        {s.rating?.toFixed(1) || '0.0'} ({s.total_reviews || 0} reviews)
                      </span>
                      {s.years_of_experience && (
                        <span className="text-xs text-slate-500">{s.years_of_experience} yrs exp</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!s.is_verified ? (
                      <>
                        <button
                          onClick={() => handleVerify(s.id, true)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleVerify(s.id, false)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleVerify(s.id, false)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <ShieldX className="w-3.5 h-3.5" /> Revoke
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : s.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-5 bg-slate-950/50 space-y-4">
                    {/* Bio */}
                    {s.bio && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Bio</p>
                        <p className="text-sm text-slate-300 leading-relaxed bg-slate-900 rounded-xl p-3 border border-slate-800">
                          {s.bio}
                        </p>
                      </div>
                    )}

                    {/* Categories */}
                    {s.categories?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Specialties</p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.categories.map((cat: string) => (
                            <span key={cat} className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs px-2.5 py-1 rounded-lg capitalize font-medium">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Availability */}
                    {s.availability?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Availability</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {s.availability.map((slot: any, i: number) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-300">{slot.day}</span>
                              <span className="text-xs text-slate-500">{slot.start_time}–{slot.end_time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Portfolio count */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Image className="w-3.5 h-3.5" />
                      <span>Portfolio items: {s.portfolio_count ?? 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminVerify;
