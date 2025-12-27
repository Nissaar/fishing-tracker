import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Fish, LogOut, User } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fish className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold">Fishing Tracker Pro</h1>
              <p className="text-blue-100 text-sm">Mauritius Edition</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full border-2 border-white" />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="hidden md:block">
                <p className="font-semibold">{user?.username}</p>
                <p className="text-xs text-blue-100">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;