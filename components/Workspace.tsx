
import React, { useState, useEffect } from 'react';
import { User, Script, BrandPitch } from '../types';
import { Button } from './Button';
/* Fix: Added missing ArrowRightIcon and HomeIcon imports */
import { PlusIcon, ShareIcon, Bars3Icon, BriefcaseIcon, CheckIcon, SparklesIcon, DocumentArrowDownIcon, ClockIcon, XMarkIcon, MagnifyingGlassIcon, FireIcon, VideoIcon, PaperAirplaneIcon, BookOpenIcon, EyeIcon, ArrowRightIcon, HomeIcon } from './icons';
import { MainLayout } from './MainLayout';
import * as geminiService from '../services/geminiService';
// @ts-ignore
import { jsPDF } from 'jspdf';
import { Modal } from './Modal';

type ViewMode = 'dashboard' | 'studio' | 'pitches' | 'docs';

const ScriptResultView: React.FC<{ script: Script, user: User, onBack?: () => void }> = ({ script, user, onBack }) => {
    const [activeTab, setActiveTab] = useState<'planning'|'script'|'social'|'prompts'|'blog'>('planning');
    const [showPreview, setShowPreview] = useState(false);

    const generatePDF = () => {
        const doc = new jsPDF();
        let y = 20;
        const addText = (text: string, size = 10, font = "normal", color = [0,0,0]) => {
            doc.setFontSize(size);
            doc.setFont("helvetica", font);
            doc.setTextColor(color[0], color[1], color[2]);
            const lines = doc.splitTextToSize(text, 180);
            lines.forEach((line: string) => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(line, 15, y);
                y += 7;
            });
            y += 2;
        };

        addText(script.title || "Script WySlider", 22, "bold", [139, 92, 246]);
        y += 5;
        
        addText("PLANNING STRATÉGIQUE", 14, "bold");
        addText(`Chaîne : ${script.planning?.channelName || user.channelName}`);
        addText(`Niche : ${script.planning?.niche || user.niche}`);
        addText(`Sujet : ${script.planning?.topic}`);
        addText(`Durée estimée : ${script.planning?.duration}`);
        y += 5;
        
        addText("SCRIPT YOUTUBE DÉTAILLÉ", 14, "bold");
        addText(`DESCRIPTION SEO : ${script.youtubeScript?.description}`, 10, "italic", [100, 100, 100]);
        addText(`HOOK D'INTRODUCTION : ${script.youtubeScript?.hook}`, 11, "bold", [220, 38, 38]);
        script.youtubeScript?.sections.forEach(s => {
            addText(`${s.timestamp || ''} - ${s.number}. ${s.title}`, 12, "bold");
            addText(s.content.replace(/<[^>]*>?/gm, ''));
            addText(`Rappel de rétention (Re-hook) : ${s.rehook}`, 10, "italic", [100, 100, 100]);
            y += 3;
        });

        if (script.youtubeScript?.blogArticle) {
            doc.addPage();
            y = 20;
            addText("ARTICLE DE BLOG", 14, "bold");
            addText(script.youtubeScript.blogArticle);
        }

        return doc;
    };

    const handleDownloadPDF = () => {
        const doc = generatePDF();
        doc.save(`WySlider_Script_${script.title.replace(/\s+/g, '_')}.pdf`);
    };

    const handleDownloadSRT = () => {
        let srt = "";
        let counter = 1;
        let time = 0;
        const addPart = (text: string) => {
            const cleanText = text.replace(/<[^>]*>?/gm, '');
            const words = cleanText.split(' ').length;
            const dur = Math.max(3, Math.floor(words / 2.5));
            const format = (s: number) => {
                const h = Math.floor(s / 3600).toString().padStart(2, '0');
                const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
                const sec = Math.floor(s % 60).toString().padStart(2, '0');
                return `${h}:${m}:${sec},000`;
            };
            srt += `${counter}\n${format(time)} --> ${format(time + dur)}\n${cleanText}\n\n`;
            time += dur;
            counter++;
        };
        if (script.youtubeScript) {
            addPart(script.youtubeScript.hook);
            script.youtubeScript.sections.forEach(s => addPart(s.content));
            addPart(script.youtubeScript.conclusion);
        }
        const blob = new Blob([srt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WySlider_${script.title.replace(/\s+/g, '_')}.srt`;
        a.click();
    };

    const handleShare = () => {
        const temps = JSON.parse(localStorage.getItem('wyslider_public_templates') || '[]');
        localStorage.setItem('wyslider_public_templates', JSON.stringify([{...script, authorName: user.name, id: `pub_${Date.now()}`}, ...temps]));
        alert("Script partagé comme template avec succès !");
    };

    if (!script.youtubeScript) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden h-full flex flex-col animate-fade-in relative">
            <div className="flex border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {['planning', 'script', 'social', 'prompts', 'blog'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeTab === tab ? 'bg-brand-purple text-white shadow-inner' : 'text-gray-400 hover:text-brand-purple'}`}>
                        {tab === 'blog' ? 'Article' : tab}
                    </button>
                ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === 'planning' && script.planning && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700"><p className="text-[10px] font-bold text-gray-400 uppercase">Titre de la Vidéo</p><p className="font-black text-lg">{script.title}</p></div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700"><p className="text-[10px] font-bold text-gray-400 uppercase">Durée estimée</p><p className="font-black text-lg">{script.planning.duration}</p></div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700"><p className="text-[10px] font-bold text-gray-400 uppercase">Nom de la Chaîne</p><p className="font-black text-lg">{script.planning.channelName || user.channelName}</p></div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700"><p className="text-[10px] font-bold text-gray-400 uppercase">Niche</p><p className="font-black text-lg">{script.planning.niche || user.niche}</p></div>
                        </div>
                        <div className="p-6 bg-brand-purple/5 border-2 border-dashed border-brand-purple/20 rounded-2xl">
                            <h3 className="font-black text-brand-purple mb-4 flex items-center"><SparklesIcon className="h-5 w-5 mr-2"/> ARCHITECTURE IA</h3>
                            <ul className="space-y-4">
                                {script.youtubeScript?.sections.map((s, i) => (
                                    <li key={i} className="flex items-center text-sm font-bold bg-white dark:bg-gray-950 p-3 rounded-lg border dark:border-gray-800">
                                        <span className="text-brand-purple mr-4 font-mono">{s.timestamp || '00:00'}</span>
                                        <span className="flex-1">{s.title}</span>
                                        <CheckIcon className="h-4 w-4 text-green-500 ml-2"/>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'script' && script.youtubeScript && (
                    <div className="space-y-8 animate-fade-in font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                        <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border-l-4 border-brand-purple font-sans text-sm">
                            <p className="font-black uppercase text-brand-purple text-[10px] mb-1">Optimisation SEO</p>
                            <p className="font-bold text-lg mb-1">{script.youtubeScript.title}</p>
                            <p className="text-gray-600 dark:text-gray-400 font-sans italic mb-3">{script.youtubeScript.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {script.youtubeScript.hashtags.map((h, i) => (
                                    <span key={i} className="text-[10px] font-bold text-brand-blue bg-brand-blue/5 px-2 py-0.5 rounded-full">{h}</span>
                                ))}
                            </div>
                        </div>
                        <div className="p-5 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-xl">
                            <span className="font-sans text-[10px] font-black text-red-600 block mb-2 uppercase tracking-widest">ACCROCHE VIRALE (HOOK)</span>
                            <p className="font-bold">{script.youtubeScript.hook}</p>
                        </div>
                        <div className="pl-4 border-l-2 dark:border-gray-800 italic text-base opacity-70">
                            {script.youtubeScript.intro}
                        </div>
                        {script.youtubeScript.sections.map((s, i) => (
                            <div key={i} className="space-y-4">
                                <h3 className="font-sans font-black text-brand-purple uppercase text-sm border-b dark:border-gray-700 pb-2 flex justify-between">
                                    <span>Séquence {s.number} : {s.title}</span>
                                    <span className="opacity-50 text-xs">{s.timestamp}</span>
                                </h3>
                                <div className="pl-4 border-l-2 dark:border-gray-800" dangerouslySetInnerHTML={{ __html: s.content }} />
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl italic text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Indice de rétention (Re-hook) :</strong> {s.rehook}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'blog' && script.youtubeScript?.blogArticle && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[2rem] border-2 border-blue-100 dark:border-blue-800">
                            <h3 className="text-xl font-black text-blue-700 dark:text-blue-400 mb-4 flex items-center"><BookOpenIcon className="h-6 w-6 mr-2"/> ARTICLE DE BLOG GÉNÉRÉ</h3>
                            <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap font-serif">
                                {script.youtubeScript.blogArticle}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'social' && script.socialPosts && (
                    <div className="grid gap-6 animate-fade-in">
                        {script.socialPosts.map((p, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-black text-brand-blue text-[10px] uppercase tracking-tighter bg-brand-blue/10 px-3 py-1 rounded-full">{p.platform}</span>
                                    <button onClick={() => {navigator.clipboard.writeText(p.content); alert("Copié !")}} className="text-xs font-bold text-brand-purple hover:underline">Copier</button>
                                </div>
                                <p className="text-sm leading-relaxed mb-4">{p.content}</p>
                                <div className="flex flex-wrap gap-2">
                                    {p.hashtags.map((h, idx) => (
                                        <span key={idx} className="text-[10px] font-bold text-brand-blue">{h}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'prompts' && script.videoPrompts && (
                    <div className="space-y-4 animate-fade-in">
                        {script.videoPrompts.map((p, i) => (
                            <div key={i} className={`p-5 rounded-2xl border-l-4 shadow-sm ${
                                p.segment === 'Introduction' ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500' :
                                p.segment === 'Content' ? 'bg-green-50 dark:bg-green-900/10 border-green-500' :
                                p.segment === 'Conclusion' ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-500' :
                                'bg-purple-50 dark:bg-purple-900/10 border-purple-500'
                            }`}>
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">{p.segment}</p>
                                <p className="text-sm font-mono leading-tight">{p.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-wrap gap-3 justify-end">
                <Button onClick={() => setShowPreview(true)} variant="outline" className="text-[10px] py-2.5 px-4 font-black"><EyeIcon className="h-4 w-4 mr-2"/> APERÇU PDF</Button>
                <Button onClick={handleShare} variant="outline" className="text-[10px] py-2.5 px-4 font-black"><ShareIcon className="h-4 w-4 mr-2"/> TEMPLATE</Button>
                <Button onClick={handleDownloadSRT} variant="secondary" className="text-[10px] py-2.5 px-4 font-black"><ClockIcon className="h-4 w-4 mr-2"/> SRT</Button>
                <Button onClick={handleDownloadPDF} variant="secondary" className="text-[10px] py-2.5 px-4 font-black"><DocumentArrowDownIcon className="h-4 w-4 mr-2"/> PDF</Button>
            </div>

            <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Aperçu du Document">
                <div className="max-h-[70vh] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4 text-sm font-serif">
                    <h1 className="text-2xl font-bold text-brand-purple">{script.title}</h1>
                    <div className="space-y-2 border-b dark:border-gray-800 pb-4">
                        <p><strong>Chaîne:</strong> {script.planning?.channelName}</p>
                        <p><strong>Niche:</strong> {script.planning?.niche}</p>
                        <p><strong>Durée:</strong> {script.planning?.duration}</p>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold">Introduction</h2>
                        <p>{script.youtubeScript?.hook}</p>
                        {script.youtubeScript?.sections.map(s => (
                            <div key={s.number}>
                                <p><strong>{s.timestamp} - {s.title}</strong></p>
                                <p className="opacity-80" dangerouslySetInnerHTML={{ __html: s.content }}></p>
                            </div>
                        ))}
                        {script.youtubeScript?.blogArticle && (
                            <>
                                <h2 className="text-lg font-bold border-t pt-4">Blog Article</h2>
                                <p className="italic opacity-80">{script.youtubeScript.blogArticle}</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <Button onClick={handleDownloadPDF}>Télécharger le PDF</Button>
                </div>
            </Modal>
        </div>
    );
};

export const Workspace: React.FC<{ user: User; onUpdateUser: (u: User) => void; onNavigateAccount: () => void; onLogout: () => void; isDarkMode?: boolean; toggleTheme?: () => void; }> = ({ user, onUpdateUser, onNavigateAccount, onLogout, isDarkMode, toggleTheme }) => {
    const [view, setView] = useState<ViewMode>('dashboard');
    const [scripts, setScripts] = useState<Script[]>([]);
    const [pitches, setPitches] = useState<BrandPitch[]>([]);
    const [currentScript, setCurrentScript] = useState<Script | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
    // Studio State
    const [mode, setMode] = useState<'oneshot' | 'serial'>('oneshot');
    const [config, setConfig] = useState({ topic: '', tone: 'Professionnel', duration: '5 - 15 min', niche: user.niche || '', channelName: user.channelName || '', goal: '', requirements: '', platforms: 'YouTube, TikTok, Instagram', episodeCount: 5 });
    const [isGenerating, setIsGenerating] = useState(false);

    // Pitch State
    const [pitchForm, setPitchForm] = useState({ target: '', desc: '', obj: '' });
    const [isPitching, setIsPitching] = useState(false);

    useEffect(() => {
        const s = localStorage.getItem('wyslider_scripts');
        if(s) setScripts(JSON.parse(s));
        const p = localStorage.getItem('wyslider_pitches');
        if(p) setPitches(JSON.parse(p));
    }, []);

    useEffect(() => { localStorage.setItem('wyslider_scripts', JSON.stringify(scripts)); }, [scripts]);
    useEffect(() => { localStorage.setItem('wyslider_pitches', JSON.stringify(pitches)); }, [pitches]);

    const handleGenerate = async () => {
        if (!config.topic) return alert("Veuillez saisir un sujet.");
        setIsGenerating(true);
        try {
            if (mode === 'oneshot') {
                const res = await geminiService.generateScript(config.topic, config.tone, config.duration, config, user.apiKey);
                if (res) {
                    const s: Script = { id: `s_${Date.now()}`, title: res.youtubeScript?.title || config.topic, createdAt: new Date().toISOString(), planning: res.planning, youtubeScript: res.youtubeScript, socialPosts: res.socialPosts, videoPrompts: res.videoPrompts };
                    setScripts([s, ...scripts]);
                    setCurrentScript(s);
                    onUpdateUser({...user, generationsLeft: user.generationsLeft - 1});
                }
            } else {
                const episodes = await geminiService.generateSeries(config.topic, config.episodeCount, config.tone, config.duration, config, user.apiKey);
                const newScripts = episodes.map((res: any, i: number) => ({ id: `s_${Date.now()}_${i}`, title: res.youtubeScript?.title || `${config.topic} - Épisode ${i+1}`, createdAt: new Date().toISOString(), planning: res.planning, youtubeScript: res.youtubeScript, socialPosts: res.socialPosts, videoPrompts: res.videoPrompts }));
                setScripts([...newScripts, ...scripts]);
                setCurrentScript(newScripts[0]);
                onUpdateUser({...user, generationsLeft: user.generationsLeft - config.episodeCount});
            }
        } catch (e) { alert("Une erreur est survenue lors de la génération. Veuillez réessayer."); }
        finally { setIsGenerating(false); }
    };

    const handleGeneratePitch = async () => {
        setIsPitching(true);
        const res = await geminiService.generatePitch(pitchForm.target, pitchForm.desc, pitchForm.obj, user.apiKey);
        setPitches([{ id: `p_${Date.now()}`, targetName: pitchForm.target, description: pitchForm.desc, objective: pitchForm.obj, content: res, createdAt: new Date().toISOString() }, ...pitches]);
        setIsPitching(false);
    };

    // Limits based on plan
    const maxEpisodes = user.status === 'Enterprise' ? 30 : (user.status === 'Community' ? 10 : 5);

    return (
        <MainLayout user={user} onLogout={onLogout} onNavigateToAccount={onNavigateAccount} isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
            {view === 'dashboard' && (
                <div className="h-full overflow-y-auto p-6 md:p-10 animate-fade-in text-gray-900 dark:text-white max-w-7xl mx-auto space-y-10">
                    <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                        <div className="flex gap-4">
                            <div className="bg-brand-purple/10 dark:bg-brand-purple/20 px-4 py-2 rounded-2xl border border-brand-purple/20">
                                <p className="text-[10px] font-black uppercase text-brand-purple tracking-widest">Packs</p>
                                <p className="text-xl font-black">{scripts.length}</p>
                            </div>
                            <div className="bg-brand-blue/10 dark:bg-brand-blue/20 px-4 py-2 rounded-2xl border border-brand-blue/20">
                                <p className="text-[10px] font-black uppercase text-brand-blue tracking-widest">Pitches</p>
                                <p className="text-xl font-black">{pitches.length}</p>
                            </div>
                            <div className="bg-orange-500/10 dark:bg-orange-500/20 px-4 py-2 rounded-2xl border border-orange-500/20">
                                <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Crédits</p>
                                <p className="text-xl font-black">{user.generationsLeft}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="flex-1 relative md:w-64">
                                {showSearch && (
                                    <input type="text" placeholder="Rechercher..." className="w-full bg-white dark:bg-gray-800 p-4 pl-12 rounded-2xl border dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-purple shadow-sm animate-fade-in text-gray-900 dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                )}
                                {showSearch && <MagnifyingGlassIcon className="h-6 w-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />}
                            </div>
                            <button onClick={() => setShowSearch(!showSearch)} className={`p-4 rounded-2xl border dark:border-gray-700 transition shadow-sm ${showSearch ? 'bg-brand-purple text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Bars3Icon className="h-6 w-6"/></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div onClick={() => setView('studio')} className="bg-brand-purple p-10 rounded-[2.5rem] text-white cursor-pointer hover:shadow-2xl hover:shadow-brand-purple/30 transition-all duration-500 group relative overflow-hidden h-56 flex flex-col justify-between">
                            <SparklesIcon className="absolute -right-8 -top-8 h-48 w-48 opacity-10 group-hover:scale-110 transition duration-700"/>
                            <h3 className="font-black text-3xl tracking-tighter">STUDIO CREATOR</h3>
                            <div className="flex items-center space-x-3"><span className="text-xs font-black uppercase tracking-widest border-b-2 border-white/50 pb-1">Nouveau Pack de Production</span><PlusIcon className="h-6 w-6"/></div>
                        </div>
                        <div onClick={() => setView('pitches')} className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] border-2 dark:border-gray-700 cursor-pointer hover:border-brand-purple transition-all duration-500 group h-56 flex flex-col justify-between shadow-xl">
                            <h3 className="font-black text-3xl tracking-tighter text-gray-800 dark:text-gray-100">MARKETING PITCH</h3>
                            <div className="flex items-center space-x-3"><span className="text-xs font-black uppercase tracking-widest text-brand-purple border-b-2 border-brand-purple/50 pb-1">Cold Email Engine</span><BriefcaseIcon className="h-6 w-6 text-brand-purple"/></div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h3 className="font-black text-2xl tracking-tighter uppercase flex items-center"><ClockIcon className="h-6 w-6 mr-3 text-brand-purple"/> PROJETS RÉCENTS</h3>
                        <div className="grid gap-5">
                            {scripts.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 8).map(s => (
                                <div key={s.id} onClick={() => { setCurrentScript(s); setView('studio'); }} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 flex justify-between items-center hover:shadow-xl hover:border-brand-purple/30 transition cursor-pointer shadow-sm group">
                                    <div className="flex items-center space-x-6">
                                        <div className="h-14 w-14 bg-brand-purple/5 rounded-2xl flex items-center justify-center text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300">
                                            <SparklesIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-xl tracking-tight">{s.title}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(s.createdAt).toLocaleDateString()} • {s.planning?.duration} • {s.planning?.topic}</p>
                                        </div>
                                    </div>
                                    <span className="text-brand-purple font-black text-xs uppercase tracking-widest">Voir le pack &rarr;</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'studio' && (
                <div className="h-full flex flex-col md:flex-row overflow-hidden animate-fade-in relative">
                    <button 
                        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-brand-purple text-white p-2 rounded-r-xl shadow-xl transition-all duration-300 ${isSidebarVisible ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
                    >
                        <ArrowRightIcon className="h-6 w-6" />
                    </button>

                    <div className={`w-full md:w-[450px] bg-white dark:bg-gray-900 border-r dark:border-gray-700 p-8 overflow-y-auto space-y-8 flex-shrink-0 shadow-2xl z-10 transition-all duration-300 ${isSidebarVisible ? 'ml-0' : '-ml-[450px]'}`}>
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-black tracking-tighter">STUDIO</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setIsSidebarVisible(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition md:block hidden text-gray-400"><XMarkIcon className="h-5 w-5"/></button>
                                <button onClick={() => { setView('dashboard'); setCurrentScript(null); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"><HomeIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                        
                        {!currentScript && (
                            <div className="space-y-8">
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl flex border dark:border-gray-700 shadow-inner">
                                    <button onClick={() => setMode('oneshot')} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${mode === 'oneshot' ? 'bg-white dark:bg-gray-700 shadow-xl text-brand-purple scale-100' : 'text-gray-400 scale-95'}`}>One-Shot Pack</button>
                                    <button onClick={() => setMode('serial')} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${mode === 'serial' ? 'bg-white dark:bg-gray-700 shadow-xl text-brand-purple scale-100' : 'text-gray-400 scale-95'}`}>Serial Prod</button>
                                </div>

                                <div className="space-y-6">
                                    <div><label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Sujet de la Vidéo</label><input value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})} placeholder="Ex: Pourquoi le Bitcoin explose..." className="w-full p-4 rounded-2xl border-2 dark:bg-gray-950 dark:border-gray-800 focus:border-brand-purple outline-none transition font-bold text-gray-900 dark:text-white"/></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Niche</label><input value={config.niche} onChange={e => setConfig({...config, niche: e.target.value})} placeholder="Tech..." className="w-full p-4 rounded-2xl border-2 dark:bg-gray-950 dark:border-gray-800 focus:border-brand-purple outline-none transition font-bold text-gray-900 dark:text-white"/></div>
                                        <div><label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Buts</label><input value={config.goal} onChange={e => setConfig({...config, goal: e.target.value})} placeholder="Vendre..." className="w-full p-4 rounded-2xl border-2 dark:bg-gray-950 dark:border-gray-800 focus:border-brand-purple outline-none transition font-bold text-gray-900 dark:text-white"/></div>
                                    </div>
                                    <div><label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Durée</label>
                                        <select value={config.duration} onChange={e => setConfig({...config, duration: e.target.value})} className="w-full p-4 rounded-2xl border-2 dark:bg-gray-950 dark:border-gray-800 focus:border-brand-purple outline-none transition font-black text-gray-900 dark:text-white">
                                            <option>30 - 60 s</option>
                                            <option>5 - 15 min</option>
                                            <option>30 - 60 min</option>
                                            <option>90 - 120 min</option>
                                        </select>
                                    </div>
                                    <div><label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Plateformes</label><input value={config.platforms} onChange={e => setConfig({...config, platforms: e.target.value})} placeholder="YouTube..." className="w-full p-4 rounded-2xl border-2 dark:bg-gray-950 dark:border-gray-800 focus:border-brand-purple outline-none transition font-bold text-gray-900 dark:text-white"/></div>
                                    <div><label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Besoins Spécifiques</label><textarea value={config.requirements} onChange={e => setConfig({...config, requirements: e.target.value})} placeholder="Ex: Ton humoristique..." className="w-full p-4 rounded-2xl border-2 dark:bg-gray-950 dark:border-gray-800 focus:border-brand-purple outline-none transition h-24 font-bold text-gray-900 dark:text-white"/></div>
                                    
                                    {mode === 'serial' && (
                                        <div className="p-5 bg-brand-purple/10 border-2 border-brand-purple rounded-3xl animate-fade-in">
                                            <label className="text-[11px] font-black text-brand-purple uppercase tracking-widest mb-3 block">Épisodes (Max {maxEpisodes})</label>
                                            <div className="flex items-center gap-4">
                                                <input type="range" min="1" max={maxEpisodes} value={config.episodeCount} onChange={e => setConfig({...config, episodeCount: parseInt(e.target.value)})} className="flex-1 accent-brand-purple"/>
                                                <span className="font-black text-2xl text-brand-purple w-10">{config.episodeCount}</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <Button onClick={handleGenerate} isLoading={isGenerating} className="w-full py-6 text-xl font-black tracking-tighter shadow-2xl shadow-brand-purple/20">LANCER L'IA</Button>
                                </div>
                            </div>
                        )}
                        {currentScript && (
                            <div className="text-center space-y-6 py-10">
                                <div className="h-28 w-28 bg-green-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30 animate-bounce"><CheckIcon className="h-14 w-14"/></div>
                                <h3 className="font-black text-3xl tracking-tighter">PACK PRÊT !</h3>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed px-6">Explorez votre pack avec les onglets.</p>
                                <Button onClick={() => setCurrentScript(null)} variant="secondary" className="w-full py-4 uppercase font-black tracking-widest text-[11px]">Nouvelle Production</Button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 md:p-10 overflow-hidden flex flex-col">
                        {currentScript ? <ScriptResultView script={currentScript} user={user} onBack={() => setCurrentScript(null)} /> : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-center"><div className="space-y-6 max-w-md"><div className="relative"><div className="absolute inset-0 bg-brand-purple blur-[100px] opacity-20"></div><SparklesIcon className="h-32 w-32 mx-auto text-brand-purple opacity-20 animate-pulse relative z-10"/></div><h3 className="font-black text-3xl tracking-tighter opacity-10 uppercase">En attente d'instruction</h3><p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30 leading-relaxed">Le Studio WySlider nécessite vos paramètres.</p></div></div>
                        )}
                    </div>
                </div>
            )}

            {view === 'pitches' && (
                <div className="h-full flex flex-col animate-fade-in bg-gray-50 dark:bg-gray-900 overflow-hidden">
                    <header className="p-8 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900"><h2 className="text-3xl font-black tracking-tighter flex items-center"><BriefcaseIcon className="h-8 w-8 mr-4 text-brand-purple"/> MARKETING PITCH ENGINE</h2><Button variant="secondary" onClick={() => setView('dashboard')} className="text-xs uppercase font-black">Retour au Dashboard</Button></header>
                    <div className="flex-1 overflow-hidden p-6 md:p-10 flex flex-col md:flex-row gap-10">
                        <div className="w-full md:w-[450px] bg-white dark:bg-gray-800 p-8 rounded-[3rem] border dark:border-gray-700 space-y-8 flex-shrink-0 shadow-2xl">
                            <h3 className="font-black text-sm uppercase tracking-widest text-brand-purple">Nouveau Pitch</h3>
                            <div className="space-y-6">
                                <div><label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cible (Marque ou Nom)</label><input value={pitchForm.target} onChange={e => setPitchForm({...pitchForm, target: e.target.value})} placeholder="Ex: Responsable Marketing Nike..." className="w-full p-5 rounded-2xl border dark:bg-gray-950 dark:border-gray-700 outline-none focus:border-brand-purple transition font-bold shadow-inner text-gray-900 dark:text-white"/></div>
                                <div><label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Description de l'Offre</label><textarea value={pitchForm.desc} onChange={e => setPitchForm({...pitchForm, desc: e.target.value})} placeholder="Que proposez-vous concrètement ?" className="w-full p-5 rounded-2xl border dark:bg-gray-950 dark:border-gray-700 h-40 outline-none focus:border-brand-purple transition font-bold shadow-inner text-gray-900 dark:text-white"/></div>
                                <div><label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Objectif final</label><input value={pitchForm.obj} onChange={e => setPitchForm({...pitchForm, obj: e.target.value})} placeholder="Vente directe, Rendez-vous, Collab..." className="w-full p-5 rounded-2xl border dark:bg-gray-950 dark:border-gray-700 outline-none focus:border-brand-purple transition font-bold shadow-inner text-gray-900 dark:text-white"/></div>
                                <Button onClick={handleGeneratePitch} isLoading={isPitching} className="w-full py-5 font-black text-lg tracking-tighter">GÉNÉRER LE COLD EMAIL</Button>
                            </div>
                        </div>
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-[3rem] border dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden">
                             <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 font-black text-[11px] uppercase tracking-[0.2em] text-gray-400">Résultats de génération & Archives</div>
                             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {pitches.map((p, i) => (
                                    <div key={p.id} className={`p-8 rounded-[2rem] border-2 transition-all duration-300 shadow-sm ${i === 0 ? 'border-brand-purple bg-brand-purple/5' : 'dark:border-gray-700 hover:border-brand-purple/30'}`}>
                                        <div className="flex justify-between items-center mb-6"><h4 className="font-black text-xl text-brand-purple tracking-tight uppercase">{p.targetName}</h4><span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{new Date(p.createdAt).toLocaleDateString()}</span></div>
                                        <div className="text-lg leading-relaxed whitespace-pre-wrap font-serif text-gray-700 dark:text-gray-300 italic">{p.content}</div>
                                        <div className="mt-8 flex justify-end border-t dark:border-gray-700 pt-6"><button onClick={() => {navigator.clipboard.writeText(p.content); alert("Pitch copié !")}} className="text-xs font-black uppercase tracking-widest text-brand-purple hover:underline">Copier le Pitch</button></div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};
