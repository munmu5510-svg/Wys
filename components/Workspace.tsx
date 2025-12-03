
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Script, ChatSession, ChatMessage, AppNotification, CalendarEvent, BrandPitch, Series } from '../types';
import { Button } from './Button';
import { PlusIcon, VideoIcon, TrashIcon, ShareIcon, PencilSquareIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon, Bars3Icon, CalendarIcon, TrendingUpIcon, ChartPieIcon, CurrencyDollarIcon, RobotIcon, ArrowDownTrayIcon, ArrowRightIcon, UserIcon, XMarkIcon, BellIcon, CloudIcon, ClockIcon, BoldIcon, ItalicIcon, ListBulletIcon, EyeIcon, PlayIcon, DocumentArrowDownIcon, Squares2x2Icon, CheckIcon } from './icons';
import { MainLayout } from './MainLayout';
import * as geminiService from '../services/geminiService';
import { Chat } from '@google/genai';
// @ts-ignore
import { jsPDF } from 'jspdf';

// --- Helper Components ---

const NotificationToast: React.FC<{ notification: AppNotification, onClose: (id: string) => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(notification.id), 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div className={`fixed bottom-4 right-4 max-w-sm w-full bg-gray-800 border-l-4 ${notification.type === 'success' ? 'border-green-500' : 'border-blue-500'} rounded shadow-2xl p-4 flex items-start animate-fade-in z-[60]`}>
            <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-200">{notification.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
            </div>
            <button onClick={() => onClose(notification.id)} className="text-gray-500 hover:text-white ml-3"><XMarkIcon className="h-4 w-4"/></button>
        </div>
    );
};

