import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { specialistsAPI, usersAPI } from '../services/api';
import { Search, MapPin, Star, Shield, Filter } from 'lucide-react';

const categories = ['All', 'hair', 'makeup', 'nails', 'skincare', 'massage', 'lashes', 'brows'];

const SpecialistCard = ({ specialist }: { specialist: any }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    usersAPI.getUser(specialist.user_id).then(res => setUser(res.data)).catch(() => {});
  }, [specialist.user_id]);

  return (
    <Link
      to={`/specialists/${specialist.id}`}
      className="bg-white rounded-2xl border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all overflow-hidden group"
    >
      {/* Header */}
      <div className="h-24 bg-gradient-to-br from-pink-100 to-rose-100 relative">
        <div className="absolute -bottom-6 left-4">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md border-4 border-white">
            {user?.full_name?.charAt(0) || '?'}
          </div>
        </div>
        {specialist.is_verified && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white rounded-full px-2 py-0.5 text-xs text-green-600 font-medium shadow-sm">
            <Shield className="w-3 h-3" /> Verified
          </div>
        )}
      </div>

      <div className="pt-8 p-4">
        <h3 className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
          {user?.full_name || 'Loading...'}
        </h3>

        {specialist.city && (
          <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
            <MapPin className="w-3 h-3" /> {specialist.city}
          </div>
        )}

        <div className="flex items-center gap-1 mt-2">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium text-gray-700">{specialist.rating?.toFixed(1) || '0.0'}</span>
          <span className="text-gray-400 text-xs">({specialist.total_reviews} reviews)</span>
        </div>

        {specialist.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {specialist.categories.slice(0, 3).map((cat: string) => (
              <span key={cat} className="bg-pink-50 text-pink-600 text-xs px-2 py-0.5 rounded-full capitalize">
                {cat}
              </span>
            ))}
          </div>
        )}

        {specialist.bio && (
          <p className="text-gray-500 text-xs mt-2 line-clamp-2">{specialist.bio}</p>
        )}
      </div>
    </Link>
  );
};

const Specialists = () => {
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');

  useEffect(() => {
    const fetchSpecialists = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedCategory !== 'All') params.category = selectedCategory;
        if (search) params.city = search;
        const res = await specialistsAPI.list(params);
        setSpecialists(res.data);
      } catch {
        setSpecialists([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialists();
  }, [selectedCategory, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 py-12 px-4 border-b border-pink-100">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Specialist</h1>
          <p className="text-gray-500 mb-6">Discover beauty professionals near you</p>

          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-pink-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-sm shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Category filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                selectedCategory === cat
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : specialists.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-medium">No specialists found</p>
            <p className="text-sm mt-1">Try a different category or city</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialists.map((s: any) => (
              <SpecialistCard key={s.id} specialist={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Specialists;
