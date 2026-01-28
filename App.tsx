
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Workspace } from './components/Workspace';
import { AccountPage } from './components/AccountPage';
import { AdminPage } from './components/AdminPage';
import { OnboardingPage } from './components/OnboardingPage';
import { User, AppScreen } from './types';
import { LogoIcon } from './components/icons';

const SplashScreen = () => (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-fade-in">
        <div className="relative">
            <div className="absolute inset-0 bg-brand-purple blur-3xl opacity-20 animate-pulse"></div>
            <LogoIcon className="h-24 w-auto text-white relative z-10 animate-bounce" />
        </div>
        <h1 className="mt-6 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600 tracking-tighter">WySlider</h1>
        <p className="text-gray-500 mt-2 text-sm tracking-widest uppercase font-bold">AI YouTube Architecture</p>
    </div>
);

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('Dashboard');
  const [isAuthFlow, setIsAuthFlow] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    const savedTheme = localStorage.getItem('wyslider_theme');
    if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
    const savedUser = localStorage.getItem('wyslider_user');
    if (savedUser) { try { setUser(JSON.parse(savedUser)); } catch(e) {} }
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
      const mode = !isDarkMode;
      setIsDarkMode(mode);
      document.documentElement.classList.toggle('dark', mode);
      localStorage.setItem('wyslider_theme', mode ? 'dark' : 'light');
  }

  const handleLogin = async (email: string, _pass: string) => {
    const saved = localStorage.getItem('wyslider_user');
    let existing: User | null = null;
    if (saved) { try { existing = JSON.parse(saved); } catch(e) {} }

    // If existing and same email, restore session including onboarding state
    if (existing && existing.email === email) {
        updateUserSession(existing);
    } else {
        const mockUser: User = {
          id: 'u_' + Date.now(),
          name: 'Utilisateur',
          email,
          channelName: '',
          youtubeUrl: '',
          niche: '',
          status: 'Just Me',
          generationsLeft: 10,
          onboardingCompleted: true // Regular login (not Signup) assumes returning user
        };
        updateUserSession(mockUser);
    }
    setIsAuthFlow(false);
  };

  const handleSignUp = async (name: string, email: string, _pass: string) => {
     const mockUser: User = { id: 'u_' + Date.now(), name, email, channelName: '', youtubeUrl: '', niche: '', status: 'Just Me', generationsLeft: 10, onboardingCompleted: false };
    updateUserSession(mockUser);
    setIsAuthFlow(false);
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('wyslider_user'); setIsAuthFlow(false); setCurrentScreen('Dashboard'); };
  const updateUserSession = (u: User) => { setUser(u); localStorage.setItem('wyslider_user', JSON.stringify(u)); };

  if (loading) return <SplashScreen />;

  if (!user) {
    if (isAuthFlow) return <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} onGoogleLogin={async()=>alert("Bientôt disponible")} onBack={()=>setIsAuthFlow(false)} />;
    return <LandingPage onNavigateToAuth={() => setIsAuthFlow(true)} />;
  }

  if (!user.onboardingCompleted) {
      return <OnboardingPage user={user} onComplete={(data) => updateUserSession({ ...user, ...data })} />;
  }

  if (currentScreen === 'Admin') return <AdminPage onBack={() => setCurrentScreen('Dashboard')} />;
  if (currentScreen === 'Account') return <AccountPage user={user} onUpdateUser={updateUserSession} onBack={() => setCurrentScreen('Dashboard')} onNavigateToAdmin={() => setCurrentScreen('Admin')} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;

  return <Workspace user={user} onUpdateUser={updateUserSession} onNavigateAccount={() => setCurrentScreen('Account')} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
};
