import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, servicesAPI, specialistsAPI, reviewsAPI } from '../../services/api';
import { Calendar, Scissors, DollarSign, Star, Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const SpecialistDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, profileRes] = await Promise.all([
          bookingsAPI.getMyBookings(),
          specialistsAPI.getMyProfile(),
        ]);
        setBookings(bookingsRes.data);
        setProfile(profileRes.data);
        // Use user_id not specialist profile id
        const servicesRes = await servicesAPI.getBySpecialist(profileRes.data.user_id);
        setServices(servicesRes.data);
        const reviewsRes = await reviewsAPI.getBySpecialist(profileRes.data.id);
        setReviews(reviewsRes.data);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0);

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-500 rounded-2xl p-6 text-white mb-6">
          <p className="text-violet-200 text-sm mb-1">Specialist Dashboard ✨</p>
          <h1 className="text-2xl font-bold">{user?.full_name}</h1>
          {profile ? (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span className="text-sm font-medium">{profile.rating?.toFixed(1)}</span>
              </div>
              <span className="text-violet-300">•</span>
              <span className="text-violet-100 text-sm">{profile.total_reviews} reviews</span>
              {profile.is_verified && (
                <>
                  <span className="text-violet-300">•</span>
                  <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">✓ Verified</span>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/specialist/profile"
              className="inline-block mt-2 bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-full transition-all"
            >
              + Complete your profile
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'text-violet-500 bg-violet-50' },
            { label: 'Pending', value: pendingBookings.length, icon: Calendar, color: 'text-yellow-500 bg-yellow-50' },
            { label: 'Services', value: services.length, icon: Scissors, color: 'text-purple-500 bg-purple-50' },
            { label: 'Earnings', value: `KSh ${totalEarnings.toLocaleString()}`, icon: DollarSign, color: 'text-green-500 bg-green-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold text-gray-800">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Recent Bookings</h2>
              <Link to="/specialist/bookings" className="text-violet-500 text-sm flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 4).map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">#{b.id.slice(-6).toUpperCase()}</p>
                      <p className="text-gray-500 text-xs">{format(new Date(b.booking_date), 'MMM dd • hh:mm a')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[b.status]}`}>
                        {b.status}
                      </span>
                      <p className="text-violet-600 font-semibold text-sm mt-1">KSh {Number(b.total_price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Services */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">My Services</h2>
              <Link to="/specialist/services" className="text-violet-500 text-sm flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {services.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Scissors className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No services yet</p>
                <Link
                  to="/specialist/services"
                  className="inline-flex items-center gap-1 text-violet-500 text-sm mt-2 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add your first service
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {services.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                      <p className="text-gray-500 text-xs capitalize">{s.category} • {s.duration_minutes} min</p>
                    </div>
                    <span className="text-violet-600 font-bold text-sm">KSh {Number(s.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client Reviews */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Client Reviews
              <span className="text-gray-400 font-normal text-sm">({reviews.length})</span>
            </h2>
            {profile && (
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-amber-600">{profile.rating?.toFixed(1)}</span>
                <span className="text-xs text-amber-500">avg</span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-gray-500">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1">Reviews will appear here after clients complete bookings</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {reviews.slice(0, 6).map(r => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                      {r.client_picture
                        ? <img src={r.client_picture.startsWith('http') ? r.client_picture : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${r.client_picture}`} alt="" className="w-full h-full object-cover" />
                        : r.client_name?.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{r.client_name || 'Client'}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {format(new Date(r.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mt-0.5 mb-2">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1 font-medium">{r.rating}.0</span>
                      </div>
                      {r.comment ? (
                        <p className="text-gray-600 text-sm leading-relaxed">"{r.comment}"</p>
                      ) : (
                        <p className="text-gray-400 text-xs italic">No comment left</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SpecialistDashboard;
