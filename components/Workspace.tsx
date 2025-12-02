import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Script, ChatSession, ChatMessage, AppNotification, CalendarEvent, BrandPitch, Series } from '../types';
import { Button } from './Button';
import { PlusIcon, VideoIcon, TrashIcon, ShareIcon, PencilSquareIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon, Bars3Icon, CalendarIcon, TrendingUpIcon, ChartPieIcon, CurrencyDollarIcon, RobotIcon, ArrowDownTrayIcon, ArrowRightIcon, UserIcon, XMarkIcon, BellIcon, CloudIcon, ClockIcon, BoldIcon, ItalicIcon, ListBulletIcon, EyeIcon, PlayIcon, DocumentArrowDownIcon, Squares2x2Icon } from './icons';
import * as geminiService from '../services/geminiService';
import { Chat } from '@google/genai';

// --- Helper Components ---

const NotificationToast: React.FC<{ notification: AppNotification, onClose: (id: string) => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(notification.id), 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div className={`fixed bottom-4 right-4 max-w-sm w-full bg-gray-800 border-l-4 ${notification.type === 'success' ? 'border-green-500' : 'border-blue-500'} rounded shadow-2xl p-4 flex items-start animate-fade-in z-50`}>
            <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-200">{notification.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
            </div>
            <button onClick={() => onClose(notification.id)} className="text-gray-500 hover:text-white ml-3"><XMarkIcon className="h-4 w-4"/></button>
        </div>
    );
};

// ... ChatOverlay and MarkdownEditor components remain the same ...
// Re-declaring purely to maintain file structure for the XML replacement
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
        <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col">
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
                        <div className="p-4 bg-gray-900 border-t border-gray-800">
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

