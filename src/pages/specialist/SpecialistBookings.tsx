import { useState, useEffect } from 'react';
import { bookingsAPI } from '../../services/api';
import { Calendar, Clock, CheckCircle, XCircle, Check } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  pending:   { color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-400',   label: 'Pending' },
  confirmed: { color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-400', label: 'Confirmed' },
  completed: { color: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-400',    label: 'Completed' },
  cancelled: { color: 'text-red-500',     bg: 'bg-red-50',     dot: 'bg-red-400',     label: 'Cancelled' },
};

const filters = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const SpecialistBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    bookingsAPI.getMyBookings()
      .then(res => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await bookingsAPI.updateStatus(id, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
    } catch {
      toast.error('Failed to update booking');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = activeFilter === 'all' ? bookings : bookings.filter(b => b.status === activeFilter);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your appointment requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
              activeFilter === f
                ? 'bg-violet-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-200 hover:text-violet-500'
            }`}
          >
            {f === 'all' ? `All (${bookings.length})` : `${statusConfig[f]?.label} (${bookings.filter(b => b.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-purple-50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-50 p-12 text-center">
          <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-violet-300" />
          </div>
          <p className="font-semibold text-gray-600">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeFilter === 'all' ? 'No bookings yet.' : `No ${activeFilter} bookings.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const cfg = statusConfig[b.status];
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5 hover:border-violet-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {b.status === 'completed' ? <CheckCircle className={`w-5 h-5 ${cfg.color}`} /> :
                       b.status === 'cancelled' ? <XCircle className={`w-5 h-5 ${cfg.color}`} /> :
                       <Clock className={`w-5 h-5 ${cfg.color}`} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800 text-sm">#{b.id.slice(-8).toUpperCase()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cfg.bg} ${cfg.color}`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(b.booking_date), 'EEEE, MMM dd yyyy')}
                      </p>
                      <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(b.booking_date), 'hh:mm a')}
                      </p>
                      {b.notes && (
                        <p className="text-gray-400 text-xs mt-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                          📝 {b.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-violet-600 mb-2">KSh {Number(b.total_price).toLocaleString()}</p>

                    {/* Action buttons */}
                    {b.status === 'pending' && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => updateStatus(b.id, 'confirmed')}
                          disabled={updating === b.id}
                          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(b.id, 'cancelled')}
                          disabled={updating === b.id}
                          className="flex items-center gap-1.5 bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" /> Decline
                        </button>
                      </div>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus(b.id, 'completed')}
                        disabled={updating === b.id}
                        className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3" /> Mark Complete
                      </button>
                    )}
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

export default SpecialistBookings;
