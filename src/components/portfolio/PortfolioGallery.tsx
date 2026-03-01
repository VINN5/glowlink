import { useState } from 'react';
import { Play, X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getUrl = (url: string) => url.startsWith('http') ? url : `${BASE_URL}${url}`;

interface Props {
  items: any[];
}

const PortfolioGallery = ({ items }: Props) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex(i => (i! > 0 ? i! - 1 : items.length - 1));
  const next = () => setLightboxIndex(i => (i! < items.length - 1 ? i! + 1 : 0));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') closeLightbox();
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-rose-400" /> Portfolio
        </h2>
        <div className="text-center py-8">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <ImageIcon className="w-5 h-5 text-rose-300" />
          </div>
          <p className="text-sm text-gray-400">No portfolio items yet</p>
        </div>
      </div>
    );
  }

  const current = lightboxIndex !== null ? items[lightboxIndex] : null;

  return (
    <>
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-rose-400" /> Portfolio
          <span className="text-gray-400 font-normal text-sm">({items.length})</span>
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
            >
              {item.media_type === 'image' ? (
                <img
                  src={getUrl(item.url)}
                  alt={item.caption || ''}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full relative bg-gray-900">
                  <video src={getUrl(item.url)} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 text-gray-800 ml-0.5" />
                    </div>
                  </div>
                </div>
              )}
              {/* Price badge */}
              {item.price && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                  KSh {item.price.toLocaleString()}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-white text-xs truncate">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && current && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            onClick={closeLightbox}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {lightboxIndex + 1} / {items.length}
          </div>

          {/* Prev */}
          {items.length > 1 && (
            <button
              className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Media */}
          <div
            className="max-w-4xl w-full px-16 flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {current.media_type === 'image' ? (
              <img
                src={getUrl(current.url)}
                alt={current.caption}
                className="max-h-[80vh] max-w-full object-contain rounded-xl"
              />
            ) : (
              <video
                src={getUrl(current.url)}
                controls
                autoPlay
                className="max-h-[80vh] max-w-full rounded-xl"
              />
            )}
            {current.caption && (
              <p className="text-white/60 text-sm mt-3 text-center max-w-md">{current.caption}</p>
            )}
            {current.price && (
              <div className="mt-2 flex justify-center">
                <span className="bg-white/15 text-white font-bold px-4 py-1.5 rounded-full text-sm">
                  KSh {current.price.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Next */}
          {items.length > 1 && (
            <button
              className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default PortfolioGallery;
