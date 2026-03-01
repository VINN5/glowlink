import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Search, Calendar, Heart,
  Settings, LogOut, Menu, X, Sparkles, ChevronRight, MessageCircle
} from 'lucide-react';

const navItems = [
  { to: '/client/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/client/find', icon: Search, label: 'Find Specialists' },
  { to: '/client/bookings', icon: Calendar, label: 'My Bookings' },
  { to: '/client/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/client/favourites', icon: Heart, label: 'Favourites' },
  { to: '/client/settings', icon: Settings, label: 'Settings' },
];

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getAvatarUrl = (pic?: string) =>
  pic ? (pic.startsWith('http') ? pic : `${BASE_URL}${pic}`) : null;

const ClientLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDF8F6] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-rose-100 z-30
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">GlowLink</span>
          </div>
        </div>

        {/* User profile */}
        <div className="p-5 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 overflow-hidden">
              {getAvatarUrl(user?.profile_picture) ? (
                <img src={getAvatarUrl(user?.profile_picture)!} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{user?.full_name}</p>
              <p className="text-xs text-rose-400 font-medium">Client</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/client/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${isActive
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-rose-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-rose-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-rose-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all w-full group"
          >
            <LogOut className="w-4 h-4 group-hover:text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden bg-white border-b border-rose-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-500 rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-sm">GlowLink</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
            {getAvatarUrl(user?.profile_picture)
              ? <img src={getAvatarUrl(user?.profile_picture)!} alt="" className="w-full h-full object-cover" />
              : user?.full_name?.charAt(0).toUpperCase()
            }
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
