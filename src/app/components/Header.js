'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getNavigationLinks, getProfileLinks, appConfig } from '@/lib/navigationConfig';
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown 
} from 'lucide-react';

const Header = () => {
  const { user, userProfile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileDropdownOpen(false);
  };

  // Get navigation links based on user role
  const navLinks = getNavigationLinks(userProfile?.role);
  const profileLinks = getProfileLinks();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image
                src={appConfig.logo}
                alt="University Logo"
                width={40}
                height={40}
                className="object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900">
                  {appConfig.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {appConfig.subtitle}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-red-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                3
              </span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-red-600" />
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {userProfile?.name || user.email}
                </span>
                <ChevronDown size={16} />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {userProfile?.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {userProfile?.email || user.email}
                    </p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {userProfile?.role || 'Student'}
                    </span>
                  </div>
                  <div className="py-1">
                    {profileLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        {link.icon === 'User' && <User size={16} className="mr-2" />}
                        {link.icon === 'Settings' && <Settings size={16} className="mr-2" />}
                        {link.icon === 'Bell' && <Bell size={16} className="mr-2" />}
                        {link.label}
                      </Link>
                    ))}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
