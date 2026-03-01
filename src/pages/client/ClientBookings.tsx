import { useState, useEffect } from 'react';
import { bookingsAPI, reviewsAPI } from '../../services/api';
import { Calendar, Clock, CheckCircle, XCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReviewModal from '../../components/reviews/ReviewModal';

const statusConfig: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  pending:   { color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-400',   label: 'Pending' },
  confirmed: { color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-400', label: 'Confirmed' },
  completed: { color: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-400',    label: 'Completed' },
  cancelled: { color: 'text-red-500',     bg: 'bg-red-50',     dot: 'bg-red-400',     label: 'Cancelled' },
};

const filters = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const ClientBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [reviewBooking, setReviewBooking] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await bookingsAPI.getMyBookings();
        setBookings(res.data);
        // Check which completed bookings have been reviewed
        const completed = res.data.filter((b: any) => b.status === 'completed');
        const checks = await Promise.all(
          completed.map((b: any) => reviewsAPI.checkReviewed(b.id).then(r => ({ id: b.id, reviewed: r.data.reviewed })))
        );
        const map: Record<string, boolean> = {};
        checks.forEach(c => { map[c.id] = c.reviewed; });
        setReviewed(map);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await bookingsAPI.cancel(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch {
      toast.error('Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = activeFilter === 'all' ? bookings : bookings.filter(b => b.status === activeFilter);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-400 text-sm mt-1">Track and manage your appointments</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
              activeFilter === f
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-rose-200 hover:text-rose-500'
            }`}
          >
            {f === 'all' ? `All (${bookings.length})` : `${statusConfig[f]?.label} (${bookings.filter(b => b.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-rose-50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-rose-50 p-12 text-center">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-rose-300" />
          </div>
          <p className="font-semibold text-gray-600">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeFilter === 'all' ? "You haven't made any bookings yet." : `No ${activeFilter} bookings.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const cfg = statusConfig[b.status];
            const isReviewed = reviewed[b.id];
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 hover:border-rose-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {b.status === 'completed' ? <CheckCircle className={`w-5 h-5 ${cfg.color}`} /> :
                       b.status === 'cancelled' ? <XCircle className={`w-5 h-5 ${cfg.color}`} /> :
                       <Clock className={`w-5 h-5 ${cfg.color}`} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-gray-800 text-sm">Booking #{b.id.slice(-8).toUpperCase()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cfg.bg} ${cfg.color}`}>
                          {b.status}
                        </span>
                        {b.status === 'completed' && isReviewed && (
                          <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                            <Star className="w-3 h-3 fill-amber-400" /> Reviewed
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(b.booking_date), 'EEEE, MMM dd yyyy')}
                      </p>
                      <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {b.time_slot || format(new Date(b.booking_date), 'hh:mm a')}
                      </p>
                      {b.notes && (
                        <p className="text-gray-400 text-xs mt-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                          📝 {b.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-2">
                    <p className="text-xl font-bold text-rose-500">KSh {Number(b.total_price).toLocaleString()}</p>

                    {/* Cancel for pending */}
                    {b.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancelling === b.id}
                        className="block text-xs text-red-400 hover:text-red-500 font-medium hover:underline disabled:opacity-50 ml-auto"
                      >
                        {cancelling === b.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}

                    {/* Rate & Review for completed */}
                    {b.status === 'completed' && !isReviewed && (
                      <button
                        onClick={() => setReviewBooking(b)}
                        className="flex items-center gap-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ml-auto"
                      >
                        <Star className="w-3.5 h-3.5" /> Rate & Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          specialistName="your specialist"
          onClose={() => setReviewBooking(null)}
          onSubmitted={() => setReviewed(prev => ({ ...prev, [reviewBooking.id]: true }))}
        />
      )}
    </div>
  );
};

export default ClientBookings;
