import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Users, Search, Trash2, ShieldCheck, ShieldOff,
  UserCheck, UserX, ChevronDown, Mail, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const roleColor: Record<string, string> = {
  client: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  specialist: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  admin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const roleFilters = ['all', 'client', 'specialist', 'admin'];

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data?.users || res.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      await adminAPI.updateUser(userId, { is_active: !isActive });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
      toast.success(isActive ? 'User deactivated' : 'User activated');
    } catch {
      toast.error('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role changed to ${newRole}`);
    } catch {
      toast.error('Failed to change role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Users</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} total users</p>
        </div>
        <button
          onClick={fetchUsers}
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
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-600"
          />
        </div>
        <div className="flex gap-2">
          {roleFilters.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                roleFilter === r
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u: any) => (
                  <tr key={u.id} className={`hover:bg-slate-800/50 transition-colors ${actionLoading === u.id ? 'opacity-50' : ''}`}>
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                          {u.profile_picture
                            ? <img src={u.profile_picture.startsWith('http') ? u.profile_picture : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${u.profile_picture}`} alt="" className="w-full h-full object-cover" />
                            : u.full_name?.charAt(0).toUpperCase()
                          }
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{u.full_name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={e => handleChangeRole(u.id, e.target.value)}
                        disabled={!!actionLoading}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border bg-transparent cursor-pointer focus:outline-none capitalize ${roleColor[u.role] || 'bg-slate-700 text-slate-400 border-slate-600'}`}
                      >
                        <option value="client" className="bg-slate-800 text-slate-200">client</option>
                        <option value="specialist" className="bg-slate-800 text-slate-200">specialist</option>
                        <option value="admin" className="bg-slate-800 text-slate-200">admin</option>
                      </select>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.is_active !== false ? 'bg-emerald-400' : 'bg-red-500'}`} />
                        <span className={`text-xs font-medium ${u.is_active !== false ? 'text-emerald-400' : 'text-red-400'}`}>
                          {u.is_active !== false ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleActive(u.id, u.is_active !== false)}
                          disabled={!!actionLoading}
                          title={u.is_active !== false ? 'Suspend user' : 'Activate user'}
                          className={`p-2 rounded-lg transition-colors ${
                            u.is_active !== false
                              ? 'hover:bg-red-500/10 text-slate-500 hover:text-red-400'
                              : 'hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400'
                          }`}
                        >
                          {u.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.full_name)}
                          disabled={!!actionLoading}
                          title="Delete user"
                          className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
