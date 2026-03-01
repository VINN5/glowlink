import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent React StrictMode double-invocation consuming the one-time code
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get('code');
    const role = sessionStorage.getItem('google_role') || 'client';

    if (!code) {
      toast.error('Google login failed — no code received');
      navigate('/login');
      return;
    }

    const handleCallback = async () => {
      try {
        const user = await loginWithGoogle(code, role);
        sessionStorage.removeItem('google_role');
        toast.success(`Welcome, ${user.full_name}! 🎉`);
        if (user.role === 'specialist') navigate('/specialist/dashboard');
        else if (user.role === 'admin') navigate('/admin');
        else navigate('/client/dashboard');
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Google login failed';
        toast.error(msg);
        navigate('/login');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <p className="text-gray-600 font-medium">Signing you in with Google...</p>
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mt-4" />
      </div>
    </div>
  );
};

export default GoogleCallback;

