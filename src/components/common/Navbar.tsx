import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Menu, X, User, LogOut, Calendar, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'specialist') return '/specialist/dashboard';
    return '/client/dashboard';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
              GlowLink
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/specialists" className="text-gray-600 hover:text-pink-600 transition-colors text-sm font-medium">
              Find Specialists
            </Link>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="text-gray-600 hover:text-pink-600 transition-colors text-sm font-medium">
                  Login
                </Link>
                <Link to="/register" className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-md transition-all">
                  Get Started
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-pink-50 hover:bg-pink-100 px-3 py-2 rounded-full transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.full_name?.split(' ')[0]}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-pink-100 py-1 z-50">
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-pink-50"
                    >
                      <User className="w-4 h-4 text-pink-500" /> Dashboard
                    </Link>
                    <Link
                      to="/bookings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-pink-50"
                    >
                      <Calendar className="w-4 h-4 text-pink-500" /> My Bookings
                    </Link>
                    <hr className="my-1 border-pink-100" />
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-pink-100 space-y-2">
            <Link to="/specialists" className="block px-4 py-2 text-gray-600 hover:bg-pink-50 rounded-lg">Find Specialists</Link>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="block px-4 py-2 text-gray-600 hover:bg-pink-50 rounded-lg">Login</Link>
                <Link to="/register" className="block px-4 py-2 bg-pink-500 text-white rounded-lg text-center">Get Started</Link>
              </>
            ) : (
              <>
                <Link to={getDashboardPath()} className="block px-4 py-2 text-gray-600 hover:bg-pink-50 rounded-lg">Dashboard</Link>
                <button onClick={logout} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg">Logout</button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
