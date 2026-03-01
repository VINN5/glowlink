import { useState, useEffect } from 'react';
import { reviewsAPI, specialistsAPI } from '../../services/api';
import { Star } from 'lucide-react';
import { format } from 'date-fns';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getAvatarUrl = (pic?: string) =>
  pic ? (pic.startsWith('http') ? pic : `${BASE_URL}${pic}`) : null;

const SpecialistReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const profileRes = await specialistsAPI.getMyProfile();
        setProfile(profileRes.data);
        const reviewsRes = await reviewsAPI.getBySpecialist(profileRes.data.id);
        setReviews(reviewsRes.data);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-400 text-sm mt-1">See what clients say about your services</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-8">
              {/* Big rating number */}
              <div className="text-center flex-shrink-0">
                <div className="text-5xl font-black text-gray-900">{avgRating}</div>
                <div className="flex items-center justify-center gap-0.5 mt-1.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
              </div>

              {/* Rating breakdown bars */}
              <div className="flex-1 space-y-2">
                {ratingCounts.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 w-16 flex-shrink-0">
                      <span className="text-xs text-gray-500 w-3">{star}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-purple-50 p-12 text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-amber-300" />
              </div>
              <p className="font-semibold text-gray-600">No reviews yet</p>
              <p className="text-gray-400 text-sm mt-1">Reviews will appear here once clients rate your completed bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => {
                const avatarUrl = getAvatarUrl(r.client_picture);
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                        {avatarUrl
                          ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          : r.client_name?.charAt(0).toUpperCase()
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + date */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-gray-800 text-sm">{r.client_name || 'Client'}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {format(new Date(r.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                          ))}
                          <span className="text-xs text-gray-500 ml-1.5 font-semibold">{r.rating}.0</span>
                        </div>

                        {/* Comment */}
                        {r.comment ? (
                          <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-xl px-3 py-2">
                            "{r.comment}"
                          </p>
                        ) : (
                          <p className="text-gray-400 text-xs italic">No comment left</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SpecialistReviews;
