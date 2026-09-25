import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // The backend puts the token in the fragment so it never reaches a server log
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');

    // Drop the token from the address bar and browser history right away
    window.history.replaceState(null, '', window.location.pathname);

    if (token) {
      localStorage.setItem('token', token);
      // Full reload so AuthContext loads the profile with the new token
      window.location.replace('/dashboard');
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg">Logging you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
