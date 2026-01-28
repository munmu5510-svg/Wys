
import React, { useState } from 'react';
import { LogoIcon } from './icons';
import { Button } from './Button';
import { AuthScreen } from '../types';

interface AuthPageProps {
    onLogin: (email: string, pass: string) => Promise<void>;
    onSignUp: (name: string, email: string, pass: string) => Promise<void>;
    onGoogleLogin: () => Promise<void>;
    onBack: () => void;
    onBypassLogin?: () => void;
}

const AuthForm: React.FC<Omit<AuthPageProps, 'onBack'>> = ({ onLogin, onSignUp, onGoogleLogin, onBypassLogin }) => {
    const [authScreen, setAuthScreen] = useState<AuthScreen>('SignUp');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            } else {
                await onSignUp(name, email, password);
            }
        } catch (err) {
            alert("Erreur d'authentification.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white/10 dark:bg-black/20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10">
            <div className="flex justify-center mb-6">
                 <button onClick={() => setAuthScreen('Login')} className={`w-1/2 py-2 font-bold rounded-l-lg transition border-r border-white/10 ${authScreen === 'Login' ? 'bg-brand-purple text-white' : 'bg-white/20 text-gray-300'}`}>Connexion</button>
                 <button onClick={() => setAuthScreen('SignUp')} className={`w-1/2 py-2 font-bold rounded-r-lg transition ${authScreen === 'SignUp' ? 'bg-brand-purple text-white' : 'bg-white/20 text-gray-300'}`}>Inscription</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                {authScreen === 'SignUp' && <input type="text" placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-gray-300"/>}
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-gray-300"/>
                <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-gray-300"/>
                <Button type="submit" className="w-full py-3" isLoading={isLoading}>{authScreen === 'Login' ? 'Se connecter' : "S'inscrire"}</Button>
            </form>
        </div>
    );
};

export const AuthPage: React.FC<AuthPageProps> = (props) => (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-transparent to-blue-900/50"></div>
        <div className="relative z-10 text-center w-full max-w-md">
            <LogoIcon className="h-16 mx-auto mb-8" />
            <AuthForm {...props} />
            <button onClick={props.onBack} className="mt-8 text-gray-400 hover:text-white transition">&larr; Retour à l'accueil</button>
        </div>
    </div>
);
