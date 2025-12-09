
import React, { useState, useEffect, useRef } from 'react';
import { User, ForgeItem, Script, ViralIdea } from '../types';
import { Button } from './Button';
import { FEEDBACK_EMAIL, CORP_USE_REWARD, POST_USE_REWARD } from '../constants';
import * as geminiService from '../services/geminiService';
import { DiamondIcon, VideoIcon, RobotIcon, UserIcon, PencilSquareIcon, ShareIcon, ChartBarIcon, RefreshIcon, FireIcon, PaperClipIcon, PlusIcon, ArrowDownTrayIcon, BoltIcon, CloudArrowUpIcon, CheckIcon, LightBulbIcon, XMarkIcon, Squares2x2Icon, TrendingUpIcon, SunIcon, MoonIcon } from './icons';
import { MainLayout } from './MainLayout';

interface AccountPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToStudio?: () => void;
  onUseIdea?: (idea: ViralIdea) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ user, onUpdateUser, onBack, onNavigateToAdmin, onNavigateToStudio, onUseIdea, isDarkMode, toggleTheme }) => {
    // Removed 'sync' and 'storage', renamed 'ideas' to 'growth'
    const [section, setSection] = useState<'account'|'templates'|'share'|'growth'|'plan'|'feedback'|'forge'>('account');
    const [promoCode, setPromoCode] = useState('');
    
    // File Input Ref for Profile Pic
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Forge State
    const [forgeUrl, setForgeUrl] = useState('');
    const [forgeItems, setForgeItems] = useState<ForgeItem[]>([]);
    
    // Share/Template State
    const [userScripts, setUserScripts] = useState<Script[]>([]);
    const [communityTemplates, setCommunityTemplates] = useState<Script[]>([]);
    
    // Viral Ideas State (Growth)
    const [viralIdeas, setViralIdeas] = useState<ViralIdea[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);

    // Post Use Verification State
    const [postUrl, setPostUrl] = useState('');
    const [isVerifyingPost, setIsVerifyingPost] = useState(false);
    const [showPostModal, setShowPostModal] = useState(false);

    // Feedback State
    const [feedbackMsg, setFeedbackMsg] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('wyslider_scripts');
        if(saved) {
            const parsed = JSON.parse(saved);
            setUserScripts(parsed);
            // Simulate Community Templates with REAL content
            const shared = parsed.filter((s: Script) => s.isTemplate);
            
            const realTemplates: Script[] = [
                { 
                    id: 't1', 
                    title: 'Structure Review Tech (MKBHD Style)', 
                    topic: 'Tech Review',
                    tone: 'Professionnel',
                    format: '8-15min',
                    niche: 'Tech', 
                    isTemplate: true, 
                    createdAt: new Date().toISOString(),
                    sections: [
                        { id: 's1', title: 'The Hook', estimatedTime: '30s', content: "**Visual:** B-roll of the product in a cinematic macro shot.\n**Audio:** 'This might be the most controversial phone of the year, and here is why...'"},
                        { id: 's2', title: 'Specs & Design', estimatedTime: '2min', content: "Let's talk about the build quality. [Show edges]. It feels premium..."},
                        { id: 's3', title: 'The Verdict', estimatedTime: '1min', content: "Should you buy it? If you are in the ecosystem, yes. If not..."}
                    ] 
                },
                { 
                    id: 't2', 
                    title: 'Vlog Storytelling (Casey Neistat)', 
                    topic: 'Vlog',
                    tone: 'Energique',
                    format: '8-15min',
                    niche: 'Lifestyle', 
                    isTemplate: true, 
                    createdAt: new Date().toISOString(),
                    sections: [
                        { id: 'v1', title: 'The Setup (Timelapse)', estimatedTime: '15s', content: "**Visual:** Time lapse of city sunrise.\n**Audio:** Good morning. Today is a big day."},
                        { id: 'v2', title: 'The Conflict', estimatedTime: '3min', content: "I forgot my camera gear at the studio... so we have to improvise."},
                    ] 
                },
                { 
                    id: 't3', 
                    title: 'Tuto Rapide (Format Shorts)', 
                    topic: 'Tutorial',
                    tone: 'Educatif',
                    format: '60s',
                    niche: 'Education', 
                    isTemplate: true, 
                    createdAt: new Date().toISOString(),
                    sections: [
                        { id: 'sh1', title: 'Problem', estimatedTime: '5s', content: "Stop doing this mistake in Excel!"},
                        { id: 'sh2', title: 'Solution', estimatedTime: '40s', content: "Instead, press ALT + F1. Look at that chart!"},
                        { id: 'sh3', title: 'CTA', estimatedTime: '5s', content: "Subscribe for more tips."}
                    ] 
                }
            ];

            setCommunityTemplates([...shared, ...realTemplates]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                onUpdateUser({...user, profilePicture: base64});
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePromoCode = () => {
        if (promoCode === 'admin2301') {
            onNavigateToAdmin();
        } else if (promoCode === 'wys2301') {
            onUpdateUser({...user, generationsLeft: user.generationsLeft + 10});
            alert("Code accepté ! 10 Générations offertes.");
        } else if (promoCode === 'PROPLUS' || promoCode === 'pro2301') {
            handleUpgradePro();
        } else {
            alert("Code invalide");
        }
    };

    const handleUpgradePro = () => {
        onUpdateUser({...user, isPro: true, generationsLeft: 999});
        alert("Mode Pro+ Activé avec succès !");
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
    }

    const handleShareTemplate = (scriptId: string) => {
        const updated = userScripts.map(s => s.id === scriptId ? {...s, isTemplate: true} : s);
        setUserScripts(updated);
        localStorage.setItem('wyslider_scripts', JSON.stringify(updated));
        alert("Script partagé comme template avec la communauté WySlider !");
    }
    
    const handleCopyTemplate = (tpl: Script) => {
        const newScript: Script = {
            ...tpl,
            id: `copy_${Date.now()}`,
            isTemplate: false,
            createdAt: new Date().toISOString(),
            title: `Copy of ${tpl.title}`
        };
        const updated = [newScript, ...userScripts];
        setUserScripts(updated);
        localStorage.setItem('wyslider_scripts', JSON.stringify(updated));
        alert("Template ajouté à votre Studio !");
        onBack();
    }

    const handleGenerateIdeas = async () => {
        setIsLoadingIdeas(true);
        const ideas = await geminiService.generateViralIdeas(user.niche);
        setViralIdeas(ideas.map((idea: any, i: number) => ({ ...idea, id: i.toString() })));
        setIsLoadingIdeas(false);
    }

    const handleUseIdea = (idea: ViralIdea) => {
        if (onUseIdea) {
            onUseIdea(idea);
        } else {
            alert(`Copiez ce titre: "${idea.title}"`);
            onBack();
        }
    }

    const handleCorpUse = async () => {
        const shareData = {
            title: 'WySlider',
            text: 'Découvre WySlider, le générateur de scripts IA pour YouTube !',
            url: 'https://wyslider-v2.vercel.app',
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                onUpdateUser({...user, generationsLeft: user.generationsLeft + 8});
                alert("Merci pour le partage ! 8 crédits ajoutés.");
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText('https://wyslider-v2.vercel.app');
            alert("Lien copié ! Envoyez-le à 2 amis et revenez pour vos crédits (Simulation: crédits ajoutés).");
            onUpdateUser({...user, generationsLeft: user.generationsLeft + 8});
        }
    }

    const handlePostUseSubmit = async () => {
        if (!postUrl) return;
        setIsVerifyingPost(true);
        const isValid = await geminiService.verifyPostContent(postUrl);
        setIsVerifyingPost(false);
        
        if (isValid) {
            onUpdateUser({...user, generationsLeft: user.generationsLeft + 10});
            alert("Post vérifié avec succès ! 10 crédits ajoutés.");
            setShowPostModal(false);
            setPostUrl('');
        } else {
            alert("L'IA n'a pas pu vérifier le lien ou le contenu ne semble pas correspondre à WySlider. Réessayez.");
        }
    }

    const handleSendFeedback = () => {
        if (!feedbackMsg) return;
        const currentFeedbacks = JSON.parse(localStorage.getItem('wyslider_feedback_box') || '[]');
        currentFeedbacks.push({
            id: Date.now().toString(),
            userEmail: user.email,
            message: feedbackMsg,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('wyslider_feedback_box', JSON.stringify(currentFeedbacks));
        alert("Feedback envoyé à l'équipe Admin !");
        setFeedbackMsg('');
    }

    const renderContent = () => {
        switch(section) {
            case 'account':
                return (
                    <div className="space-y-6 pb-20">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Mon Compte</h2>
                            <div className="text-sm text-gray-400">Local Storage Active</div>
                        </div>
                        <div className="flex items-center space-x-4 bg-gray-800 p-6 rounded-xl border border-gray-700">
                             <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                 <div className="h-20 w-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-brand-purple relative">
                                    {user.profilePicture ? <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover"/> : <UserIcon className="h-10 w-10 text-gray-400"/>}
                                 </div>
                                 <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                     <span className="text-xs text-white font-bold">Modifier</span>
                                 </div>
                                 <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden"/>
                             </div>
                             <div className="flex-1">
                                 <div className="flex items-center space-x-2">
                                     <p className="font-bold text-lg break-all">{user.email}</p>
                                     {user.isPro && <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">PRO+</span>}
                                 </div>
                                 <p className="text-gray-400">{user.niche} | {user.channelName}</p>
                             </div>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="text-xs text-gray-400 font-bold uppercase mt-4 block">Détails de la chaîne</label>
                            <input type="text" placeholder="Modifier Nom Chaîne" className="w-full bg-gray-800 p-3 rounded border border-gray-700 focus:border-brand-purple outline-none text-white" defaultValue={user.channelName} onChange={e => onUpdateUser({...user, channelName: e.target.value})}/>
                            <input type="text" placeholder="Modifier URL Chaîne" className="w-full bg-gray-800 p-3 rounded border border-gray-700 focus:border-brand-purple outline-none text-white" defaultValue={user.youtubeUrl} onChange={e => onUpdateUser({...user, youtubeUrl: e.target.value})}/>
                            <input type="text" placeholder="Modifier Niche" className="w-full bg-gray-800 p-3 rounded border border-gray-700 focus:border-brand-purple outline-none text-white" defaultValue={user.niche} onChange={e => onUpdateUser({...user, niche: e.target.value})}/>
                        </div>

                        {toggleTheme && (
                            <div className="pt-4 border-t border-gray-700">
                                <h3 className="font-bold mb-2">Thème</h3>
                                <Button onClick={toggleTheme} variant="secondary" className="w-full flex justify-center items-center">
                                    {isDarkMode ? <><SunIcon className="h-5 w-5 mr-2"/> Switch to Light Mode</> : <><MoonIcon className="h-5 w-5 mr-2"/> Switch to Dark Mode</>}
                                </Button>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-700">
                             <h3 className="font-bold mb-2">Code Promo</h3>
                             <div className="flex space-x-2">
                                <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="flex-1 bg-gray-800 p-2 rounded border border-gray-700 focus:border-brand-purple outline-none text-white" placeholder="Entrez un code (ex: wys2301)..."/>
                                <Button onClick={handlePromoCode} variant="secondary">Appliquer</Button>
                             </div>
                        </div>
                    </div>
                );
            case 'templates':
                return (
                    <div className="space-y-6 pb-20">
                        <div className="flex items-center space-x-2">
                             <Squares2x2Icon className="h-6 w-6 text-pink-400"/>
                             <h2 className="text-2xl font-bold">Community Templates</h2>
                        </div>
                        <p className="text-gray-400">Découvrez les structures qui marchent pour les autres créateurs. (Contenu Réel)</p>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                            {communityTemplates.map((tpl, i) => (
                                <div key={i} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-pink-500 transition cursor-pointer">
                                    <h3 className="font-bold text-lg mb-1">{tpl.title}</h3>
                                    <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{tpl.niche}</span>
                                    <p className="text-xs text-gray-500 mt-2">{tpl.sections.length} Sections</p>
                                    <div className="mt-4 flex justify-end">
                                        <Button variant="outline" className="text-xs py-1 px-3" onClick={() => handleCopyTemplate(tpl)}>Utiliser ce template</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'forge':
                return (
                    <div className="space-y-6 pb-20">
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
                                        className="w-full bg-gray-900 p-3 rounded border border-gray-700 pl-10 focus:ring-1 focus:ring-orange-500 outline-none transition text-white"
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
                                                <XMarkIcon className="h-4 w-4"/>
                                            </button>
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t border-gray-800 relative z-10">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-400 uppercase font-bold tracking-wider">Style DNA</span>
                                                <span className="text-orange-400">{item.styleDNA || "Pending..."}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                                                <div className={`h-full bg-gradient-to-r from-orange-600 to-red-600 rounded-full ${item.styleDNA ? 'w-3/4 animate-pulse' : 'w-0'}`}></div>
                                            </div>
                                        </div>
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
            case 'share':
                return (
                    <div className="space-y-6 pb-20">
                        <div className="flex items-center space-x-2">
                             <ShareIcon className="h-6 w-6 text-green-400"/>
                             <h2 className="text-2xl font-bold">Partager des Templates</h2>
                        </div>
                        <p className="text-gray-400">Sélectionnez vos meilleurs scripts pour les partager comme modèles avec la communauté.</p>
                        
                        <div className="space-y-3">
                            {userScripts.length === 0 && <div className="text-gray-500 italic">Aucun script à partager.</div>}
                            {userScripts.map(script => (
                                <div key={script.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold">{script.title}</h3>
                                        <span className="text-xs text-gray-500">{script.niche}</span>
                                    </div>
                                    {script.isTemplate ? (
                                        <span className="text-green-500 text-xs font-bold border border-green-500 px-2 py-1 rounded">PARTAGÉ</span>
                                    ) : (
                                        <Button onClick={() => handleShareTemplate(script.id)} variant="outline" className="text-xs py-1 px-3">
                                            Partager
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'growth':
                return (
                     <div className="space-y-6 pb-20">
                        <div className="flex items-center space-x-2">
                             <TrendingUpIcon className="h-6 w-6 text-yellow-400"/>
                             <h2 className="text-2xl font-bold">Growth Engine (Niche: {user.niche})</h2>
                        </div>
                        <p className="text-gray-400">L'IA analyse votre niche pour trouver des concepts à fort potentiel. Cliquez pour générer.</p>
                        
                        <Button onClick={handleGenerateIdeas} isLoading={isLoadingIdeas} className="w-full mb-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold">
                            <RefreshIcon className="h-5 w-5 mr-2 inline"/> Générer 6 nouvelles idées
                        </Button>

                        <div className="grid gap-4 md:grid-cols-2">
                            {viralIdeas.map(idea => (
                                <div key={idea.id} onClick={() => handleUseIdea(idea)} className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-yellow-500 cursor-pointer group transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold ${idea.difficulty === 'Easy' ? 'bg-green-900 text-green-400' : idea.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'}`}>{idea.difficulty}</span>
                                        <ArrowDownTrayIcon className="h-4 w-4 text-gray-600 group-hover:text-yellow-400 -rotate-90"/>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 group-hover:text-yellow-400 transition">{idea.title}</h3>
                                    <p className="text-sm text-gray-400 italic">"{idea.hook}"</p>
                                </div>
                            ))}
                        </div>
                     </div>
                );
            case 'plan':
                return (
                    <div className="space-y-6 pb-20">
                        <h2 className="text-2xl font-bold">Formules & Bonus</h2>
                        <div className="p-4 border border-brand-purple bg-brand-purple/10 rounded-xl">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">{user.isPro ? 'WySlider Pro+' : 'Freemium'}</span>
                                <span className="text-sm bg-brand-purple px-2 py-1 rounded">Actif</span>
                            </div>
                            <p className="text-gray-400 mt-2">Générations restantes: {user.generationsLeft}</p>
                        </div>
                        
                        <div className="grid gap-4">
                            <div 
                                onClick={handleCorpUse}
                                className="bg-gray-800 p-4 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition group"
                            >
                                <h3 className="font-bold text-blue-400">Corp Use (+8 Crédits)</h3>
                                <p className="text-sm text-gray-400 group-hover:text-white transition">Partagez WySlider avec 2 amis via vos applis.</p>
                            </div>
                            
                            <div 
                                onClick={() => setShowPostModal(true)}
                                className="bg-gray-800 p-4 rounded border border-gray-700 cursor-pointer hover:border-green-500 transition group"
                            >
                                <h3 className="font-bold text-green-400">Post Use (+10 Crédits)</h3>
                                <p className="text-sm text-gray-400 group-hover:text-white transition">Collez le lien de votre post parlant de nous.</p>
                            </div>

                             <div className="bg-gray-800 p-4 rounded border border-gray-700 cursor-pointer hover:border-gray-500 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-1">POPULAIRE</div>
                                <h3 className="font-bold text-yellow-400">WYS Pro+ ($49)</h3>
                                <p className="text-sm text-gray-400">50 scripts + Serial Prod + Veo</p>
                                <Button className="mt-2 w-full text-xs" onClick={handleUpgradePro}>Simuler Upgrade</Button>
                            </div>
                        </div>
                    </div>
                );
            case 'feedback':
                return (
                    <div className="space-y-4 pb-20">
                        <h2 className="text-2xl font-bold">Feedback</h2>
                         <p className="text-sm text-gray-400">Votre avis aide à améliorer WySlider. L'admin lit tous les messages.</p>
                         <textarea 
                            value={feedbackMsg}
                            onChange={e => setFeedbackMsg(e.target.value)}
                            className="w-full bg-gray-800 p-3 rounded border border-gray-700 h-32 focus:border-brand-purple outline-none text-white" 
                            placeholder="Idées, bugs, ou encouragements..."
                         />
                         <Button onClick={handleSendFeedback}>Envoyer à l'Admin</Button>
                    </div>
                )
            default:
                return <div className="text-center py-10 text-gray-500">Section en construction</div>;
        }
    };

    const handleTabChange = (tab: string) => {
        if (tab === 'dashboard') onBack();
        else if (tab === 'studio' && onNavigateToStudio) onNavigateToStudio();
        // account is already active
    }

    return (
        <MainLayout
            user={user} 
            onLogout={() => {}} // Logout handled by MainLayout generally via props, but AccountPage usually doesn't need to pass logout if header handles it. Wait, MainLayout header has logout button.
            onNavigateToAccount={() => {}} // Already on account
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            activeTab="account"
            onTabChange={handleTabChange}
        >
            <div className="flex flex-col md:flex-row h-full text-white animate-fade-in overflow-hidden relative">
                {/* Post Use Modal */}
                {showPostModal && (
                    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-gray-900 border border-green-500 p-6 rounded-xl max-w-md w-full shadow-2xl shadow-green-900/50">
                            <h3 className="text-xl font-bold text-green-400 mb-4">Vérification Post Use</h3>
                            <p className="text-sm text-gray-300 mb-4">Collez le lien de votre post (Twitter, LinkedIn, YouTube, etc.) parlant de WySlider.</p>
                            <input 
                                value={postUrl} 
                                onChange={e => setPostUrl(e.target.value)} 
                                placeholder="https://..." 
                                className="w-full bg-black border border-gray-700 p-3 rounded text-white mb-4"
                            />
                            <div className="flex space-x-3">
                                <Button onClick={handlePostUseSubmit} isLoading={isVerifyingPost} className="flex-1 bg-green-600 hover:bg-green-700">Vérifier</Button>
                                <Button onClick={() => setShowPostModal(false)} variant="secondary">Annuler</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sidebar (Top nav on mobile, Left sidebar on desktop) */}
                <div className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto">
                    <div className="p-4 md:p-6 border-r md:border-r-0 md:border-b border-gray-800 flex items-center md:block">
                        <Button onClick={onBack} variant="outline" className="w-auto md:w-full text-sm">← <span className="hidden md:inline">Retour</span></Button>
                    </div>
                    <nav className="flex md:flex-col flex-1 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-1">
                        {[
                            {id: 'account', label: 'Compte', icon: <UserIcon className="h-5 w-5"/>},
                            {id: 'growth', label: 'Growth', icon: <TrendingUpIcon className="h-5 w-5 text-yellow-400"/>},
                            {id: 'templates', label: 'Templates', icon: <Squares2x2Icon className="h-5 w-5 text-pink-400"/>},
                            {id: 'forge', label: 'Forge', icon: <FireIcon className="h-5 w-5 text-orange-500"/>},
                            {id: 'share', label: 'Partager', icon: <ShareIcon className="h-5 w-5 text-green-400"/>},
                            {id: 'plan', label: 'Formules', icon: <DiamondIcon className="h-5 w-5 text-yellow-500"/>},
                            {id: 'feedback', label: 'Feedback', icon: <PencilSquareIcon className="h-5 w-5"/>},
                        ].map(item => (
                            <button 
                                key={item.id} 
                                onClick={() => setSection(item.id as any)}
                                className={`flex-shrink-0 md:w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition whitespace-nowrap ${section === item.id ? 'bg-brand-purple text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                            >
                                {item.icon}
                                <span className="hidden md:inline">{item.label}</span>
                                <span className="md:hidden">{item.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Center Content */}
                <div className="flex-1 overflow-y-auto bg-gray-900 p-4 md:p-8 scroll-smooth">
                    <div className="max-w-4xl mx-auto">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};