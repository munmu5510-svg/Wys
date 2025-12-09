
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

const BottomNavItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    isActive: boolean; 
    onClick: () => void 
}> = ({ icon, label, isActive, onClick }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors ${isActive ? 'text-brand-purple' : 'text-gray-400 hover:text-white'}`}
    >
        <div className={`${isActive ? 'transform scale-110' : ''} transition-transform duration-200`}>
            {icon}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

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
                <div className="hidden md:flex px-3 py-1 bg-brand-purple/10 rounded-full text-brand-purple text-sm font-semibold">
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
      {/* Added pb-16 only on mobile to prevent content from being hidden behind the fixed bottom bar */}
      <main className="flex-1 overflow-hidden bg-gray-900 relative flex flex-col">
        <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {onTabChange && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-800 border-t border-gray-700 z-50 flex items-center justify-around pb-safe">
              <BottomNavItem 
                  icon={<HomeIcon className="h-6 w-6"/>} 
                  label="Dashboard" 
                  isActive={activeTab === 'dashboard'} 
                  onClick={() => onTabChange('dashboard')} 
              />
              <BottomNavItem 
                  icon={<PencilSquareIcon className="h-6 w-6"/>} 
                  label="Studio" 
                  isActive={activeTab === 'studio'} 
                  onClick={() => onTabChange('studio')} 
              />
               <BottomNavItem 
                  icon={<UserIcon className="h-6 w-6"/>} 
                  label="Account" 
                  isActive={activeTab === 'account'} 
                  onClick={() => onTabChange('account')} 
              />
          </div>
      )}
    </div>
  );
};