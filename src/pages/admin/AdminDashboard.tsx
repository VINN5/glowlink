import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  Users, Briefcase, Calendar, ShieldCheck,
  TrendingUp, ArrowRight, UserCheck, UserX, Clock
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, usersRes, verifyRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getUsers({ limit: 5, sort: 'newest' }),
          adminAPI.getPendingVerifications(),
        ]);
        setStats(statsRes.data);
        setRecentUsers(usersRes.data?.users || usersRes.data || []);
        setPendingVerifications((verifyRes.data || []).slice(0, 4));
      } catch {
        setStats({ total_users: 0, total_specialists: 0, total_bookings: 0, pending_verifications: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? '—', icon: Users, color: 'from-indigo-500 to-blue-600', change: '+12%' },
    { label: 'Specialists', value: stats?.total_specialists ?? '—', icon: Briefcase, color: 'from-violet-500 to-purple-600', change: '+8%' },
    { label: 'Total Bookings', value: stats?.total_bookings ?? '—', icon: Calendar, color: 'from-emerald-500 to-teal-600', change: '+23%' },
    { label: 'Pending Verify', value: stats?.pending_verifications ?? '—', icon: ShieldCheck, color: 'from-amber-500 to-orange-600', change: null },
  ];

  const roleColor: Record<string, string> = {
    client: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    specialist: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    admin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-slate-300 text-xs font-medium">System Online</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-colors">
            <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{loading ? <span className="text-slate-600">—</span> : value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">{change} this month</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Users */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Recent Users
            </h2>
            <Link to="/admin/users" className="text-indigo-400 text-xs font-semibold flex items-center gap-1 hover:text-indigo-300">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />)}
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">No users yet</p>
            ) : (
              <div className="space-y-2">
                {recentUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                      {u.profile_picture
                        ? <img src={u.profile_picture.startsWith('http') ? u.profile_picture : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${u.profile_picture}`} alt="" className="w-full h-full object-cover" />
                        : u.full_name?.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{u.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium border capitalize ${roleColor[u.role] || 'bg-slate-700 text-slate-400'}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Verification Queue
              {pendingVerifications.length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                  {pendingVerifications.length}
                </span>
              )}
            </h2>
            <Link to="/admin/verify" className="text-indigo-400 text-xs font-semibold flex items-center gap-1 hover:text-indigo-300">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}
              </div>
            ) : pendingVerifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-slate-400">All clear!</p>
                <p className="text-xs text-slate-600 mt-0.5">No pending verifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingVerifications.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                      {s.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{s.full_name || 'Specialist'}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="text-xs text-amber-500/80">Awaiting review</span>
                      </div>
                    </div>
                    <Link
                      to="/admin/verify"
                      className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
