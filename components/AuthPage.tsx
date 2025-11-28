
import React, { useState } from 'react';
import { LogoIcon } from './icons';
import { Button } from './Button';
import { AuthScreen } from '../types';

interface AuthPageProps {
    onLogin: (email: string, pass: string) => Promise<void>;
    onSignUp: (email: string, channelName: string, youtubeUrl: string, niche: string, pass: string) => Promise<void>;
    onGoogleLogin: () => Promise<void>;
    onBack: () => void;
    onBypassLogin?: () => void;
}

const AuthForm: React.FC<Omit<AuthPageProps, 'onBack'>> = ({ onLogin, onSignUp, onGoogleLogin, onBypassLogin }) => {
    const [authScreen, setAuthScreen] = useState<AuthScreen>('SignUp');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [channelName, setChannelName] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [niche, setNiche] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsLoading(true);
        try {
            if (authScreen === 'Login') {
                if (email === 'admin' && password === '2301') {
                     if (onBypassLogin) onBypassLogin();
                     return;
                }
                await onLogin(email, password);
            } else if (authScreen === 'SignUp') {
                if (accessCode !== '2301Wys') {
                    alert("Code Bêta invalide.");
                    setIsLoading(false);
                    return;
                }
                await onSignUp(email, channelName, youtubeUrl, niche, password);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md bg-white/10 dark:bg-black/20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10">
            <div className="flex justify-center mb-6 text-sm sm:text-base">
                 <button onClick={() => setAuthScreen('Login')} className={`w-1/2 px-4 py-2 font-semibold rounded-l-lg transition border-r border-white/10 ${authScreen === 'Login' ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white' : 'bg-white/20 text-gray-300'}`}>Connexion</button>
                 <button onClick={() => setAuthScreen('SignUp')} className={`w-1/2 px-4 py-2 font-semibold rounded-r-lg transition ${authScreen === 'SignUp' ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white' : 'bg-white/20 text-gray-300'}`}>Inscription</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                </div>
                
                {authScreen === 'SignUp' && (
                    <>
                        <input type="text" placeholder="Nom de la chaîne YouTube" value={channelName} onChange={e => setChannelName(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                        <input type="url" placeholder="URL de la chaîne YouTube" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                        <input type="text" placeholder="Nom de la niche" value={niche} onChange={e => setNiche(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                        <input type="text" placeholder="Code d'accès Bêta (2301Wys)" value={accessCode} onChange={e => setAccessCode(e.target.value)} required className="w-full px-4 py-3 bg-brand-purple/20 rounded-lg border border-brand-purple/50 focus:ring-2 focus:ring-brand-purple focus:outline-none placeholder-gray-300 text-white font-mono"/>
                    </>
                )}
                
                <div>
                    <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                </div>

                <Button type="submit" className="w-full !py-3.5 text-lg shadow-lg shadow-brand-purple/20 mt-4" isLoading={isLoading}>
                    {authScreen === 'Login' ? 'Se connecter' : "S'inscrire"}
                </Button>
            </form>
        </div>
    );
};

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignUp, onGoogleLogin, onBack, onBypassLogin }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans animate-fade-in flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-transparent to-blue-900/50"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="relative z-10 text-center w-full max-w-md">
            <div className="flex justify-center mb-8">
                <LogoIcon className="h-16 w-auto" />
            </div>
            <AuthForm onLogin={onLogin} onSignUp={onSignUp} onGoogleLogin={onGoogleLogin} onBypassLogin={onBypassLogin} />
             <button onClick={onBack} className="mt-8 text-gray-300 hover:text-white transition">
                &larr; Retour à l'accueil
             </button>
        </div>
    </div>
  );
};