// ... ChatOverlay ...
const ChatOverlay: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void;
    sessions: ChatSession[];
    activeSessionId: string | null;
    onNewChat: () => void;
    onSelectSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    onDeleteAllHistory: () => void;
    onSendMessage: (msg: string) => void;
    isProcessing: boolean;
}> = ({ isOpen, onClose, sessions, activeSessionId, onNewChat, onSelectSession, onDeleteSession, onDeleteAllHistory, onSendMessage, isProcessing }) => {
    const [input, setInput] = useState('');
    const [view, setView] = useState<'history' | 'chat'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    useEffect(() => {
        if(activeSessionId) setView('chat');
        else setView('history');
    }, [activeSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages]);

    const handleSend = () => {
        if(!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 md:inset-auto md:inset-y-0 md:right-0 md:w-96 max-w-full bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col">
            <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900">
                <div className="flex items-center space-x-2">
                    <button onClick={() => setView('history')} className={`p-2 rounded hover:bg-gray-800 ${view === 'history' ? 'text-white' : 'text-gray-500'}`} title="Historique">
                        <ClockIcon className="h-5 w-5"/>
                    </button>
                    <span className="font-bold text-lg">AI Assistant</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><XMarkIcon className="h-6 w-6"/></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative">
                {view === 'history' ? (
                    <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
                        <Button onClick={() => { onNewChat(); setView('chat'); }} className="w-full mb-4 bg-gray-800 hover:bg-gray-700 border border-gray-700">+ Nouvelle Discussion</Button>
                        {sessions.length === 0 && <p className="text-center text-gray-500 mt-10">Aucun historique.</p>}
                        {sessions.map(session => (
                            <div key={session.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-brand-purple group cursor-pointer" onClick={() => onSelectSession(session.id)}>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-gray-200 truncate pr-2">{session.title}</h4>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} 
                                        className="text-gray-600 hover:text-red-500"
                                    >
                                        <TrashIcon className="h-4 w-4"/>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{new Date(session.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                        {sessions.length > 0 && (
                            <button onClick={() => { if(window.confirm("Tout supprimer ?")) onDeleteAllHistory(); }} className="w-full text-xs text-red-500 hover:text-red-400 mt-8 underline">
                                Supprimer tout l'historique
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {!activeSession && <div className="text-center text-gray-500 mt-10">Commencez une nouvelle discussion.</div>}
                            {activeSession?.messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-brand-purple text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isProcessing && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-800 rounded-2xl rounded-bl-none px-4 py-2 text-sm text-gray-400 flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-gray-900 border-t border-gray-800 pb-8 md:pb-4">
                            <div className="flex space-x-2">
                                <input 
                                    value={input} 
                                    onChange={e => setInput(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Posez une question..." 
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-brand-purple outline-none"
                                />
                                <button onClick={handleSend} disabled={isProcessing} className="bg-brand-purple text-white p-2 rounded-full hover:bg-purple-600 disabled:opacity-50">
                                    <PaperAirplaneIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const MarkdownEditor: React.FC<{ value: string, onChange: (val: string) => void, placeholder?: string }> = ({ value, onChange, placeholder }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (backdropRef.current && textareaRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const handleToolbarClick = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
        
        onChange(newText);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
        }, 0);
    };

    const highlightedHTML = useMemo(() => {
        let html = value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/^# (.*$)/gm, '<span class="text-white font-bold text-lg"># $1</span>')
            .replace(/\*\*(.*?)\*\*/g, '<span class="text-blue-400 font-bold">**$1**</span>')
            .replace(/\*(.*?)\*/g, '<span class="text-purple-400 italic">*$1*</span>')
            .replace(/^- (.*$)/gm, '<span class="text-yellow-400 font-bold">- </span><span>$1</span>')
            .replace(/\[(.*?)\]/g, '<span class="text-green-400 font-mono text-xs bg-green-900/30 px-1 rounded">[$1]</span>')
            .replace(/\((.*?)\)/g, '<span class="text-pink-400 italic text-xs">($1)</span>');
            
        return html + '<br/>'; 
    }, [value]);

    return (
        <div className="relative font-mono group">
            <div className="flex space-x-1 mb-2 bg-gray-800 p-1.5 rounded-lg border border-gray-700 w-fit opacity-50 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition" onClick={() => handleToolbarClick('**', '**')} title="Bold"><BoldIcon className="h-4 w-4"/></button>
                <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition" onClick={() => handleToolbarClick('*', '*')} title="Italic"><ItalicIcon className="h-4 w-4"/></button>
                <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition" onClick={() => handleToolbarClick('- ')} title="List"><ListBulletIcon className="h-4 w-4"/></button>
                <div className="w-px bg-gray-700 mx-1"></div>
                <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition" onClick={() => handleToolbarClick('[', ']')} title="Visual Note"><EyeIcon className="h-4 w-4"/></button>
            </div>
            
            <div className="relative h-48 w-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-brand-purple focus-within:border-brand-purple transition-all">
                <div 
                    ref={backdropRef}
                    className="absolute inset-0 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none text-transparent overflow-hidden"
                    style={{ fontFamily: 'monospace' }}
                    dangerouslySetInnerHTML={{ __html: highlightedHTML }} 
                />
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onScroll={handleScroll}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full p-4 bg-transparent text-sm leading-relaxed font-mono text-gray-300 caret-white resize-none outline-none overflow-auto"
                    style={{ color: 'transparent', caretColor: 'white', fontFamily: 'monospace' }} 
                    placeholder={placeholder}
                />
            </div>
            <div className="mt-1 text-right text-[10px] text-gray-600">Markdown supported</div>
        </div>
    )
}

const Dashboard: React.FC<{ 
    scripts: Script[], 
    series: Series[], 
    onSelect: (s: Script) => void, 
    onDelete: (id: string) => void, 
    onBulkDelete: (ids: string[]) => void,
    onBulkShare: (ids: string[]) => void,
    onOpenStudio: () => void, 
    onOpenSerial: () => void 
}> = ({ scripts, series, onSelect, onDelete, onBulkDelete, onBulkShare, onOpenStudio, onOpenSerial }) => {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkAction = (action: 'delete' | 'share') => {
        if (selectedIds.size === 0) return;
        if (action === 'delete') onBulkDelete(Array.from(selectedIds));
        if (action === 'share') onBulkShare(Array.from(selectedIds));
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 animate-fade-in scroll-smooth">
             <div className="max-w-6xl mx-auto space-y-8 pb-20">
                <div className="flex items-center space-x-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700 relative z-20">
                    <div className="flex-1 relative">
                        <input type="text" placeholder="Rechercher..." className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-sm focus:ring-1 focus:ring-brand-purple outline-none"/>
                    </div>
                    <div className="flex space-x-2">
                        {selectionMode ? (
                             <div className="flex space-x-2">
                                <button onClick={() => handleBulkAction('delete')} className="p-2 bg-red-900/50 text-red-400 rounded hover:bg-red-900 border border-red-800" title="Supprimer Sélection"><TrashIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleBulkAction('share')} className="p-2 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-900 border border-blue-800" title="Partager Sélection"><ShareIcon className="h-5 w-5"/></button>
                                <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Annuler</button>
                             </div>
                        ) : (
                            <button onClick={() => setSelectionMode(true)} className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="Sélectionner...">
                                <Bars3Icon className="h-5 w-5"/>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center space-x-2"><PencilSquareIcon className="h-5 w-5 text-brand-purple"/> <span>Mes Scripts</span></h2>
                    <button onClick={onOpenStudio} className="bg-brand-purple hover:bg-purple-600 text-white rounded-full p-2 shadow-lg transition transform hover:scale-105">
                        <PlusIcon className="h-6 w-6"/>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scripts.filter(s => !s.seriesId).map(script => (
                         <div 
                             key={script.id} 
                             onClick={() => selectionMode ? toggleSelection(script.id) : onSelect(script)} 
                             className={`group bg-gray-800 rounded-xl overflow-hidden border cursor-pointer transition relative ${selectionMode && selectedIds.has(script.id) ? 'border-brand-purple ring-1 ring-brand-purple' : 'border-gray-700 hover:border-brand-purple'}`}
                         >
                             <div className="h-32 bg-gray-700 relative overflow-hidden">
                                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-900">
                                     <span className="text-4xl font-black opacity-20">WYS</span>
                                 </div>
                                 {selectionMode && (
                                     <div className="absolute top-2 right-2">
                                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedIds.has(script.id) ? 'bg-brand-purple border-brand-purple' : 'border-gray-400 bg-gray-800'}`}>
                                             {selectedIds.has(script.id) && <CheckIcon className="h-4 w-4 text-white"/>}
                                         </div>
                                     </div>
                                 )}
                             </div>
                             <div className="p-4">
                                 <div className="flex justify-between items-start mb-2">
                                     <h3 className="font-bold truncate pr-2">{script.title}</h3>
                                     {script.isTemplate && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">TEMPLATE</span>}
                                 </div>
                                 <p className="text-xs text-gray-500 mb-2 truncate">{script.youtubeDescription || "Pas de description"}</p>
                                 <div className="flex justify-between items-center text-xs text-gray-400">
                                     <span>{new Date(script.createdAt).toLocaleDateString()}</span>
                                     <span className="bg-gray-700 px-2 py-0.5 rounded">{script.niche || "Général"}</span>
                                 </div>
                             </div>
                         </div>
                    ))}
                    {scripts.length === 0 && series.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">Aucun script. Cliquez sur + pour commencer.</div>}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <h2 className="text-xl font-bold flex items-center space-x-2"><VideoIcon className="h-5 w-5 text-blue-500"/> <span>Mes Séries</span></h2>
                     <div className="flex items-center space-x-3">
                        <span className="hidden md:inline text-sm font-mono text-gray-500">{series.length} Séries</span>
                        <button onClick={onOpenSerial} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 shadow-lg transition transform hover:scale-105">
                            <PlusIcon className="h-6 w-6"/>
                        </button>
                     </div>
                </div>

                {series.length === 0 ? (
                    <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500 hover:bg-gray-800/50 transition cursor-pointer" onClick={onOpenSerial}>
                        Vous n'avez pas encore créé de série. Cliquez ici pour lancer Serial Prod.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {series.map(s => (
                            <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 relative">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{s.title}</h3>
                                        <span className="text-xs text-gray-400">{s.episodeCount} épisodes | {new Date(s.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <button className={`text-red-500 hover:text-red-400 transition`} onClick={() => onDelete(s.id)}><TrashIcon className="h-5 w-5"/></button>
                                </div>
                                <div className="grid gap-2 pl-4 border-l-2 border-gray-700">
                                    {s.episodes.map(ep => (
                                        <div key={ep.id} onClick={() => onSelect(ep)} className="flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer group">
                                            <span className="text-sm text-gray-300 group-hover:text-white truncate">{ep.title}</span>
                                            <ArrowRightIcon className="h-4 w-4 text-gray-500"/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
        </div>
    );
};

const AVAILABLE_TONES = ["Personal brand", "Humour", "Energique", "Professionnel", "Critique", "Colere", "Empathie"];
const AVAILABLE_DURATIONS = ["60s", "3-5min", "8-15min"];

const SerialProd: React.FC<{
    user: User;
    onClose: () => void;
    onSaveSeries: (series: Series) => void;
    onNavigateAccount: () => void;
    onNotify: (t: string, m: string) => void;
}> = ({ user, onClose, onSaveSeries, onNavigateAccount, onNotify }) => {
    const [step, setStep] = useState<'config' | 'preview' | 'generating'>('config');
    const [theme, setTheme] = useState('');
    const [config, setConfig] = useState({ 
        niche: user.niche, 
        tone: 'Professionnel', 
        duration: '8-15min', 
        platforms: 'YouTube, TikTok, Instagram',
        goal: '',
        needs: '',
        cta: '',
        count: 5
    });
    const [customTone, setCustomTone] = useState('');
    const [isAddingTone, setIsAddingTone] = useState(false);
    
    const [proposedEpisodes, setProposedEpisodes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const handlePropose = async () => {
         if (!user.isPro) {
             alert("Abonnement WYS Pro+ requis pour Serial Prod.");
             return;
         }
         if (!theme) return alert("Veuillez entrer un thème.");
         setIsLoading(true);
         const episodes = await geminiService.generateSeriesOutlines(theme, config.count, config.tone, config.niche, config.goal);
         setProposedEpisodes(episodes);
         setStep('preview');
         setIsLoading(false);
    }

    const handleGenerateFinal = async () => {
        setIsLoading(true);
        setStep('generating');
        
        const generatedScripts: Script[] = [];
        const seriesId = `series_${Date.now()}`;

        for (let i = 0; i < proposedEpisodes.length; i++) {
            const ep = proposedEpisodes[i];
            const scriptData = await geminiService.generateScript(
                ep.title, 
                config.tone, 
                config.duration, 
                user.youtubeUrl, 
                config.goal, 
                config.needs, 
                config.cta, 
                config.platforms
            );
            if (scriptData) {
                generatedScripts.push({
                    id: `ep_${Date.now()}_${i}`,
                    title: scriptData.title,
                    topic: theme,
                    tone: config.tone,
                    format: config.duration,
                    sections: scriptData.sections || [],
                    createdAt: new Date().toISOString(),
                    youtubeDescription: scriptData.youtubeDescription,
                    hashtags: scriptData.hashtags,
                    niche: config.niche,
                    goal: config.goal,
                    needs: config.needs,
                    cta: config.cta,
                    seriesId: seriesId,
                    socialPosts: scriptData.socialPosts
                });
            }
        }

        const newSeries: Series = {
            id: seriesId,
            title: theme,
            episodeCount: generatedScripts.length,
            niche: config.niche,
            createdAt: new Date().toISOString(),
            episodes: generatedScripts
        };

        onSaveSeries(newSeries);
        setIsLoading(false);
        onNotify("Série Terminée", "Vos scripts sont prêts !");
        onClose();
    }

    return (
        <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col p-6 animate-fade-in overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold">Serial Prod <span className="text-sm bg-yellow-500 text-black px-2 py-0.5 rounded font-bold ml-2">PRO+</span></h2>
                 <button onClick={onClose}><XMarkIcon className="h-6 w-6"/></button>
             </div>
             
             {step === 'config' && (
                 <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Thème de la série</label>
                            <input value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ex: Cuisine pour débutants" className="w-full bg-gray-800 p-3 rounded border border-gray-700"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Nombre d'Épisodes</label>
                            <select value={config.count} onChange={e => setConfig({...config, count: parseInt(e.target.value)})} className="w-full bg-gray-800 rounded border border-gray-700 p-3">
                                {Array.from({length: 18}, (_, i) => i + 3).map(num => (
                                    <option key={num} value={num}>{num} Épisodes</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Niche</label>
                            <input value={config.niche} onChange={e => setConfig({...config, niche: e.target.value})} className="w-full bg-gray-800 p-3 rounded border border-gray-700"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Objectif (But)</label>
                            <input value={config.goal} onChange={e => setConfig({...config, goal: e.target.value})} placeholder="Ex: Vendre une formation..." className="w-full bg-gray-800 p-3 rounded border border-gray-700"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Besoins Spécifiques</label>
                            <input value={config.needs} onChange={e => setConfig({...config, needs: e.target.value})} placeholder="Ex: Mentionner le lien en bio..." className="w-full bg-gray-800 p-3 rounded border border-gray-700"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Call To Action (CTA)</label>
                            <input value={config.cta} onChange={e => setConfig({...config, cta: e.target.value})} placeholder="Ex: Abonnez-vous !" className="w-full bg-gray-800 p-3 rounded border border-gray-700"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Plateformes</label>
                            <input value={config.platforms} onChange={e => setConfig({...config, platforms: e.target.value})} className="w-full bg-gray-800 p-3 rounded border border-gray-700"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Ton</label>
                            <div className="flex space-x-2">
                                <select value={config.tone} onChange={e => setConfig({...config, tone: e.target.value})} className="flex-1 bg-gray-800 rounded border border-gray-700 p-3">
                                    {AVAILABLE_TONES.map(t => <option key={t}>{t}</option>)}
                                    {customTone && <option>{customTone}</option>}
                                </select>
                                <button onClick={() => setIsAddingTone(!isAddingTone)} className="bg-gray-700 p-3 rounded hover:bg-gray-600"><PlusIcon className="h-6 w-6"/></button>
                            </div>
                            {isAddingTone && (
                                <div className="mt-2 flex space-x-2">
                                    <input value={customTone} onChange={e => setCustomTone(e.target.value)} placeholder="Nouveau ton..." className="flex-1 bg-gray-900 border border-gray-700 p-2 rounded text-sm"/>
                                    <button onClick={() => { setConfig({...config, tone: customTone}); setIsAddingTone(false); }} className="bg-brand-purple px-3 rounded text-sm font-bold">OK</button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Durée</label>
                            <select value={config.duration} onChange={e => setConfig({...config, duration: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-3">
                                {AVAILABLE_DURATIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <Button onClick={handlePropose} isLoading={isLoading} className="py-4 text-lg">Proposer les Épisodes</Button>
                 </>
             )}

             {step === 'preview' && (
                 <div className="space-y-4">
                     <h3 className="font-bold text-lg mb-4">Proposition de l'IA ({proposedEpisodes.length} épisodes)</h3>
                     <div className="grid gap-3 mb-6">
                         {proposedEpisodes.map((ep, i) => (
                             <div key={i} className="bg-gray-800 p-4 rounded border border-gray-700">
                                 <span className="font-bold text-brand-purple mr-2">Ep {i+1}:</span>
                                 <span className="font-bold text-white">{ep.title}</span>
                                 <p className="text-sm text-gray-400 mt-1">{ep.summary}</p>
                             </div>
                         ))}
                     </div>
                     <div className="flex space-x-4">
                         <Button onClick={handleGenerateFinal} isLoading={isLoading} className="flex-1 py-3 text-lg">Générer les Scripts</Button>
                         <Button onClick={() => setStep('config')} variant="secondary">Modifier</Button>
                     </div>
                 </div>
             )}

             {step === 'generating' && (
                 <div className="flex-1 flex flex-col items-center justify-center text-center">
                     <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-purple mb-4"></div>
                     <h3 className="text-xl font-bold mb-2">Génération de la série en cours...</h3>
                     <p className="text-gray-400">L'IA rédige les scripts complets pour chaque épisode. Cela peut prendre une minute.</p>
                 </div>
             )}
        </div>
    )
}

const Studio: React.FC<{ 
    scripts: Script[], 
    selectedScript: Script | null, 
    onUpdate: (s: Script) => void, 
    onBack: () => void,
    onGenerate: (config: any) => Promise<void>, 
    isGenerating: boolean,
    user: User
}> = ({ scripts, selectedScript, onUpdate, onBack, onGenerate, isGenerating, user }) => {
     const [config, setConfig] = useState({ 
         topic: '', 
         niche: user.niche, 
         tone: 'Professionnel', 
         duration: '8-15min', 
         platforms: 'YouTube, TikTok, Instagram',
         goal: '',
         needs: '',
         cta: ''
     });
     const [customTone, setCustomTone] = useState('');
     const [isAddingTone, setIsAddingTone] = useState(false);
     const [showConfigMobile, setShowConfigMobile] = useState(false);
     const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);

     useEffect(() => {
         // Show config initially if script has no sections, but only if we are not generating
         if (selectedScript && !selectedScript.sections.length && selectedScript.topic && !isGenerating) {
             setConfig(prev => ({
                 ...prev,
                 topic: selectedScript.topic,
                 goal: selectedScript.goal || prev.goal,
                 needs: selectedScript.needs || prev.needs,
                 cta: selectedScript.cta || prev.cta
             }));
             setShowConfigMobile(true);
         } else if (selectedScript && selectedScript.sections.length > 0) {
             setShowConfigMobile(false);
         }
     }, [selectedScript, isGenerating]);

     const handleGeneratePosts = async () => {
         if(!selectedScript) return;
         setIsGeneratingPosts(true);
         const fullContent = selectedScript.sections.map(s => s.content).join(' ');
         const posts = await geminiService.generateSocialPosts(selectedScript.title, fullContent, config.platforms);
         if(posts && posts.length > 0) {
             onUpdate({...selectedScript, socialPosts: posts});
         }
         setIsGeneratingPosts(false);
     };

     const handleDownloadPDF = () => {
        if (!selectedScript) return;
        const doc = new jsPDF();
        
        let yPos = 20;
        const pageHeight = 297; // A4 height in mm
        const marginBottom = 20;
        
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text(selectedScript.title, 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Topic: ${selectedScript.topic} | Tone: ${selectedScript.tone}`, 20, yPos);
        yPos += 10;
        
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos);
        yPos += 10;

        selectedScript.sections.forEach((section) => {
            // Check title space
            if (yPos > pageHeight - marginBottom) { doc.addPage(); yPos = 20; }
            
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(`${section.title} (${section.estimatedTime})`, 20, yPos);
            yPos += 8;
            
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(60, 60, 60);
            
            // Clean content from Markdown-like bold marks
            const cleanContent = section.content.replace(/\*\*/g, '');
            const splitText = doc.splitTextToSize(cleanContent, 170);
            
            // Print line by line to handle page breaks accurately
            for (let i = 0; i < splitText.length; i++) {
                if (yPos > pageHeight - marginBottom) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(splitText[i], 20, yPos);
                yPos += 6; // Line height
            }
            
            // Visual Note in PDF
            if (section.visualNote) {
                yPos += 5;
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 150);
                doc.setFont("helvetica", "italic");
                const noteText = doc.splitTextToSize(`[Visual: ${section.visualNote}]`, 170);
                for (let i = 0; i < noteText.length; i++) {
                    if (yPos > pageHeight - marginBottom) { doc.addPage(); yPos = 20; }
                    doc.text(noteText[i], 20, yPos);
                    yPos += 5;
                }
            }
            yPos += 5; // Paragraph spacing
        });

        if (selectedScript.socialPosts && selectedScript.socialPosts.length > 0) {
             doc.addPage();
             yPos = 20;
             doc.setFontSize(18);
             doc.setFont("helvetica", "bold");
             doc.text("Campaign Social Posts", 20, yPos);
             yPos += 15;

             selectedScript.socialPosts.forEach(post => {
                 if(yPos > pageHeight - marginBottom) { doc.addPage(); yPos = 20; }
                 doc.setFontSize(12);
                 doc.setTextColor(0, 0, 200); // Blue
                 doc.text(`Platform: ${post.platform}`, 20, yPos);
                 yPos += 7;
                 
                 doc.setFontSize(11);
                 doc.setTextColor(60, 60, 60);
                 const contentLines = doc.splitTextToSize(post.content, 170);
                 
                 for(let i=0; i<contentLines.length; i++) {
                     if (yPos > pageHeight - marginBottom) { doc.addPage(); yPos = 20; }
                     doc.text(contentLines[i], 20, yPos);
                     yPos += 5;
                 }
                 
                 // Visual Note for Social Post
                 if(post.visualNote) {
                     yPos += 3;
                     doc.setFontSize(10);
                     doc.setTextColor(100, 100, 150);
                     const vNote = doc.splitTextToSize(`[Visual Asset: ${post.visualNote}]`, 170);
                     for(let i=0; i<vNote.length; i++) {
                         if (yPos > pageHeight - marginBottom) { doc.addPage(); yPos = 20; }
                         doc.text(vNote[i], 20, yPos);
                         yPos += 5;
                     }
                 }

                 yPos += 5;
                 
                 doc.setTextColor(150, 150, 150);
                 const tags = doc.splitTextToSize(post.hashtags.join(' '), 170);
                 for(let i=0; i<tags.length; i++) {
                     if (yPos > pageHeight - marginBottom) { doc.addPage(); yPos = 20; }
                     doc.text(tags[i], 20, yPos);
                     yPos += 5;
                 }
                 yPos += 10;
             });
        }
        
        doc.save(`${selectedScript.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
     }

     if (!selectedScript) {
         return (
             <div className="h-full flex overflow-hidden animate-fade-in">
                  <div className="w-full md:w-80 bg-gray-900 border-r border-gray-800 flex flex-col p-6 space-y-6 overflow-y-auto">
                     <h2 className="font-bold text-lg mb-4">Studio Config</h2>
                     <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Sujet</label>
                            <textarea value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1 h-20" placeholder="Sujet de la vidéo..."/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Objectif (But)</label>
                            <input value={config.goal} onChange={e => setConfig({...config, goal: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Besoins</label>
                            <input value={config.needs} onChange={e => setConfig({...config, needs: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">CTA</label>
                            <input value={config.cta} onChange={e => setConfig({...config, cta: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1"/>
                        </div>
                        
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Ton</label>
                            <div className="flex space-x-1 mt-1">
                                <select value={config.tone} onChange={e => setConfig({...config, tone: e.target.value})} className="flex-1 bg-gray-800 rounded border border-gray-700 p-2 text-sm">
                                    {AVAILABLE_TONES.map(t => <option key={t}>{t}</option>)}
                                    {customTone && <option>{customTone}</option>}
                                </select>
                                <button onClick={() => setIsAddingTone(!isAddingTone)} className="bg-gray-700 px-2 rounded hover:bg-gray-600"><PlusIcon className="h-4 w-4"/></button>
                            </div>
                            {isAddingTone && (
                                <div className="mt-2 flex space-x-2">
                                    <input value={customTone} onChange={e => setCustomTone(e.target.value)} placeholder="Nouveau ton..." className="flex-1 bg-gray-900 border border-gray-700 p-1 rounded text-xs"/>
                                    <button onClick={() => { setConfig({...config, tone: customTone}); setIsAddingTone(false); }} className="bg-brand-purple px-2 rounded text-xs font-bold">OK</button>
                                </div>
                            )}
                        </div>

                         <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Durée</label>
                            <select value={config.duration} onChange={e => setConfig({...config, duration: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1">
                                {AVAILABLE_DURATIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Plateformes</label>
                            <input value={config.platforms} onChange={e => setConfig({...config, platforms: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1"/>
                        </div>
                     </div>

                     <Button onClick={() => onGenerate(config)} isLoading={isGenerating}>Générer Script</Button>
                     <Button variant="secondary" onClick={onBack}>Annuler</Button>
                  </div>
                  <div className="hidden md:flex flex-1 bg-gray-800 items-center justify-center text-gray-500">
                      <div className="text-center">
                          <PencilSquareIcon className="h-16 w-16 mx-auto mb-4 opacity-20"/>
                          <p>Configurez votre script à gauche pour commencer.</p>
                      </div>
                  </div>
             </div>
         )
     }

     return (
         <div className="h-full flex overflow-hidden animate-fade-in relative">
             <div className={`${showConfigMobile ? 'absolute inset-0 z-30 bg-gray-900' : 'hidden'} md:block md:static md:w-80 md:bg-gray-900 md:border-r border-gray-800 p-6 overflow-y-auto`}>
                 <div className="flex justify-between items-center mb-4">
                    <button onClick={onBack} className="text-sm text-gray-400">&larr; Retour</button>
                    {showConfigMobile && <button onClick={() => setShowConfigMobile(false)} className="md:hidden"><XMarkIcon className="h-6 w-6"/></button>}
                 </div>
                 <h2 className="font-bold mb-4 truncate">{selectedScript.title}</h2>
                 <div className="text-xs text-gray-400 space-y-2">
                     <p><strong>Goal:</strong> {selectedScript.goal || '-'}</p>
                     <p><strong>Needs:</strong> {selectedScript.needs || '-'}</p>
                     <p><strong>CTA:</strong> {selectedScript.cta || '-'}</p>
                 </div>
                 <div className="mt-8 pt-4 border-t border-gray-700">
                     <Button onClick={handleDownloadPDF} variant="secondary" className="w-full flex items-center justify-center">
                         <DocumentArrowDownIcon className="h-5 w-5 mr-2"/> Télécharger PDF
                     </Button>
                 </div>
             </div>
             <div className="flex-1 bg-gray-800 overflow-y-auto p-4 md:p-8 scroll-smooth">
                 <div className="flex justify-between items-start mb-6">
                    <input value={selectedScript.title} onChange={e => onUpdate({...selectedScript, title: e.target.value})} className="text-2xl md:text-3xl font-bold bg-transparent w-full mr-2"/>
                    <button onClick={() => setShowConfigMobile(true)} className="md:hidden p-2 bg-gray-700 rounded"><PencilSquareIcon className="h-5 w-5"/></button>
                 </div>
                 <div className="space-y-4">
                     {selectedScript.sections.length === 0 && (
                        <div className="text-gray-400 p-8 border border-dashed border-gray-600 rounded text-center">
                            <p className="mb-4">Contenu vide ou incomplet.</p>
                            <Button onClick={() => onGenerate(config)} isLoading={isGenerating}>Régénérer le Script</Button>
                        </div>
                     )}
                     {selectedScript.sections.map((section, idx) => (
                         <div key={idx} className="bg-gray-900 border border-gray-700 rounded-xl p-3 md:p-5">
                             <div className="flex justify-between mb-2">
                                <span className="font-bold text-brand-purple text-sm md:text-base">{section.title}</span>
                                <span className="text-xs text-gray-500">{section.estimatedTime}</span>
                             </div>
                             <MarkdownEditor value={section.content} onChange={val => {
                                 const newSections = [...selectedScript.sections];
                                 newSections[idx] = {...section, content: val};
                                 onUpdate({...selectedScript, sections: newSections});
                             }}/>
                             {section.visualNote && (
                                 <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800 rounded text-xs text-blue-300 italic">
                                     <strong>Visual Note:</strong> {section.visualNote}
                                 </div>
                             )}
                         </div>
                     ))}

                     {/* Social Posts Section */}
                     <div className="mt-8 pt-8 border-t border-gray-700">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xl font-bold flex items-center"><ShareIcon className="h-5 w-5 mr-2 text-green-400"/> Mes Posts</h3>
                             <Button onClick={handleGeneratePosts} isLoading={isGeneratingPosts} className="text-sm py-1 px-3">Générer Posts</Button>
                         </div>
                         {!selectedScript.socialPosts && <p className="text-gray-500 italic text-sm">Aucun post généré.</p>}
                         <div className="grid gap-4 md:grid-cols-2">
                             {selectedScript.socialPosts?.map((post, i) => (
                                 <div key={i} className="bg-gray-900 border border-gray-700 p-4 rounded-xl">
                                     <span className="text-xs font-bold uppercase text-brand-blue mb-2 block">{post.platform}</span>
                                     <p className="text-sm text-gray-300 mb-3 whitespace-pre-wrap">{post.content}</p>
                                     {post.visualNote && <p className="text-xs text-blue-300 italic mb-2">[Asset: {post.visualNote}]</p>}
                                     <div className="text-xs text-blue-400">{post.hashtags.join(' ')}</div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
         </div>
     )
}

interface WorkspaceProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onNavigateAccount: () => void;
    onLogout: () => void;
    pendingGenConfig: any;
    clearPendingConfig: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ user, onUpdateUser, onNavigateAccount, onLogout, pendingGenConfig, clearPendingConfig }) => {
    const [screen, setScreen] = useState<'dashboard' | 'studio'>('dashboard');
    const [scripts, setScripts] = useState<Script[]>([]);
    const [series, setSeries] = useState<Series[]>([]);
    const [selectedScript, setSelectedScript] = useState<Script | null>(null);
    const [showSerialModal, setShowSerialModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Chat
    const [showChat, setShowChat] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isChatProcessing, setIsChatProcessing] = useState(false);
    const chatClientRef = useRef<Chat | null>(null);

    // Notifications
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        const savedScripts = localStorage.getItem('wyslider_scripts');
        if (savedScripts) setScripts(JSON.parse(savedScripts));
        
        const savedSeries = localStorage.getItem('wyslider_series');
        if (savedSeries) setSeries(JSON.parse(savedSeries));

        const savedChats = localStorage.getItem('wyslider_chats');
        if (savedChats) setChatSessions(JSON.parse(savedChats));
    }, []);

    useEffect(() => {
        if (pendingGenConfig) {
            handleGenerateScript(pendingGenConfig);
            clearPendingConfig();
        }
    }, [pendingGenConfig]);

    const addNotification = (title: string, message: string, type: 'info'|'success'|'warning' = 'info') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, title, message, type, read: false, timestamp: new Date().toISOString() }]);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const saveScripts = (newScripts: Script[]) => {
        setScripts(newScripts);
        localStorage.setItem('wyslider_scripts', JSON.stringify(newScripts));
    };

    const saveSeries = (newSeries: Series[]) => {
        setSeries(newSeries);
        localStorage.setItem('wyslider_series', JSON.stringify(newSeries));
    };
    
    const saveChats = (newChats: ChatSession[]) => {
        setChatSessions(newChats);
        localStorage.setItem('wyslider_chats', JSON.stringify(newChats));
    };

    const handleDeleteScript = (id: string) => {
        if(!window.confirm("Supprimer ce script ?")) return;
        const updated = scripts.filter(s => s.id !== id);
        saveScripts(updated);
        if (selectedScript?.id === id) {
            setSelectedScript(null);
            setScreen('dashboard');
        }
    };

    const handleBulkDelete = (ids: string[]) => {
        if(!window.confirm(`Supprimer ${ids.length} scripts ?`)) return;
        const updated = scripts.filter(s => !ids.includes(s.id));
        saveScripts(updated);
    };

    const handleBulkShare = (ids: string[]) => {
         const updated = scripts.map(s => ids.includes(s.id) ? {...s, isTemplate: true} : s);
         saveScripts(updated);
         addNotification("Partage réussi", `${ids.length} templates partagés avec la communauté !`, "success");
    };
    
    const handleDeleteSeries = (id: string) => {
        if(!window.confirm("Supprimer cette série et tous ses épisodes ?")) return;
        const targetSeries = series.find(s => s.id === id);
        const updatedSeries = series.filter(s => s.id !== id);
        saveSeries(updatedSeries);
        
        if (targetSeries) {
            const epIds = targetSeries.episodes.map(e => e.id);
            const updatedScripts = scripts.filter(s => !epIds.includes(s.id));
            saveScripts(updatedScripts);
        }
    };

    const handleGenerateScript = async (config: any) => {
        if (user.generationsLeft <= 0 && !user.isPro) {
            alert("Plus de crédits. Passez à la version Pro ou partagez l'app !");
            return;
        }

        setIsGenerating(true);
        // Create skeleton script
        const tempId = selectedScript?.id || `script_${Date.now()}`;
        const isNew = !selectedScript;
        
        if (isNew) {
            const newScript: Script = {
                id: tempId,
                title: config.topic || "Nouveau Script",
                topic: config.topic,
                tone: config.tone,
                format: config.duration,
                sections: [],
                createdAt: new Date().toISOString(),
                niche: config.niche,
                goal: config.goal,
                needs: config.needs,
                cta: config.cta,
                isTemplate: false
            };
            setSelectedScript(newScript);
            setScreen('studio');
        }

        const result = await geminiService.generateScript(
            config.topic, 
            config.tone, 
            config.duration, 
            user.youtubeUrl, 
            config.goal, 
            config.needs, 
            config.cta, 
            config.platforms
        );

        if (result) {
            const finalScript: Script = {
                id: tempId,
                title: result.title || config.topic,
                topic: config.topic,
                tone: config.tone,
                format: config.duration,
                sections: result.sections,
                createdAt: new Date().toISOString(),
                youtubeDescription: result.youtubeDescription,
                hashtags: result.hashtags,
                niche: config.niche,
                goal: config.goal,
                needs: config.needs,
                cta: config.cta,
                socialPosts: result.socialPosts
            };

            const updatedScripts = isNew 
                ? [finalScript, ...scripts]
                : scripts.map(s => s.id === tempId ? finalScript : s);
            
            saveScripts(updatedScripts);
            setSelectedScript(finalScript);
            onUpdateUser({...user, generationsLeft: user.generationsLeft - 1});
            addNotification("Génération Terminée", "Votre script est prêt !", "success");
        } else {
            addNotification("Erreur", "L'IA n'a pas pu générer le script. Réessayez.", "warning");
        }
        setIsGenerating(false);
    };

    const handleUpdateScript = (updated: Script) => {
        setSelectedScript(updated);
        const newScripts = scripts.map(s => s.id === updated.id ? updated : s);
        saveScripts(newScripts);
    };

    // Chat Logic
    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'Nouvelle discussion',
            messages: [],
            createdAt: new Date().toISOString()
        };
        saveChats([newSession, ...chatSessions]);
        setActiveChatId(newSession.id);
        
        // Context for chat
        const context = selectedScript ? `Working on script: ${selectedScript.title}\nContent: ${selectedScript.sections.map(s => s.content).join(' ')}` : `User Dashboard. Niche: ${user.niche}`;
        chatClientRef.current = geminiService.startChatSession(context);
    };

    const handleSendMessage = async (msg: string) => {
        if (!activeChatId) handleNewChat();
        
        const currentSessionId = activeChatId || chatSessions[0]?.id; // Fallback handled by handleNewChat effectively but sync is tricky
        // If we just called handleNewChat, activeChatId state update might not be flushed.
        // Better to check if chatClientRef is active or just ensure session exists.
        
        // Simple approach: if no session, create one immediately
        let session = chatSessions.find(s => s.id === activeChatId);
        let sessionId = activeChatId;

        if (!session) {
             const newSession: ChatSession = {
                id: Date.now().toString(),
                title: msg.substring(0, 30) + '...',
                messages: [],
                createdAt: new Date().toISOString()
            };
            session = newSession;
            sessionId = newSession.id;
            const updatedSessions = [newSession, ...chatSessions];
            saveChats(updatedSessions);
            setActiveChatId(sessionId);
            
            const context = selectedScript ? `Working on script: ${selectedScript.title}` : `User Dashboard. Niche: ${user.niche}`;
            chatClientRef.current = geminiService.startChatSession(context);
        }

        // Add User Message
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date().toISOString() };
        const updatedMsgs = [...session.messages, userMsg];
        const updatedSession = { ...session, messages: updatedMsgs };
        saveChats(chatSessions.map(s => s.id === sessionId ? updatedSession : s));
        
        setIsChatProcessing(true);
        
        if (!chatClientRef.current) {
             const context = selectedScript ? `Working on script: ${selectedScript.title}` : `User Dashboard. Niche: ${user.niche}`;
             chatClientRef.current = geminiService.startChatSession(context);
             // Replay history if needed, but for now simplified
        }

        const response = await geminiService.sendMessageToChat(chatClientRef.current!, msg);
        
        const modelMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', content: response, timestamp: new Date().toISOString() };
        const finalMsgs = [...updatedMsgs, modelMsg];
        const finalSession = { ...updatedSession, messages: finalMsgs };
        saveChats(chatSessions.map(s => s.id === sessionId ? finalSession : s));
        
        setIsChatProcessing(false);
    };

    return (
        <MainLayout user={user} onLogout={onLogout} onNavigateToAccount={onNavigateAccount}>
            {notifications.map(n => (
                <NotificationToast key={n.id} notification={n} onClose={removeNotification} />
            ))}

            {screen === 'dashboard' && (
                <Dashboard 
                    scripts={scripts} 
                    series={series}
                    onSelect={(s) => { setSelectedScript(s); setScreen('studio'); }} 
                    onDelete={handleDeleteScript}
                    onBulkDelete={handleBulkDelete}
                    onBulkShare={handleBulkShare}
                    onOpenStudio={() => { setSelectedScript(null); setScreen('studio'); }}
                    onOpenSerial={() => setShowSerialModal(true)}
                />
            )}

            {screen === 'studio' && (
                <Studio 
                    scripts={scripts}
                    selectedScript={selectedScript}
                    onUpdate={handleUpdateScript}
                    onBack={() => setScreen('dashboard')}
                    onGenerate={handleGenerateScript}
                    isGenerating={isGenerating}
                    user={user}
                />
            )}

            {showSerialModal && (
                <SerialProd 
                    user={user}
                    onClose={() => setShowSerialModal(false)}
                    onSaveSeries={(newSeries) => {
                        saveSeries([newSeries, ...series]);
                        saveScripts([...newSeries.episodes, ...scripts]);
                    }}
                    onNavigateAccount={onNavigateAccount}
                    onNotify={(t, m) => addNotification(t, m, 'success')}
                />
            )}

            <ChatOverlay 
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                sessions={chatSessions}
                activeSessionId={activeChatId}
                onNewChat={handleNewChat}
                onSelectSession={(id) => setActiveChatId(id)}
                onDeleteSession={(id) => {
                    const updated = chatSessions.filter(s => s.id !== id);
                    saveChats(updated);
                    if(activeChatId === id) setActiveChatId(null);
                }}
                onDeleteAllHistory={() => {
                    saveChats([]);
                    setActiveChatId(null);
                }}
                onSendMessage={handleSendMessage}
                isProcessing={isChatProcessing}
            />

            {/* Chat Trigger */}
            <button 
                onClick={() => setShowChat(true)}
                className="fixed bottom-6 right-6 p-4 bg-brand-purple hover:bg-purple-600 text-white rounded-full shadow-2xl z-40 transition transform hover:scale-110"
            >
                <ChatBubbleLeftRightIcon className="h-6 w-6"/>
            </button>
        </MainLayout>
    );
};