const Dashboard: React.FC<{ scripts: Script[], series: Series[], onSelect: (s: Script) => void, onDelete: (id: string) => void, onOpenStudio: () => void, onOpenSerial: () => void }> = ({ scripts, series, onSelect, onDelete, onOpenStudio, onOpenSerial }) => {
    return (
        <div className="h-full overflow-y-auto p-6 animate-fade-in scroll-smooth">
             <div className="max-w-6xl mx-auto space-y-8 pb-20">
                <div className="flex items-center space-x-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="flex-1 relative">
                        <input type="text" placeholder="Rechercher un script..." className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-sm focus:ring-1 focus:ring-brand-purple outline-none"/>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-white"><Bars3Icon className="h-5 w-5"/></button>
                    <div className="text-sm font-mono text-brand-purple">{scripts.length} Scripts</div>
                    <button className="p-2 text-gray-400 hover:text-white"><PencilSquareIcon className="h-5 w-5"/></button>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center space-x-2"><PencilSquareIcon className="h-5 w-5 text-brand-purple"/> <span>Mes Scripts</span></h2>
                    <button onClick={onOpenStudio} className="bg-brand-purple hover:bg-purple-600 text-white rounded-full p-2 shadow-lg transition transform hover:scale-105">
                        <PlusIcon className="h-6 w-6"/>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scripts.filter(s => !s.seriesId).map(script => (
                         <div key={script.id} onClick={() => onSelect(script)} className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-brand-purple cursor-pointer transition relative">
                             <div className="h-32 bg-gray-700 relative overflow-hidden">
                                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-900">
                                     <span className="text-4xl font-black opacity-20">WYS</span>
                                 </div>
                                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                     <button onClick={(e) => {e.stopPropagation(); onDelete(script.id)}} className="bg-red-500/80 p-1 rounded-full text-white"><TrashIcon className="h-4 w-4"/></button>
                                 </div>
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
                        <span className="text-sm font-mono text-gray-500">{series.length} Séries</span>
                        <button onClick={onOpenSerial} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 shadow-lg transition transform hover:scale-105">
                            <PlusIcon className="h-6 w-6"/>
                        </button>
                     </div>
                </div>

                {series.length === 0 ? (
                    <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500 hover:bg-gray-800/50 transition cursor-pointer" onClick={onOpenSerial}>
                        Vous n'avez pas encore créé de série. Cliquez ici pour lancer Serial Prod et générer 5+ vidéos d'un coup.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {series.map(s => (
                            <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{s.title}</h3>
                                        <span className="text-xs text-gray-400">{s.episodeCount} épisodes | {new Date(s.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <button className="text-red-500 hover:text-red-400" onClick={() => onDelete(s.id)}><TrashIcon className="h-5 w-5"/></button>
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

// --- TONES & DURATIONS ---
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
        
        // Generate full scripts based on proposals
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
                    seriesId: seriesId
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
         platforms: 'YouTube',
         goal: '',
         needs: '',
         cta: ''
     });
     const [customTone, setCustomTone] = useState('');
     const [isAddingTone, setIsAddingTone] = useState(false);

     useEffect(() => {
         // Pre-fill config if selected script is new/empty but has a topic (e.g. from Viral Idea)
         if (selectedScript && !selectedScript.sections.length && selectedScript.topic) {
             setConfig(prev => ({
                 ...prev,
                 topic: selectedScript.topic,
                 goal: selectedScript.goal || prev.goal,
                 needs: selectedScript.needs || prev.needs,
                 cta: selectedScript.cta || prev.cta
             }));
         }
     }, [selectedScript]);

     if (!selectedScript) {
         return (
             <div className="h-full flex overflow-hidden animate-fade-in">
                  <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col p-6 space-y-6 overflow-y-auto">
                     <h2 className="font-bold text-lg mb-4">Studio Config</h2>
                     {/* Config form remains same */}
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
                  <div className="flex-1 bg-gray-800 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                          <PencilSquareIcon className="h-16 w-16 mx-auto mb-4 opacity-20"/>
                          <p>Configurez votre script à gauche pour commencer.</p>
                      </div>
                  </div>
             </div>
         )
     }

     return (
         <div className="h-full flex overflow-hidden animate-fade-in">
             <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 hidden lg:block overflow-y-auto">
                 <button onClick={onBack} className="text-sm text-gray-400 mb-4">&larr; Retour</button>
                 <h2 className="font-bold mb-4">{selectedScript.title}</h2>
                 <div className="text-xs text-gray-400 space-y-2">
                     <p><strong>Goal:</strong> {selectedScript.goal || '-'}</p>
                     <p><strong>Needs:</strong> {selectedScript.needs || '-'}</p>
                     <p><strong>CTA:</strong> {selectedScript.cta || '-'}</p>
                 </div>
             </div>
             <div className="flex-1 bg-gray-800 overflow-y-auto p-8 scroll-smooth">
                 <input value={selectedScript.title} onChange={e => onUpdate({...selectedScript, title: e.target.value})} className="text-3xl font-bold bg-transparent w-full mb-6"/>
                 <div className="space-y-4">
                     {selectedScript.sections.map((section, idx) => (
                         <div key={idx} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                             <div className="flex justify-between mb-2">
                                <span className="font-bold text-brand-purple">{section.title}</span>
                             </div>
                             <MarkdownEditor value={section.content} onChange={val => {
                                 const newSections = [...selectedScript.sections];
                                 newSections[idx] = {...section, content: val};
                                 onUpdate({...selectedScript, sections: newSections});
                             }}/>
                         </div>
                     ))}
                 </div>
             </div>
         </div>
     )
}

const Growth: React.FC<{ user: User }> = ({ user }) => {
    // ... Growth Component ... (No changes needed, keeping existing XML structure safe)
    // Re-rendering Growth for consistency if needed, but avoiding redundancy for brevity 
    // unless you want me to print the whole file again. 
    // Assuming context is maintained, I'll print the full component to be safe.
    
    const [section, setSection] = useState<'seo'|'calendar'|'pitch'>('calendar');
    const [scripts, setScripts] = useState<Script[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [isGeneratingCalendar, setIsGeneratingCalendar] = useState(false);
    const [calendarTasks, setCalendarTasks] = useState('');
    const [selectedScriptSEO, setSelectedScriptSEO] = useState('');
    const [seoAnalysis, setSeoAnalysis] = useState('');
    const [isAnalyzingSEO, setIsAnalyzingSEO] = useState(false);
    const [pitchBrand, setPitchBrand] = useState('');
    const [pitchUrl, setPitchUrl] = useState('');
    const [pitchObj, setPitchObj] = useState('');
    const [isWritingPitch, setIsWritingPitch] = useState(false);
    const [pitchHistory, setPitchHistory] = useState<BrandPitch[]>([]);

    useEffect(() => {
        const s = localStorage.getItem('wyslider_scripts');
        if(s) setScripts(JSON.parse(s));
        const h = localStorage.getItem('wyslider_pitch_history');
        if(h) setPitchHistory(JSON.parse(h));
    }, []);

    // ... Handlers ...
    const handleGenerateCalendar = async () => {
        setIsGeneratingCalendar(true);
        const events = await geminiService.generateEditorialCalendar(user.niche, calendarTasks);
        setCalendarEvents(events.map((e: any, i: number) => ({...e, id: i.toString()})));
        setIsGeneratingCalendar(false);
    }
    const handleAnalyzeSEO = async () => {
        if (!selectedScriptSEO) return;
        const script = scripts.find(s => s.id === selectedScriptSEO);
        if(!script) return;
        setIsAnalyzingSEO(true);
        const analysis = await geminiService.analyzeSEO(script.title, script.sections.map(s => s.content).join(' '));
        setSeoAnalysis(analysis);
        setIsAnalyzingSEO(false);
    }
    const handleWritePitch = async () => {
        if(!pitchBrand || !pitchObj) return;
        setIsWritingPitch(true);
        const content = await geminiService.generatePitch(pitchBrand, pitchUrl, pitchObj);
        const newPitch: BrandPitch = { id: Date.now().toString(), brandName: pitchBrand, brandUrl: pitchUrl, objective: pitchObj, content, createdAt: new Date().toISOString() };
        const updatedHistory = [newPitch, ...pitchHistory];
        setPitchHistory(updatedHistory);
        localStorage.setItem('wyslider_pitch_history', JSON.stringify(updatedHistory));
        setIsWritingPitch(false);
    }
    const handleClearPitchHistory = () => { if(window.confirm("Vider l'historique ?")) { setPitchHistory([]); localStorage.removeItem('wyslider_pitch_history'); } }
    const handleDownloadPitch = (pitch: BrandPitch) => {
        const element = document.createElement("a");
        const file = new Blob([pitch.content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `pitch_${pitch.brandName}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    return (
        <div className="h-full flex overflow-hidden animate-fade-in">
             <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                 <div className="p-6">
                     <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">Growth Hub</h2>
                 </div>
                 <nav className="flex-1 space-y-1 px-3">
                     <button onClick={() => setSection('calendar')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${section === 'calendar' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                         <CalendarIcon className="h-5 w-5 text-blue-500"/> <span>Calendrier Éditorial</span>
                     </button>
                     <button onClick={() => setSection('seo')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${section === 'seo' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                         <ChartPieIcon className="h-5 w-5 text-green-500"/> <span>Score SEO & CTR</span>
                     </button>
                     <button onClick={() => setSection('pitch')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${section === 'pitch' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                         <CurrencyDollarIcon className="h-5 w-5 text-yellow-500"/> <span>Pitch for Mark</span>
                     </button>
                 </nav>
             </div>
             <div className="flex-1 bg-gray-900 p-8 overflow-y-auto scroll-smooth">
                 {/* Content Views (Calendar, SEO, Pitch) */}
                 {section === 'calendar' && (
                     <div className="max-w-4xl space-y-6 pb-20">
                         <h2 className="text-2xl font-bold">Calendrier Éditorial IA</h2>
                         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                             <label className="block text-sm font-bold text-gray-400 mb-2">Liste des tâches / Idées à planifier</label>
                             <textarea value={calendarTasks} onChange={e => setCalendarTasks(e.target.value)} className="w-full bg-gray-900 p-3 rounded border border-gray-600 mb-4 h-24" placeholder="- Video sur les tendances 2024&#10;- Short sur l'outil X..."/>
                             <Button onClick={handleGenerateCalendar} isLoading={isGeneratingCalendar}><PlusIcon className="h-5 w-5 mr-2 inline"/> Générer le planning</Button>
                         </div>
                         {calendarEvents.length > 0 && <div className="grid gap-4">{calendarEvents.map((evt) => <div key={evt.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="bg-gray-700 px-3 py-2 rounded text-center min-w-[60px]"><span className="block text-xs text-gray-400">{evt.date.split('-')[1]}/{evt.date.split('-')[0]}</span><span className="block font-bold text-lg">{evt.date.split('-')[2]}</span></div><div><h3 className="font-bold">{evt.title}</h3><span className="text-xs bg-brand-purple/20 text-brand-purple px-2 py-0.5 rounded mr-2">{evt.format}</span></div></div></div>)}</div>}
                     </div>
                 )}
                 {section === 'seo' && (
                     <div className="max-w-4xl space-y-6 pb-20">
                         <h2 className="text-2xl font-bold">Score SEO & CTR</h2>
                         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                             <label className="block text-sm font-bold text-gray-400 mb-2">Sélectionner un script à analyser</label>
                             <select value={selectedScriptSEO} onChange={e => setSelectedScriptSEO(e.target.value)} className="w-full bg-gray-900 p-3 rounded border border-gray-600 mb-4"><option value="">-- Choisir un script --</option>{scripts.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
                             <Button onClick={handleAnalyzeSEO} isLoading={isAnalyzingSEO} disabled={!selectedScriptSEO}>Analyser</Button>
                         </div>
                         {seoAnalysis && <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-fade-in"><h3 className="font-bold text-lg mb-4 text-green-400">Résultat de l'analyse</h3><div className="whitespace-pre-wrap leading-relaxed text-gray-300">{seoAnalysis}</div></div>}
                     </div>
                 )}
                 {section === 'pitch' && (
                     <div className="max-w-4xl space-y-6 pb-20">
                         <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Pitch for Mark</h2>{pitchHistory.length > 0 && <button onClick={handleClearPitchHistory} className="text-xs text-red-500 hover:text-red-400 underline">Vider l'historique</button>}</div>
                         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 grid gap-4">
                             <input value={pitchBrand} onChange={e => setPitchBrand(e.target.value)} placeholder="Nom de la marque" className="w-full bg-gray-900 p-3 rounded border border-gray-600"/>
                             <input value={pitchUrl} onChange={e => setPitchUrl(e.target.value)} placeholder="URL de la marque (Site Web)" className="w-full bg-gray-900 p-3 rounded border border-gray-600"/>
                             <textarea value={pitchObj} onChange={e => setPitchObj(e.target.value)} placeholder="Objectif du pitch..." className="w-full bg-gray-900 p-3 rounded border border-gray-600 h-24"/>
                             <Button onClick={handleWritePitch} isLoading={isWritingPitch}>Écrire</Button>
                         </div>
                         <div className="space-y-4">{pitchHistory.map(pitch => <div key={pitch.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative group"><div className="flex justify-between items-start mb-4"><div><h3 className="font-bold text-lg text-yellow-400">{pitch.brandName}</h3><p className="text-xs text-gray-500">{new Date(pitch.createdAt).toLocaleDateString()}</p></div><Button onClick={() => handleDownloadPitch(pitch)} variant="secondary" className="text-xs py-2 px-3"><DocumentArrowDownIcon className="h-4 w-4 mr-1 inline"/> Télécharger</Button></div><div className="bg-black/30 p-4 rounded text-sm text-gray-300 whitespace-pre-wrap font-mono">{pitch.content}</div></div>)}</div>
                     </div>
                 )}
             </div>
        </div>
    );
};

export const Workspace: React.FC<{ user: User, onUpdateUser: (u: User) => void, onNavigateAccount: () => void, onLogout: () => void, pendingGenConfig?: any, clearPendingConfig?: () => void }> = ({ user, onUpdateUser, onNavigateAccount, onLogout, pendingGenConfig, clearPendingConfig }) => {
    const [currentView, setCurrentView] = useState<'dashboard' | 'growth'>('dashboard');
    const [showStudio, setShowStudio] = useState(false);
    const [showSerialProd, setShowSerialProd] = useState(false);
    
    const [scripts, setScripts] = useState<Script[]>([]);
    const [series, setSeries] = useState<Series[]>([]);
    
    const [selectedScriptId, setSelectedScriptId] = useState<string|null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChatSessionId, setActiveChatSessionId] = useState<string|null>(null);
    const [isChatProcessing, setIsChatProcessing] = useState(false);
    const chatClientRef = useRef<Chat | null>(null);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);

    useEffect(() => {
        const storedScripts = localStorage.getItem('wyslider_scripts');
        if (storedScripts) setScripts(JSON.parse(storedScripts));
        
        const storedSeries = localStorage.getItem('wyslider_series');
        if (storedSeries) setSeries(JSON.parse(storedSeries));
        
        const chatHistory = localStorage.getItem('wyslider_chat_history');
        if(chatHistory) setChatSessions(JSON.parse(chatHistory));

        const checkAdminNotifs = () => {
            const adminMsg = localStorage.getItem('wyslider_admin_broadcast');
            if (adminMsg) {
                const msgData = JSON.parse(adminMsg);
                if (!msgData.seen) {
                    const newNotif: AppNotification = {
                        id: Date.now().toString(),
                        title: "WYS Team",
                        message: msgData.message,
                        type: 'info',
                        read: false,
                        timestamp: new Date().toISOString()
                    };
                    setNotifications(prev => [...prev, newNotif]);
                    localStorage.setItem('wyslider_admin_broadcast', JSON.stringify({...msgData, seen: true}));
                }
            }
        };
        const interval = setInterval(checkAdminNotifs, 5000);
        return () => clearInterval(interval);
    }, []);

    // Handle Pending Configuration (e.g. from Viral Ideas)
    useEffect(() => {
        if (pendingGenConfig) {
            // Create a temp script with config and open studio
            const tempId = `temp_${Date.now()}`;
            const tempScript: Script = {
                id: tempId,
                title: pendingGenConfig.topic,
                topic: pendingGenConfig.topic,
                tone: pendingGenConfig.tone || 'Professionnel',
                format: pendingGenConfig.duration || '8-15min',
                sections: [],
                createdAt: new Date().toISOString(),
                niche: user.niche,
                goal: pendingGenConfig.goal,
                needs: pendingGenConfig.needs,
                cta: pendingGenConfig.cta
            };
            // Add temporarily to state logic handled by Studio via selectedScriptId or pass config directly
            // Easier: just add to scripts (it's empty anyway) and open it.
            const updated = [tempScript, ...scripts];
            setScripts(updated); // Don't save to LS yet to avoid garbage, but Studio will save on update
            setSelectedScriptId(tempId);
            setShowStudio(true);
            
            // Auto generate
            setTimeout(() => {
                // We rely on the user clicking "Generate" in studio, OR we trigger it.
                // The Studio component takes `onGenerate`. We can pass a flag to auto-trigger but better let user review.
            }, 500);
            
            if (clearPendingConfig) clearPendingConfig();
        }
    }, [pendingGenConfig]);

    const saveScripts = (newScripts: Script[]) => {
        setScripts(newScripts);
        localStorage.setItem('wyslider_scripts', JSON.stringify(newScripts));
    };

    const saveSeries = (newSeries: Series) => {
        const updated = [newSeries, ...series];
        setSeries(updated);
        localStorage.setItem('wyslider_series', JSON.stringify(updated));
        
        // Also add episodes to scripts list so they are accessible individually
        const updatedScripts = [...newSeries.episodes, ...scripts];
        saveScripts(updatedScripts);
        onUpdateUser({...user, generationsLeft: Math.max(0, user.generationsLeft - newSeries.episodes.length)});
    };

    const deleteSeries = (id: string) => {
        if(window.confirm("Supprimer toute la série et ses épisodes ?")) {
            const updated = series.filter(s => s.id !== id);
            setSeries(updated);
            localStorage.setItem('wyslider_series', JSON.stringify(updated));
            // Also delete associated scripts
            const updatedScripts = scripts.filter(s => s.seriesId !== id);
            saveScripts(updatedScripts);
        }
    };

    const handleGenerate = async (config: any) => {
        if (user.generationsLeft <= 0) { alert("Plus de crédits !"); return; }
        setIsGenerating(true);
        const data = await geminiService.generateScript(
            config.topic, 
            config.tone, 
            config.duration, 
            user.youtubeUrl,
            config.goal,
            config.needs,
            config.cta,
            config.platforms
        );
        if (data) {
            const newScript: Script = {
                id: `script_${Date.now()}`,
                title: data.title || config.topic,
                topic: config.topic,
                tone: config.tone,
                format: config.duration,
                sections: data.sections || [],
                createdAt: new Date().toISOString(),
                youtubeDescription: data.youtubeDescription,
                hashtags: data.hashtags,
                niche: config.niche,
                goal: config.goal,
                needs: config.needs,
                cta: config.cta
            };
            const updatedScripts = [newScript, ...scripts];
            saveScripts(updatedScripts);
            setSelectedScriptId(newScript.id);
            onUpdateUser({...user, generationsLeft: user.generationsLeft - 1});
        }
        setIsGenerating(false);
    }
    
    // Chat handlers
    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: `Discussion ${new Date().toLocaleTimeString()}`,
            messages: [{ id: '1', role: 'model', content: "Bonjour ! Comment puis-je vous aider avec votre chaîne aujourd'hui ?", timestamp: new Date().toISOString() }],
            createdAt: new Date().toISOString()
        };
        const updated = [newSession, ...chatSessions];
        setChatSessions(updated);
        setActiveChatSessionId(newSession.id);
        localStorage.setItem('wyslider_chat_history', JSON.stringify(updated));
        
        chatClientRef.current = geminiService.startChatSession("Context: User working on scripts.");
    };

    const handleDeleteChat = (id: string) => {
        const updated = chatSessions.filter(s => s.id !== id);
        setChatSessions(updated);
        localStorage.setItem('wyslider_chat_history', JSON.stringify(updated));
        if(activeChatSessionId === id) setActiveChatSessionId(null);
    }

    const handleSendMessage = async (msg: string) => {
         if(!activeChatSessionId) return;
         
         const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date().toISOString() };
         const updatedSessions = chatSessions.map(s => s.id === activeChatSessionId ? { ...s, messages: [...s.messages, userMsg] } : s);
         setChatSessions(updatedSessions);
         
         setIsChatProcessing(true);
         if (!chatClientRef.current) chatClientRef.current = geminiService.startChatSession("Context: User working on scripts.");
         
         const response = await geminiService.sendMessageToChat(chatClientRef.current, msg);
         const modelMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', content: response, timestamp: new Date().toISOString() };
         
         const finalSessions = updatedSessions.map(s => s.id === activeChatSessionId ? { ...s, messages: [...s.messages, modelMsg] } : s);
         setChatSessions(finalSessions);
         localStorage.setItem('wyslider_chat_history', JSON.stringify(finalSessions));
         setIsChatProcessing(false);
    }
    
    const TopBar = () => (
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-20 relative">
            <div className="flex items-center space-x-2">
                <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">WYS</span>
                <span className="text-xs font-mono text-gray-500 pt-1">V2.3</span>
            </div>
            <div className="flex items-center space-x-3 md:space-x-6">
                <div className="relative">
                    <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="p-2 text-gray-400 hover:text-white relative">
                        <BellIcon className="h-6 w-6"/>
                        {notifications.some(n => !n.read) && <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-gray-900"></span>}
                    </button>
                    {showNotifPanel && (
                        <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 p-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase p-2 border-b border-gray-700 mb-2">Notifications</h4>
                            {notifications.length === 0 && <p className="text-xs text-gray-500 p-2 text-center">Rien à signaler.</p>}
                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {notifications.slice().reverse().map(n => (
                                    <div key={n.id} className="p-3 bg-gray-700/50 rounded hover:bg-gray-700 transition">
                                        <p className="font-bold text-sm text-brand-purple">{n.title}</p>
                                        <p className="text-xs text-white">{n.message}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 text-right">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button className="bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1 rounded-full text-brand-purple font-bold border border-gray-700">
                    {user.generationsLeft} CRÉDITS
                </button>
                <button onClick={onNavigateAccount} className="flex items-center space-x-2 text-gray-400 hover:text-white">
                    {user.profilePicture ? <img src={user.profilePicture} alt="Profile" className="h-8 w-8 rounded-full border border-gray-700 object-cover"/> : <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700"><UserIcon className="h-4 w-4"/></div>}
                </button>
                <button onClick={onLogout} className="text-red-900 hover:text-red-500"><ArrowRightIcon className="h-5 w-5"/></button>
            </div>
        </header>
    );

    if (showSerialProd) {
        return <SerialProd user={user} onClose={() => setShowSerialProd(false)} onSaveSeries={saveSeries} onNavigateAccount={onNavigateAccount} onNotify={(t,m) => setNotifications(prev => [...prev, {id: Date.now().toString(), title: t, message: m, type: 'success', read: false, timestamp: new Date().toISOString()}])} />
    }

    if (showStudio) {
        return (
            <div className="flex flex-col h-screen w-full bg-gray-900 text-white">
                <TopBar />
                <div className="flex-1 overflow-hidden relative">
                    <Studio scripts={scripts} selectedScript={scripts.find(s=>s.id === selectedScriptId)||null} onUpdate={(s)=>saveScripts(scripts.map(old=>old.id===s.id?s:old))} onBack={()=>{setShowStudio(false); setSelectedScriptId(null)}} onGenerate={handleGenerate} isGenerating={isGenerating} user={user} />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen w-full bg-gray-900 text-white overflow-hidden">
            <TopBar />
            
            <div className="flex justify-center py-4 bg-gray-900 flex-shrink-0">
                <div className="bg-gray-800 p-1 rounded-full flex space-x-1 relative">
                    <button onClick={() => setCurrentView('dashboard')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                        Dashboard
                    </button>
                    <button onClick={() => setCurrentView('growth')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${currentView === 'growth' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                        Growth
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <div className={`absolute inset-0 w-[200%] flex transition-transform duration-500 ease-in-out ${currentView === 'dashboard' ? 'translate-x-0' : '-translate-x-1/2'}`}>
                    <div className="w-1/2 h-full overflow-hidden relative">
                         <Dashboard 
                            scripts={scripts} 
                            series={series}
                            onSelect={(s) => { setSelectedScriptId(s.id); setShowStudio(true); }}
                            onDelete={(id) => deleteSeries(id)} // Modified to handle script deletion inside dashboard if needed, or pass correct deleter
                            onOpenStudio={() => { setSelectedScriptId(null); setShowStudio(true); }}
                            onOpenSerial={() => setShowSerialProd(true)}
                         />
                         {notifications.map(n => <NotificationToast key={n.id} notification={n} onClose={id => setNotifications(prev => prev.filter(x => x.id !== id))} />)}
                    </div>
                    <div className="w-1/2 h-full overflow-hidden">
                        <Growth user={user} />
                    </div>
                </div>
            </div>
            
            <ChatOverlay 
                 isOpen={showChat}
                 onClose={() => setShowChat(false)}
                 sessions={chatSessions}
                 activeSessionId={activeChatSessionId}
                 onNewChat={handleNewChat}
                 onSelectSession={setActiveChatSessionId}
                 onDeleteSession={handleDeleteChat}
                 onDeleteAllHistory={() => { setChatSessions([]); localStorage.removeItem('wyslider_chat_history'); }}
                 onSendMessage={handleSendMessage}
                 isProcessing={isChatProcessing}
             />
             
             {!showChat && (
                 <button onClick={() => setShowChat(true)} className="fixed bottom-6 right-6 bg-brand-purple p-4 rounded-full shadow-2xl hover:scale-110 transition z-40">
                     <ChatBubbleLeftRightIcon className="h-6 w-6 text-white"/>
                 </button>
             )}
        </div>
    );
};