
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { MainLayout } from './components/MainLayout';
import { Workspace } from './components/Workspace';
import { AccountPage } from './components/AccountPage';
import { AdminPage } from './components/AdminPage';
import { User, AppScreen } from './types';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('Dashboard');
  const [isAuthFlow, setIsAuthFlow] = useState(false);

  useEffect(() => {
    console.log("WySlider App Mounted V3");
    const savedUser = localStorage.getItem('wyslider_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }
  }, []);

  const handleLogin = async (email: string, _pass: string) => {
    const mockUser: User = {
      id: 'u_' + Date.now(),
      email,
      channelName: 'Creator Channel',
      youtubeUrl: 'https://youtube.com/@creator',
      niche: 'Education',
      generationsLeft: 6,
      storagePreference: 'local',
      lastSyncedAt: undefined
    };
    updateUserSession(mockUser);
    setIsAuthFlow(false);
  };

  const handleSignUp = async (email: string, channelName: string, youtubeUrl: string, niche: string, _pass: string) => {
     const mockUser: User = {
      id: 'u_' + Date.now(),
      email,
      channelName,
      youtubeUrl,
      niche,
      generationsLeft: 6,
      storagePreference: 'local'
    };
    updateUserSession(mockUser);
    setIsAuthFlow(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wyslider_user');
    setCurrentScreen('Dashboard');
    setIsAuthFlow(false);
  };

  const updateUserSession = (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('wyslider_user', JSON.stringify(updatedUser));
  };

  const handleAdminBypass = () => {
      const adminUser: User = {
          id: 'admin_root',
          email: 'admin@wyslider.com',
          channelName: 'WYS Admin',
          youtubeUrl: '',
          niche: 'System',
          generationsLeft: 9999,
          isPro: true
      };
      updateUserSession(adminUser);
      setIsAuthFlow(false);
      setCurrentScreen('Admin');
  };

  if (!user) {
    if (isAuthFlow) {
        return (
            <AuthPage 
                onLogin={handleLogin} 
                onSignUp={handleSignUp} 
                onGoogleLogin={async () => alert("Google Login coming soon.")} 
                onBack={() => setIsAuthFlow(false)}
                onBypassLogin={handleAdminBypass}
            />
        );
    }
    return <LandingPage onNavigateToAuth={() => setIsAuthFlow(true)} />;
  }

  if (currentScreen === 'Admin') {
      return <AdminPage onBack={() => setCurrentScreen('Dashboard')} />;
  }

  if (currentScreen === 'Account') {
      return (
        <AccountPage 
            user={user} 
            onUpdateUser={updateUserSession} 
            onBack={() => setCurrentScreen('Dashboard')}
            onNavigateToAdmin={() => setCurrentScreen('Admin')}
        />
      );
  }

  return (
    <MainLayout user={user} onLogout={handleLogout} onNavigateToAccount={() => setCurrentScreen('Account')}>
       <Workspace 
            user={user} 
            onUpdateUser={updateUserSession} 
            onNavigateAccount={() => setCurrentScreen('Account')}
            onLogout={handleLogout}
       />
    </MainLayout>
  );
};
