import { useState, useRef } from 'react';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Camera, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  gradientFrom?: string;
  gradientTo?: string;
}

const sizes = {
  sm: { avatar: 'w-12 h-12', icon: 'w-5 h-5', camera: 'w-5 h-5 -bottom-1 -right-1', text: 'text-lg' },
  md: { avatar: 'w-16 h-16', icon: 'w-6 h-6', camera: 'w-6 h-6 -bottom-1 -right-1', text: 'text-2xl' },
  lg: { avatar: 'w-24 h-24', icon: 'w-9 h-9', camera: 'w-7 h-7 -bottom-0 -right-0', text: 'text-3xl' },
};

const ProfilePictureUpload = ({
  size = 'md',
  gradientFrom = 'from-rose-400',
  gradientTo = 'to-pink-500',
}: Props) => {
  const { user, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const s = sizes[size];

  const pictureUrl = preview
    || (user?.profile_picture
      ? user.profile_picture.startsWith('http')
        ? user.profile_picture
        : `${BASE_URL}${user.profile_picture}`
      : null);

  const handleClick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const res = await usersAPI.uploadProfilePicture(file);
      await refreshUser(); // ← updates sidebar immediately
      const updatedPicture = res.data.profile_picture;
      if (updatedPicture) {
        setPreview(
          updatedPicture.startsWith('http')
            ? updatedPicture
            : `${BASE_URL}${updatedPicture}`
        );
      }
      toast.success('Profile picture updated!');
    } catch (err: any) {
      setPreview(null);
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <div
        onClick={handleClick}
        className={`${s.avatar} rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-shadow relative group`}
      >
        {pictureUrl ? (
          <img src={pictureUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className={s.text}>{user?.full_name?.charAt(0).toUpperCase() || <User className={s.icon} />}</span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
          {uploading
            ? <Loader2 className={`${s.icon} text-white animate-spin`} />
            : <Camera className={`${s.icon} text-white`} />
          }
        </div>
      </div>

      {/* Camera badge */}
      <button
        onClick={handleClick}
        disabled={uploading}
        className={`absolute ${s.camera} bg-white border-2 border-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-60`}
      >
        {uploading
          ? <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
          : <Camera className="w-3 h-3 text-gray-600" />
        }
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePictureUpload;
