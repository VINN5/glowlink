import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI } from '../../services/api';
import { Calendar, Clock, Search, Star, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsAPI.getMyBookings()
      .then(res => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 rounded-2xl p-6 text-white mb-6">
          <p className="text-pink-100 text-sm mb-1">Welcome back 👋</p>
          <h1 className="text-2xl font-bold">{user?.full_name}</h1>
          <p className="text-pink-100 text-sm mt-1">Ready for your next beauty session?</p>
          <Link
            to="/specialists"
            className="inline-flex items-center gap-2 bg-white text-pink-600 px-4 py-2 rounded-full text-sm font-medium mt-4 hover:shadow-md transition-all"
          >
            <Search className="w-4 h-4" /> Find a Specialist
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'text-pink-500 bg-pink-50' },
            { label: 'Upcoming', value: upcoming.length, icon: Clock, color: 'text-blue-500 bg-blue-50' },
            { label: 'Completed', value: past.filter(b => b.status === 'completed').length, icon: Star, color: 'text-green-500 bg-green-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Upcoming Bookings</h2>
            <Link to="/bookings" className="text-pink-500 text-sm flex items-center gap-1 hover:text-pink-600">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming bookings</p>
              <Link to="/specialists" className="text-pink-500 text-sm mt-2 inline-block hover:underline">
                Book your first appointment →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Booking #{booking.id.slice(-6)}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {format(new Date(booking.booking_date), 'MMM dd, yyyy • hh:mm a')}
                    </p>
                    <p className="text-pink-600 font-semibold text-sm mt-1">KSh {Number(booking.total_price).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[booking.status]}`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
