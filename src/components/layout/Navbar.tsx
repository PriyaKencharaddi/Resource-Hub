import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Home, GraduationCap, Users, Shield, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const getRoleIcon = () => {
    if (!userProfile) return <User className="h-5 w-5" />;
    switch (userProfile.role) {
      case 'student':
        return <GraduationCap className="h-5 w-5" />;
      case 'teacher':
        return <Users className="h-5 w-5" />;
      case 'admin':
        return <Shield className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  // Active link styling
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-1 transition-colors ${
      isActive ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2 py-2 px-3 rounded-md transition-colors ${
      isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
    }`;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const dashboardPath = userProfile?.role === 'student'
    ? '/student-dashboard'
    : userProfile?.role === 'teacher'
    ? '/teacher-dashboard'
    : userProfile?.role === 'admin'
    ? '/admin-dashboard'
    : '/student-dashboard';

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <img src="/logo.jpg" alt="CSE Fortune Logo" className="h-10 sm:h-12 w-auto object-contain" />
          </NavLink>

          {/* Main navigation (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            {currentUser && (
              <NavLink to={dashboardPath} className={navLinkClass}>
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </NavLink>
            )}

            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>

            <NavLink to="/resources" className={navLinkClass}>
              Resources
            </NavLink>

            {userProfile?.role === 'admin' && (
              <NavLink to="/admin-dashboard" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </div>

          {/* Right side profile/logout (Desktop & Tablet) */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {getRoleIcon()}
                  <span>{userProfile?.username || 'User'}</span>
                  {userProfile?.role && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {userProfile.role}
                    </span>
                  )}
                </div>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `flex items-center space-x-1 transition-colors ${
                      isActive ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'
                    }`
                  }
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded transition-colors ${
                      isActive ? 'text-blue-600 font-semibold' : 'text-blue-600 hover:text-blue-800'
                    }`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    `px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                      isActive ? 'font-semibold' : ''
                    }`
                  }
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          {currentUser && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 mb-2">
              {getRoleIcon()}
              <span className="font-medium text-gray-900">{userProfile?.username || 'User'}</span>
              {userProfile?.role && (
                <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase">
                  {userProfile.role}
                </span>
              )}
            </div>
          )}

          {currentUser && (
            <NavLink to={dashboardPath} className={mobileNavLinkClass} onClick={closeMobileMenu}>
              <Home className="h-5 w-5 text-blue-600" />
              <span>Dashboard</span>
            </NavLink>
          )}

          <NavLink to="/" className={mobileNavLinkClass} onClick={closeMobileMenu}>
            <span>Home</span>
          </NavLink>

          <NavLink to="/resources" className={mobileNavLinkClass} onClick={closeMobileMenu}>
            <span>Resources</span>
          </NavLink>

          {userProfile?.role === 'admin' && (
            <NavLink to="/admin-dashboard" className={mobileNavLinkClass} onClick={closeMobileMenu}>
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Admin Dashboard</span>
            </NavLink>
          )}

          {currentUser ? (
            <div className="pt-2 border-t border-gray-100 flex flex-col space-y-2">
              <NavLink to="/profile" className={mobileNavLinkClass} onClick={closeMobileMenu}>
                <User className="h-5 w-5 text-gray-600" />
                <span>Profile</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 py-2 px-3 rounded-md text-red-600 hover:bg-red-50 transition-colors w-full text-left font-medium"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100 flex flex-col space-y-2">
              <NavLink
                to="/login"
                className="w-full text-center py-2 px-4 rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
                onClick={closeMobileMenu}
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="w-full text-center py-2 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                onClick={closeMobileMenu}
              >
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
