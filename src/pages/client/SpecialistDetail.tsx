import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { specialistsAPI, servicesAPI, bookingsAPI, reviewsAPI, portfolioAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MapPin, Star, Shield, Clock, Calendar, ArrowLeft,
  Scissors, Check, User, MessageCircle
} from 'lucide-react';
import { messagesAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PortfolioGallery from '../../components/portfolio/PortfolioGallery';

const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const categoryEmoji: Record<string, string> = {
  hair: '💇', makeup: '💄', nails: '💅', skincare: '🧴',
  massage: '💆', lashes: '👁️', brows: '🪮', other: '✨',
};

const SpecialistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [specialist, setSpecialist] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const sRes = await specialistsAPI.getById(id!);
        setSpecialist(sRes.data);
        const svRes = await servicesAPI.getBySpecialist(sRes.data.user_id);
        setServices(svRes.data);
        const rRes = await reviewsAPI.getBySpecialist(id!);
        setReviews(rRes.data);
        const pRes = await portfolioAPI.getBySpecialist(id!);
        setPortfolio(pRes.data);
      } catch {
        toast.error('Specialist not found');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Generate time slots from an availability window
  const generateSlots = (startTime: string, endTime: string, duration: number = 60) => {
    const slots: string[] = [];
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let current = sh * 60 + sm;
    const end = eh * 60 + em;
    while (current + duration <= end) {
      const s = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
      const e = `${String(Math.floor((current + duration) / 60)).padStart(2, '0')}:${String((current + duration) % 60).padStart(2, '0')}`;
      slots.push(`${s} - ${e}`);
      current += duration;
    }
    return slots;
  };

  const availability = specialist?.availability || [];
  const sortedAvailability = [...availability].sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  const selectedDaySlots = (() => {
    const dayAvail = availability.find((a: any) => a.day === selectedDay);
    if (!dayAvail || !selectedService) return [];
    return generateSlots(dayAvail.start_time, dayAvail.end_time, selectedService.duration_minutes || 60);
  })();

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book');
      navigate('/login');
      return;
    }
    if (!selectedService) return toast.error('Please select a service');
    if (!bookingDate) return toast.error('Please select a date');
    if (!selectedSlot) return toast.error('Please select a time slot');

    setBooking(true);
    try {
      await bookingsAPI.create({
        specialist_id: id,
        service_id: selectedService.id,
        booking_date: new Date(`${bookingDate}T${selectedSlot.split(' - ')[0]}`).toISOString(),
        time_slot: selectedSlot,
        day_of_week: selectedDay,
        notes,
      });
      setBooked(true);
      toast.success('Booking confirmed! 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handleMessage = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      const res = await messagesAPI.startConversation({ other_user_id: specialist.user_id });
      navigate('/client/messages', { state: { conversationId: res.data.id } });
    } catch {
      toast.error('Could not start conversation');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
    </div>
  );

  if (!specialist) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Specialists
      </button>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* LEFT: Profile + Services + Availability */}
        <div className="lg:col-span-2 space-y-5">

          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-rose-50 shadow-sm overflow-hidden">
            <div className="h-28 bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100" />
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-8 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-md border-4 border-white overflow-hidden flex-shrink-0">
                  {specialist.profile_picture
                    ? <img
                        src={specialist.profile_picture.startsWith('http') ? specialist.profile_picture : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${specialist.profile_picture}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    : <User className="w-7 h-7" />
                  }
                </div>
                <div className="pb-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900">{specialist.full_name || 'Beauty Specialist'}</h1>
                    {specialist.is_verified && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                        <Shield className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {specialist.city && (
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        <MapPin className="w-3.5 h-3.5" /> {specialist.city}
                      </span>
                    )}
                    {specialist.location && (
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        📍 {specialist.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-amber-500 text-sm font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {specialist.rating?.toFixed(1)} ({specialist.total_reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {specialist.bio && (
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{specialist.bio}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {specialist.categories?.map((cat: string) => (
                  <span key={cat} className="flex items-center gap-1.5 bg-rose-50 text-rose-600 text-xs px-3 py-1 rounded-xl font-medium capitalize">
                    {categoryEmoji[cat] || '✨'} {cat}
                  </span>
                ))}
                {specialist.years_of_experience && (
                  <span className="bg-gray-50 text-gray-500 text-xs px-3 py-1 rounded-xl font-medium">
                    {specialist.years_of_experience} yrs experience
                  </span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleMessage}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-rose-50 hover:text-rose-500 text-gray-600 border border-gray-200 hover:border-rose-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                >
                  <MessageCircle className="w-4 h-4" /> Message Specialist
                </button>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-rose-400" /> Services
            </h2>
            {services.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No services listed yet</p>
            ) : (
              <div className="space-y-2.5">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setSelectedSlot(''); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                      selectedService?.id === s.id
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-gray-100 hover:border-rose-200 hover:bg-rose-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedService?.id === s.id ? 'bg-rose-500' : 'bg-gray-100'}`}>
                        <Scissors className={`w-4 h-4 ${selectedService?.id === s.id ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 capitalize">{s.category}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {s.duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-500">KSh {Number(s.price).toLocaleString()}</span>
                      {selectedService?.id === s.id && <Check className="w-4 h-4 text-rose-500" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-400" /> Availability
            </h2>
            {sortedAvailability.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No availability set by specialist</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2.5">
                {sortedAvailability.map((slot: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedDay(slot.day); setSelectedSlot(''); }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                      selectedDay === slot.day
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-gray-100 hover:border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedDay === slot.day ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                      <span className="font-semibold text-gray-700 text-sm">{slot.day}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{slot.start_time} – {slot.end_time}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Portfolio */}
          <PortfolioGallery items={portfolio} />

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Reviews
              <span className="text-gray-400 font-normal text-sm">({reviews.length})</span>
            </h2>
            {reviews.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Star className="w-5 h-5 text-amber-300" />
                </div>
                <p className="text-sm text-gray-400">No reviews yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Be the first to review after booking</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
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
                        <div className="flex items-center gap-0.5 mt-0.5 mb-1.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                          ))}
                          <span className="text-xs text-gray-500 ml-1 font-medium">{r.rating}.0</span>
                        </div>
                        {r.comment && (
                          <p className="text-gray-500 text-sm leading-relaxed">{r.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Booking Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 sticky top-6">
            {booked ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">Booking Confirmed!</h3>
                <p className="text-gray-400 text-sm mb-4">Your appointment has been requested.</p>
                <Link
                  to="/client/bookings"
                  className="block bg-rose-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors text-center"
                >
                  View My Bookings
                </Link>
              </div>
            ) : (
              <>
                <h2 className="font-bold text-gray-800 mb-4">Book an Appointment</h2>

                {/* Step 1: Service selected */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">1. Selected Service</p>
                  {selectedService ? (
                    <div className="bg-rose-50 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{selectedService.name}</p>
                        <p className="text-xs text-gray-400">{selectedService.duration_minutes} min</p>
                      </div>
                      <span className="font-bold text-rose-500">KSh {Number(selectedService.price).toLocaleString()}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-3">← Select a service</p>
                  )}
                </div>

                {/* Step 2: Pick a day */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">2. Day</p>
                  {selectedDay ? (
                    <div className="bg-rose-50 rounded-xl p-3 flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-sm">{selectedDay}</span>
                      <button onClick={() => { setSelectedDay(''); setSelectedSlot(''); }} className="text-xs text-rose-400 hover:underline">Change</button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-3">← Select a day from availability</p>
                  )}
                </div>

                {/* Step 3: Pick a date */}
                {selectedDay && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">3. Date</p>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setBookingDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm"
                    />
                  </div>
                )}

                {/* Step 4: Pick a time slot */}
                {selectedDay && selectedService && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">4. Time Slot</p>
                    {selectedDaySlots.length === 0 ? (
                      <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-3">No slots available</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                        {selectedDaySlots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                              selectedSlot === slot
                                ? 'bg-rose-500 text-white'
                                : 'bg-gray-50 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border border-gray-200'
                            }`}
                          >
                            {slot.split(' - ')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes (optional)</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Any special requests..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm resize-none"
                  />
                </div>

                {/* Total */}
                {selectedService && (
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-600">Total</span>
                    <span className="text-lg font-bold text-rose-500">KSh {Number(selectedService.price).toLocaleString()}</span>
                  </div>
                )}

                <button
                  onClick={handleBook}
                  disabled={!selectedService || !bookingDate || !selectedSlot || booking}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </button>

                {!isAuthenticated && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    <Link to="/login" className="text-rose-400 font-semibold hover:underline">Sign in</Link> to book an appointment
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistDetail;
