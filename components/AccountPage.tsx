
import React, { useState, useEffect, useRef } from 'react';
import { User, ForgeItem, Script, ViralIdea } from '../types';
import { Button } from './Button';
import { PRICING } from '../constants';
import * as geminiService from '../services/geminiService';
import { DiamondIcon, VideoIcon, RobotIcon, UserIcon, PencilSquareIcon, ShareIcon, ChartBarIcon, RefreshIcon, FireIcon, PaperClipIcon, PlusIcon, ArrowDownTrayIcon, BoltIcon, CloudArrowUpIcon, CheckIcon, LightBulbIcon, XMarkIcon, Squares2x2Icon, TrendingUpIcon, SunIcon, MoonIcon, BriefcaseIcon } from './icons';
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
    const [section, setSection] = useState<'account'|'templates'|'share'|'growth'|'plan'|'feedback'|'forge'|'pitch'>('account');
    const [promoCode, setPromoCode] = useState('');
    
    // File Input Ref for Profile Pic
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Forge State
    const [forgeUrl, setForgeUrl] = useState('');
    const [forgeItems, setForgeItems] = useState<ForgeItem[]>([]);
    const [isForging, setIsForging] = useState(false);
    
    // Pitch Mark State
    const [pitchTarget, setPitchTarget] = useState('');
    const [pitchDesc, setPitchDesc] = useState('');
    const [pitchObj, setPitchObj] = useState('');
    const [generatedPitch, setGeneratedPitch] = useState('');
    const [isPitching, setIsPitching] = useState(false);
    
    // Share/Template State
    const [userScripts, setUserScripts] = useState<Script[]>([]);
    const [communityTemplates, setCommunityTemplates] = useState<Script[]>([]);
    
    // Viral Ideas State (Growth)
    const [viralIdeas, setViralIdeas] = useState<ViralIdea[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);

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
                    title: 'Tech Review Structure (MKBHD Style)', 
                    topic: 'Tech Review',
                    tone: 'Professional',
                    format: '8-15min',
                    niche: 'Tech', 
                    isTemplate: true, 
                    createdAt: new Date().toISOString(),
                    sections: []
                },
                { 
                    id: 't2', 
                    title: 'Vlog Storytelling (Casey Neistat)', 
                    topic: 'Vlog',
                    tone: 'Energetic',
                    format: '8-15min',
                    niche: 'Lifestyle', 
                    isTemplate: true, 
                    createdAt: new Date().toISOString(),
                    sections: []
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
            alert("Code accepted! 10 Credits added.");
        } else if (promoCode === 'PROPLUS' || promoCode === 'pro2301') {
            handleUpgradePro();
        } else {
            alert("Invalid Code");
        }
    };

    const handleUpgradePro = () => {
        onUpdateUser({...user, isPro: true, generationsLeft: 999});
        alert("Pro+ Mode Activated!");
    }

    const handleAddToForge = () => {
        if (!forgeUrl) return;
        
        // Simulating robust analysis extraction based on URL keywords or length
        let extractedStyle = "General Analysis: Standard pacing.";
        if (forgeUrl.toLowerCase().includes("beast") || forgeUrl.length > 50) {
            extractedStyle = "Analyzed: Rapid fire cuts, high retention hooks, loud energetic intro.";
        } else if (forgeUrl.toLowerCase().includes("doc") || forgeUrl.toLowerCase().includes("essay")) {
            extractedStyle = "Analyzed: Slow build-up, mysterious intro, deep dive structure, curiosity gaps.";
        } else if (forgeUrl.toLowerCase().includes("vlog")) {
            extractedStyle = "Analyzed: Hand-held feel, personal connection, day-in-life structure, music driven.";
        } else {
            extractedStyle = "Analyzed: Professional educational tone, clear chapter segmentation, b-roll heavy.";
        }

        const newItem: ForgeItem = {
            id: Date.now().toString(),
            type: 'url',
            value: forgeUrl,
            name: `Ref ${forgeItems.length + 1}`,
            styleDNA: 'Processing...'
        };
        setForgeItems([...forgeItems, newItem]);
        setForgeUrl('');
        
        // Simulate analysis delay
        setTimeout(() => {
            setForgeItems(items => items.map(i => i.id === newItem.id ? {...i, styleDNA: extractedStyle} : i));
        }, 1200);
    }

    const handleCustomizeAI = async () => {
        if (forgeItems.length === 0) return alert("Please add reference URLs first.");
        
        setIsForging(true);
        const dna = forgeItems.map(i => i.styleDNA).join(' + ');
        const finalDNA = dna || "Generic High Quality Style";
        
        // 1. Generate a Strategy Instruction & Name based on this DNA
        const result = await geminiService.generateCustomStrategy(finalDNA);
        
        // 2. Create the custom strategy object
        const newStrategy = {
            id: `strat_${Date.now()}`,
            name: result.name, // AI generated name
            instruction: result.instruction
        };

        // 3. Append to User's library (preserving existing ones)
        const currentStrategies = user.customStrategies || [];
        const updatedStrategies = [...currentStrategies, newStrategy];

        onUpdateUser({
            ...user, 
            styleDNA: finalDNA, // Store latest DNA as active
            customStrategies: updatedStrategies
        });
        
        setIsForging(false);
        setForgeItems([]); // Clear references
        alert(`Forged new strategy: "${result.name}"! It is now available in the Studio.`);
    }

    const handleGeneratePitch = async () => {
        if(!pitchTarget || !pitchDesc || !pitchObj) return alert("Please fill all fields.");
        setIsPitching(true);
        const result = await geminiService.generatePitch(pitchTarget, pitchDesc, pitchObj);
        setGeneratedPitch(result);
        setIsPitching(false);
    }

    const handleShareTemplate = (scriptId: string) => {
        const updated = userScripts.map(s => s.id === scriptId ? {...s, isTemplate: true} : s);
        setUserScripts(updated);
        localStorage.setItem('wyslider_scripts', JSON.stringify(updated));
        alert("Script shared with community!");
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
        alert("Template added to Studio!");
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
            alert(`Copy this title: "${idea.title}"`);
            onBack();
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
        alert("Feedback sent!");
        setFeedbackMsg('');
    }

    const renderContent = () => {
        switch(section) {
            case 'account':
                return (
                    <div className="space-y-6 pb-20">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h2>
                            <div className="text-sm text-gray-500">Local Storage</div>
                        </div>
                        <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                             <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                 <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-brand-purple relative">
                                    {user.profilePicture ? <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover"/> : <UserIcon className="h-10 w-10 text-gray-400"/>}
                                 </div>
                                 <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                     <span className="text-xs text-white font-bold">Edit</span>
                                 </div>
                                 <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden"/>
                             </div>
                             <div className="flex-1">
                                 <div className="flex items-center space-x-2">
                                     <p className="font-bold text-lg break-all text-gray-900 dark:text-white">{user.email}</p>
                                     {user.isPro && <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">PRO+</span>}
                                 </div>
                                 <p className="text-gray-500 dark:text-gray-400">{user.niche} | {user.channelName}</p>
                             </div>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mt-4 block">Channel Details</label>
                            <input type="text" placeholder="Channel Name" className="w-full bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 focus:border-brand-purple outline-none text-gray-900 dark:text-white transition" defaultValue={user.channelName} onChange={e => onUpdateUser({...user, channelName: e.target.value})}/>
                            <input type="text" placeholder="Channel URL" className="w-full bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 focus:border-brand-purple outline-none text-gray-900 dark:text-white transition" defaultValue={user.youtubeUrl} onChange={e => onUpdateUser({...user, youtubeUrl: e.target.value})}/>
                            <input type="text" placeholder="Niche" className="w-full bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 focus:border-brand-purple outline-none text-gray-900 dark:text-white transition" defaultValue={user.niche} onChange={e => onUpdateUser({...user, niche: e.target.value})}/>
                        </div>

                        {toggleTheme && (
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Theme</h3>
                                <Button onClick={toggleTheme} variant="secondary" className="w-full flex justify-center items-center">
                                    {isDarkMode ? <><SunIcon className="h-5 w-5 mr-2"/> Switch to Light Mode</> : <><MoonIcon className="h-5 w-5 mr-2"/> Switch to Dark Mode</>}
                                </Button>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                             <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Promo Code</h3>
                             <div className="flex space-x-2">
                                <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="flex-1 bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 focus:border-brand-purple outline-none text-gray-900 dark:text-white transition" placeholder="Enter code..."/>
                                <Button onClick={handlePromoCode} variant="secondary">Apply</Button>
                             </div>
                        </div>
                    </div>
                );
            case 'templates':
                return (
                    <div className="space-y-6 pb-20">
                        <div className="flex items-center space-x-2">
                             <Squares2x2Icon className="h-6 w-6 text-pink-500"/>
                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Community Templates</h2>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Discover structures that work for other creators.</p>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                            {communityTemplates.map((tpl, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-pink-500 transition cursor-pointer">
                                    <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{tpl.title}</h3>
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{tpl.niche}</span>
                                    <div className="mt-4 flex justify-end">
                                        <Button variant="outline" className="text-xs py-1 px-3" onClick={() => handleCopyTemplate(tpl)}>Use Template</Button>
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
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">Forge (Personalize AI)</h2>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Add reference YouTube URLs to extract their narrative architecture. The AI will analyze the hook, pacing, and structure.</p>
                        
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl">
                             <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Add Reference (YouTube URL)</label>
                             <div className="flex space-x-2 mb-6">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        value={forgeUrl} 
                                        onChange={e => setForgeUrl(e.target.value)}
                                        placeholder="https://youtube.com/watch?v=..." 
                                        className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-700 pl-10 focus:ring-1 focus:ring-orange-500 outline-none transition text-gray-900 dark:text-white"
                                    />
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <VideoIcon className="h-5 w-5" />
                                    </div>
                                </div>
                                <Button onClick={handleAddToForge} className="bg-orange-600 hover:bg-orange-700 text-white">Add</Button>
                             </div>
                             
                             <div className="space-y-3 mb-6">
                                {forgeItems.length === 0 && <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">No references added. Paste a URL to start forging.</div>}
                                {forgeItems.map(item => (
                                    <div key={item.id} className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-800 flex justify-between items-center">
                                        <div className="flex-1 mr-2">
                                            <p className="font-bold text-sm text-gray-900 dark:text-gray-200 truncate">{item.value}</p>
                                            <p className="text-xs text-orange-500 dark:text-orange-400 animate-pulse">{item.styleDNA}</p>
                                        </div>
                                        <button onClick={() => setForgeItems(forgeItems.filter(i => i.id !== item.id))} className="text-gray-400 hover:text-red-500"><XMarkIcon className="h-4 w-4"/></button>
                                    </div>
                                ))}
                             </div>
                             
                             {user.customStrategies && user.customStrategies.length > 0 && (
                                 <div className="mb-4">
                                     <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Your Forged Strategies</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {user.customStrategies.map(s => (
                                             <span key={s.id} className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded border border-orange-200 dark:border-orange-800">
                                                 {s.name}
                                             </span>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             <Button onClick={handleCustomizeAI} isLoading={isForging} className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg shadow-orange-900/20 py-4 text-lg">
                                 <FireIcon className="h-5 w-5 mr-2 inline" />
                                 Save & Personalize Strategy
                             </Button>
                        </div>
                    </div>
                );
            case 'pitch':
                return (
                    <div className="space-y-6 pb-20">
                        <div className="flex items-center space-x-2">
                             <BriefcaseIcon className="h-6 w-6 text-blue-500"/>
                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pitch Mark</h2>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Draft professional brand pitches instantly.</p>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Target Name (Company/Person)</label>
                                    <input value={pitchTarget} onChange={e => setPitchTarget(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-3 rounded text-gray-900 dark:text-white mt-1"/>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Target Description (What do they do?)</label>
                                    <textarea value={pitchDesc} onChange={e => setPitchDesc(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-3 rounded text-gray-900 dark:text-white mt-1 h-20"/>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Your Objective</label>
                                    <input value={pitchObj} onChange={e => setPitchObj(e.target.value)} placeholder="e.g. Sponsoring, Collaboration..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-3 rounded text-gray-900 dark:text-white mt-1"/>
                                </div>
                            </div>
                            <Button onClick={handleGeneratePitch} isLoading={isPitching} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Generate Pitch</Button>
                            
                            {generatedPitch && (
                                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <h4 className="font-bold text-sm text-gray-500 dark:text-gray-400 mb-2">Generated Draft:</h4>
                                    <p className="text-gray-800 dark:text-white whitespace-pre-wrap font-serif leading-relaxed">{generatedPitch}</p>
                                    <Button onClick={() => navigator.clipboard.writeText(generatedPitch)} variant="secondary" className="mt-4 text-xs">Copy Text</Button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'growth':
                return (
                     <div className="space-y-6 pb-20">
                        <div className="flex items-center space-x-2">
                             <TrendingUpIcon className="h-6 w-6 text-yellow-500"/>
                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Growth Engine</h2>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Generate viral concepts for {user.niche}.</p>
                        
                        <Button onClick={handleGenerateIdeas} isLoading={isLoadingIdeas} className="w-full mb-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold">
                            <RefreshIcon className="h-5 w-5 mr-2 inline"/> Generate 6 Ideas
                        </Button>

                        <div className="grid gap-4 md:grid-cols-2">
                            {viralIdeas.map(idea => (
                                <div key={idea.id} onClick={() => handleUseIdea(idea)} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-yellow-500 cursor-pointer group transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold ${idea.difficulty === 'Easy' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : idea.difficulty === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'}`}>{idea.difficulty}</span>
                                        <ArrowDownTrayIcon className="h-4 w-4 text-gray-400 group-hover:text-yellow-500 -rotate-90"/>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition text-gray-900 dark:text-white">{idea.title}</h3>
                                    <p className="text-sm text-gray-500 italic">"{idea.hook}"</p>
                                </div>
                            ))}
                        </div>
                     </div>
                );
            case 'plan':
                return (
                    <div className="space-y-6 pb-20">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Plans & Pricing</h2>
                        <div className="p-4 border border-brand-purple bg-brand-purple/10 rounded-xl mb-6">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg text-gray-900 dark:text-white">{user.isPro ? 'Creator Pro' : 'Free Trial'}</span>
                                <span className="text-sm bg-brand-purple px-2 py-1 rounded text-white">Active</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Credits: {user.generationsLeft}</p>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                             <div className="bg-white dark:bg-gray-800 p-6 rounded border border-gray-200 dark:border-gray-700">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Starter</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">${PRICING.starter}</p>
                                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2 mb-4">
                                    <li>10 Scripts</li>
                                    <li>Social Posts</li>
                                    <li>Viral Idea Gen</li>
                                </ul>
                                <Button onClick={() => alert("Simulated Payment")} variant="outline" className="w-full">Buy Now</Button>
                            </div>
                             <div className="bg-white dark:bg-gray-800 p-6 rounded border border-indigo-500 relative">
                                <div className="absolute top-0 right-0 bg-indigo-600 text-xs px-2 py-1 rounded-bl text-white font-bold">BEST</div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Creator</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">${PRICING.creator}</p>
                                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2 mb-4">
                                    <li>30 Scripts</li>
                                    <li>Serial Prod (5 Eps)</li>
                                    <li>All Starter features</li>
                                </ul>
                                <Button onClick={() => alert("Simulated Payment")} className="w-full text-white">Buy Now</Button>
                            </div>
                             <div className="bg-white dark:bg-gray-800 p-6 rounded border border-gray-200 dark:border-gray-700">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Pro Authority</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">${PRICING.pro}</p>
                                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2 mb-4">
                                    <li>50 Scripts</li>
                                    <li>Serial Prod (20 Eps)</li>
                                    <li>Priority Support</li>
                                </ul>
                                <Button onClick={() => alert("Simulated Payment")} variant="outline" className="w-full">Buy Now</Button>
                            </div>
                        </div>
                    </div>
                );
            case 'feedback':
                return (
                    <div className="space-y-4 pb-20">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback</h2>
                         <p className="text-sm text-gray-500 dark:text-gray-400">Help us improve WySlider.</p>
                         <textarea 
                            value={feedbackMsg}
                            onChange={e => setFeedbackMsg(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 h-32 focus:border-brand-purple outline-none text-gray-900 dark:text-white transition" 
                            placeholder="Ideas, bugs, or thoughts..."
                         />
                         <Button onClick={handleSendFeedback}>Send</Button>
                    </div>
                )
            default:
                return <div className="text-center py-10 text-gray-500">Construction Area</div>;
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
            onLogout={() => {}} 
            onNavigateToAccount={() => {}} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            activeTab="account"
            onTabChange={handleTabChange}
        >
            <div className="flex flex-col md:flex-row h-full text-gray-900 dark:text-white animate-fade-in overflow-hidden relative transition-colors duration-300">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto transition-colors duration-300">
                    <div className="p-4 md:p-6 border-r md:border-r-0 md:border-b border-gray-200 dark:border-gray-800 flex items-center md:block">
                        <Button onClick={onBack} variant="outline" className="w-auto md:w-full text-sm">← <span className="hidden md:inline">Back</span></Button>
                    </div>
                    <nav className="flex md:flex-col flex-1 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-1">
                        {[
                            {id: 'account', label: 'Account', icon: <UserIcon className="h-5 w-5"/>},
                            {id: 'growth', label: 'Growth', icon: <TrendingUpIcon className="h-5 w-5 text-yellow-500"/>},
                            {id: 'pitch', label: 'Pitch Mark', icon: <BriefcaseIcon className="h-5 w-5 text-blue-500"/>},
                            {id: 'templates', label: 'Templates', icon: <Squares2x2Icon className="h-5 w-5 text-pink-500"/>},
                            {id: 'forge', label: 'Forge', icon: <FireIcon className="h-5 w-5 text-orange-500"/>},
                            {id: 'share', label: 'Share', icon: <ShareIcon className="h-5 w-5 text-green-500"/>},
                            {id: 'plan', label: 'Plans', icon: <DiamondIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-500"/>},
                            {id: 'feedback', label: 'Feedback', icon: <PencilSquareIcon className="h-5 w-5"/>},
                        ].map(item => (
                            <button 
                                key={item.id} 
                                onClick={() => setSection(item.id as any)}
                                className={`flex-shrink-0 md:w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition whitespace-nowrap ${section === item.id ? 'bg-brand-purple text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {item.icon}
                                <span className="hidden md:inline">{item.label}</span>
                                <span className="md:hidden">{item.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Center Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-8 scroll-smooth transition-colors duration-300">
                    <div className="max-w-4xl mx-auto">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
