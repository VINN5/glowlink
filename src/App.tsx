import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Specialists from './pages/Specialists';
import GoogleCallback from './pages/GoogleCallback';

// Client
import SpecialistDetail from './pages/client/SpecialistDetail';
import ClientLayout from './pages/client/ClientLayout';
import ClientHome from './pages/client/ClientHome';
import ClientBookings from './pages/client/ClientBookings';
import ClientFind from './pages/client/ClientFind';
import ClientMessages from './pages/client/ClientMessages';
import ClientFavourites from './pages/client/ClientFavourites';
import ClientSettings from './pages/client/ClientSettings';

// Specialist
import SpecialistLayout from './pages/specialist/SpecialistLayout';
import SpecialistHome from './pages/specialist/SpecialistHome';
import SpecialistBookings from './pages/specialist/SpecialistBookings';
import SpecialistServices from './pages/specialist/SpecialistServices';
import SpecialistProfile from './pages/specialist/SpecialistProfile';
import SpecialistMessages from './pages/specialist/SpecialistMessages';
import SpecialistSettings from './pages/specialist/SpecialistSettings';
import SpecialistReviews from './pages/specialist/SpecialistReviews';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';

const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#7c3aed', secondary: '#fff' } },
        }} />
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/specialists" element={<PublicLayout><Specialists /></PublicLayout>} />
          <Route path="/specialists/:id" element={<PublicLayout><SpecialistDetail /></PublicLayout>} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          {/* Client Dashboard */}
          <Route path="/client" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<ClientHome />} />
            <Route path="bookings" element={<ClientBookings />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="find" element={<ClientFind />} />
            <Route path="favourites" element={<ClientFavourites />} />
            <Route path="settings" element={<ClientSettings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Specialist Dashboard */}
          <Route path="/specialist" element={
            <ProtectedRoute allowedRoles={['specialist']}>
              <SpecialistLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<SpecialistHome />} />
            <Route path="bookings" element={<SpecialistBookings />} />
            <Route path="messages" element={<SpecialistMessages />} />
            <Route path="services" element={<SpecialistServices />} />
            <Route path="reviews" element={<SpecialistReviews />} />
            <Route path="profile" element={<SpecialistProfile />} />
            <Route path="settings" element={<SpecialistSettings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
