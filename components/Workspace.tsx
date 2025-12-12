
import React, { useState, useEffect } from 'react';
import { User, Script, FusionStructure, BrandPitch, ScriptSection } from '../types';
import { Button } from './Button';
import { PlusIcon, VideoIcon, TrashIcon, ShareIcon, PencilSquareIcon, Bars3Icon, TrendingUpIcon, BriefcaseIcon, BookOpenIcon, CheckIcon, SparklesIcon, DocumentArrowDownIcon, EyeIcon } from './icons';
import { MainLayout } from './MainLayout';
import * as geminiService from '../services/geminiService';
// @ts-ignore
import { jsPDF } from 'jspdf';

// --- Types for internal views ---
type ViewMode = 'dashboard' | 'studio' | 'pitches' | 'docs' | 'serial' | 'socials';

// --- Sub-Components ---

const FusionForgeSelector: React.FC<{ 
    structures: FusionStructure[], 
    selectedId: string, 
    onSelect: (id: string) => void,
    onImport: (url: string) => void,
    isImporting: boolean
}> = ({ structures, selectedId, onSelect, onImport, isImporting }) => {
    const [url, setUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="mb-4">
            <label className="text-xs font-bold text-brand-purple uppercase flex items-center mb-2">
                <SparklesIcon className="h-4 w-4 mr-1"/> Fusion Forge
            </label>
            <div className="flex space-x-2 mb-2">
                <select 
                    value={selectedId} 
                    onChange={e => onSelect(e.target.value)} 
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-brand-purple text-gray-900 dark:text-white"
                >
                    <option value="standard">Standard Structure</option>
                    {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button 
                    onClick={() => setIsAdding(!isAdding)} 
                    className="bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple p-2 rounded-lg"
                    title="Import new structure"
                >
                    <PlusIcon className="h-5 w-5"/>
                </button>
            </div>
            {isAdding && (
                <div className="bg-brand-purple/5 p-3 rounded-lg border border-brand-purple/20 animate-fade-in">
                    <p className="text-xs text-gray-500 mb-2">Import structure from a YouTube video URL.</p>
                    <div className="flex space-x-2">
                        <input 
                            value={url} 
                            onChange={e => setUrl(e.target.value)} 
                            placeholder="https://youtube.com/..." 
                            className="flex-1 bg-white dark:bg-gray-900 border border-brand-purple/30 rounded px-2 text-xs text-gray-900 dark:text-white"
                        />
                        <Button 
                            onClick={() => { onImport(url); setUrl(''); setIsAdding(false); }} 
                            isLoading={isImporting} 
                            className="text-xs py-1 px-3"
                        >
                            Import
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ScriptResultView: React.FC<{ script: Script }> = ({ script }) => {
    const [activeTab, setActiveTab] = useState<'planning'|'script'|'social'|'prompts'>('planning');

    if (!script.youtubeScript) return <div className="p-10 text-center text-gray-500">Script generation failed or incomplete.</div>;

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        let y = 20;
        const addText = (text: string, size = 10, font = "normal", color = [0,0,0]) => {
            doc.setFontSize(size);
            doc.setFont("helvetica", font);
            doc.setTextColor(color[0], color[1], color[2]);
            const lines = doc.splitTextToSize(text, 180);
            if (y + lines.length * 5 > 280) { doc.addPage(); y = 20; }
            doc.text(lines, 15, y);
            y += lines.length * 5 + 2;
        };

        addText(script.title, 20, "bold", [139, 92, 246]); // Brand Purple
        y += 5;
        
        // Part 1: Planning
        addText("PLANNING", 14, "bold");
        addText(`Tone: ${script.planning?.mainTone}`, 10);
        script.planning?.subTones.forEach(st => addText(`- ${st.tone}`, 10));
        y += 5;
        
        // Part 2: Script
        addText("SCRIPT", 14, "bold");
        addText(`Hook: ${script.youtubeScript?.hook}`);
        script.youtubeScript?.sections.forEach(s => {
            y += 5;
            addText(`Section ${s.number}: ${s.title}`, 12, "bold");
            // Simple regex strip for PDF
            const cleanContent = s.content.replace(/<[^>]*>?/gm, '');
            addText(cleanContent);
            addText(`Re-hook: ${s.rehook}`, 10, "italic", [100,100,100]);
        });

        // Part 3: Social Posts
        y += 10;
        addText("SOCIAL MEDIA POSTS", 14, "bold", [59, 130, 246]); // Blue
        if (script.socialPosts && script.socialPosts.length > 0) {
            script.socialPosts.forEach(post => {
                y += 5;
                addText(`[${post.platform}]`, 12, "bold");
                addText(post.content);
                if (post.hashtags.length > 0) addText(`Hashtags: ${post.hashtags.join(' ')}`, 10, "italic", [100,100,100]);
                if (post.visualNote) addText(`Visual: ${post.visualNote}`, 10, "italic", [100,100,100]);
            });
        } else {
            addText("No social posts generated.");
        }

        // Part 4: Video Prompts
        y += 10;
        addText("VIDEO PROMPTS", 14, "bold", [168, 85, 247]); // Purple
        if (script.videoPrompts && script.videoPrompts.length > 0) {
            script.videoPrompts.forEach(vp => {
                y += 5;
                addText(`${vp.segment}:`, 11, "bold");
                addText(vp.description);
            });
        } else {
            addText("No video prompts generated.");
        }

        doc.save("wyslider_script.pdf");
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                {['planning', 'script', 'social', 'prompts'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition ${activeTab === tab ? 'bg-brand-purple text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {activeTab === 'planning' && script.planning && (
                    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <h4 className="text-xs font-bold text-gray-500 uppercase">Topic</h4>
                                <p className="text-lg font-bold">{script.planning.topic}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <h4 className="text-xs font-bold text-gray-500 uppercase">Duration</h4>
                                <p className="text-lg font-bold">{script.planning.duration}</p>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-bold mb-3">Tonal Palette</h3>
                            <div className="flex space-x-3">
                                {script.planning.subTones.map((st, i) => (
                                    <div key={i} className="px-4 py-2 rounded-full border flex items-center space-x-2" style={{ borderColor: st.color, backgroundColor: `${st.color}10` }}>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }}></div>
                                        <span className="font-bold text-sm" style={{ color: st.color }}>{st.tone}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span className="block text-2xl font-bold text-blue-600">{script.planning.sectionCount}</span>
                                <span className="text-xs text-blue-500">Sections</span>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span className="block text-2xl font-bold text-green-600">{script.planning.socialCount}</span>
                                <span className="text-xs text-green-500">Social Posts</span>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <span className="block text-2xl font-bold text-purple-600">{script.planning.videoPromptsCount}</span>
                                <span className="text-xs text-purple-500">Prompts</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'script' && script.youtubeScript && (
                    <div className="space-y-8 animate-fade-in font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg font-sans text-sm mb-6 text-gray-900 dark:text-white">
                            <p><strong>Title:</strong> {script.youtubeScript.title}</p>
                            <p className="mt-2 text-gray-500">{script.youtubeScript.description}</p>
                            <div className="mt-2 text-blue-500">{script.youtubeScript.hashtags.join(' ')}</div>
                        </div>

                        <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-900/10">
                            <h4 className="font-sans text-xs font-bold text-red-600 uppercase mb-1">Hook</h4>
                            <p>{script.youtubeScript.hook}</p>
                        </div>

                        <div className="pl-4">
                            <h4 className="font-sans text-xs font-bold text-gray-500 uppercase mb-1">Intro</h4>
                            <p>{script.youtubeScript.intro}</p>
                        </div>

                        {script.youtubeScript.sections.map((sec, i) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                <div className="absolute -left-8 top-0 w-5 h-5 rounded-full bg-brand-purple text-white flex items-center justify-center text-xs font-bold font-sans">{sec.number}</div>
                                
                                <h3 className="font-sans font-bold text-xl mb-3 text-brand-purple">{sec.title}</h3>
                                {/* Dangerously Set HTML for colored spans from AI */}
                                <div dangerouslySetInnerHTML={{ __html: sec.content }} />
                                
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <span className="font-sans text-xs font-bold text-yellow-600 uppercase block mb-1">Retention Re-hook</span>
                                    <p className="italic text-sm text-yellow-800 dark:text-yellow-200">{sec.rehook}</p>
                                </div>
                            </div>
                        ))}

                        <div className="border-t pt-6">
                            <h4 className="font-sans text-xs font-bold text-gray-500 uppercase mb-1">CTA</h4>
                            <p className="font-bold">{script.youtubeScript.cta}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'social' && script.socialPosts && (
                    <div className="grid gap-6 animate-fade-in text-gray-900 dark:text-white">
                        {script.socialPosts.map((post, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-xl">
                                <div className="flex justify-between mb-3">
                                    <span className="font-bold text-brand-blue uppercase text-sm">{post.platform}</span>
                                    <button className="text-xs text-gray-400 hover:text-white" onClick={() => navigator.clipboard.writeText(post.content)}>Copy</button>
                                </div>
                                <p className="whitespace-pre-wrap text-sm mb-4">{post.content}</p>
                                {post.visualNote && <p className="text-xs italic text-gray-500 border-l-2 border-gray-300 pl-2">Visual: {post.visualNote}</p>}
                                <div className="mt-3 text-xs text-blue-500">{post.hashtags.join(' ')}</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'prompts' && script.videoPrompts && (
                    <div className="space-y-4 animate-fade-in text-gray-900 dark:text-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">AI Video Generation Prompts</h3>
                            <Button className="text-xs py-1 px-3" onClick={() => {
                                const all = script.videoPrompts?.map(p => `${p.segment}: ${p.description}`).join('\n\n');
                                navigator.clipboard.writeText(all || "");
                                alert("All prompts copied!");
                            }}>Copy All</Button>
                        </div>
                        {script.videoPrompts.map((vp, i) => (
                            <div key={i} className="flex space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <div className="w-32 flex-shrink-0 text-xs font-mono text-gray-500 font-bold pt-1">{vp.segment}</div>
                                <div className="flex-1 text-sm font-mono text-green-600 dark:text-green-400">{vp.description}</div>
                                <button className="text-gray-400 hover:text-brand-purple" onClick={() => navigator.clipboard.writeText(vp.description)}>
                                    <ShareIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
                <Button onClick={handleDownloadPDF} variant="secondary" className="flex items-center">
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2"/> Export PDF
                </Button>
            </div>
        </div>
    );
};

export const Workspace: React.FC<{
    user: User;
    onUpdateUser: (u: User) => void;
    onNavigateAccount: () => void;
    onLogout: () => void;
    view?: any;
    setView?: any;
    pendingGenConfig?: any;
    clearPendingConfig?: any;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
}> = ({ user, onUpdateUser, onNavigateAccount, onLogout, isDarkMode, toggleTheme }) => {
    const [view, setView] = useState<ViewMode>('dashboard');
    const [scripts, setScripts] = useState<Script[]>([]);
    const [pitches, setPitches] = useState<BrandPitch[]>([]);
    const [currentScript, setCurrentScript] = useState<Script | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Studio State
    const [config, setConfig] = useState({ topic: '', tone: 'Professional', duration: '8-15min', niche: user.niche, goal: 'Growth', needs: 'Retention', cta: 'Subscribe', platforms: 'YouTube, TikTok' });
    const [fusionId, setFusionId] = useState('standard');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Pitch State
    const [pitchForm, setPitchForm] = useState({ target: '', desc: '', obj: '' });
    const [pitchResult, setPitchResult] = useState('');
    const [isPitching, setIsPitching] = useState(false);

    useEffect(() => {
        try {
            const s = localStorage.getItem('wyslider_scripts');
            if(s) setScripts(JSON.parse(s));
        } catch(e) { console.error("Failed to load scripts", e); }
        
        try {
            const p = localStorage.getItem('wyslider_pitches');
            if(p) setPitches(JSON.parse(p));
        } catch(e) { console.error("Failed to load pitches", e); }
    }, []);

    useEffect(() => {
        localStorage.setItem('wyslider_scripts', JSON.stringify(scripts));
    }, [scripts]);

    useEffect(() => {
        localStorage.setItem('wyslider_pitches', JSON.stringify(pitches));
    }, [pitches]);

    const handleImportFusion = async (url: string) => {
        setIsImporting(true);
        const structure = await geminiService.analyzeFusionStructure(url);
        const newFusion: FusionStructure = {
            id: `fs_${Date.now()}`,
            name: structure.name,
            description: structure.description,
            instruction: structure.instruction,
            sourceUrl: url
        };
        const updatedUser = { 
            ...user, 
            fusionStructures: [...(user.fusionStructures || []), newFusion] 
        };
        onUpdateUser(updatedUser);
        setFusionId(newFusion.id);
        setIsImporting(false);
        alert(`Fusion Structure "${structure.name}" added!`);
    };

    const handleGenerateScript = async () => {
        setIsGenerating(true);
        const structure = user.fusionStructures?.find(fs => fs.id === fusionId);
        const instruction = structure ? structure.instruction : geminiService.STRATEGIES['Standard']; // Fallback

        try {
            const result = await geminiService.generateScript(
                config.topic, config.tone, config.duration, instruction, 
                { niche: config.niche, goal: config.goal, needs: config.needs, cta: config.cta, platforms: config.platforms }
            );

            if (result) {
                const newScript: Script = {
                    id: `s_${Date.now()}`,
                    title: result.youtubeScript?.title || config.topic,
                    createdAt: new Date().toISOString(),
                    planning: result.planning,
                    youtubeScript: result.youtubeScript,
                    socialPosts: result.socialPosts,
                    videoPrompts: result.videoPrompts
                };
                setScripts([newScript, ...scripts]);
                setCurrentScript(newScript);
                onUpdateUser({...user, generationsLeft: user.generationsLeft - 1});
            }
        } catch (e) {
            console.error(e);
            alert("Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGeneratePitch = async () => {
        setIsPitching(true);
        const res = await geminiService.generatePitch(pitchForm.target, pitchForm.desc, pitchForm.obj);
        setPitchResult(res);
        const newPitch: BrandPitch = {
            id: `p_${Date.now()}`,
            targetName: pitchForm.target,
            description: pitchForm.desc,
            objective: pitchForm.obj,
            content: res,
            createdAt: new Date().toISOString()
        };
        setPitches([newPitch, ...pitches]);
        setIsPitching(false);
    };

    const filteredScripts = scripts.filter(s => s.title?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <MainLayout 
            user={user} onLogout={onLogout} onNavigateToAccount={onNavigateAccount} 
            isDarkMode={isDarkMode} toggleTheme={toggleTheme}
        >
            {/* --- DASHBOARD --- */}
            {view === 'dashboard' && (
                <div className="h-full overflow-y-auto">
                    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-gray-900 dark:text-white">
                        {/* Search Bar */}
                        <div className="flex space-x-4">
                            <input 
                                type="text" 
                                placeholder="Search projects..." 
                                className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-purple text-gray-900 dark:text-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <button className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700">
                                <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-300"/>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* 1. Scripts History */}
                            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110">
                                    <PencilSquareIcon className="h-24 w-24"/>
                                </div>
                                <h3 className="font-bold text-xl mb-1">Scripts & Series</h3>
                                <p className="text-purple-100 text-sm mb-6">{scripts.length} Projects</p>
                                <div className="flex space-x-2">
                                    <button onClick={() => setView('studio')} className="bg-white text-purple-600 p-2 rounded-full hover:bg-purple-50 transition shadow-md">
                                        <PlusIcon className="h-6 w-6"/>
                                    </button>
                                    <button onClick={() => { setSearchTerm(''); }} className="text-xs bg-purple-700/50 hover:bg-purple-700 px-3 py-1 rounded-full backdrop-blur-sm transition">View All</button>
                                </div>
                            </div>

                            {/* 2. Social Posts History */}
                            <div 
                                onClick={() => setView('socials')}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-green-500 transition cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 p-4 text-green-500 opacity-10 group-hover:opacity-20 transition">
                                    <ShareIcon className="h-24 w-24"/>
                                </div>
                                <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-white">Social Posts</h3>
                                <p className="text-gray-500 text-sm mb-6">Generated content history</p>
                                <button onClick={(e) => { e.stopPropagation(); setView('socials'); }} className="text-xs bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">Open Library</button>
                            </div>

                            {/* 3. Marketing Pitch */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-blue-500 transition">
                                <div className="absolute top-0 right-0 p-4 text-blue-500 opacity-10 group-hover:opacity-20 transition">
                                    <BriefcaseIcon className="h-24 w-24"/>
                                </div>
                                <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-white">Marketing Pitch</h3>
                                <p className="text-gray-500 text-sm mb-6">{pitches.length} Drafts</p>
                                <div className="flex space-x-2">
                                    <button onClick={() => setView('pitches')} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition">
                                        <PlusIcon className="h-6 w-6"/>
                                    </button>
                                </div>
                            </div>

                            {/* 4. Docs */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-yellow-500 transition cursor-pointer" onClick={() => setView('docs')}>
                                <div className="absolute top-0 right-0 p-4 text-yellow-500 opacity-10 group-hover:opacity-20 transition">
                                    <BookOpenIcon className="h-24 w-24"/>
                                </div>
                                <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-white">Documentation</h3>
                                <p className="text-gray-500 text-sm mb-6">Learn how to use WySlider</p>
                                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-bold uppercase">Read Docs &rarr;</span>
                            </div>
                        </div>

                        {/* Quick Access List */}
                        <div className="mt-8">
                            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Recent Scripts</h3>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredScripts.slice(0, 5).map(s => (
                                    <div key={s.id} onClick={() => { setCurrentScript(s); setView('studio'); }} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition first:rounded-t-2xl last:rounded-b-2xl">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">{s.title}</h4>
                                            <p className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()} • {s.planning?.mainTone || 'Professional'}</p>
                                        </div>
                                        <span className="text-brand-purple">Open &rarr;</span>
                                    </div>
                                ))}
                                {filteredScripts.length === 0 && <div className="p-6 text-center text-gray-500">No scripts found.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SOCIALS LIBRARY --- */}
            {view === 'socials' && (
                <div className="p-8 max-w-4xl mx-auto h-full flex flex-col animate-fade-in text-gray-900 dark:text-white overflow-y-auto">
                    <div className="flex items-center justify-between mb-8">
                         <h2 className="text-2xl font-bold flex items-center"><ShareIcon className="h-6 w-6 mr-2 text-green-500"/> Social Media Library</h2>
                         <Button variant="secondary" onClick={() => setView('dashboard')}>Back</Button>
                    </div>
                    
                    <div className="space-y-8">
                        {scripts.filter(s => s.socialPosts && s.socialPosts.length > 0).length === 0 && (
                            <div className="text-center text-gray-500 p-10 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">No social posts generated yet. Generate a script to see posts here.</div>
                        )}
                        {scripts.filter(s => s.socialPosts && s.socialPosts.length > 0).map(script => (
                            <div key={script.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-brand-purple">{script.title}</h3>
                                    <span className="text-xs text-gray-500">{new Date(script.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="p-4 grid gap-4 md:grid-cols-2">
                                    {script.socialPosts?.map((post, idx) => (
                                        <div key={idx} className="bg-gray-50 dark:bg-gray-950 p-4 rounded border border-gray-100 dark:border-gray-800 relative group">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-xs font-bold uppercase text-brand-blue tracking-wide">{post.platform}</span>
                                                <button onClick={() => {navigator.clipboard.writeText(post.content); alert('Copied!')}} className="text-xs text-gray-400 hover:text-brand-purple transition">Copy</button>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">{post.content}</p>
                                            {post.visualNote && <p className="text-xs italic text-gray-500 border-l-2 border-gray-300 pl-2 mb-2">Visual: {post.visualNote}</p>}
                                            <p className="text-xs text-blue-500">{post.hashtags.join(' ')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- STUDIO --- */}
            {view === 'studio' && (
                <div className="h-full flex flex-col md:flex-row animate-fade-in text-gray-900 dark:text-white overflow-y-auto md:overflow-hidden">
                    {/* Config Sidebar */}
                    <div className="w-full md:w-96 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 md:overflow-y-auto flex-shrink-0">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Studio</h2>
                            <Button variant="secondary" onClick={() => setView('dashboard')} className="text-xs py-1">Exit</Button>
                        </div>

                        {!currentScript && (
                            <div className="space-y-4">
                                <FusionForgeSelector 
                                    structures={user.fusionStructures || []} 
                                    selectedId={fusionId} 
                                    onSelect={setFusionId}
                                    onImport={handleImportFusion}
                                    isImporting={isImporting}
                                />
                                
                                <input value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})} placeholder="Video Topic..." className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"/>
                                <select value={config.tone} onChange={e => setConfig({...config, tone: e.target.value})} className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white">
                                    <option>Professional</option><option>Energetic</option><option>Humorous</option><option>Serious</option>
                                </select>
                                <input value={config.duration} onChange={e => setConfig({...config, duration: e.target.value})} placeholder="Duration (e.g. 10min)" className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"/>
                                <input value={config.niche} onChange={e => setConfig({...config, niche: e.target.value})} placeholder="Niche" className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"/>
                                <input value={config.goal} onChange={e => setConfig({...config, goal: e.target.value})} placeholder="Goal" className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"/>
                                <input value={config.needs} onChange={e => setConfig({...config, needs: e.target.value})} placeholder="Key points needed" className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"/>
                                <input value={config.cta} onChange={e => setConfig({...config, cta: e.target.value})} placeholder="CTA" className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"/>
                                
                                <Button onClick={handleGenerateScript} isLoading={isGenerating} className="w-full py-4 text-lg shadow-lg shadow-brand-purple/20">Generate</Button>
                            </div>
                        )}
                        {currentScript && (
                            <div className="text-center">
                                <CheckIcon className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                                <h3 className="font-bold text-lg mb-2">Script Ready</h3>
                                <p className="text-gray-500 text-sm mb-6">Your 4-part package has been generated.</p>
                                <Button onClick={() => setCurrentScript(null)} variant="secondary">New Script</Button>
                            </div>
                        )}
                    </div>

                    {/* Result View */}
                    <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-4 md:p-8 md:overflow-hidden h-full flex flex-col">
                        {currentScript ? (
                            <ScriptResultView script={currentScript} />
                        ) : (
                            <div className="h-64 md:h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <SparklesIcon className="h-20 w-20 mx-auto mb-4 opacity-20"/>
                                    <p>Configure Fusion Forge settings on the left.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- PITCHES --- */}
            {view === 'pitches' && (
                <div className="p-8 max-w-4xl mx-auto h-full flex flex-col animate-fade-in text-gray-900 dark:text-white overflow-y-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold flex items-center"><BriefcaseIcon className="h-6 w-6 mr-2 text-blue-500"/> Marketing Pitches</h2>
                        <Button variant="secondary" onClick={() => setView('dashboard')}>Back</Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8 flex-1 overflow-hidden">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-fit">
                            <h3 className="font-bold mb-4">Create New Pitch</h3>
                            <div className="space-y-4">
                                <input value={pitchForm.target} onChange={e => setPitchForm({...pitchForm, target: e.target.value})} placeholder="Target Name" className="w-full p-3 rounded border dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white"/>
                                <textarea value={pitchForm.desc} onChange={e => setPitchForm({...pitchForm, desc: e.target.value})} placeholder="Description of Target" className="w-full p-3 rounded border dark:bg-gray-900 dark:border-gray-700 h-24 text-gray-900 dark:text-white"/>
                                <input value={pitchForm.obj} onChange={e => setPitchForm({...pitchForm, obj: e.target.value})} placeholder="Your Objective" className="w-full p-3 rounded border dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white"/>
                                <Button onClick={handleGeneratePitch} isLoading={isPitching} className="w-full">Generate Pitch</Button>
                            </div>
                            {pitchResult && (
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-900">
                                    <p className="whitespace-pre-wrap text-sm">{pitchResult}</p>
                                    <Button variant="secondary" className="mt-2 w-full text-xs" onClick={() => navigator.clipboard.writeText(pitchResult)}>Copy</Button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-y-auto space-y-4 pr-2">
                            <h3 className="font-bold sticky top-0 bg-gray-50 dark:bg-gray-900 py-2">History</h3>
                            {pitches.length === 0 && <p className="text-gray-500">No pitches yet.</p>}
                            {pitches.map(p => (
                                <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold">{p.targetName}</h4>
                                        <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2 truncate">{p.objective}</p>
                                    <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-600 dark:text-gray-300 line-clamp-3">
                                        {p.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- DOCS --- */}
            {view === 'docs' && (
                <div className="p-8 max-w-4xl mx-auto animate-fade-in text-gray-900 dark:text-white h-full overflow-y-auto">
                    <Button variant="secondary" onClick={() => setView('dashboard')} className="mb-6">← Back to Dashboard</Button>
                    <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none">
                        <h1 className="text-3xl font-bold mb-6">WySlider Guide</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            Welcome to WySlider, your AI-powered production partner. This platform is designed to streamline the entire creative process for YouTube creators, from ideation to promotion.
                        </p>
                        
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-xl font-bold mb-3 text-brand-purple">1. The Studio & 4-Part System</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    The Studio is where the magic happens. WySlider generates a comprehensive production package divided into 4 key parts:
                                </p>
                                <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700 dark:text-gray-300">
                                    <li><strong>Planning:</strong> Establishes the tonal palette, pacing, and structural overview.</li>
                                    <li><strong>Script:</strong> A full script optimized for retention, featuring strategic hooks and re-hooks to maintain viewer attention.</li>
                                    <li><strong>Social Media:</strong> Ready-to-use posts for Twitter, LinkedIn, Instagram, etc., to promote your video.</li>
                                    <li><strong>Video Prompts:</strong> Visual descriptions tailored for AI video generators (like Runway, Sora, Pika) or for guiding your editor.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold mb-3 text-brand-purple">2. Fusion Forge</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Fusion Forge allows you to "steal" the narrative DNA of successful videos. 
                                    Simply paste a YouTube URL into the Fusion Forge importer in the Studio. 
                                    The AI analyzes the video's structure (pacing, hook style, content blocks) and saves it as a reusable template for your own content.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold mb-3 text-brand-purple">3. Marketing Pitches</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Need to reach out to brands or collaborators? Use the Marketing Pitch tool to generate professional, persuasive cold emails and messages tailored to specific targets and objectives.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold mb-3 text-brand-purple">4. Social Library</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Access all your historically generated social media posts in one place via the Social Library on the dashboard. Quickly copy content and hashtags for your distribution workflow.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};
