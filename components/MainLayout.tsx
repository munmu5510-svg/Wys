
import React, { useState, useEffect } from 'react';
import { LogoIcon, UserIcon, LogoutIcon, SunIcon, MoonIcon, SparklesIcon, DiamondIcon } from './icons';
import { User } from '../types';

interface MainLayoutProps {
  user: User | null;
  onLogout: () => void;
  onNavigateToAccount: () => void;
  children: React.ReactNode;
}

const ThemeToggle: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setIsDarkMode(isDark);
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        setIsDarkMode(!isDarkMode);
    };

    return (
        <button onClick={toggleTheme} title={isDarkMode ? "Passer au thème clair" : "Passer au thème sombre"} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            {isDarkMode ? <SunIcon className="h-5 w-5 text-yellow-400" /> : <MoonIcon className="h-5 w-5 text-gray-700" />}
        </button>
    );
};


export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout, onNavigateToAccount, children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={onNavigateToAccount}>
              <LogoIcon className="h-8 w-auto" />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                {user?.isProPlus && (
                    <div className="hidden sm:flex items-center space-x-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm animate-pulse">
                        <DiamondIcon className="h-4 w-4" />
                        <span>PRO+</span>
                    </div>
                )}
                <div className="flex items-center space-x-2 bg-gradient-to-r from-brand-purple/20 to-brand-blue/20 text-brand-purple dark:text-brand-blue rounded-full px-3 py-1 text-sm font-medium">
                    <SparklesIcon className="h-4 w-4" />
                    <span>{user?.generationsLeft ?? 0}<span className="hidden sm:inline">&nbsp;générations</span></span>
                </div>
                <ThemeToggle />
              <button onClick={onNavigateToAccount} title="Mon Compte" className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative">
                {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-gray-300 dark:border-gray-600" />
                ) : (
                    <UserIcon className="h-6 w-6" />
                )}
              </button>
              <button onClick={onLogout} title="Se déconnecter" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <LogoutIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};