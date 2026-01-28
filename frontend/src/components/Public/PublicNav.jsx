import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Fish, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PublicNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center gap-2">
            <Fish className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Fishing Tracker</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Contact
            </Link>
            <Link to="/data-sources" className="text-gray-700 hover:text-blue-600 font-medium">
              Data Sources
            </Link>
            <Link to="/privacy" className="text-gray-700 hover:text-blue-600 font-medium">
              Privacy
            </Link>
            
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="block py-2 text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block py-2 text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link
              to="/data-sources"
              className="block py-2 text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsOpen(false)}
            >
              Data Sources
            </Link>
            <Link
              to="/privacy"
              className="block py-2 text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsOpen(false)}
            >
              Privacy
            </Link>
            
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="block py-2 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-blue-600 hover:text-blue-700 font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block py-2 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default PublicNav;