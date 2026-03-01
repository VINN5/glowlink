import { Link } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';

const ClientFavourites = () => {
  // Favourites will be stored in localStorage for now
  // In production this would be a backend feature
  const favourites: any[] = JSON.parse(localStorage.getItem('glowlink_favourites') || '[]');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Favourites</h1>
        <p className="text-gray-400 text-sm mt-1">Your saved beauty specialists</p>
      </div>

      {favourites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-rose-50 p-14 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-rose-300" />
          </div>
          <p className="font-semibold text-gray-600 mb-1">No favourites yet</p>
          <p className="text-gray-400 text-sm mb-5">Save specialists you love for quick access</p>
          <Link
            to="/client/find"
            className="inline-flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors"
          >
            <Search className="w-4 h-4" /> Find Specialists
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favourites.map((s: any) => (
            <Link
              key={s.id}
              to={`/specialists/${s.id}`}
              className="bg-white rounded-2xl border border-rose-50 p-4 hover:border-rose-200 hover:shadow-sm transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-rose-300 to-pink-400 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {s.name?.charAt(0) || '✨'}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s.city}</p>
              </div>
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400 ml-auto" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientFavourites;
