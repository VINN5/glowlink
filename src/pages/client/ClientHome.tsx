import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, specialistsAPI } from '../../services/api';
import { Calendar, Clock, Star, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  pending:   { color: 'text-amber-600',  bg: 'bg-amber-50',  dot: 'bg-amber-400' },
  confirmed: { color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
  completed: { color: 'text-blue-600',   bg: 'bg-blue-50',   dot: 'bg-blue-400' },
  cancelled: { color: 'text-red-500',    bg: 'bg-red-50',    dot: 'bg-red-400' },
};

const ClientHome = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    Promise.all([
      bookingsAPI.getMyBookings(),
      specialistsAPI.list({ limit: 4 }),
    ]).then(([bRes, sRes]) => {
      setBookings(bRes.data);
      setSpecialists(sRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'completed');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-12" />
        <div className="relative z-10">
          <p className="text-rose-100 text-sm font-medium mb-1">{greeting()}, ✨</p>
          <h1 className="text-2xl font-bold mb-1">{user?.full_name}</h1>
          <p className="text-rose-100 text-sm mb-4">You have {upcoming.length} upcoming appointment{upcoming.length !== 1 ? 's' : ''}.</p>
          <Link
            to="/client/find"
            className="inline-flex items-center gap-2 bg-white text-rose-500 px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> Book a Session
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: Calendar, gradient: 'from-rose-400 to-pink-500' },
          { label: 'Upcoming', value: upcoming.length, icon: Clock, gradient: 'from-violet-400 to-purple-500' },
          { label: 'Completed', value: completed.length, icon: TrendingUp, gradient: 'from-emerald-400 to-teal-500' },
        ].map(({ label, value, icon: Icon, gradient }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-rose-50 shadow-sm">
            <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl border border-rose-50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-sm">Upcoming Bookings</h2>
            <Link to="/client/bookings" className="text-rose-400 text-xs font-semibold flex items-center gap-1 hover:text-rose-500">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-5 h-5 text-rose-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No upcoming bookings</p>
                <Link to="/client/find" className="text-rose-400 text-xs mt-1.5 inline-block hover:underline font-medium">
                  Book your first appointment →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcoming.slice(0, 3).map(b => {
                  const cfg = statusConfig[b.status];
                  return (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-rose-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">#{b.id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-gray-400">{format(new Date(b.booking_date), 'MMM dd, yyyy • hh:mm a')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-rose-500">${b.total_price}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cfg.bg} ${cfg.color}`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Specialists */}
        <div className="bg-white rounded-2xl border border-rose-50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-sm">Recommended Specialists</h2>
            <Link to="/client/find" className="text-rose-400 text-xs font-semibold flex items-center gap-1 hover:text-rose-500">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : specialists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No specialists available yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {specialists.slice(0, 4).map((s: any) => (
                  <Link
                    key={s.id}
                    to={`/specialists/${s.id}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-rose-50/50 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-rose-300 to-pink-400 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {s.user_id?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-rose-600 transition-colors">
                        {s.city || 'Beauty Specialist'}
                      </p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-gray-400">{s.rating?.toFixed(1) || '0.0'}</span>
                        {s.categories?.[0] && (
                          <span className="text-xs text-rose-400 capitalize ml-1">• {s.categories[0]}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-rose-400 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientHome;
