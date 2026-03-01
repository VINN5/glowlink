import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, servicesAPI, specialistsAPI } from '../../services/api';
import { Calendar, DollarSign, Star, Scissors, ArrowRight, TrendingUp, Clock, Plus, Shield } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  pending:   { color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-400' },
  confirmed: { color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
  completed: { color: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-400' },
  cancelled: { color: 'text-red-500',     bg: 'bg-red-50',     dot: 'bg-red-400' },
};

const SpecialistHome = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, pRes] = await Promise.all([
          bookingsAPI.getMyBookings(),
          specialistsAPI.getMyProfile(),
        ]);
        setBookings(bRes.data);
        setProfile(pRes.data);
        const sRes = await servicesAPI.getBySpecialist(pRes.data.id);
        setServices(sRes.data);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pending   = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const completed = bookings.filter(b => b.status === 'completed');
  const earnings  = completed.reduce((sum, b) => sum + b.total_price, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-16" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-violet-200 text-sm font-medium mb-1">{greeting()}, ✨</p>
            <h1 className="text-2xl font-bold mb-1">{user?.full_name}</h1>
            <p className="text-violet-200 text-sm mb-4">
              {pending.length > 0
                ? `You have ${pending.length} pending booking${pending.length !== 1 ? 's' : ''} to review.`
                : 'No pending bookings right now.'}
            </p>
            <Link
              to="/specialist/bookings"
              className="inline-flex items-center gap-2 bg-white text-violet-600 px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
            >
              <Calendar className="w-3.5 h-3.5" /> View Bookings
            </Link>
          </div>
          {profile && (
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1 justify-end mb-1">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span className="font-bold text-lg">{profile.rating?.toFixed(1)}</span>
              </div>
              <p className="text-violet-200 text-xs">{profile.total_reviews} reviews</p>
              {profile.is_verified && (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <Shield className="w-3 h-3 text-emerald-300" />
                  <span className="text-emerald-300 text-xs font-medium">Verified</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile incomplete warning */}
      {!profile && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-700 text-sm">Complete your profile</p>
            <p className="text-amber-600 text-xs mt-0.5">Set up your specialist profile to start receiving bookings</p>
          </div>
          <Link
            to="/specialist/profile"
            className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors flex-shrink-0"
          >
            Set Up Profile
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: Calendar, gradient: 'from-violet-400 to-purple-500' },
          { label: 'Pending', value: pending.length, icon: Clock, gradient: 'from-amber-400 to-orange-500' },
          { label: 'Services', value: services.length, icon: Scissors, gradient: 'from-pink-400 to-rose-500' },
          { label: 'Earnings', value: `$${earnings.toFixed(0)}`, icon: DollarSign, gradient: 'from-emerald-400 to-teal-500' },
        ].map(({ label, value, icon: Icon, gradient }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-purple-50 shadow-sm">
            <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-sm">Recent Bookings</h2>
            <Link to="/specialist/bookings" className="text-violet-500 text-xs font-semibold flex items-center gap-1 hover:text-violet-600">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-5 h-5 text-violet-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No bookings yet</p>
                <p className="text-xs text-gray-400 mt-1">Bookings will appear here</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bookings.slice(0, 4).map(b => {
                  const cfg = statusConfig[b.status];
                  return (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">#{b.id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-gray-400">{format(new Date(b.booking_date), 'MMM dd • hh:mm a')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-violet-600">${b.total_price}</p>
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

        {/* My Services */}
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-sm">My Services</h2>
            <Link to="/specialist/services" className="text-violet-500 text-xs font-semibold flex items-center gap-1 hover:text-violet-600">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Scissors className="w-5 h-5 text-violet-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No services yet</p>
                <Link
                  to="/specialist/services"
                  className="inline-flex items-center gap-1 text-violet-500 text-xs mt-2 font-semibold hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add your first service
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {services.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                        <Scissors className="w-3.5 h-3.5 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{s.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{s.category} • {s.duration_minutes}min</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-violet-600">${s.price}</span>
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

export default SpecialistHome;
