import React, { useState, useRef, useEffect } from 'react';
import { UserCircle, LogOut, Mail, User, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Theme State (Defaulting strictly to 'light')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  // Apply the theme directly to the HTML document root for Tailwind
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Close dropdown if user clicks anywhere outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* The Small Profile Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors focus:ring-2 focus:ring-bis-500 outline-none"
        title="Account Profile"
      >
        <UserCircle className="w-6 h-6 text-bis-900" />
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
          
          <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-slate-800">
              <User className="w-5 h-5 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Full Name</span>
                <span className="text-sm font-extrabold truncate">{user?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-slate-800">
              <Mail className="w-5 h-5 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email</span>
                <span className="text-sm font-medium truncate">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Sign Out Button at the bottom */}
          <button 
            onClick={logout}
            className="w-full p-4 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" /> 
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};