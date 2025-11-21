
import React, { useState } from 'react';
import { LogoIcon, ArrowDownTrayIcon } from './icons';
import { Button } from './Button';
import { AuthScreen } from '../types';

interface AuthPageProps {
    onLogin: (email: string, pass: string) => void;
    onSignUp: (email: string, channelName: string, youtubeUrl: string, pass: string) => void;
    onImport: (importData: string) => void;
    onBack: () => void;
}

const AuthForm: React.FC<Omit<AuthPageProps, 'onBack'>> = ({ onLogin, onSignUp, onImport }) => {
    const [authScreen, setAuthScreen] = useState(AuthScreen.SignUp);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [channelName, setChannelName] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [importKey, setImportKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authScreen === AuthScreen.Login) {
            onLogin(email, password);
        } else if (authScreen === AuthScreen.SignUp) {
            onSignUp(email, channelName, youtubeUrl, password);
        } else if (authScreen === AuthScreen.Import) {
            onImport(importKey);
        }
    }

    return (
        <div className="w-full max-w-md bg-white/10 dark:bg-black/20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
            <div className="flex justify-center mb-6 text-sm sm:text-base">
                 <button onClick={() => setAuthScreen(AuthScreen.Login)} className={`px-3 sm:px-4 py-2 font-semibold rounded-l-lg transition border-r border-white/10 ${authScreen === AuthScreen.Login ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white' : 'bg-white/20 text-gray-300'}`}>Connexion</button>
                 <button onClick={() => setAuthScreen(AuthScreen.SignUp)} className={`px-3 sm:px-4 py-2 font-semibold transition border-r border-white/10 ${authScreen === AuthScreen.SignUp ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white' : 'bg-white/20 text-gray-300'}`}>Inscription</button>
                 <button onClick={() => setAuthScreen(AuthScreen.Import)} className={`px-3 sm:px-4 py-2 font-semibold rounded-r-lg transition ${authScreen === AuthScreen.Import ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white' : 'bg-white/20 text-gray-300'}`}>Importer</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {authScreen !== AuthScreen.Import && (
                    <input type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                )}
                
                {authScreen === AuthScreen.SignUp && (
                    <>
                        <input type="text" placeholder="Nom de chaîne" value={channelName} onChange={e => setChannelName(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                        <input type="url" placeholder="Lien chaîne YouTube" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                    </>
                )}
                
                {authScreen !== AuthScreen.Import && (
                    <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white"/>
                )}

                {authScreen === AuthScreen.Import && (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-300 mb-2">Collez ici votre "Clé de Connexion Universelle" générée depuis votre autre appareil (Compte {'>'} Synchro).</p>
                        <textarea 
                            placeholder="Collez votre clé de sauvegarde ici..." 
                            value={importKey} 
                            onChange={e => setImportKey(e.target.value)} 
                            required 
                            rows={4}
                            className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-brand-blue focus:outline-none placeholder-gray-300 text-white text-xs font-mono"
                        />
                    </div>
                )}

                <Button type="submit" className="w-full !py-3.5 text-lg">
                    {authScreen === AuthScreen.Login ? 'Se connecter' : authScreen === AuthScreen.SignUp ? "S'inscrire" : "Importer & Restaurer"}
                </Button>
            </form>
        </div>
    );
};

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignUp, onImport, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans animate-fade-in flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-transparent to-blue-900/50"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="relative z-10 text-center w-full max-w-md">
            <div className="flex justify-center mb-8">
                <LogoIcon className="h-16 w-auto" />
            </div>
            <AuthForm onLogin={onLogin} onSignUp={onSignUp} onImport={onImport} />
             <button onClick={onBack} className="mt-8 text-gray-300 hover:text-white transition">
                &larr; Retour à l'accueil
             </button>
        </div>
    </div>
  );
};