import React, { useState } from 'react';
import { LogoIcon } from './icons';
import { Button } from './Button';
import { AuthScreen } from '../types';

interface AuthPageProps {
    onLogin: (email: string, pass: string) => void;
    onSignUp: (email: string, channelName: string, youtubeUrl: string, pass: string) => void;
    onBack: () => void;
}

const AuthForm: React.FC<Omit<AuthPageProps, 'onBack'>> = ({ onLogin, onSignUp }) => {
    const [authScreen, setAuthScreen] = useState(AuthScreen.SignUp);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [channelName, setChannelName] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authScreen === AuthScreen.Login) {
            onLogin(email, password);
        } else {
            onSignUp(email, channelName, youtubeUrl, password);
        }
    }

    return (
        <div className="w-full max-w-md bg-white/10 dark:bg-black/20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
            <div className="flex justify-center mb-6">
                 <button onClick={() => setAuthScreen(AuthScreen.Login)} className={`px-4 py-2 text-lg font-semibold rounded-l-lg transition ${authScreen === AuthScreen.Login ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white' : 'bg-white/20 text-gray-300'}`}>Se connecter</button>
                 <button onClick={() => setAuthScreen(AuthScreen.SignUp)} className={`px-4 py-2 text-lg font-semibold rounded-r-lg transition ${authScreen === AuthScreen.SignUp ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white' : 'bg-white/20 text-gray-300'}`}>S'inscrire</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                {authScreen === AuthScreen.SignUp && (
                    <>
                        <input type="text" placeholder="Nom de chaîne" value={channelName} onChange={e => setChannelName(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                        <input type="url" placeholder="Lien chaîne YouTube" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                    </>
                )}
                <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                <Button type="submit" className="w-full !py-3.5 text-lg">
                    {authScreen === AuthScreen.Login ? 'Se connecter' : "S'inscrire"}
                </Button>
            </form>
        </div>
    );
};

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignUp, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans animate-fade-in flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-transparent to-blue-900/50"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="relative z-10 text-center">
            <div className="flex justify-center mb-8">
                <LogoIcon className="h-16 w-auto" />
            </div>
            <AuthForm onLogin={onLogin} onSignUp={onSignUp} />
             <button onClick={onBack} className="mt-8 text-gray-300 hover:text-white transition">
                &larr; Retour à l'accueil
             </button>
        </div>
    </div>
  );
};
