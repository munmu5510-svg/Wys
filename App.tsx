import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { MainLayout } from './components/MainLayout';
import { Workspace } from './components/Workspace';
import { AccountPage } from './components/AccountPage';
import { AuthPage } from './components/AuthPage';
import { User } from './types';
import { INITIAL_FREE_GENERATIONS } from './constants';

enum Page {
    Landing,
    Auth,
    Workspace,
    Account,
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [page, setPage] = useState<Page>(Page.Landing);

    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('wyslider_user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
                setPage(Page.Workspace);
            } else {
                setPage(Page.Landing);
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            // Clear corrupted data and default to landing page
            localStorage.removeItem('wyslider_user');
            setPage(Page.Landing);
        }
        
        // Check for saved theme
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, []);

    const handleUpdateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('wyslider_user', JSON.stringify(updatedUser));
    };

    const handleLogin = (email: string, pass: string) => {
        // Mock login
        console.log("Login attempt with:", email, pass);
        const savedUser = localStorage.getItem('wyslider_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser) as User;
            if (parsedUser.email === email) { // Simple check
                setUser(parsedUser);
                setPage(Page.Workspace);
                return;
            }
        }
        alert("Utilisateur non trouvé ou mot de passe incorrect. Veuillez vous inscrire.");
    };

    const handleSignUp = (email: string, channelName: string, youtubeUrl: string, pass: string) => {
        // Mock signup
        console.log("Signup with:", email, channelName, youtubeUrl, pass);
        const newUser: User = {
            email,
            channelName,
            youtubeUrl,
            generationsLeft: INITIAL_FREE_GENERATIONS,
        };
        handleUpdateUser(newUser);
        setPage(Page.Workspace);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('wyslider_user');
        setPage(Page.Landing);
    };

    if (!user) {
        switch (page) {
            case Page.Auth:
                return <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} onBack={() => setPage(Page.Landing)} />;
            case Page.Landing:
            default:
                return <LandingPage onNavigateToAuth={() => setPage(Page.Auth)} />;
        }
    }
    
    // User is authenticated
    return (
        <MainLayout 
            user={user} 
            onLogout={handleLogout} 
            onNavigateToAccount={() => setPage(Page.Account)}
        >
            {page === Page.Workspace && (
                <Workspace 
                    user={user} 
                    onUpdateUser={handleUpdateUser} 
                    onNavigateAccount={() => setPage(Page.Account)} 
                />
            )}
            {page === Page.Account && <AccountPage user={user} onUpdateUser={handleUpdateUser} onBack={() => setPage(Page.Workspace)} />}
        </MainLayout>
    );
};

export default App;