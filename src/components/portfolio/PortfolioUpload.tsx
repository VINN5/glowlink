import { useState, useEffect, useRef } from 'react';
import { portfolioAPI } from '../../services/api';
import { Upload, Trash2, Play, ImageIcon, Loader2, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getUrl = (url: string) => url.startsWith('http') ? url : `${BASE_URL}${url}`;

const PortfolioUpload = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [caption, setCaption] = useState('');
  const [price, setPrice] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    portfolioAPI.getMine()
      .then(r => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) return toast.error('Only images and videos are allowed');
    if (isImage && file.size > 10 * 1024 * 1024) return toast.error('Image must be under 10MB');
    if (isVideo && file.size > 50 * 1024 * 1024) return toast.error('Video must be under 50MB');
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setCaption('');
    setPrice('');
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const res = await portfolioAPI.upload(pendingFile, caption, price);
      setItems(prev => [res.data, ...prev]);
      setPendingFile(null);
      setPendingPreview(null);
      setCaption('');
      setPrice('');
      toast.success('Added to portfolio!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from your portfolio?')) return;
    setDeleting(id);
    try {
      await portfolioAPI.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Removed from portfolio');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const cancelPending = () => {
    setPendingFile(null);
    setPendingPreview(null);
    setCaption('');
    setPrice('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-violet-400" /> Portfolio
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{items.length}/20 items · Photos & videos of your work</p>
        </div>
      </div>

      <div className="p-5">
        {/* Pending preview */}
        {pendingFile && pendingPreview ? (
          <div className="mb-5 border-2 border-violet-200 rounded-2xl overflow-hidden bg-violet-50/30">
            <div className="relative">
              {pendingFile.type.startsWith('image/') ? (
                <img src={pendingPreview} alt="Preview" className="w-full max-h-64 object-cover" />
              ) : (
                <video src={pendingPreview} controls className="w-full max-h-64" />
              )}
              <button
                onClick={cancelPending}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Add a caption (optional)..."
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">KSh</span>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Set a price (optional)"
                  min={0}
                  className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={cancelPending}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-violet-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Drop zone */
          <div
            onClick={() => items.length < 20 && inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-5 ${
              dragOver ? 'border-violet-400 bg-violet-50' :
              items.length >= 20 ? 'border-gray-200 opacity-50 cursor-not-allowed' :
              'border-gray-200 hover:border-violet-300 hover:bg-violet-50/30'
            }`}
          >
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-violet-400" />
            </div>
            <p className="font-semibold text-gray-600 text-sm">
              {items.length >= 20 ? 'Portfolio full (20/20)' : 'Click or drag to upload'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Photos (JPEG, PNG, WebP up to 10MB) · Videos (MP4, MOV, WebM up to 50MB)</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
        />

        {/* Portfolio grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">No portfolio items yet. Upload your first work!</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map(item => (
              <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => setLightbox(item)}
              >
                {item.media_type === 'image' ? (
                  <img src={getUrl(item.url)} alt={item.caption || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <video src={getUrl(item.url)} className="w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-gray-800 ml-0.5" />
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
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-start justify-end p-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                    disabled={deleting === item.id}
                    className="w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white transition-colors"
                  >
                    {deleting === item.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <p className="text-white text-xs truncate">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            {lightbox.media_type === 'image' ? (
              <img src={getUrl(lightbox.url)} alt={lightbox.caption} className="w-full max-h-[80vh] object-contain rounded-xl" />
            ) : (
              <video src={getUrl(lightbox.url)} controls autoPlay className="w-full max-h-[80vh] rounded-xl" />
            )}
            {lightbox.caption && (
              <p className="text-white/70 text-center text-sm mt-3">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioUpload;
