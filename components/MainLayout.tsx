
import * as React from 'react';
import { LogoIcon, UserIcon, LogoutIcon } from './icons';
import { User } from '../types';

interface MainLayoutProps {
  user: User | null;
  onLogout: () => void;
  onNavigateToAccount: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout, onNavigateToAccount, children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer space-x-2" onClick={onNavigateToAccount}>
              <LogoIcon className="h-8 w-auto" />
              <span className="font-bold text-xl tracking-tight hidden sm:block">WySlider</span>
            </div>
            
            <div className="flex items-center space-x-4">
                <div className="hidden md:flex px-3 py-1 bg-brand-purple/10 rounded-full text-brand-purple text-sm font-semibold">
                    {user?.generationsLeft} credits
                </div>
                <button onClick={onNavigateToAccount} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                   <UserIcon className="h-6 w-6"/>
                </button>
                <button onClick={onLogout} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition text-red-400">
                   <LogoutIcon className="h-6 w-6"/>
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
