

import * as React from 'react';
import { LogoIcon, UserIcon, LogoutIcon, SunIcon, MoonIcon, HomeIcon, PencilSquareIcon, Squares2x2Icon } from './icons';
import { User } from '../types';

interface MainLayoutProps {
  user: User | null;
  onLogout: () => void;
  onNavigateToAccount: () => void;
  children: React.ReactNode;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  activeTab?: 'dashboard' | 'studio' | 'account' | 'serial';
  onTabChange?: (tab: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout, onNavigateToAccount, children, isDarkMode, toggleTheme, activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 transition-colors duration-300">
      <header className="flex-shrink-0 bg-gray-800 shadow-md z-20 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer space-x-2" onClick={onNavigateToAccount}>
              <LogoIcon className="h-8 w-auto" />
              <span className="font-bold text-xl tracking-tight hidden sm:block text-white">WySlider</span>
            </div>
            
            <div className="flex items-center space-x-4">
                {user?.isPro && (
                   <div className="hidden md:flex items-center justify-center bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide shadow-lg shadow-orange-500/20 mr-1 border border-yellow-300/50">
                      PRO+
                   </div>
                )}
                <div className="hidden md:flex px-3 py-1 bg-brand-purple/10 rounded-full text-brand-purple text-sm font-semibold border border-brand-purple/20">
                    {user?.generationsLeft} credits
                </div>
                
                {toggleTheme && (
                    <button onClick={toggleTheme} className="p-1 rounded-full hover:bg-gray-700 transition text-gray-400 hover:text-white">
                        {isDarkMode ? <SunIcon className="h-6 w-6"/> : <MoonIcon className="h-6 w-6"/>}
                    </button>
                )}

                <button onClick={onNavigateToAccount} className="p-1 rounded-full hover:bg-gray-700 transition text-gray-400 hover:text-white">
                   <UserIcon className="h-6 w-6"/>
                </button>
                <button onClick={onLogout} className="p-1 rounded-full hover:bg-gray-700 transition text-red-400">
                   <LogoutIcon className="h-6 w-6"/>
                </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden bg-gray-900 relative flex flex-col">
        <div className="flex-1 overflow-hidden relative">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Removed per request */}
    </div>
  );
};