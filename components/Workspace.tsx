

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Script, ChatSession, ChatMessage, AppNotification, CalendarEvent, BrandPitch, Series } from '../types';
import { Button } from './Button';
import { PlusIcon, VideoIcon, TrashIcon, ShareIcon, PencilSquareIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon, Bars3Icon, CalendarIcon, TrendingUpIcon, ChartPieIcon, CurrencyDollarIcon, RobotIcon, ArrowDownTrayIcon, ArrowRightIcon, UserIcon, XMarkIcon, BellIcon, CloudIcon, ClockIcon, BoldIcon, ItalicIcon, ListBulletIcon, EyeIcon, PlayIcon, DocumentArrowDownIcon, Squares2x2Icon, CheckIcon, SparklesIcon } from './icons';
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
        <div className={`fixed bottom-4 right-4 max-w-sm w-full bg-white dark:bg-gray-800 border-l-4 ${notification.type === 'success' ? 'border-green-500' : 'border-blue-500'} rounded shadow-2xl p-4 flex items-start animate-fade-in z-[60]`}>
            <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-200">{notification.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
            </div>
            <button onClick={() => onClose(notification.id)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white ml-3"><XMarkIcon className="h-4 w-4"/></button>
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
    }, [activeSession?.messages, isProcessing]);

    const handleSend = () => {
        if(!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 md:inset-auto md:inset-y-0 md:right-0 md:w-96 max-w-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 z-[70] flex flex-col">
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-900">
                <div className="flex items-center space-x-2">
                    <button onClick={() => setView('history')} className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${view === 'history' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`} title="History">
                        <ClockIcon className="h-5 w-5"/>
                    </button>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">AI Assistant</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-white"><XMarkIcon className="h-6 w-6"/></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative">
                {view === 'history' ? (
                    <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
                        <Button onClick={() => { onNewChat(); setView('chat'); }} className="w-full mb-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">+ New Chat</Button>
                        {sessions.length === 0 && <p className="text-center text-gray-500 mt-10">No history.</p>}
                        {sessions.map(session => (
                            <div key={session.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-purple dark:hover:border-brand-purple group cursor-pointer" onClick={() => onSelectSession(session.id)}>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-200 truncate pr-2">{session.title}</h4>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} 
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <TrashIcon className="h-4 w-4"/>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{new Date(session.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                        {sessions.length > 0 && (
                            <button onClick={() => { if(window.confirm("Delete all?")) onDeleteAllHistory(); }} className="w-full text-xs text-red-500 hover:text-red-400 mt-8 underline">
                                Delete All History
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                            {!activeSession && <div className="text-center text-gray-500 mt-10">Start a new chat.</div>}
                            {activeSession?.messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-purple text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isProcessing && activeSession?.messages[activeSession.messages.length - 1]?.role === 'user' && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-2 text-sm text-gray-400 flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
                            <div className="flex space-x-2">
                                <input 
                                    value={input} 
                                    onChange={e => setInput(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask anything..." 
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full px-4 py-3 text-sm focus:ring-1 focus:ring-brand-purple outline-none text-gray-900 dark:text-white placeholder-gray-500"
                                />
                                <button onClick={handleSend} disabled={isProcessing} className="bg-brand-purple text-white p-2.5 rounded-full hover:bg-purple-600 disabled:opacity-50 flex-shrink-0">
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

const ScriptPreview: React.FC<{ 
    content: string, 
    visualNote?: string, 
    onEdit: (newContent: string) => void,
    title: string,
    time: string 
}> = ({ content, visualNote, onEdit, title, time }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(content);

    const handleSave = () => {
        onEdit(editValue);
        setIsEditing(false);
    };

    // Format Markdown to cleaner HTML-like preview
    const formattedContent = useMemo(() => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-gray-600 dark:text-gray-300">$1</em>')
            .replace(/\[Visual: (.*?)\]/g, '') // Remove inline visuals from speech text, handle separately if needed
            .replace(/\[(.*?)\]/g, '<span class="text-green-600 dark:text-green-400 text-xs uppercase font-bold tracking-wider">[$1]</span>');
    }, [content]);

    if (isEditing) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-4 shadow-lg">
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">Editing...</span>
                </div>
                <textarea 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full h-40 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded border border-gray-300 dark:border-gray-700 focus:border-brand-purple outline-none"
                />
                <div className="flex justify-end space-x-2 mt-3">
                    <Button variant="secondary" onClick={() => setIsEditing(false)} className="text-xs py-1">Cancel</Button>
                    <Button onClick={handleSave} className="text-xs py-1">Save</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group mb-6">
            <div className="absolute -left-3 top-6 bottom-6 w-0.5 bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                    <div className="bg-gray-100 dark:bg-gray-800 text-brand-purple text-xs font-bold px-2 py-1 rounded border border-gray-300 dark:border-gray-700 shadow-sm whitespace-nowrap">
                        {time}
                    </div>
                </div>
                
                <div className="flex-1">
                    <div className="bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 rounded-xl p-5 shadow-sm hover:border-gray-400 dark:hover:border-gray-600 transition group-hover:shadow-md cursor-pointer" onClick={() => setIsEditing(true)}>
                        <h4 className="text-brand-purple font-bold text-lg mb-3 tracking-tight">{title}</h4>
                        
                        <div className="text-gray-700 dark:text-gray-300 text-base leading-relaxed font-serif" dangerouslySetInnerHTML={{ __html: formattedContent }} />
                        
                        {visualNote && (
                            <div className="mt-4 flex items-start p-3 bg-green-50 dark:bg-gray-900/50 border-l-2 border-green-500 rounded-r-lg">
                                <EyeIcon className="h-4 w-4 text-green-600 dark:text-green-500 mt-1 mr-2 flex-shrink-0"/>
                                <span className="text-sm text-gray-600 dark:text-gray-400 italic font-sans">{visualNote}</span>
                            </div>
                        )}
                        
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                            <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"><PencilSquareIcon className="h-4 w-4"/></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

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

    const soloScriptsCount = scripts.filter(s => !s.seriesId).length;

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 animate-fade-in scroll-smooth bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
             <div className="max-w-6xl mx-auto space-y-8 pb-20">
                <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative z-20">
                    <div className="flex-1 relative">
                        <input type="text" placeholder="Search..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg py-2 px-4 text-sm focus:ring-1 focus:ring-brand-purple outline-none text-gray-900 dark:text-white transition-colors duration-300"/>
                    </div>
                    <div className="flex space-x-2">
                        {selectionMode ? (
                             <div className="flex space-x-2">
                                <button onClick={() => handleBulkAction('delete')} className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900 border border-red-200 dark:border-red-800" title="Delete Selection"><TrashIcon className="h-5 w-5"/></button>
                                <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                             </div>
                        ) : (
                            <button onClick={() => setSelectionMode(true)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" title="Select...">
                                <Bars3Icon className="h-5 w-5"/>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center space-x-2 text-gray-900 dark:text-white"><PencilSquareIcon className="h-5 w-5 text-brand-purple"/> <span>My Scripts</span></h2>
                    <div className="flex items-center space-x-3">
                         <span className="text-sm font-mono text-gray-500">{soloScriptsCount} Scripts</span>
                         <button onClick={onOpenStudio} className="bg-brand-purple hover:bg-purple-600 text-white rounded-full p-2 shadow-lg transition transform hover:scale-105">
                            <PlusIcon className="h-6 w-6"/>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scripts.filter(s => !s.seriesId).map(script => (
                         <div 
                             key={script.id} 
                             onClick={() => selectionMode ? toggleSelection(script.id) : onSelect(script)} 
                             className={`group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border cursor-pointer transition relative ${selectionMode && selectedIds.has(script.id) ? 'border-brand-purple ring-1 ring-brand-purple' : 'border-gray-200 dark:border-gray-700 hover:border-brand-purple dark:hover:border-brand-purple'}`}
                         >
                             <div className="h-32 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                                 <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
                                     <span className="text-4xl font-black opacity-20">WYS</span>
                                 </div>
                                 {selectionMode && (
                                     <div className="absolute top-2 right-2">
                                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedIds.has(script.id) ? 'bg-brand-purple border-brand-purple' : 'border-gray-400 bg-white dark:bg-gray-800'}`}>
                                             {selectedIds.has(script.id) && <CheckIcon className="h-4 w-4 text-white"/>}
                                         </div>
                                     </div>
                                 )}
                             </div>
                             <div className="p-4">
                                 <div className="flex justify-between items-start mb-2">
                                     <h3 className="font-bold truncate pr-2 text-gray-900 dark:text-white">{script.title}</h3>
                                     {script.isTemplate && <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">TEMPLATE</span>}
                                 </div>
                                 <p className="text-xs text-gray-500 mb-2 truncate">{script.youtubeDescription || "No description"}</p>
                                 <div className="flex justify-between items-center text-xs text-gray-400">
                                     <span>{new Date(script.createdAt).toLocaleDateString()}</span>
                                     <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{script.niche || "General"}</span>
                                 </div>
                             </div>
                         </div>
                    ))}
                    {scripts.length === 0 && series.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">No scripts yet.</div>}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold flex items-center space-x-2 text-gray-900 dark:text-white"><VideoIcon className="h-5 w-5 text-blue-500"/> <span>My Series</span></h2>
                     <div className="flex items-center space-x-3">
                        <span className="hidden md:inline text-sm font-mono text-gray-500">{series.length} Series</span>
                        <button onClick={onOpenSerial} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 shadow-lg transition transform hover:scale-105">
                            <PlusIcon className="h-6 w-6"/>
                        </button>
                     </div>
                </div>

                {series.length === 0 ? (
                    <div className="bg-gray-100 dark:bg-gray-800/30 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800/50 transition cursor-pointer" onClick={onOpenSerial}>
                        No series yet. Click to launch Serial Prod.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {series.map(s => (
                            <div key={s.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 relative">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{s.title}</h3>
                                        <span className="text-xs text-gray-500">{s.episodeCount} episodes | {new Date(s.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <button className={`text-red-500 hover:text-red-400 transition`} onClick={() => onDelete(s.id)}><TrashIcon className="h-5 w-5"/></button>
                                </div>
                                <div className="grid gap-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                    {s.episodes.map(ep => (
                                        <div key={ep.id} onClick={() => onSelect(ep)} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group">
                                            <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white truncate">{ep.title}</span>
                                            <ArrowRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500"/>
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

const AVAILABLE_TONES = ["Personal brand", "Humour", "Energetic", "Professional", "Critical", "Angry", "Empathetic"];
const AVAILABLE_DURATIONS = ["60s", "3-5min", "8-15min"];
const AVAILABLE_STRATEGIES = ["Standard", "Retention Beast", "The Storyteller", "The Educator", "The Salesman"];

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
        tone: 'Professional', 
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
             alert("WYS Pro+ required for Serial Prod.");
             return;
         }
         if (!theme) return alert("Please enter a theme.");
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
                config.platforms,
                user.styleDNA // Pass styleDNA
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
        onNotify("Series Complete", "Your scripts are ready!");
        onClose();
    }

    return (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col p-6 animate-fade-in overflow-y-auto text-gray-900 dark:text-white transition-colors duration-300">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold">Serial Prod <span className="text-sm bg-yellow-500 text-black px-2 py-0.5 rounded font-bold ml-2">PRO+</span></h2>
                 <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><XMarkIcon className="h-6 w-6"/></button>
             </div>
             
             {step === 'config' && (
                 <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Series Theme</label>
                            <input value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ex: Cooking for beginners" className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-brand-purple outline-none transition"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Episode Count</label>
                            <select value={config.count} onChange={e => setConfig({...config, count: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-white outline-none">
                                {Array.from({length: 18}, (_, i) => i + 3).map(num => (
                                    <option key={num} value={num}>{num} Episodes</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Niche</label>
                            <input value={config.niche} onChange={e => setConfig({...config, niche: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-brand-purple outline-none transition"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Goal</label>
                            <input value={config.goal} onChange={e => setConfig({...config, goal: e.target.value})} placeholder="Ex: Sell course..." className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-brand-purple outline-none transition"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Needs</label>
                            <input value={config.needs} onChange={e => setConfig({...config, needs: e.target.value})} placeholder="Ex: Mention bio link..." className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-brand-purple outline-none transition"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">CTA</label>
                            <input value={config.cta} onChange={e => setConfig({...config, cta: e.target.value})} placeholder="Ex: Subscribe!" className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-brand-purple outline-none transition"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Platforms</label>
                            <input value={config.platforms} onChange={e => setConfig({...config, platforms: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-brand-purple outline-none transition"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Tone</label>
                            <div className="flex space-x-2">
                                <select value={config.tone} onChange={e => setConfig({...config, tone: e.target.value})} className="flex-1 bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-white outline-none">
                                    {AVAILABLE_TONES.map(t => <option key={t}>{t}</option>)}
                                    {customTone && <option>{customTone}</option>}
                                </select>
                                <button onClick={() => setIsAddingTone(!isAddingTone)} className="bg-gray-200 dark:bg-gray-700 p-3 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"><PlusIcon className="h-6 w-6"/></button>
                            </div>
                            {isAddingTone && (
                                <div className="mt-2 flex space-x-2">
                                    <input value={customTone} onChange={e => setCustomTone(e.target.value)} placeholder="New tone..." className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded text-sm text-gray-900 dark:text-white"/>
                                    <button onClick={() => { setConfig({...config, tone: customTone}); setIsAddingTone(false); }} className="bg-brand-purple px-3 rounded text-sm font-bold text-white">OK</button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Duration</label>
                            <select value={config.duration} onChange={e => setConfig({...config, duration: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-white outline-none">
                                {AVAILABLE_DURATIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <Button onClick={handlePropose} isLoading={isLoading} className="py-4 text-lg">Propose Episodes</Button>
                 </>
             )}

             {step === 'preview' && (
                 <div className="space-y-4">
                     <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">AI Proposal ({proposedEpisodes.length} episodes)</h3>
                     <div className="grid gap-3 mb-6">
                         {proposedEpisodes.map((ep, i) => (
                             <div key={i} className="bg-gray-100 dark:bg-gray-800 p-4 rounded border border-gray-300 dark:border-gray-700">
                                 <span className="font-bold text-brand-purple mr-2">Ep {i+1}:</span>
                                 <span className="font-bold text-gray-900 dark:text-white">{ep.title}</span>
                                 <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ep.summary}</p>
                             </div>
                         ))}
                     </div>
                     <div className="flex space-x-4">
                         <Button onClick={handleGenerateFinal} isLoading={isLoading} className="flex-1 py-3 text-lg">Generate Scripts</Button>
                         <Button onClick={() => setStep('config')} variant="secondary">Edit</Button>
                     </div>
                 </div>
             )}

             {step === 'generating' && (
                 <div className="flex-1 flex flex-col items-center justify-center text-center">
                     <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-purple mb-4"></div>
                     <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Generating Series...</h3>
                     <p className="text-gray-500 dark:text-gray-400">The AI is writing full scripts for each episode. This may take a minute.</p>
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
         tone: 'Professional', 
         duration: '8-15min', 
         platforms: 'YouTube, TikTok, Instagram',
         goal: '',
         needs: '',
         cta: '',
         strategy: 'Standard'
     });
     const [customTone, setCustomTone] = useState('');
     const [isAddingTone, setIsAddingTone] = useState(false);
     
     // Layout state for Mobile Sidebar Toggle
     const [isConfigOpen, setIsConfigOpen] = useState(false);
     const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);

     useEffect(() => {
         // Initialize config from existing script if available
         if (selectedScript && !selectedScript.sections.length && selectedScript.topic && !isGenerating) {
             setConfig(prev => ({
                 ...prev,
                 topic: selectedScript.topic,
                 goal: selectedScript.goal || prev.goal,
                 needs: selectedScript.needs || prev.needs,
                 cta: selectedScript.cta || prev.cta,
                 strategy: selectedScript.strategy || prev.strategy
             }));
             // On mobile, auto-open config if script is empty
             if (window.innerWidth < 768) setIsConfigOpen(true);
         }
     }, [selectedScript, isGenerating]);

     const handleGeneratePosts = async () => {
         if(!selectedScript) return;
         setIsGeneratingPosts(true);
         
         try {
             const fullContent = selectedScript.sections.map(s => s.content).join(' ');
             const posts = await geminiService.generateSocialPosts(selectedScript.title, fullContent, config.platforms);
             if(posts && posts.length > 0) {
                 onUpdate({...selectedScript, socialPosts: posts});
             }
         } catch(error: any) {
             console.error("Social post generation failed", error);
             let msg = "Failed to generate posts.";
             if(error.message === "QUOTA_EXCEEDED") msg = "Quota limit reached. Please wait a moment.";
             alert(msg);
         } finally {
             setIsGeneratingPosts(false);
         }
     };

     const handleDownloadPDF = () => {
        if (!selectedScript) return;
        
        try {
            const doc = new jsPDF();
            
            // PDF Styling Colors
            const primaryColor = [79, 70, 229]; // Indigo-600
            const secondaryColor = [107, 114, 128]; // Gray-500
            const blackColor = [0, 0, 0];
            
            let yPos = 20;

            // Title
            doc.setFontSize(22);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont("helvetica", "bold");
            const titleSplit = doc.splitTextToSize(selectedScript.title, 180);
            doc.text(titleSplit, 15, yPos);
            yPos += (10 * titleSplit.length) + 10;

            // Metadata
            doc.setFontSize(10);
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont("helvetica", "normal");
            doc.text(`Format: ${selectedScript.format} | Tone: ${selectedScript.tone}`, 15, yPos);
            yPos += 15;

            // Divider
            doc.setDrawColor(200, 200, 200);
            doc.line(15, yPos, 195, yPos);
            yPos += 10;

            // Sections
            selectedScript.sections.forEach((section) => {
                // Check page break
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                // Section Header
                doc.setFontSize(14);
                doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
                doc.setFont("helvetica", "bold");
                doc.text(`${section.title} (${section.estimatedTime})`, 15, yPos);
                yPos += 8;

                // Section Content
                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                const contentText = section.content.replace(/\*\*/g, '').replace(/\[(.*?)\]/g, 'Visual: $1');
                const splitContent = doc.splitTextToSize(contentText, 180);
                doc.text(splitContent, 15, yPos);
                yPos += (6 * splitContent.length) + 5;

                // Visual Note
                if (section.visualNote) {
                    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                    doc.setFont("helvetica", "italic");
                    const visNote = `Note: ${section.visualNote}`;
                    const splitVis = doc.splitTextToSize(visNote, 180);
                    doc.text(splitVis, 15, yPos);
                    yPos += (6 * splitVis.length) + 5;
                }
                
                yPos += 5; // Extra spacing between sections
            });

            // --- ADD SOCIAL POSTS LOGIC HERE ---
            if (selectedScript.socialPosts && selectedScript.socialPosts.length > 0) {
                 // Check page break for header
                 if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                } else {
                    yPos += 10;
                    doc.setDrawColor(200, 200, 200);
                    doc.line(15, yPos, 195, yPos);
                    yPos += 15;
                }

                doc.setFontSize(18);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setFont("helvetica", "bold");
                doc.text("Social Media Posts", 15, yPos);
                yPos += 15;

                selectedScript.socialPosts.forEach(post => {
                     // Check page break
                    if (yPos > 260) {
                        doc.addPage();
                        yPos = 20;
                    }

                    // Platform
                    doc.setFontSize(12);
                    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.setFont("helvetica", "bold");
                    doc.text(post.platform.toUpperCase(), 15, yPos);
                    yPos += 6;

                    // Content
                    doc.setFontSize(10);
                    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
                    doc.setFont("helvetica", "normal");
                    const splitPost = doc.splitTextToSize(post.content, 180);
                    doc.text(splitPost, 15, yPos);
                    yPos += (5 * splitPost.length) + 4;

                    // Hashtags
                    if (post.hashtags && post.hashtags.length > 0) {
                        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                        const tags = post.hashtags.join(' ');
                        const splitTags = doc.splitTextToSize(tags, 180);
                        doc.text(splitTags, 15, yPos);
                        yPos += (5 * splitTags.length) + 4;
                    }

                    // Visual Note for post
                    if (post.visualNote) {
                         doc.setFont("helvetica", "italic");
                         doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                         const vNote = `Asset: ${post.visualNote}`;
                         const splitV = doc.splitTextToSize(vNote, 180);
                         doc.text(splitV, 15, yPos);
                         yPos += (5 * splitV.length) + 4;
                    }

                    yPos += 8; // Spacing between posts
                });
            }

            doc.save(`${selectedScript.title.substring(0, 20)}_script.pdf`);
        } catch (e) {
            console.error("PDF Error", e);
            alert("Error generating PDF. Please ensure content is loaded.");
        }
     }

     if (!selectedScript) {
         return (
             <div className="h-full flex overflow-hidden animate-fade-in bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                  <div className="w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col p-6 space-y-6 overflow-y-auto">
                     <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Studio Config</h2>
                     <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Topic</label>
                            <textarea value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 h-20 text-gray-900 dark:text-white focus:border-brand-purple outline-none" placeholder="Video topic..."/>
                        </div>
                        
                        {/* STRATEGY SELECTOR */}
                        <div className="bg-brand-purple/5 p-3 rounded-lg border border-brand-purple/20">
                            <label className="text-xs text-brand-purple font-bold uppercase flex items-center mb-1">
                                <SparklesIcon className="h-3 w-3 mr-1"/> Masterclass Strategy
                            </label>
                            <select value={config.strategy} onChange={e => setConfig({...config, strategy: e.target.value})} className="w-full bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm text-gray-900 dark:text-white outline-none">
                                {AVAILABLE_STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1 italic">
                                {config.strategy === 'Retention Beast' && "Fast pacing, rapid cuts, immediate hook (MrBeast style)."}
                                {config.strategy === 'The Storyteller' && "Emotional arc, hero's journey, conflict (Casey Neistat style)."}
                                {config.strategy === 'The Educator' && "Curiosity gap, investigation, twist (Veritasium style)."}
                                {config.strategy === 'The Salesman' && "High value, authority, strong CTA (Hormozi style)."}
                                {config.strategy === 'Standard' && "Balanced professional structure."}
                            </p>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Goal</label>
                            <input value={config.goal} onChange={e => setConfig({...config, goal: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 text-gray-900 dark:text-white focus:border-brand-purple outline-none"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Needs</label>
                            <input value={config.needs} onChange={e => setConfig({...config, needs: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 text-gray-900 dark:text-white focus:border-brand-purple outline-none"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">CTA</label>
                            <input value={config.cta} onChange={e => setConfig({...config, cta: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 text-gray-900 dark:text-white focus:border-brand-purple outline-none"/>
                        </div>
                        
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Tone</label>
                            <div className="flex space-x-1 mt-1">
                                <select value={config.tone} onChange={e => setConfig({...config, tone: e.target.value})} className="flex-1 bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm text-gray-900 dark:text-white outline-none">
                                    {AVAILABLE_TONES.map(t => <option key={t}>{t}</option>)}
                                    {customTone && <option>{customTone}</option>}
                                </select>
                                <button onClick={() => setIsAddingTone(!isAddingTone)} className="bg-gray-200 dark:bg-gray-700 px-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"><PlusIcon className="h-4 w-4"/></button>
                            </div>
                            {isAddingTone && (
                                <div className="mt-2 flex space-x-2">
                                    <input value={customTone} onChange={e => setCustomTone(e.target.value)} placeholder="New tone..." className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-1 rounded text-xs text-gray-900 dark:text-white"/>
                                    <button onClick={() => { setConfig({...config, tone: customTone}); setIsAddingTone(false); }} className="bg-brand-purple px-2 rounded text-xs font-bold text-white">OK</button>
                                </div>
                            )}
                        </div>

                         <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Duration</label>
                            <select value={config.duration} onChange={e => setConfig({...config, duration: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 text-gray-900 dark:text-white outline-none">
                                {AVAILABLE_DURATIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Platforms</label>
                            <input value={config.platforms} onChange={e => setConfig({...config, platforms: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 text-gray-900 dark:text-white focus:border-brand-purple outline-none"/>
                        </div>
                     </div>

                     <Button onClick={() => onGenerate(config)} isLoading={isGenerating}>Generate Script</Button>
                     <Button variant="secondary" onClick={onBack}>Cancel</Button>
                  </div>
                  <div className="hidden md:flex flex-1 bg-gray-100 dark:bg-gray-800 items-center justify-center text-gray-500 dark:text-gray-500">
                      <div className="text-center">
                          <PencilSquareIcon className="h-16 w-16 mx-auto mb-4 opacity-20"/>
                          <p>Configure your script on the left to start.</p>
                      </div>
                  </div>
             </div>
         )
     }

     return (
         <div className="h-full flex overflow-hidden animate-fade-in relative bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
             {/* Sidebar: Fixed on Desktop, Toggleable Overlay on Mobile */}
             <div className={`
                fixed inset-0 z-30 bg-white dark:bg-gray-900 md:static md:inset-auto md:w-80 md:border-r border-gray-200 dark:border-gray-800 md:block transition-transform duration-300
                ${isConfigOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
             `}>
                 <div className="h-full overflow-y-auto p-6 text-gray-900 dark:text-white">
                     <div className="flex justify-between items-center mb-4">
                        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">&larr; Back</button>
                        <button onClick={() => setIsConfigOpen(false)} className="md:hidden text-gray-500 dark:text-gray-400"><XMarkIcon className="h-6 w-6"/></button>
                     </div>
                     
                     <div className="space-y-4 mb-6">
                        <h3 className="font-bold text-lg">Edit Config</h3>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Topic</label>
                            <textarea value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 h-20 text-gray-900 dark:text-white focus:border-brand-purple outline-none" placeholder="Topic..."/>
                        </div>
                        
                        {/* STRATEGY SELECTOR MOBILE/EDIT */}
                        <div className="bg-brand-purple/5 p-3 rounded-lg border border-brand-purple/20">
                            <label className="text-xs text-brand-purple font-bold uppercase flex items-center mb-1">
                                <SparklesIcon className="h-3 w-3 mr-1"/> Strategy
                            </label>
                            <select value={config.strategy} onChange={e => setConfig({...config, strategy: e.target.value})} className="w-full bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm text-gray-900 dark:text-white outline-none">
                                {AVAILABLE_STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Goal</label>
                            <input value={config.goal} onChange={e => setConfig({...config, goal: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 text-gray-900 dark:text-white focus:border-brand-purple outline-none"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Needs</label>
                            <input value={config.needs} onChange={e => setConfig({...config, needs: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 text-gray-900 dark:text-white focus:border-brand-purple outline-none"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">CTA</label>
                            <input value={config.cta} onChange={e => setConfig({...config, cta: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 p-2 text-sm mt-1 text-gray-900 dark:text-white focus:border-brand-purple outline-none"/>
                        </div>
                        <Button onClick={() => { onGenerate(config); setIsConfigOpen(false); }} isLoading={isGenerating}>Regenerate</Button>
                     </div>

                     <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                         <Button onClick={handleDownloadPDF} variant="secondary" className="w-full flex items-center justify-center">
                             <DocumentArrowDownIcon className="h-5 w-5 mr-2"/> Export PDF
                         </Button>
                     </div>
                 </div>
             </div>
             
             {/* Main Content Area - SCRIPT PREVIEW MODE */}
             <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto p-4 md:p-8 scroll-smooth text-gray-900 dark:text-white transition-colors duration-300">
                 <div className="max-w-4xl mx-auto pb-20">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 mr-4">
                            <input value={selectedScript.title} onChange={e => onUpdate({...selectedScript, title: e.target.value})} className="text-2xl md:text-3xl font-bold bg-transparent w-full outline-none placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white"/>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex space-x-3">
                                {selectedScript.strategy && <span className="bg-brand-purple/10 text-brand-purple px-2 py-1 rounded font-bold border border-brand-purple/20">{selectedScript.strategy}</span>}
                                <span className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">{selectedScript.format}</span>
                                <span className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">{selectedScript.tone}</span>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => setIsConfigOpen(true)} className="md:hidden p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm flex items-center text-gray-700 dark:text-gray-300">
                                <PencilSquareIcon className="h-5 w-5 mr-1"/> <span className="hidden sm:inline">Config</span>
                            </button>
                        </div>
                     </div>
                     
                     <div className="space-y-1">
                         {selectedScript.sections.length === 0 && (
                            <div className="text-gray-500 dark:text-gray-400 p-8 border border-dashed border-gray-300 dark:border-gray-600 rounded text-center">
                                <p className="mb-4">Empty content.</p>
                                <Button onClick={() => setIsConfigOpen(true)}>Open Config</Button>
                            </div>
                         )}
                         
                         {/* Render Script Preview Sections */}
                         {selectedScript.sections.map((section, idx) => (
                             <ScriptPreview 
                                key={idx}
                                title={section.title}
                                time={section.estimatedTime}
                                content={section.content}
                                visualNote={section.visualNote}
                                onEdit={(newContent) => {
                                    const newSections = [...selectedScript.sections];
                                    newSections[idx] = {...section, content: newContent};
                                    onUpdate({...selectedScript, sections: newSections});
                                }}
                             />
                         ))}

                         {/* Social Posts Section */}
                         <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white"><ShareIcon className="h-5 w-5 mr-2 text-green-500"/> Social Posts</h3>
                                 <Button onClick={handleGeneratePosts} isLoading={isGeneratingPosts} className="text-sm py-1 px-3">Generate Posts</Button>
                             </div>
                             {!selectedScript.socialPosts && <p className="text-gray-500 italic text-sm">No posts generated yet.</p>}
                             <div className="grid gap-4 md:grid-cols-2">
                                 {selectedScript.socialPosts?.map((post, i) => (
                                     <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl">
                                         <span className="text-xs font-bold uppercase text-brand-blue mb-2 block">{post.platform}</span>
                                         <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">{post.content}</p>
                                         {post.visualNote && <p className="text-xs text-blue-500 dark:text-blue-300 italic mb-2">[Asset: {post.visualNote}]</p>}
                                         <div className="text-xs text-blue-500 dark:text-blue-400">{post.hashtags?.join(' ')}</div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         </div>
     )
}

interface WorkspaceProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onNavigateAccount: () => void;
  onLogout: () => void;
  pendingGenConfig?: any;
  clearPendingConfig?: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  view?: 'dashboard' | 'studio' | 'serial';
  setView?: (view: 'dashboard' | 'studio' | 'serial') => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ user, onUpdateUser, onNavigateAccount, onLogout, pendingGenConfig, clearPendingConfig, isDarkMode, toggleTheme, view: propView, setView: propSetView }) => {
    // State initialization - use props if available, otherwise internal state (fallback)
    const [internalView, setInternalView] = useState<'dashboard' | 'studio' | 'serial'>('dashboard');
    const view = propView || internalView;
    const setView = propSetView || setInternalView;

    const [scripts, setScripts] = useState<Script[]>([]);
    const [series, setSeries] = useState<Series[]>([]);
    const [currentScript, setCurrentScript] = useState<Script | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Chat state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isChatProcessing, setIsChatProcessing] = useState(false);
    
    // Notifications
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    
    // Refs for chat instances
    const chatInstances = useRef<Map<string, Chat>>(new Map());

    // ... Load data from localStorage ...
    useEffect(() => {
        const savedScripts = localStorage.getItem('wyslider_scripts');
        if (savedScripts) setScripts(JSON.parse(savedScripts));
        
        const savedSeries = localStorage.getItem('wyslider_series');
        if (savedSeries) setSeries(JSON.parse(savedSeries));

        const savedChats = localStorage.getItem('wyslider_chats');
        if (savedChats) setChatSessions(JSON.parse(savedChats));
        
        // Handle pending config from "Use Idea"
        if (pendingGenConfig) {
             // Fixed: Do not call handleCreateScript() here as it causes race condition
             const newScript: Script = {
                 id: `s_${Date.now()}`,
                 title: pendingGenConfig.topic,
                 topic: pendingGenConfig.topic,
                 tone: pendingGenConfig.tone || 'Professional',
                 format: pendingGenConfig.duration || '8-15min',
                 createdAt: new Date().toISOString(),
                 sections: [],
                 niche: user.niche,
                 goal: pendingGenConfig.goal,
                 needs: pendingGenConfig.needs,
                 cta: pendingGenConfig.cta
             };
             
             // Use functional update to ensure state consistency
             setScripts(prev => {
                 const updated = [newScript, ...prev];
                 localStorage.setItem('wyslider_scripts', JSON.stringify(updated)); // Immediate save
                 return updated;
             });
             setCurrentScript(newScript);
             setView('studio');
             if (clearPendingConfig) clearPendingConfig();
        }
    }, [pendingGenConfig]);

    useEffect(() => {
        localStorage.setItem('wyslider_scripts', JSON.stringify(scripts));
    }, [scripts]);

    useEffect(() => {
        localStorage.setItem('wyslider_series', JSON.stringify(series));
    }, [series]);
    
    useEffect(() => {
        localStorage.setItem('wyslider_chats', JSON.stringify(chatSessions));
    }, [chatSessions]);

    // Check for admin broadcast
    useEffect(() => {
        const broadcast = localStorage.getItem('wyslider_admin_broadcast');
        if (broadcast) {
            const data = JSON.parse(broadcast);
            const lastSeen = localStorage.getItem('wyslider_last_broadcast');
            if (data.timestamp !== lastSeen) {
                notify(data.message, "Admin Broadcast");
                localStorage.setItem('wyslider_last_broadcast', data.timestamp);
            }
        }
    }, []);

    const notify = (title: string, message: string, type: 'info'|'success'|'warning' = 'info') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, title, message, type, read: false, timestamp: new Date().toISOString() }]);
    };

    const handleCreateScript = () => {
        const newScript: Script = {
            id: `s_${Date.now()}`,
            title: 'New Script',
            topic: '',
            tone: 'Professional',
            format: '8-15min',
            createdAt: new Date().toISOString(),
            sections: [],
            niche: user.niche
        };
        setScripts([newScript, ...scripts]);
        setCurrentScript(newScript);
        setView('studio');
    };

    const handleGenerateScript = async (config: any) => {
        if (!currentScript) return;
        if (user.generationsLeft <= 0) {
            alert("No more credits! Upgrade to Pro.");
            return;
        }

        setIsGenerating(true);

        try {
            const scriptData = await geminiService.generateScript(
                config.topic, 
                config.tone, 
                config.duration, 
                user.youtubeUrl, 
                config.goal, 
                config.needs, 
                config.cta, 
                config.platforms,
                user.styleDNA, // Pass styleDNA to service
                config.strategy // Pass Masterclass Strategy
            );
            
            if (scriptData) {
                const updatedScript: Script = {
                    ...currentScript,
                    title: scriptData.title,
                    topic: config.topic,
                    tone: config.tone,
                    format: config.duration,
                    strategy: config.strategy,
                    youtubeDescription: scriptData.youtubeDescription,
                    hashtags: scriptData.hashtags,
                    sections: scriptData.sections,
                    socialPosts: scriptData.socialPosts,
                    goal: config.goal,
                    needs: config.needs,
                    cta: config.cta
                };
                
                const newScripts = scripts.map(s => s.id === currentScript.id ? updatedScript : s);
                setScripts(newScripts);
                setCurrentScript(updatedScript);
                onUpdateUser({ ...user, generationsLeft: user.generationsLeft - 1 });
                notify("Script Generated!", "Your script is ready.", "success");
            }
        } catch (error: any) {
            console.error("Gen Script failed:", error);
            let msg = "AI failed to generate script.";
            if (error.message === "QUOTA_EXCEEDED") {
                msg = "Quota exceeded (Too many requests). Please wait 60s.";
            } else if (error.message === "Request timed out") {
                msg = "AI took too long. Try a simpler topic.";
            } else if (error.message === "EMPTY_RESPONSE") {
                 msg = "AI returned an empty response. Try again.";
            }
            notify("Error", msg, "warning");
        } finally {
            setIsGenerating(false);
        }
    };

    // Chat Logic
    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: `chat_${Date.now()}`,
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString()
        };
        setChatSessions([newSession, ...chatSessions]);
        setActiveChatId(newSession.id);
        
        const chat = geminiService.startChatSession(
             currentScript ? `Current Script Context: ${JSON.stringify(currentScript)}` : "No specific script selected."
        );
        chatInstances.current.set(newSession.id, chat);
    };

    const handleSendMessage = async (content: string) => {
        if (!activeChatId) return;
        
        // 1. Add User Message immediately
        const userMsg: ChatMessage = { id: `m_${Date.now()}`, role: 'user', content, timestamp: new Date().toISOString() };
        setChatSessions(sessions => sessions.map(s => {
            if (s.id === activeChatId) {
                return { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? content.substring(0, 30) + '...' : s.title };
            }
            return s;
        }));

        setIsChatProcessing(true);
        
        let chat = chatInstances.current.get(activeChatId);
        if (!chat) {
             chat = geminiService.startChatSession(
                 currentScript ? `Current Script Context: ${JSON.stringify(currentScript)}` : "No specific script selected."
            );
            chatInstances.current.set(activeChatId, chat);
        }

        // 2. Create placeholder for AI message
        const aiMsgId = `m_${Date.now()}_ai`;
        const initialAiMsg: ChatMessage = { id: aiMsgId, role: 'model', content: '', timestamp: new Date().toISOString() };
        
        setChatSessions(sessions => sessions.map(s => {
            if (s.id === activeChatId) {
                return { ...s, messages: [...s.messages, initialAiMsg] };
            }
            return s;
        }));

        // 3. Stream response
        try {
            const stream = geminiService.sendMessageToChatStream(chat, content);
            let fullText = "";

            for await (const chunk of stream) {
                fullText += chunk;
                // Update the last message (the AI placeholder) with new chunk
                setChatSessions(sessions => sessions.map(s => {
                    if (s.id === activeChatId) {
                        const newMessages = [...s.messages];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg.id === aiMsgId) {
                            lastMsg.content = fullText;
                        }
                        return { ...s, messages: newMessages };
                    }
                    return s;
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsChatProcessing(false);
        }
    };

    const handleTabChange = (tab: string) => {
        if (tab === 'dashboard') setView('dashboard');
        else if (tab === 'studio') {
            if (!currentScript) handleCreateScript();
            setView('studio');
        } else if (tab === 'account') {
            onNavigateAccount();
        }
    }

    return (
        <MainLayout 
            user={user} 
            onLogout={onLogout} 
            onNavigateToAccount={onNavigateAccount}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            activeTab={view}
            onTabChange={handleTabChange}
        >
            {/* Notification Toasts */}
            <div className="fixed bottom-4 right-4 z-[60] flex flex-col space-y-2 pointer-events-none">
                 {notifications.map(n => (
                     <div className="pointer-events-auto" key={n.id}>
                        <NotificationToast notification={n} onClose={id => setNotifications(prev => prev.filter(x => x.id !== id))} />
                     </div>
                 ))}
            </div>

            {/* Chat Overlay */}
            <ChatOverlay 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)}
                sessions={chatSessions}
                activeSessionId={activeChatId}
                onNewChat={handleNewChat}
                onSelectSession={setActiveChatId}
                onDeleteSession={(id) => {
                    setChatSessions(prev => prev.filter(s => s.id !== id));
                    if(activeChatId === id) setActiveChatId(null);
                    chatInstances.current.delete(id);
                }}
                onDeleteAllHistory={() => {
                    setChatSessions([]);
                    setActiveChatId(null);
                    chatInstances.current.clear();
                }}
                onSendMessage={handleSendMessage}
                isProcessing={isChatProcessing}
            />

             {/* Floating Chat Button */}
             <button 
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 bg-brand-purple hover:bg-purple-600 text-white p-4 rounded-full shadow-2xl z-40 transition-transform transform hover:scale-110 flex items-center justify-center"
            >
                <ChatBubbleLeftRightIcon className="h-8 w-8" />
                {isChatProcessing && <span className="absolute top-0 right-0 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span></span>}
            </button>

            {view === 'dashboard' && (
                <Dashboard 
                    scripts={scripts} 
                    series={series}
                    onSelect={(s) => { setCurrentScript(s); setView('studio'); }} 
                    onDelete={(id) => {
                         if(window.confirm("Delete this script/series?")) {
                             setScripts(prev => prev.filter(s => s.id !== id));
                             setSeries(prev => prev.filter(s => s.id !== id));
                         }
                    }}
                    onBulkDelete={(ids) => {
                         if(window.confirm(`Delete ${ids.length} items?`)) {
                             setScripts(prev => prev.filter(s => !ids.includes(s.id)));
                         }
                    }}
                    onBulkShare={() => alert("Bulk share coming soon.")}
                    onOpenStudio={() => { setCurrentScript(null); handleCreateScript(); }}
                    onOpenSerial={() => setView('serial')}
                />
            )}

            {view === 'studio' && (
                 <Studio 
                    scripts={scripts}
                    selectedScript={currentScript}
                    onUpdate={(updated) => {
                        setCurrentScript(updated);
                        setScripts(prev => prev.map(s => s.id === updated.id ? updated : s));
                    }}
                    onBack={() => setView('dashboard')}
                    onGenerate={handleGenerateScript}
                    isGenerating={isGenerating}
                    user={user}
                 />
            )}

            {view === 'serial' && (
                <SerialProd 
                    user={user}
                    onClose={() => setView('dashboard')}
                    onSaveSeries={(newSeries) => {
                        setSeries([newSeries, ...series]);
                        setScripts([...newSeries.episodes, ...scripts]);
                        onUpdateUser({...user, generationsLeft: user.generationsLeft - newSeries.episodes.length});
                    }}
                    onNavigateAccount={onNavigateAccount}
                    onNotify={(t, m) => notify(t, m, 'success')}
                />
            )}
        </MainLayout>
    );
};