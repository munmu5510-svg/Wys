
import React, { useState } from 'react';
import { User, ForgeItem } from '../types';
import { Button } from './Button';
import { FEEDBACK_EMAIL, CORP_USE_REWARD, POST_USE_REWARD } from '../constants';
import * as geminiService from '../services/geminiService';
import { DiamondIcon, VideoIcon, RobotIcon, UserIcon, PencilSquareIcon, KeyIcon, ShareIcon, ChartBarIcon, RefreshIcon, FireIcon, PaperClipIcon, PlusIcon, ArrowDownTrayIcon, BoltIcon, CloudArrowUpIcon, CheckIcon } from './icons';

interface AccountPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
  onNavigateToAdmin: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ user, onUpdateUser, onBack, onNavigateToAdmin }) => {
    const [section, setSection] = useState<'account'|'templates'|'apikey'|'share'|'stats'|'plan'|'feedback'|'sync'|'forge'|'storage'>('account');
    const [promoCode, setPromoCode] = useState('');
    const [syncCode, setSyncCode] = useState('');
    
    // Forge State
    const [forgeUrl, setForgeUrl] = useState('');
    const [forgeItems, setForgeItems] = useState<ForgeItem[]>([]);
    
    // Storage State
    const [storagePref, setStoragePref] = useState<'local'|'drive'|'firebase'>(user.storagePreference || 'local');
    const [firebaseConfig, setFirebaseConfig] = useState(user.firebaseConfig || '');
    const [isSyncingDrive, setIsSyncingDrive] = useState(false);

    const handlePromoCode = () => {
        if (promoCode === 'admin2301') {
            onNavigateToAdmin();
        } else if (promoCode === 'wys2301') {
            onUpdateUser({...user, generationsLeft: user.generationsLeft + 10});
            alert("10 Générations ajoutées !");
        } else {
            alert("Code invalide");
        }
    };

    const handleSync = () => {
        if (syncCode === 'wys2323') {
            alert("Données récupérées et synchronisées avec succès.");
        } else {
            alert("Code de synchronisation invalide.");
        }
    };

    const handleSaveApiKey = (key: string) => {
        onUpdateUser({...user, apiKey: key});
        alert("Clé API enregistrée !");
    }

    const handleAddToForge = () => {
        if (!forgeUrl) return;
        const newItem: ForgeItem = {
            id: Date.now().toString(),
            type: 'url',
            value: forgeUrl,
            name: `Ref ${forgeItems.length + 1}`,
            styleDNA: 'Analyzing...'
        };
        setForgeItems([...forgeItems, newItem]);
        setForgeUrl('');
        
        // Simulate analysis
        setTimeout(() => {
            setForgeItems(items => items.map(i => i.id === newItem.id ? {...i, styleDNA: 'High Energy • Fast Cuts'} : i));
        }, 2000);
    }

    const handleCustomizeAI = async () => {
        alert("IA Personnalisée avec succès basés sur vos références !");
        // In a real app, this would send data to backend/local storage to adjust system prompts
    }

    const handleStorageChange = (type: 'local'|'drive'|'firebase') => {
        setStoragePref(type);
        if (type === 'local') {
            onUpdateUser({...user, storagePreference: 'local'});
        } else if (type === 'drive') {
            const confirmed = window.confirm("Autoriser WySlider à accéder à Google Drive ?");
            if (confirmed) onUpdateUser({...user, storagePreference: 'drive'});
            else setStoragePref('local');
        }
        // Firebase handled by save button below
    }

    const handleDriveSync = () => {
        if(storagePref !== 'drive') return;
        setIsSyncingDrive(true);
        setTimeout(() => {
            setIsSyncingDrive(false);
            onUpdateUser({...user, lastSyncedAt: new Date().toISOString()});
            alert("Synchronisation Google Drive réussie !");
        }, 2500);
    }

    const saveFirebaseConfig = () => {
        onUpdateUser({...user, storagePreference: 'firebase', firebaseConfig});
        alert("Configuration Firebase sauvegardée.");
    }

    const renderContent = () => {
        switch(section) {
            case 'account':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Mon Compte</h2>
                        <div className="flex items-center space-x-4">
                             <div className="h-20 w-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                {user.profilePicture ? <img src={user.profilePicture} className="h-full w-full object-cover"/> : <UserIcon className="h-10 w-10 text-gray-400"/>}
                             </div>
                             <div>
                                 <p className="font-bold text-lg">{user.email}</p>
                                 <p className="text-gray-400">{user.niche} | {user.channelName}</p>
                             </div>
                        </div>
                        <div className="space-y-4">
                            <input type="text" placeholder="Modifier Nom Chaîne" className="w-full bg-gray-800 p-3 rounded border border-gray-700" defaultValue={user.channelName} onChange={e => onUpdateUser({...user, channelName: e.target.value})}/>
                            <input type="text" placeholder="Modifier URL Chaîne" className="w-full bg-gray-800 p-3 rounded border border-gray-700" defaultValue={user.youtubeUrl} onChange={e => onUpdateUser({...user, youtubeUrl: e.target.value})}/>
                            <input type="text" placeholder="Modifier Niche" className="w-full bg-gray-800 p-3 rounded border border-gray-700" defaultValue={user.niche} onChange={e => onUpdateUser({...user, niche: e.target.value})}/>
                        </div>
                        <div className="pt-4 border-t border-gray-700">
                             <h3 className="font-bold mb-2">Code Promo</h3>
                             <div className="flex space-x-2">
                                <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="flex-1 bg-gray-800 p-2 rounded border border-gray-700" placeholder="Entrez un code..."/>
                                <Button onClick={handlePromoCode} variant="secondary">Appliquer</Button>
                             </div>
                        </div>
                    </div>
                );
            case 'forge':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <FireIcon className="h-8 w-8 text-orange-500" />
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">Forge (AI Lab)</h2>
                        </div>
                        <p className="text-gray-400">Entraînez votre IA personnelle. Ajoutez des références pour capturer votre essence.</p>
                        
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
                             <label className="block text-sm font-bold mb-2 text-gray-300">Ajouter une référence (Source Style)</label>
                             <div className="flex space-x-2 mb-6">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        value={forgeUrl} 
                                        onChange={e => setForgeUrl(e.target.value)}
                                        placeholder="Coller URL YouTube de référence..." 
                                        className="w-full bg-gray-900 p-3 rounded border border-gray-700 pl-10 focus:ring-1 focus:ring-orange-500 outline-none transition"
                                    />
                                    <div className="absolute left-3 top-3 text-gray-500">
                                        <VideoIcon className="h-5 w-5" />
                                    </div>
                                </div>
                                <button className="p-3 bg-gray-700 rounded hover:bg-gray-600 border border-gray-600 transition" title="Uploader un script (fichier)">
                                    <PaperClipIcon className="h-5 w-5 text-gray-300" />
                                </button>
                                <Button onClick={handleAddToForge} className="bg-orange-600 hover:bg-orange-700 text-white">Ajouter</Button>
                             </div>
                             
                             {/* Improved Forge Grid UI */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {forgeItems.length === 0 && <div className="col-span-full text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-lg">Aucune référence. Commencez à forger votre style.</div>}
                                {forgeItems.map(item => (
                                    <div key={item.id} className="relative bg-gray-900 rounded-lg border border-gray-800 p-4 group hover:border-orange-500/50 transition duration-300 overflow-hidden">
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div className="flex items-center space-x-2">
                                                <div className="p-2 bg-gray-800 rounded-full">
                                                    {item.type === 'url' ? <VideoIcon className="h-4 w-4 text-red-500"/> : <PaperClipIcon className="h-4 w-4 text-blue-500"/>}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-200">{item.name}</h4>
                                                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{item.value}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setForgeItems(forgeItems.filter(i => i.id !== item.id))} className="text-gray-600 hover:text-red-400">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t border-gray-800 relative z-10">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-400 uppercase font-bold tracking-wider">Style DNA</span>
                                                <span className="text-orange-400">{item.styleDNA || "Pending..."}</span>
                                            </div>
                                            {/* DNA Visualization Bar */}
                                            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                                                <div className={`h-full bg-gradient-to-r from-orange-600 to-red-600 rounded-full ${item.styleDNA ? 'w-3/4 animate-pulse' : 'w-0'}`}></div>
                                            </div>
                                        </div>
                                        
                                        {/* Background Decoration */}
                                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition"></div>
                                    </div>
                                ))}
                             </div>

                             <Button onClick={handleCustomizeAI} className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg shadow-orange-900/20 py-4 text-lg">
                                 <FireIcon className="h-5 w-5 mr-2 inline" />
                                 Fusionner & Personnaliser l'IA
                             </Button>
                        </div>
                    </div>
                );
            case 'storage':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                             <ArrowDownTrayIcon className="h-6 w-6 text-blue-400"/>
                             <h2 className="text-2xl font-bold">Stockage</h2>
                        </div>
                        <p className="text-gray-400">Définissez où votre base de données (scripts, séries) est stockée.</p>

                        <div className="grid gap-4">
                            {/* LocalStorage */}
                            <div 
                                onClick={() => handleStorageChange('local')}
                                className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition ${storagePref === 'local' ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                            >
                                <div>
                                    <h3 className="font-bold flex items-center"><BoltIcon className="h-4 w-4 mr-2"/> Local Storage</h3>
                                    <p className="text-sm text-gray-400">Vos données restent dans votre navigateur. (Par défaut)</p>
                                </div>
                                <div className={`h-4 w-4 rounded-full border ${storagePref === 'local' ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}></div>
                            </div>

                            {/* Google Drive */}
                            <div 
                                onClick={() => handleStorageChange('drive')}
                                className={`p-4 rounded-xl border cursor-pointer transition ${storagePref === 'drive' ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <h3 className="font-bold flex items-center"><ArrowDownTrayIcon className="h-4 w-4 mr-2"/> Google Drive</h3>
                                        <p className="text-sm text-gray-400">Synchronisation cloud automatique.</p>
                                    </div>
                                    <div className={`h-4 w-4 rounded-full border ${storagePref === 'drive' ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}></div>
                                </div>
                                {storagePref === 'drive' && (
                                    <div className="mt-4 pt-4 border-t border-gray-700" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-between items-center bg-gray-900 p-3 rounded mb-3">
                                            <span className="text-sm text-gray-400">Dernière synchro: {user.lastSyncedAt ? new Date(user.lastSyncedAt).toLocaleString() : 'Jamais'}</span>
                                            {isSyncingDrive ? <div className="text-blue-400 text-xs font-bold animate-pulse">SYNCHRONISATION...</div> : <CheckIcon className="h-4 w-4 text-green-500"/>}
                                        </div>
                                        <Button onClick={handleDriveSync} disabled={isSyncingDrive} className="w-full py-2 text-sm bg-blue-600 hover:bg-blue-700 flex items-center justify-center">
                                            <CloudArrowUpIcon className="h-4 w-4 mr-2"/> {isSyncingDrive ? 'En cours...' : 'Synchroniser maintenant'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Firebase */}
                            <div 
                                onClick={() => setStoragePref('firebase')}
                                className={`p-4 rounded-xl border cursor-pointer transition ${storagePref === 'firebase' ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <h3 className="font-bold flex items-center"><FireIcon className="h-4 w-4 mr-2 text-orange-500"/> Firebase</h3>
                                        <p className="text-sm text-gray-400">Pour une persistance professionnelle.</p>
                                    </div>
                                    <div className={`h-4 w-4 rounded-full border ${storagePref === 'firebase' ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}></div>
                                </div>
                                {storagePref === 'firebase' && (
                                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-3 animate-fade-in" onClick={e => e.stopPropagation()}>
                                        <p className="text-xs text-gray-300">1. Créez un projet Firebase. <br/>2. Activez Firestore. <br/>3. Collez la configuration SDK ci-dessous.</p>
                                        <textarea 
                                            value={firebaseConfig} 
                                            onChange={e => setFirebaseConfig(e.target.value)}
                                            placeholder='const firebaseConfig = { ... }'
                                            className="w-full h-24 bg-gray-900 p-2 text-xs font-mono rounded border border-gray-600"
                                        />
                                        <Button onClick={saveFirebaseConfig} className="w-full py-2 text-sm">Sauvegarder Config Firebase</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'apikey':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Clé API (Veo)</h2>
                        <p className="text-gray-400">Pour utiliser la génération vidéo avec Veo, vous devez fournir votre propre clé API Google Cloud.</p>
                        <input type="password" placeholder="AI Studio / GCP API Key" className="w-full bg-gray-800 p-3 rounded border border-gray-700" defaultValue={user.apiKey} onBlur={(e) => handleSaveApiKey(e.target.value)} />
                    </div>
                );
            case 'stats':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Générations</h2>
                         <div className="bg-gray-800 p-6 rounded-xl">
                            <div className="flex justify-between mb-2">
                                <span>Crédits Utilisés</span>
                                <span>{6 - user.generationsLeft} / 6 (Freemium)</span>
                            </div>
                            <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                                <div className="bg-brand-purple h-full" style={{width: `${Math.max(0, ((6 - user.generationsLeft)/6)*100)}%`}}></div>
                            </div>
                         </div>
                    </div>
                );
            case 'plan':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Formule Actuelle</h2>
                        <div className="p-4 border border-brand-purple bg-brand-purple/10 rounded-xl">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">Freemium</span>
                                <span className="text-sm bg-brand-purple px-2 py-1 rounded">Actif</span>
                            </div>
                            <p className="text-gray-400 mt-2">6 générations gratuites restantes: {user.generationsLeft}</p>
                        </div>
                        
                        <div className="grid gap-4">
                            <div className="bg-gray-800 p-4 rounded border border-gray-700 cursor-pointer hover:border-gray-500">
                                <h3 className="font-bold">Corp Use</h3>
                                <p className="text-sm text-gray-400">Invitez 2 amis = +8 crédits</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded border border-gray-700 cursor-pointer hover:border-gray-500">
                                <h3 className="font-bold">Post Use</h3>
                                <p className="text-sm text-gray-400">Partagez sur les réseaux = +10 crédits</p>
                            </div>
                             <div className="bg-gray-800 p-4 rounded border border-gray-700 cursor-pointer hover:border-gray-500 opacity-50">
                                <h3 className="font-bold">WYS Pro+ ($49)</h3>
                                <p className="text-sm text-gray-400">50 scripts + Serial Prod + Veo</p>
                            </div>
                        </div>
                    </div>
                );
            case 'sync':
                return (
                    <div className="space-y-6">
                         <h2 className="text-2xl font-bold">Synchronisation</h2>
                         <p className="text-gray-400">Code de récupération pour synchroniser vos données sur un autre appareil.</p>
                         <div className="flex space-x-2">
                             <input type="text" value={syncCode} onChange={e => setSyncCode(e.target.value)} placeholder="Code de récupération (ex: wys2323)" className="flex-1 bg-gray-800 p-3 rounded border border-gray-700"/>
                             <Button onClick={handleSync}>Sync</Button>
                         </div>
                    </div>
                );
            case 'feedback':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Feedback</h2>
                         <textarea className="w-full bg-gray-800 p-3 rounded border border-gray-700 h-32" placeholder="Votre avis nous intéresse..."></textarea>
                         <Button onClick={() => alert("Merci pour votre feedback !")}>Envoyer</Button>
                    </div>
                )
            default:
                return <div className="text-center py-10 text-gray-500">Section en construction</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white animate-fade-in overflow-hidden">
             {/* Sidebar Left */}
             <div className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <Button onClick={onBack} variant="outline" className="w-full text-sm">← Retour</Button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {[
                        {id: 'account', label: 'Compte WySlider', icon: <UserIcon className="h-5 w-5"/>},
                        {id: 'forge', label: 'Forge (AI Custom)', icon: <FireIcon className="h-5 w-5 text-orange-500"/>},
                        {id: 'storage', label: 'Stockage', icon: <ArrowDownTrayIcon className="h-5 w-5 text-blue-400"/>},
                        {id: 'templates', label: 'Templates', icon: <DiamondIcon className="h-5 w-5"/>},
                        {id: 'apikey', label: 'Clé API', icon: <KeyIcon className="h-5 w-5"/>},
                        {id: 'share', label: 'Partager', icon: <ShareIcon className="h-5 w-5"/>},
                        {id: 'stats', label: 'Génération', icon: <ChartBarIcon className="h-5 w-5"/>},
                        {id: 'plan', label: 'Formule', icon: <DiamondIcon className="h-5 w-5 text-yellow-500"/>},
                        {id: 'feedback', label: 'Feedback', icon: <PencilSquareIcon className="h-5 w-5"/>},
                        {id: 'sync', label: 'Sync', icon: <RefreshIcon className="h-5 w-5"/>},
                    ].map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setSection(item.id as any)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${section === item.id ? 'bg-brand-purple text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center space-x-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue"></div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user.email}</p>
                            <p className="text-xs text-gray-500 truncate">{user.niche}</p>
                        </div>
                    </div>
                    <Button onClick={() => window.location.reload()} variant="secondary" className="w-full text-xs">Se déconnecter</Button>
                </div>
             </div>

             {/* Center Content */}
             <div className="flex-1 overflow-y-auto bg-gray-900 p-8">
                 <div className="max-w-4xl mx-auto">
                    {renderContent()}
                 </div>
             </div>
        </div>
    );
};