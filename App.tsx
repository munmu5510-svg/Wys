import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Workspace } from './components/Workspace';
import { AccountPage } from './components/AccountPage';
import { AdminPage } from './components/AdminPage';
import { User, AppScreen, ViralIdea } from './types';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('Dashboard');
  const [isAuthFlow, setIsAuthFlow] = useState(false);
  const [pendingGenConfig, setPendingGenConfig] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    console.log("WySlider App Mounted V3.2");
    
    // Theme Init
    const savedTheme = localStorage.getItem('wyslider_theme');
    if (savedTheme) {
        const isDark = savedTheme === 'dark';
        setIsDarkMode(isDark);
        if(isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }

    const savedUser = localStorage.getItem('wyslider_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }
  }, []);

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if(newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('wyslider_theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('wyslider_theme', 'light');
      }
      if (user) {
          updateUserSession({...user, theme: newMode ? 'dark' : 'light'});
      }
  }

  const handleLogin = async (email: string, _pass: string) => {
    const mockUser: User = {
      id: 'u_' + Date.now(),
      email,
      channelName: 'Creator Channel',
      youtubeUrl: 'https://youtube.com/@creator',
      niche: 'Education',
      generationsLeft: 6,
      storagePreference: 'local',
      lastSyncedAt: undefined,
      theme: isDarkMode ? 'dark' : 'light'
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
      storagePreference: 'local',
      theme: isDarkMode ? 'dark' : 'light'
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
          isPro: true,
          theme: 'dark'
      };
      updateUserSession(adminUser);
      setIsAuthFlow(false);
      setCurrentScreen('Admin');
  };

  const handleUseIdea = (idea: ViralIdea) => {
      setPendingGenConfig({
          topic: idea.title,
          tone: 'Energique',
          duration: '8-15min',
          goal: `Make a viral video about ${idea.title}`,
          needs: 'High retention hook',
          cta: 'Subscribe for more'
      });
      setCurrentScreen('Dashboard');
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
            onUseIdea={handleUseIdea}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
        />
      );
  }

  return (
       <Workspace 
            user={user} 
            onUpdateUser={updateUserSession} 
            onNavigateAccount={() => setCurrentScreen('Account')}
            onLogout={handleLogout}
            pendingGenConfig={pendingGenConfig}
            clearPendingConfig={() => setPendingGenConfig(null)}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
       />
  );
};