import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import LandingPage from './components/Public/LandingPage';
import PrivacyPolicy from './components/Public/PrivacyPolicy';
import About from './components/Public/About';
import Contact from './components/Public/Contact';
import DataSources from './components/Public/DataSources';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AuthCallback from './components/Auth/AuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import Admin from './components/Dashboard/Admin';

const FullPageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="loading-spinner"></div>
  </div>
);

// `replace` keeps the back button from bouncing between the page and /login;
// `from` lets Login send the user back where they were headed
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

// The API enforces admin rights; this only spares non-admins a page that
// would load and then bounce them
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      {user?.is_admin ? children : <Navigate to="/dashboard" replace />}
    </ProtectedRoute>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/data-sources" element={<DataSources />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;