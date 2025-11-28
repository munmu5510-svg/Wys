
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Script, ChatSession, ChatMessage, AppNotification } from '../types';
import { Button } from './Button';
import { PlusIcon, VideoIcon, TrashIcon, ShareIcon, PencilSquareIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon, Bars3Icon, CalendarIcon, TrendingUpIcon, ChartPieIcon, CurrencyDollarIcon, RobotIcon, ArrowDownTrayIcon, ArrowRightIcon, UserIcon, XMarkIcon, BellIcon, CloudIcon, ClockIcon, BoldIcon, ItalicIcon, ListBulletIcon, EyeIcon } from './icons';
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

const Dashboard: React.FC<{ scripts: Script[], onSelect: (s: Script) => void, onDelete: (id: string) => void, onOpenStudio: () => void, onOpenSerial: () => void }> = ({ scripts, onSelect, onDelete, onOpenStudio, onOpenSerial }) => {
    return (
        <div className="h-full overflow-y-auto p-6 animate-fade-in">
             <div className="max-w-6xl mx-auto space-y-8">
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
                    {scripts.map(script => (
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
                    {scripts.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">Aucun script. Cliquez sur + pour commencer.</div>}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <h2 className="text-xl font-bold flex items-center space-x-2"><VideoIcon className="h-5 w-5 text-blue-500"/> <span>Mes Séries</span></h2>
                     <div className="flex items-center space-x-3">
                        <span className="text-sm font-mono text-gray-500">0 Séries</span>
                        <button onClick={onOpenSerial} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 shadow-lg transition transform hover:scale-105">
                            <PlusIcon className="h-6 w-6"/>
                        </button>
                     </div>
                </div>

                <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500 hover:bg-gray-800/50 transition cursor-pointer" onClick={onOpenSerial}>
                    Vous n'avez pas encore créé de série. Cliquez ici pour lancer Serial Prod et générer 5+ vidéos d'un coup.
                </div>
             </div>
        </div>
    );
};

const SerialProd: React.FC<{
    user: User;
    onClose: () => void;
    onSaveScripts: (scripts: Script[]) => void;
    onEditScript: (script: Script) => void;
    onNavigateAccount: () => void;
    onNotify: (t: string, m: string) => void;
}> = ({ user, onClose, onSaveScripts, onEditScript, onNavigateAccount, onNotify }) => {
    const [theme, setTheme] = useState('');
    const [useCurrentNiche, setUseCurrentNiche] = useState(true);
    const [customNiche, setCustomNiche] = useState('');
    const [tone, setTone] = useState('Standard: Professionnel');
    const [imitationUrl, setImitationUrl] = useState('');
    const [duration, setDuration] = useState('8-15 min');
    const [platforms, setPlatforms] = useState('YouTube');
    const [episodeCount, setEpisodeCount] = useState(5);
    const [generatedEpisodes, setGeneratedEpisodes] = useState<Script[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    const handleGenerate = async () => {
        if (!theme) return alert("Veuillez entrer un thème.");
        setIsGenerating(true);
        const nicheToUse = useCurrentNiche ? user.niche : customNiche;
        const finalTone = tone === 'Imitation' ? `Imitation of: ${imitationUrl}` : tone;
        
        const episodesData = await geminiService.generateSeries(theme, episodeCount, finalTone, nicheToUse, duration);
        
        const newScripts: Script[] = episodesData.map((ep: any, index: number) => ({
            id: `ep_${Date.now()}_${index}`,
            title: ep.title,
            topic: theme,
            tone: finalTone,
            format: duration,
            sections: ep.sections || [],
            createdAt: new Date().toISOString(),
            youtubeDescription: ep.youtubeDescription,
            hashtags: ep.hashtags,
            niche: nicheToUse,
            seriesName: theme
        }));

        setGeneratedEpisodes(newScripts);
        onSaveScripts(newScripts); 
        setIsGenerating(false);
        onNotify("Série générée !", `5 épisodes créés pour ${theme}`);
    };

    const handleDownload = () => {
        alert("Téléchargement PDF en cours... (Simulé)");
        // PDF generation logic moved to backend or handled via print for stability
        window.print();
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white animate-fade-in absolute inset-0 z-50">
            <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0 z-20">
                <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">WYS</span>
                </div>
                
                <div className="flex items-center space-x-6">
                    <button className="bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1 rounded-full text-brand-purple font-bold border border-gray-700">
                        {user.generationsLeft} CRÉDITS
                    </button>
                    <button onClick={onNavigateAccount} className="flex items-center space-x-2 text-gray-400 hover:text-white">
                        {user.profilePicture ? <img src={user.profilePicture} alt="Profile" className="h-8 w-8 rounded-full border border-gray-700"/> : <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700"><UserIcon className="h-4 w-4"/></div>}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col p-6 space-y-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2 font-bold text-xl">
                            <VideoIcon className="h-6 w-6 text-brand-purple"/>
                            <span>Serial Prod</span>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white"><XMarkIcon className="h-6 w-6"/></button>
                    </div>

                    <div className="space-y-4">
                         <div>
                            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Thème Générique</label>
                            <input value={theme} onChange={e => setTheme(e.target.value)} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm" placeholder="Ex: Cuisine pour débutants"/>
                        </div>
                        
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Niche</label>
                            <div className="flex items-center mb-2">
                                <input type="checkbox" checked={useCurrentNiche} onChange={e => setUseCurrentNiche(e.target.checked)} className="mr-2"/>
                                <span className="text-sm text-gray-300">Utiliser {user.niche}</span>
                            </div>
                            {!useCurrentNiche && (
                                <input value={customNiche} onChange={e => setCustomNiche(e.target.value)} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm" placeholder="Autre niche..."/>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Ton</label>
                            <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm">
                                <option>Standard: Professionnel</option>
                                <option>Standard: Humoristique</option>
                                <option>Standard: Énergique</option>
                                <option>Standard: Critique Positif</option>
                                <option>Standard: Critique Négatif</option>
                                <option>Standard: Colère</option>
                                <option>Standard: Empathie</option>
                                <option>Imitation</option>
                            </select>
                            {tone === 'Imitation' && (
                                <input placeholder="Coller URL YouTube de référence" value={imitationUrl} onChange={e => setImitationUrl(e.target.value)} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-xs mt-2"/>
                            )}
                        </div>

                         <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Durée</label>
                                <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm">
                                    <option>60s (Shorts)</option>
                                    <option>3-5 min</option>
                                    <option>8-15 min</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Episodes</label>
                                <input type="number" min="3" max="20" value={episodeCount} onChange={e => setEpisodeCount(parseInt(e.target.value))} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm"/>
                            </div>
                         </div>

                         <div>
                            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Plateformes</label>
                            <input value={platforms} onChange={e => setPlatforms(e.target.value)} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm"/>
                        </div>

                        <Button onClick={handleGenerate} isLoading={isGenerating} className="w-full py-4 text-lg shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                            Générer la Série
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-gray-900 p-8 overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-6">Episodes {generatedEpisodes.length > 0 && `(${generatedEpisodes.length})`}</h2>
                    {generatedEpisodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                            <VideoIcon className="h-12 w-12 mb-4 opacity-50"/>
                            <p>Configurez et lancez la génération pour voir les épisodes.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {generatedEpisodes.map((ep, i) => (
                                <div key={ep.id} onClick={() => onEditScript(ep)} className="bg-gray-800 border border-gray-700 p-4 rounded-xl hover:border-brand-purple cursor-pointer transition group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1 flex items-center">
                                                <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded mr-2">EP {i+1}</span>
                                                {ep.title}
                                            </h3>
                                            <p className="text-sm text-gray-400 line-clamp-2">{ep.youtubeDescription}</p>
                                        </div>
                                        <ArrowRightIcon className="h-5 w-5 text-gray-600 group-hover:text-brand-purple"/>
                                    </div>
                                    <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                                        {(ep.hashtags || []).slice(0, 3).map(tag => (
                                            <span key={tag} className="bg-gray-900 px-2 py-1 rounded">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showRightSidebar && (
                    <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="font-bold">Extensions Prod</h2>
                            <button onClick={() => setShowRightSidebar(false)}><XMarkIcon className="h-5 w-5 text-gray-500"/></button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="bg-gray-800 p-4 rounded-lg mb-4">
                                <h3 className="font-bold text-sm mb-3 flex items-center"><ShareIcon className="h-4 w-4 mr-2"/> Posts Sociaux</h3>
                                <p className="text-xs text-gray-500 mb-2">Générés pour {platforms}</p>
                                {generatedEpisodes.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="bg-gray-900 p-2 rounded text-xs text-gray-400 border border-gray-700">
                                            LinkedIn: Découvrez notre nouvelle série sur {theme}...
                                        </div>
                                        <div className="bg-gray-900 p-2 rounded text-xs text-gray-400 border border-gray-700">
                                            Twitter: Thread 1/{generatedEpisodes.length}: {generatedEpisodes[0]?.title}...
                                        </div>
                                    </div>
                                ) : <p className="text-xs text-gray-600 italic">En attente de génération...</p>}
                            </div>

                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="font-bold text-sm mb-3">Export</h3>
                                <Button onClick={handleDownload} disabled={generatedEpisodes.length === 0} className="w-full text-xs py-2 flex items-center justify-center">
                                    <ArrowDownTrayIcon className="h-4 w-4 mr-2"/> Télécharger PDF (Tout)
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                 {!showRightSidebar && (
                    <div className="w-12 bg-gray-900 border-l border-gray-800 flex flex-col items-center py-4">
                        <button onClick={() => setShowRightSidebar(true)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white mb-4"><Bars3Icon className="h-5 w-5"/></button>
                    </div>
                )}
            </div>
        </div>
    );
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
    const [config, setConfig] = useState({ topic: '', niche: user.niche, tone: 'Standard: Professionnel', duration: '8-15min', platforms: 'YouTube' });
    const [imitationUrl, setImitationUrl] = useState('');

    const handleGenerateClick = () => {
        let finalTone = config.tone;
        if (config.tone === 'Imitation' && imitationUrl) {
            finalTone = `Imitation of style from: ${imitationUrl}`;
        }
        onGenerate({ ...config, tone: finalTone });
    };

    if (!selectedScript) {
        return (
            <div className="h-full flex overflow-hidden animate-fade-in">
                <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col p-6 space-y-6 overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg">Configuration</h2>
                        <button onClick={onBack}><ArrowRightIcon className="h-5 w-5 text-gray-500 rotate-180"/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Sujet</label>
                            <textarea value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1 h-20" placeholder="Ex: 5 astuces pour..."/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Niche</label>
                            <input value={config.niche} onChange={e => setConfig({...config, niche: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1"/>
                        </div>
                         <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Ton</label>
                            <select value={config.tone} onChange={e => setConfig({...config, tone: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1">
                                <option>Standard: Professionnel</option>
                                <option>Standard: Humoristique</option>
                                <option>Standard: Énergique</option>
                                <option>Standard: Colère</option>
                                <option>Standard: Empathie</option>
                                <option>Imitation</option>
                            </select>
                            {config.tone === 'Imitation' && (
                                <input placeholder="Coller URL YouTube de référence" value={imitationUrl} onChange={e => setImitationUrl(e.target.value)} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-xs mt-2"/>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Durée</label>
                            <select value={config.duration} onChange={e => setConfig({...config, duration: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1">
                                <option value="<60s">Shorts (60s)</option>
                                <option value="3-5min">3-5 min</option>
                                <option value="8-15min">8-15 min</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Plateformes</label>
                            <input value={config.platforms} onChange={e => setConfig({...config, platforms: e.target.value})} className="w-full bg-gray-800 rounded border border-gray-700 p-2 text-sm mt-1"/>
                        </div>
                        
                        <Button onClick={handleGenerateClick} isLoading={isGenerating} className="w-full">Générer</Button>
                    </div>
                </div>

                <div className="flex-1 bg-gray-800 flex items-center justify-center text-gray-500">
                    <p>Configurez à gauche et cliquez sur Générer pour créer un nouveau script.</p>
                </div>
                <div className="w-80 bg-gray-900 border-l border-gray-800 hidden lg:block"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex overflow-hidden animate-fade-in">
             <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 hidden lg:block overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="font-bold">Détails</h2>
                     <button onClick={onBack} className="text-xs text-gray-500">Fermer</button>
                 </div>
                 <div className="space-y-4 text-sm text-gray-400">
                     <p><strong className="text-gray-300">Format:</strong> {selectedScript.format}</p>
                     <p><strong className="text-gray-300">Ton:</strong> {selectedScript.tone}</p>
                     <p><strong className="text-gray-300">Niche:</strong> {selectedScript.niche}</p>
                 </div>
             </div>

             <div className="flex-1 bg-gray-800 overflow-y-auto p-8">
                 <div className="max-w-3xl mx-auto space-y-6">
                     <input value={selectedScript.title} onChange={e => onUpdate({...selectedScript, title: e.target.value})} className="text-3xl font-bold bg-transparent w-full border-none focus:ring-0 placeholder-gray-600"/>
                     <textarea value={selectedScript.youtubeDescription} onChange={e => onUpdate({...selectedScript, youtubeDescription: e.target.value})} className="w-full bg-gray-900/50 p-4 rounded-lg text-sm text-gray-300 h-32" placeholder="Description YouTube..."/>
                     
                     <div className="space-y-4">
                         {selectedScript.sections.map((section, idx) => (
                             <div key={idx} className="bg-gray-900 border border-gray-700 rounded-xl p-5 relative group">
                                 <div className="flex justify-between mb-2">
                                     <span className="font-bold text-brand-purple">{section.title}</span>
                                     <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{section.estimatedTime}s</span>
                                 </div>
                                 
                                 <MarkdownEditor 
                                    value={section.content}
                                    onChange={val => {
                                        const newSections = [...selectedScript.sections];
                                        newSections[idx] = {...section, content: val};
                                        onUpdate({...selectedScript, sections: newSections});
                                    }}
                                    placeholder="Ecrivez votre script ici..."
                                 />
                                 
                                 <div className="mt-3 bg-blue-900/20 p-3 rounded-lg border border-blue-900/50 flex items-start space-x-2">
                                     <VideoIcon className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0"/>
                                     <textarea value={section.visualNote} onChange={e => {
                                         const newSections = [...selectedScript.sections];
                                         newSections[idx] = {...section, visualNote: e.target.value};
                                         onUpdate({...selectedScript, sections: newSections});
                                     }} className="w-full bg-transparent text-sm text-blue-300 outline-none resize-none" placeholder="Note visuelle..."/>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>

             <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
                 <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                     <h2 className="font-bold">Extensions</h2>
                     <button onClick={() => {}}><ArrowRightIcon className="h-5 w-5 text-gray-500"/></button>
                 </div>
                 <div className="p-4 flex-1 overflow-y-auto space-y-4">
                     <div className="bg-gray-800 p-4 rounded-lg">
                         <h3 className="font-bold text-sm mb-2">Générer Posts Sociaux</h3>
                         <div className="flex space-x-2 mb-2">
                             <button className="flex-1 bg-blue-600/20 text-blue-500 text-xs py-1 rounded border border-blue-600/50">LinkedIn</button>
                             <button className="flex-1 bg-pink-600/20 text-pink-500 text-xs py-1 rounded border border-pink-600/50">Instagram</button>
                         </div>
                         <Button className="w-full text-xs py-2">Générer</Button>
                     </div>
                     
                     <div className="bg-gray-800 p-4 rounded-lg">
                         <h3 className="font-bold text-sm mb-2">Téléchargement</h3>
                         <button className="w-full flex items-center justify-between p-2 bg-gray-700 rounded mb-2 hover:bg-gray-600">
                             <span className="text-sm">Format PDF</span>
                             <ArrowDownTrayIcon className="h-4 w-4"/>
                         </button>
                         <button className="w-full flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600">
                             <span className="text-sm">Format Texte / SRT</span>
                             <ArrowDownTrayIcon className="h-4 w-4"/>
                         </button>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const Growth: React.FC<{ user: User }> = ({ user }) => {
    const [section, setSection] = useState<'seo'|'trends'|'calendar'|'pitch'|'video'>('seo');
    const [seoAnalysis, setSeoAnalysis] = useState('');
    const [pitchBrand, setPitchBrand] = useState('');
    const [pitchObj, setPitchObj] = useState('');
    const [pitchResult, setPitchResult] = useState('');

    const handleSeo = async () => {
        const res = await geminiService.analyzeSEO(user.niche);
        setSeoAnalysis(res);
    };

    const handlePitch = async () => {
        const res = await geminiService.generatePitch(pitchBrand, pitchObj);
        setPitchResult(res);
    };

    return (
        <div className="h-full flex overflow-hidden animate-fade-in">
             <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                 <div className="p-6">
                     <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">Growth Hub</h2>
                 </div>
                 <nav className="flex-1 space-y-1 px-3">
                     <button onClick={() => setSection('seo')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${section === 'seo' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                         <ChartPieIcon className="h-5 w-5 text-green-500"/> <span>Score SEO & CTR</span>
                     </button>
                     <button onClick={() => setSection('trends')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${section === 'trends' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                         <TrendingUpIcon className="h-5 w-5 text-red-500"/> <span>Tendances</span>
                     </button>
                     <button onClick={() => setSection('calendar')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${section === 'calendar' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                         <CalendarIcon className="h-5 w-5 text-blue-500"/> <span>Calendrier Éditorial</span>
                     </button>
                     <button onClick={() => setSection('pitch')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${section === 'pitch' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                         <CurrencyDollarIcon className="h-5 w-5 text-yellow-500"/> <span>Pitch for Mark</span>
                     </button>
                     <button onClick={() => setSection('video')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${section === 'video' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                         <VideoIcon className="h-5 w-5 text-brand-purple"/> <span>Text to Video (Veo)</span>
                     </button>
                 </nav>
             </div>

             <div className="flex-1 bg-gray-900 p-8 overflow-y-auto">
                 {section === 'seo' && (
                     <div className="max-w-2xl">
                         <h2 className="text-2xl font-bold mb-4">Analyse SEO Niche</h2>
                         <Button onClick={handleSeo} className="mb-4">Analyser ma Niche ({user.niche})</Button>
                         {seoAnalysis && <div className="bg-gray-800 p-6 rounded-xl whitespace-pre-wrap leading-relaxed">{seoAnalysis}</div>}
                     </div>
                 )}
                 {section === 'pitch' && (
                     <div className="max-w-2xl">
                         <h2 className="text-2xl font-bold mb-4">Générateur de Pitch</h2>
                         <div className="space-y-4 mb-6">
                             <input value={pitchBrand} onChange={e => setPitchBrand(e.target.value)} placeholder="Marque (ex: Nike)" className="w-full bg-gray-800 p-3 rounded border border-gray-700"/>
                             <input value={pitchObj} onChange={e => setPitchObj(e.target.value)} placeholder="Objectif (ex: obtenir un sponsoring de 5k)" className="w-full bg-gray-800 p-3 rounded border border-gray-700"/>
                             <Button onClick={handlePitch}>Générer le Pitch</Button>
                         </div>
                         {pitchResult && <div className="bg-gray-800 p-6 rounded-xl whitespace-pre-wrap leading-relaxed border-l-4 border-yellow-500">{pitchResult}</div>}
                     </div>
                 )}
                 {(section === 'trends' || section === 'calendar' || section === 'video') && (
                     <div className="flex flex-col items-center justify-center h-full text-gray-500">
                         <RobotIcon className="h-16 w-16 mb-4 opacity-20"/>
                         <p>Module {section.toUpperCase()} en cours de déploiement.</p>
                     </div>
                 )}
             </div>
        </div>
    );
};

export const Workspace: React.FC<{ user: User, onUpdateUser: (u: User) => void, onNavigateAccount: () => void, onLogout: () => void }> = ({ user, onUpdateUser, onNavigateAccount, onLogout }) => {
    const [currentView, setCurrentView] = useState<'dashboard' | 'growth'>('dashboard');
    const [showStudio, setShowStudio] = useState(false);
    const [showSerialProd, setShowSerialProd] = useState(false);
    const [scripts, setScripts] = useState<Script[]>([]);
    const [selectedScriptId, setSelectedScriptId] = useState<string|null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const [showChat, setShowChat] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChatSessionId, setActiveChatSessionId] = useState<string|null>(null);
    const [isChatProcessing, setIsChatProcessing] = useState(false);
    const chatClientRef = useRef<Chat | null>(null);

    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        const storedScripts = localStorage.getItem('wyslider_scripts');
        if (storedScripts) setScripts(JSON.parse(storedScripts));

        const storedChats = localStorage.getItem('wyslider_chats');
        if (storedChats) setChatSessions(JSON.parse(storedChats));

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const saveScripts = (newScripts: Script[]) => {
        setScripts(newScripts);
        localStorage.setItem('wyslider_scripts', JSON.stringify(newScripts));
    };

    const saveChats = (newChats: ChatSession[]) => {
        setChatSessions(newChats);
        localStorage.setItem('wyslider_chats', JSON.stringify(newChats));
    };

    const notify = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
        const id = Date.now().toString();
        const newNotif: AppNotification = { id, title, message, type, read: false, timestamp: new Date().toISOString() };
        setNotifications(prev => [...prev, newNotif]);
        
        if (Notification.permission === 'granted') {
            new Notification(title, { body: message });
        }
    };

    const handleGenerate = async (config: any) => {
        if (user.generationsLeft <= 0) { alert("Plus de crédits !"); return; }
        setIsGenerating(true);
        const data = await geminiService.generateScript(config.topic, config.tone, config.duration, user.youtubeUrl);
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
                niche: config.niche
            };
            const updatedScripts = [newScript, ...scripts];
            saveScripts(updatedScripts);
            setSelectedScriptId(newScript.id);
            onUpdateUser({...user, generationsLeft: user.generationsLeft - 1});
            notify("Script Généré !", `Le script "${newScript.title}" est prêt.`, 'success');
        }
        setIsGenerating(false);
    }

    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: `Discussion ${new Date().toLocaleTimeString()}`,
            messages: [{ id: '1', role: 'model', content: "Bonjour ! Comment puis-je vous aider avec votre chaîne aujourd'hui ?", timestamp: new Date().toISOString() }],
            createdAt: new Date().toISOString()
        };
        saveChats([newSession, ...chatSessions]);
        setActiveChatSessionId(newSession.id);
        chatClientRef.current = geminiService.startChatSession(user.niche || "YouTube Creation");
    };

    const handleSendMessage = async (msg: string) => {
        if(!activeChatSessionId) return;
        
        setIsChatProcessing(true);
        const activeSession = chatSessions.find(s => s.id === activeChatSessionId);
        if(!activeSession) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date().toISOString() };
        const updatedMessages = [...activeSession.messages, userMsg];
        
        const updatedSessions = chatSessions.map(s => s.id === activeChatSessionId ? { ...s, messages: updatedMessages } : s);
        saveChats(updatedSessions);

        if (!chatClientRef.current) chatClientRef.current = geminiService.startChatSession(user.niche || "");
        
        const response = await geminiService.sendMessageToChat(chatClientRef.current, msg);
        const modelMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', content: response, timestamp: new Date().toISOString() };
        
        const finalSessions = updatedSessions.map(s => s.id === activeChatSessionId ? { ...s, messages: [...updatedMessages, modelMsg] } : s);
        saveChats(finalSessions);
        setIsChatProcessing(false);
    };

    const selectedScript = scripts.find(s => s.id === selectedScriptId) || null;

    const TopBar = () => (
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0 z-20">
            <div className="flex items-center space-x-2">
                <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">WYS</span>
                <span className="text-xs font-mono text-gray-500 pt-1">V2.1</span>
            </div>
            
            <div className="flex items-center space-x-6">
                {user.storagePreference === 'drive' && (
                    <div className="flex items-center text-xs text-blue-400 font-bold px-2 py-1 bg-blue-900/20 rounded border border-blue-900/50" title="Synchronisé avec Drive">
                        <CloudIcon className="h-4 w-4 mr-1"/> DRIVE
                    </div>
                )}
                
                <button className="relative text-gray-400 hover:text-white" onClick={() => notify("Test", "Ceci est une notification de test.", "info")}>
                    <BellIcon className="h-5 w-5"/>
                    {notifications.length > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>}
                </button>

                <button className="bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1 rounded-full text-brand-purple font-bold border border-gray-700">
                    {user.generationsLeft} CRÉDITS
                </button>
                <button 
                    className={`text-gray-400 hover:text-white ${showChat ? 'text-brand-purple' : ''}`}
                    onClick={() => {
                        if(!showChat && chatSessions.length === 0) handleNewChat();
                        setShowChat(!showChat);
                    }}
                >
                    <ChatBubbleLeftRightIcon className="h-5 w-5"/>
                </button>
                <div className="h-5 w-px bg-gray-700"></div>
                <button onClick={onNavigateAccount} className="flex items-center space-x-2 text-gray-400 hover:text-white">
                    {user.profilePicture ? <img src={user.profilePicture} alt="Profile" className="h-8 w-8 rounded-full border border-gray-700"/> : <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700"><UserIcon className="h-4 w-4"/></div>}
                </button>
                <button onClick={onLogout} className="text-red-900 hover:text-red-500"><ArrowRightIcon className="h-5 w-5"/></button>
            </div>
        </header>
    );

    if (showSerialProd) {
        return (
            <>
                <SerialProd 
                    user={user}
                    onClose={() => setShowSerialProd(false)}
                    onSaveScripts={(newSeriesScripts) => saveScripts([...newSeriesScripts, ...scripts])}
                    onEditScript={(s) => {
                        setShowSerialProd(false);
                        setSelectedScriptId(s.id);
                        setShowStudio(true);
                    }}
                    onNavigateAccount={onNavigateAccount}
                    onNotify={(t, m) => notify(t, m, 'success')}
                />
                {notifications.map(n => <NotificationToast key={n.id} notification={n} onClose={id => setNotifications(prev => prev.filter(x => x.id !== id))} />)}
            </>
        );
    }

    if (showStudio) {
        return (
            <div className="flex flex-col h-screen bg-gray-900 text-white">
                <TopBar />
                <div className="flex-1 overflow-hidden relative">
                     <Studio 
                        scripts={scripts} 
                        selectedScript={selectedScript} 
                        onUpdate={(s) => saveScripts(scripts.map(old => old.id === s.id ? s : old))} 
                        onBack={() => { setShowStudio(false); setSelectedScriptId(null); }}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        user={user}
                     />
                     <ChatOverlay 
                        isOpen={showChat}
                        onClose={() => setShowChat(false)}
                        sessions={chatSessions}
                        activeSessionId={activeChatSessionId}
                        onNewChat={handleNewChat}
                        onSelectSession={setActiveChatSessionId}
                        onDeleteSession={(id) => saveChats(chatSessions.filter(s => s.id !== id))}
                        onDeleteAllHistory={() => saveChats([])}
                        onSendMessage={handleSendMessage}
                        isProcessing={isChatProcessing}
                    />
                    {notifications.map(n => <NotificationToast key={n.id} notification={n} onClose={id => setNotifications(prev => prev.filter(x => x.id !== id))} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
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
                            onSelect={(s) => { setSelectedScriptId(s.id); setShowStudio(true); }}
                            onDelete={(id) => saveScripts(scripts.filter(s => s.id !== id))}
                            onOpenStudio={() => { setSelectedScriptId(null); setShowStudio(true); }}
                            onOpenSerial={() => setShowSerialProd(true)}
                         />
                         
                         <ChatOverlay 
                            isOpen={showChat}
                            onClose={() => setShowChat(false)}
                            sessions={chatSessions}
                            activeSessionId={activeChatSessionId}
                            onNewChat={handleNewChat}
                            onSelectSession={setActiveChatSessionId}
                            onDeleteSession={(id) => saveChats(chatSessions.filter(s => s.id !== id))}
                            onDeleteAllHistory={() => saveChats([])}
                            onSendMessage={handleSendMessage}
                            isProcessing={isChatProcessing}
                        />

                        {notifications.map(n => <NotificationToast key={n.id} notification={n} onClose={id => setNotifications(prev => prev.filter(x => x.id !== id))} />)}
                    </div>
                    <div className="w-1/2 h-full overflow-hidden">
                        <Growth user={user} />
                    </div>
                </div>
            </div>
        </div>
    );
};
