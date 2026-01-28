
import React, { useState, useRef, useEffect } from 'react';
import { User, Script } from '../types';
import { Button } from './Button';
import { PRICING } from '../constants';
import { UserIcon, DiamondIcon, PencilSquareIcon, SunIcon, MoonIcon, Squares2x2Icon, CheckIcon, KeyIcon, RocketLaunchIcon, SparklesIcon } from './icons';
import { MainLayout } from './MainLayout';

interface AccountPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
  onNavigateToAdmin: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ user, onUpdateUser, onBack, onNavigateToAdmin, isDarkMode, toggleTheme }) => {
    const [section, setSection] = useState<'account'|'templates'|'plan'|'feedback'|'api'>('account');
    const [promoCode, setPromoCode] = useState('');
    const [adminCode, setAdminCode] = useState('');
    const [publicTemplates, setPublicTemplates] = useState<Script[]>([]);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (section === 'templates') {
            const saved = localStorage.getItem('wyslider_public_templates');
            if (saved) setPublicTemplates(JSON.parse(saved));
        }
    }, [section]);

    const handlePromoCode = () => {
        if (promoCode === 'wys2301') {
            onUpdateUser({...user, generationsLeft: user.generationsLeft + 10});
            alert("10 Crédits de production ajoutés avec succès.");
            setPromoCode('');
        } else {
            alert("Code promotionnel invalide.");
        }
    };

    const handleAdminPanel = () => {
        if (adminCode === 'admin2301') {
            onNavigateToAdmin();
        } else {
            alert("Code administrateur incorrect.");
        }
    };

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateUser({ ...user, profilePicture: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const renderContent = () => {
        switch(section) {
            case 'account':
                return (
                    <div className="space-y-10 pb-20 animate-fade-in">
                        <h2 className="text-4xl font-black tracking-tighter uppercase">Profil Créateur</h2>
                        <div className="flex items-center space-x-8 bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] border dark:border-gray-700 shadow-2xl transition-colors">
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="h-32 w-32 bg-brand-purple text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand-purple/30 cursor-pointer overflow-hidden relative group"
                             >
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="h-16 w-16"/>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <PencilSquareIcon className="h-8 w-8 text-white" />
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleProfilePicChange} 
                                />
                             </div>
                             <div className="flex-1">
                                 <p className="font-black text-3xl tracking-tighter uppercase text-gray-900 dark:text-white">{user.name}</p>
                                 <p className="text-gray-500 font-bold text-lg">{user.email}</p>
                                 <div className="mt-4 inline-flex items-center px-4 py-1.5 bg-brand-purple/10 text-brand-purple text-[11px] font-black rounded-xl uppercase tracking-widest border border-brand-purple/20">
                                     {user.status}
                                 </div>
                             </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Identité de la Chaîne</label>
                                <input type="text" className="w-full bg-white dark:bg-gray-700 p-5 rounded-2xl border dark:border-gray-600 font-black text-lg shadow-inner text-gray-900 dark:text-white" defaultValue={user.channelName} onChange={e => onUpdateUser({...user, channelName: e.target.value})}/>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Niche Éditoriale</label>
                                <input type="text" className="w-full bg-white dark:bg-gray-700 p-5 rounded-2xl border dark:border-gray-600 font-black text-lg shadow-inner text-gray-900 dark:text-white" defaultValue={user.niche} onChange={e => onUpdateUser({...user, niche: e.target.value})}/>
                            </div>
                        </div>

                        <div className="pt-10 border-t dark:border-gray-800 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Code Promotionnel</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Tapez votre code..." 
                                            className="flex-1 bg-white dark:bg-gray-700 p-4 rounded-xl border dark:border-gray-600 font-bold text-gray-900 dark:text-white outline-none focus:border-brand-purple"
                                            value={promoCode}
                                            onChange={e => setPromoCode(e.target.value)}
                                        />
                                        <Button onClick={handlePromoCode} className="px-6">Appliquer</Button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Accès Admin</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="password" 
                                            placeholder="Code secret..." 
                                            className="flex-1 bg-white dark:bg-gray-700 p-4 rounded-xl border dark:border-gray-600 font-bold text-gray-900 dark:text-white outline-none focus:border-brand-purple"
                                            value={adminCode}
                                            onChange={e => setAdminCode(e.target.value)}
                                        />
                                        <Button onClick={handleAdminPanel} variant="secondary" className="px-6">Ouvrir</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'api':
                return (
                    <div className="space-y-10 animate-fade-in">
                        <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center text-gray-900 dark:text-white"><KeyIcon className="h-10 w-10 mr-4 text-brand-purple"/> Synchronisation API</h2>
                        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border dark:border-gray-700 space-y-6 shadow-2xl">
                            <p className="text-lg text-gray-500 font-bold leading-relaxed opacity-80">Connectez votre propre clé Gemini pour des capacités de génération sans limites. WySlider traitera vos données localement pour une sécurité maximale.</p>
                            <input type="password" placeholder="Clé Google AI Studio (API_KEY)" className="w-full bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl border dark:border-gray-700 font-mono text-sm tracking-widest shadow-inner text-gray-900 dark:text-white" defaultValue={user.apiKey || ''} onChange={e => onUpdateUser({...user, apiKey: e.target.value})}/>
                        </div>
                    </div>
                );
            case 'templates':
                return (
                    <div className="space-y-10 animate-fade-in">
                        <h2 className="text-4xl font-black tracking-tighter uppercase text-gray-900 dark:text-white">Bibliothèque de Modèles</h2>
                        <div className="grid gap-6">
                            {publicTemplates.map(t => (
                                <div key={t.id} className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border-2 dark:border-gray-700 flex justify-between items-center shadow-xl group hover:border-brand-purple transition-all duration-300">
                                    <div className="flex items-center space-x-6">
                                        <div className="h-16 w-16 bg-brand-purple/5 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-colors">
                                            <Squares2x2Icon className="h-8 w-8"/>
                                        </div>
                                        <div>
                                            <p className="font-black text-2xl tracking-tight uppercase text-gray-900 dark:text-white">{t.title}</p>
                                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest mt-1">Partagé par le créateur : {t.authorName || 'Anonyme'}</p>
                                        </div>
                                    </div>
                                    <Button variant="secondary" className="text-[11px] font-black uppercase tracking-widest px-8">ACTIVER</Button>
                                </div>
                            ))}
                            {publicTemplates.length === 0 && <div className="text-center py-24 bg-gray-50 dark:bg-gray-900 rounded-[3rem] border-4 border-dashed dark:border-gray-800 opacity-20"><p className="text-gray-400 font-black text-2xl tracking-[0.5em] uppercase">Aucun Modèle Disponible</p></div>}
                        </div>
                    </div>
                );
            case 'plan':
                return (
                    <div className="space-y-10 animate-fade-in pb-20">
                        <h2 className="text-4xl font-black tracking-tighter uppercase text-gray-900 dark:text-white">Votre Accès WySlider</h2>
                        <div className="grid gap-8 md:grid-cols-3">
                             <div className="bg-white dark:bg-gray-800/80 p-8 rounded-[2.5rem] border dark:border-gray-700 flex flex-col hover:shadow-2xl transition-all duration-500 shadow-xl group backdrop-blur-sm">
                                <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-brand-purple transition">Starter</h3>
                                <p className="text-5xl font-black my-6 tracking-tighter text-gray-900 dark:text-white">${PRICING.starter}</p>
                                <div className="text-[11px] font-black text-brand-purple mb-8 bg-brand-purple/10 px-4 py-2 rounded-xl uppercase tracking-widest self-start">Valide 15 Jours</div>
                                <ul className="space-y-4 mb-10 text-sm font-black flex-1 text-gray-900 dark:text-white">
                                    <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"/> 10 Packs Scripts</li>
                                    <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"/> Serial Prod (5 Épisodes)</li>
                                </ul>
                                <Button className="w-full py-5 font-black uppercase tracking-widest text-[11px]">S'abonner</Button>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] border-4 border-brand-purple relative flex flex-col shadow-2xl shadow-brand-purple/30 scale-105 z-10 transition-all duration-500">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl">Recommandé</div>
                                <h3 className="text-2xl font-black text-brand-purple uppercase tracking-widest mb-2">Creator</h3>
                                <p className="text-6xl font-black my-6 tracking-tighter text-gray-900 dark:text-white">${PRICING.creator}</p>
                                <div className="text-[11px] font-black text-brand-purple mb-8 bg-brand-purple/10 px-4 py-2 rounded-xl uppercase tracking-widest self-start">Valide 25 Jours</div>
                                <ul className="space-y-4 mb-10 text-sm font-black flex-1 text-gray-900 dark:text-white">
                                    <li className="flex items-center"><CheckIcon className="h-5 w-5 text-brand-purple mr-3 flex-shrink-0"/> 30 Packs Scripts</li>
                                    <li className="flex items-center"><CheckIcon className="h-5 w-5 text-brand-purple mr-3 flex-shrink-0"/> Serial Prod (10 Épisodes)</li>
                                </ul>
                                <Button className="w-full py-6 font-black uppercase tracking-widest text-lg shadow-2xl">S'abonner</Button>
                            </div>

                             <div className="bg-white dark:bg-gray-800/80 p-8 rounded-[2.5rem] border dark:border-gray-700 flex flex-col hover:shadow-2xl transition-all duration-500 shadow-xl group backdrop-blur-sm">
                                <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-brand-purple transition">Authority</h3>
                                <p className="text-5xl font-black my-6 tracking-tighter text-gray-900 dark:text-white">${PRICING.pro}</p>
                                <div className="text-[11px] font-black text-brand-purple mb-8 bg-brand-purple/10 px-4 py-2 rounded-xl uppercase tracking-widest self-start">Valide 31 Jours</div>
                                <ul className="space-y-4 mb-10 text-sm font-black flex-1 text-gray-900 dark:text-white">
                                    <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"/> 50 Packs Scripts</li>
                                    <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"/> Serial Prod (30 Épisodes)</li>
                                </ul>
                                <Button className="w-full py-5 font-black uppercase tracking-widest text-[11px]">S'abonner</Button>
                            </div>
                        </div>
                    </div>
                );
            case 'feedback':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-4xl font-black tracking-tighter uppercase text-gray-900 dark:text-white">Centre de Feedback</h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm opacity-60">Votre avis nous aide à rendre WySlider plus intelligent chaque jour.</p>
                        <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} className="w-full bg-white dark:bg-gray-800 p-8 rounded-[2rem] border-2 dark:border-gray-700 h-64 font-bold text-lg outline-none focus:border-brand-purple transition shadow-inner text-gray-900 dark:text-white" placeholder="Décrivez vos suggestions ou les bugs rencontrés..."/>
                        <Button onClick={() => { alert("Votre message a été transmis à l'équipe technique WySlider !"); setFeedbackMsg(''); }} className="px-12 py-5 font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-purple/20">Envoyer le Rapport</Button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <MainLayout user={user} onLogout={() => {}} onNavigateToAccount={() => {}} isDarkMode={isDarkMode} toggleTheme={toggleTheme} activeTab="account" onTabChange={(t) => t === 'dashboard' && onBack()}>
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
                <div className="w-full md:w-[350px] border-b md:border-b-0 md:border-r dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-row md:flex-col p-8 space-x-3 md:space-x-0 md:space-y-4 overflow-x-auto scrollbar-hide flex-shrink-0">
                    <Button onClick={onBack} variant="outline" className="md:w-full mb-8 font-black text-[11px] tracking-widest uppercase py-4">← Retour au Dashboard</Button>
                    {[
                        {id: 'account', label: 'Mon Profil', icon: <UserIcon className="h-5 w-5"/>},
                        {id: 'api', label: 'Paramètres API', icon: <KeyIcon className="h-5 w-5"/>},
                        {id: 'templates', label: 'Mes Modèles', icon: <Squares2x2Icon className="h-5 w-5"/>},
                        {id: 'plan', label: 'Plans & Crédits', icon: <DiamondIcon className="h-5 w-5"/>},
                        {id: 'feedback', label: 'Nous Écrire', icon: <PencilSquareIcon className="h-5 w-5"/>},
                    ].map(item => (
                        <button key={item.id} onClick={() => setSection(item.id as any)} className={`flex items-center space-x-4 px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${section === item.id ? 'bg-brand-purple text-white shadow-2xl shadow-brand-purple/30 translate-x-1' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                            {item.icon}<span>{item.label}</span>
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-10 md:p-16 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-all duration-500">
                    <div className="max-w-4xl mx-auto">{renderContent()}</div>
                </div>
            </div>
        </MainLayout>
    );
};
