import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { specialistsAPI } from '../../services/api';
import { Search, MapPin, Star, Shield, SlidersHorizontal } from 'lucide-react';

const categories = ['All', 'hair', 'makeup', 'nails', 'skincare', 'massage', 'lashes', 'brows'];

const categoryEmoji: Record<string, string> = {
  All: '✨', hair: '💇', makeup: '💄', nails: '💅',
  skincare: '🧴', massage: '💆', lashes: '👁️', brows: '🪮',
};

const ClientFind = () => {
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, [selectedCategory, search]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Specialists</h1>
        <p className="text-gray-400 text-sm mt-1">Discover beauty professionals near you</p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-rose-100 rounded-2xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm shadow-sm"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-rose-200 hover:text-rose-500'
            }`}
          >
            <span>{categoryEmoji[cat]}</span> {cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-rose-50 overflow-hidden animate-pulse">
              <div className="h-24 bg-rose-50" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : specialists.length === 0 ? (
        <div className="bg-white rounded-2xl border border-rose-50 p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-semibold text-gray-600">No specialists found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different category or city</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4 font-medium">{specialists.length} specialist{specialists.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialists.map((s: any) => (
              <Link
                key={s.id}
                to={`/specialists/${s.id}`}
                className="bg-white rounded-2xl border border-rose-50 hover:border-rose-300 hover:shadow-md transition-all overflow-hidden group"
              >
                {/* Card header */}
                <div className="h-20 bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100 relative">
                  <div className="absolute -bottom-5 left-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md border-4 border-white">
                      {s.city?.charAt(0)?.toUpperCase() || '✨'}
                    </div>
                  </div>
                  {s.is_verified && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-emerald-600 font-semibold shadow-sm">
                      <Shield className="w-3 h-3" /> Verified
                    </div>
                  )}
                </div>

                <div className="pt-7 p-4">
                  <h3 className="font-bold text-gray-800 group-hover:text-rose-500 transition-colors text-sm">
                    {s.city ? `Specialist in ${s.city}` : 'Beauty Specialist'}
                  </h3>

                  {s.city && (
                    <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                      <MapPin className="w-3 h-3" /> {s.city}
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-gray-700">{s.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-400 text-xs">({s.total_reviews})</span>
                  </div>

                  {s.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {s.categories.slice(0, 3).map((cat: string) => (
                        <span key={cat} className="bg-rose-50 text-rose-500 text-xs px-2 py-0.5 rounded-lg capitalize font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {s.bio && (
                    <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">{s.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientFind;
