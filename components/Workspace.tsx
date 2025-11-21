
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppScreen, Script, User, ScriptSection, RepurposedContent, ScriptVersion, ChatMessage, EpisodeSuggestion, SeriesGenerationProgress, SponsorshipDeal } from '../types';
import { Button } from './Button';
import { PlusIcon, PlayIcon, MinusIcon, XMarkIcon, DiamondIcon, RobotIcon, RefreshIcon, PhotoIcon, VideoIcon, Bars3Icon, TrashIcon, ShareIcon, ArrowDownTrayIcon, PencilSquareIcon, CheckIcon, PaperAirplaneIcon, SparklesIcon, ChartBarIcon, BriefcaseIcon, CalendarIcon, FireIcon, BoltIcon } from './icons';
import { Modal } from './Modal';
import * as geminiService from '../services/geminiService';
import { Chat } from '@google/genai';
import { APP_URL } from '../constants';
import { jsPDF } from "jspdf";

// --- Shared Utils ---

const downloadScript = (script: Script, format: 'srt' | 'pdf') => {
    if (format === 'srt') {
        if (!script.srtFile) {
            alert("Aucun fichier SRT disponible.");
            return;
        }
        const blob = new Blob([script.srtFile], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${fileName}.srt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPos = 20;

        const checkPageBreak = (heightNeeded: number) => {
            if (yPos + heightNeeded > pageHeight - margin) {
                doc.addPage();
                yPos = 20;
            }
        };

        const printTextLines = (text: string | string[], lineHeight: number) => {
            const lines = Array.isArray(text) ? text : [text];
            lines.forEach(line => {
                checkPageBreak(lineHeight);
                doc.text(line, margin, yPos);
                yPos += lineHeight;
            });
        };

        // Title
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        const splitTitle = doc.splitTextToSize(script.title, pageWidth - 2 * margin);
        printTextLines(splitTitle, 10);
        yPos += 5;

        // Meta info
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        printTextLines(`Format: ${script.format} | Ton: ${script.tone}`, 7);
        yPos += 5;

        // YouTube Description
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        printTextLines("Description YouTube:", 8);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(script.youtubeDescription || "", pageWidth - 2 * margin);
        printTextLines(splitDesc, 5);
        yPos += 10;

        // Sections
        script.sections.forEach((section, index) => {
            // Ensure space for section header
            checkPageBreak(15);
            
            // Title
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            const titleLine = `${index + 1}. ${section.title} (${section.estimatedTime}s)`;
            printTextLines(titleLine, 8);

            // Visual Note
            doc.setFontSize(11);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100);
            const splitVisual = doc.splitTextToSize(`Note Visuelle: ${section.visualNote}`, pageWidth - 2 * margin);
            printTextLines(splitVisual, 5);
            
            doc.setTextColor(0);
            yPos += 2;

            // Content
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            const splitContent = doc.splitTextToSize(section.content, pageWidth - 2 * margin);
            printTextLines(splitContent, 6);
            
            yPos += 8; // Spacing after section
        });

        doc.save(`${script.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    }
};

const ShareModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    script: Script;
}> = ({ isOpen, onClose, script }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copier le lien');
    const shareUrl = `${APP_URL}/view-script?id=${script.id}`;

    useEffect(() => {
        if (isOpen) {
            setCopyButtonText('Copier le lien');
        }
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopyButtonText('Copié !');
            setTimeout(() => setCopyButtonText('Copier le lien'), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Erreur lors de la copie du lien.');
        });
    };

    const handleEmailShare = () => {
        const subject = encodeURIComponent(`Script WySlider: ${script.title}`);
        const body = encodeURIComponent(`Regarde ce script que j'ai créé avec WySlider :\n\n${shareUrl}\n\nSujet: ${script.topic}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Partager votre script">
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Partagez un lien lecture seule ou envoyez-le par email.</p>
                <div className="flex items-center space-x-2">
                    <input 
                        type="text" 
                        value={shareUrl} 
                        readOnly 
                        className="flex-grow px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    />
                    <Button onClick={handleCopy} variant="secondary" className="!px-4 !py-2">
                        {copyButtonText}
                    </Button>
                </div>
                 <Button onClick={handleEmailShare} className="w-full">
                    Envoyer par Email
                </Button>
            </div>
        </Modal>
    );
};

const TitleOptimizerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    script: Script;
    onUpdateTitle: (newTitle: string) => void;
}> = ({ isOpen, onClose, script, onUpdateTitle }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && suggestions.length === 0) {
            fetchSuggestions();
        }
    }, [isOpen]);

    const fetchSuggestions = async () => {
        setIsLoading(true);
        const titles = await geminiService.generateTitleVariations(script.topic, script.title);
        setSuggestions(titles);
        setIsLoading(false);
    }

    const handleSelect = (title: string) => {
        onUpdateTitle(title);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Optimiseur de Titre (SEO & CTR)">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">Voici des suggestions pour maximiser vos vues :</p>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <svg className="animate-spin h-8 w-8 text-brand-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {suggestions.map((title, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleSelect(title)}
                                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-purple hover:bg-brand-purple/5 transition font-medium"
                            >
                                {title}
                            </button>
                        ))}
                    </div>
                )}
                <Button onClick={fetchSuggestions} variant="secondary" className="w-full mt-2">
                    Générer d'autres idées
                </Button>
            </div>
        </Modal>
    );
}

// --- NEW SCREENS ---

const GrowthScreen: React.FC<{ scripts: Script[], user: User }> = ({ scripts, user }) => {
    const [seoUrl, setSeoUrl] = useState('');
    const [seoResult, setSeoResult] = useState<{score: number, feedback: string[]} | null>(null);
    const [isLoadingSeo, setIsLoadingSeo] = useState(false);
    const [trends, setTrends] = useState<string[]>([]);
    const [isLoadingTrends, setIsLoadingTrends] = useState(false);
    const [selectedScriptForSEO, setSelectedScriptForSEO] = useState<Script | null>(scripts.length > 0 ? scripts[0] : null);


    const handleSeoAnalyze = async () => {
        if(!selectedScriptForSEO) return;
        setIsLoadingSeo(true);
        const result = await geminiService.analyzeSEO(selectedScriptForSEO.title, selectedScriptForSEO.youtubeDescription || "No description");
        setSeoResult({score: result.score, feedback: result.feedback});
        setIsLoadingSeo(false);
    };

    const handleGetTrends = async () => {
        setIsLoadingTrends(true);
        const results = await geminiService.getTrendIdeas(user.channelName || 'General');
        setTrends(results);
        setIsLoadingTrends(false);
    };

    return (
        <div className="p-4 sm:p-8 h-full overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SEO Studio */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-4 flex items-center"><ChartBarIcon className="h-6 w-6 mr-2 text-brand-blue"/>SEO Studio</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Analysez vos scripts existants pour optimiser leur portée.</p>
                
                <div className="space-y-4">
                    <div>
                         <label className="block text-sm font-semibold mb-1">Sélectionner un script</label>
                         <select 
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                            onChange={(e) => setSelectedScriptForSEO(scripts.find(s => s.id === e.target.value) || null)}
                            value={selectedScriptForSEO?.id || ''}
                         >
                             {scripts.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                         </select>
                    </div>
                    <Button onClick={handleSeoAnalyze} isLoading={isLoadingSeo} className="w-full">Analyser le potentiel SEO</Button>
                </div>

                {seoResult && (
                    <div className="mt-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-bold text-lg">Score SEO</span>
                            <span className={`text-2xl font-extrabold ${seoResult.score > 70 ? 'text-green-500' : seoResult.score > 40 ? 'text-orange-500' : 'text-red-500'}`}>{seoResult.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div className={`bg-brand-blue h-2.5 rounded-full`} style={{width: `${seoResult.score}%`}}></div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Conseils d'amélioration :</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                {seoResult.feedback.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Trend Hunter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                 <h2 className="text-2xl font-bold mb-4 flex items-center"><FireIcon className="h-6 w-6 mr-2 text-orange-500"/>Trend Hunter</h2>
                 <p className="text-gray-500 dark:text-gray-400 mb-4">L'IA scanne votre niche pour trouver des sujets viraux.</p>
                 
                 <Button onClick={handleGetTrends} isLoading={isLoadingTrends} variant="secondary" className="w-full mb-6">
                    <RefreshIcon className="h-5 w-5 mr-2"/> Scanner les tendances
                 </Button>

                 <div className="space-y-3">
                     {trends.map((trend, idx) => (
                         <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-orange-500 flex items-start">
                             <span className="font-bold text-orange-500 mr-3">#{idx+1}</span>
                             <p className="font-medium">{trend}</p>
                         </div>
                     ))}
                     {!isLoadingTrends && trends.length === 0 && <p className="text-center text-gray-400 italic">Cliquez pour scanner...</p>}
                 </div>
            </div>

            {/* Editorial Calendar */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center"><CalendarIcon className="h-6 w-6 mr-2 text-brand-purple"/>Calendrier Éditorial</h2>
                    <button className="text-sm text-brand-purple font-semibold hover:underline">Synchroniser Notion</button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                     {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                         <div key={day} className="text-center font-bold text-gray-400 uppercase text-xs mb-2">{day}</div>
                     ))}
                     {Array.from({length: 30}).map((_, i) => (
                         <div key={i} className={`h-24 border border-gray-100 dark:border-gray-700 rounded-lg p-2 ${i === 12 ? 'bg-brand-purple/10 ring-1 ring-brand-purple' : ''}`}>
                             <span className="text-xs text-gray-400">{i+1}</span>
                             {i === 12 && (
                                 <div className="mt-1 p-1 bg-brand-purple text-white text-[10px] rounded truncate">
                                     Lancement Série...
                                 </div>
                             )}
                             {i === 15 && (
                                 <div className="mt-1 p-1 bg-blue-500 text-white text-[10px] rounded truncate">
                                     Vlog IA #2
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

const BusinessScreen: React.FC<{ user: User }> = ({ user }) => {
    const [deals, setDeals] = useState<SponsorshipDeal[]>([
        { id: '1', brandName: 'NordVPN', status: 'contacted', amount: 500 },
        { id: '2', brandName: 'Skillshare', status: 'negotiating', amount: 750 },
    ]);
    const [pitchBrand, setPitchBrand] = useState('');
    const [pitchResult, setPitchResult] = useState('');
    const [isLoadingPitch, setIsLoadingPitch] = useState(false);

    const moveDeal = (id: string, status: SponsorshipDeal['status']) => {
        setDeals(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    };

    const handleGeneratePitch = async () => {
        if(!pitchBrand) return;
        setIsLoadingPitch(true);
        const email = await geminiService.generatePitchEmail(pitchBrand, user.channelName, "Tech/Lifestyle");
        setPitchResult(email);
        setIsLoadingPitch(false);
    };

    const Columns = {
        contacted: 'Contacté',
        negotiating: 'En Négociation',
        closed: 'Signé',
    };

    return (
        <div className="p-4 sm:p-8 h-full overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
             {/* Sponsorship Tracker */}
             <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-6 flex items-center"><BriefcaseIcon className="h-6 w-6 mr-2 text-green-600"/>Sponsorship Tracker</h2>
                
                <div className="grid grid-cols-3 gap-4 h-[400px]">
                    {(Object.keys(Columns) as Array<keyof typeof Columns>).map(status => (
                        <div key={status} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 flex flex-col">
                            <h3 className="font-bold text-sm uppercase text-gray-500 mb-3">{Columns[status]}</h3>
                            <div className="space-y-2 flex-grow overflow-y-auto">
                                {deals.filter(d => d.status === status).map(deal => (
                                    <div key={deal.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-200 dark:border-gray-600 cursor-grab">
                                        <p className="font-bold">{deal.brandName}</p>
                                        <p className="text-sm text-gray-500">${deal.amount}</p>
                                        <div className="mt-2 flex justify-end space-x-1">
                                            {status !== 'contacted' && <button onClick={() => moveDeal(deal.id, 'contacted')} className="text-xs px-1 bg-gray-200 rounded">←</button>}
                                            {status !== 'closed' && <button onClick={() => moveDeal(deal.id, status === 'contacted' ? 'negotiating' : 'closed')} className="text-xs px-1 bg-gray-200 rounded">→</button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <button className="mt-2 text-sm text-center text-gray-400 hover:text-gray-600">+ Ajouter</button>
                        </div>
                    ))}
                </div>
             </div>

             {/* Pitch Generator */}
             <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex flex-col">
                <h2 className="text-2xl font-bold mb-4 flex items-center"><BoltIcon className="h-6 w-6 mr-2 text-yellow-500"/>Pitch Generator</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Générez un email de démarchage personnalisé.</p>
                
                <div className="space-y-3 mb-4">
                    <input 
                        type="text" 
                        value={pitchBrand} 
                        onChange={e => setPitchBrand(e.target.value)} 
                        placeholder="Nom de la marque (ex: Nike)" 
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    />
                    <Button onClick={handleGeneratePitch} isLoading={isLoadingPitch} className="w-full">Générer Pitch</Button>
                </div>

                <div className="flex-grow bg-gray-100 dark:bg-gray-700 rounded-lg p-3 overflow-y-auto text-xs whitespace-pre-wrap font-mono">
                    {pitchResult || "// Le résultat apparaîtra ici..."}
                </div>
             </div>
        </div>
    );
};


// Dashboard Screen
const DashboardScreen: React.FC<{ 
    scripts: Script[], 
    onCreateNew: () => void, 
    onEdit: (script: Script) => void,
    onUpdateScripts: (scripts: Script[]) => void
}> = ({ scripts, onCreateNew, onEdit, onUpdateScripts }) => {
    const [viewMode, setViewMode] = useState<'scripts' | 'series'>('scripts');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedScriptIds, setSelectedScriptIds] = useState<Set<string>>(new Set());
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [scriptToShare, setScriptToShare] = useState<Script | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Group scripts by series
    const seriesGroups = React.useMemo(() => {
        const groups: { [key: string]: Script[] } = {};
        scripts.filter(s => s.seriesId).forEach(s => {
            if (!groups[s.seriesId!]) {
                groups[s.seriesId!] = [];
            }
            groups[s.seriesId!].push(s);
        });
        return groups;
    }, [scripts]);

    const displayedScripts: Script[] = viewMode === 'scripts' 
        ? scripts.filter(s => !s.seriesId) 
        : []; // For series view we render groups, not individual scripts

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelection = new Set(selectedScriptIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedScriptIds(newSelection);
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedScriptIds(new Set());
        setIsMenuOpen(false);
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Voulez-vous vraiment supprimer ${selectedScriptIds.size} script(s) ?`)) {
            const updatedScripts = scripts.filter(s => !selectedScriptIds.has(s.id));
            onUpdateScripts(updatedScripts);
            setSelectionMode(false);
            setSelectedScriptIds(new Set());
        }
    };
    
    const handleDeleteSeries = (seriesId: string) => {
        if (window.confirm(`Voulez-vous supprimer toute la série ?`)) {
             const updatedScripts = scripts.filter(s => s.seriesId !== seriesId);
             onUpdateScripts(updatedScripts);
        }
    }

    const handleShareSelected = () => {
        const selectedScripts = scripts.filter(s => selectedScriptIds.has(s.id));
        const titles = selectedScripts.map(s => `- ${s.title}`).join('\n');
        const subject = encodeURIComponent("Mes Scripts WySlider");
        const body = encodeURIComponent(`Voici une liste de scripts que j'ai créés :\n\n${titles}\n\n(Ouvrez l'app pour les voir en détail)`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setSelectionMode(false);
        setSelectedScriptIds(new Set());
    };

    const handleEditSelected = () => {
        if (selectedScriptIds.size !== 1) return;
        const scriptId = Array.from(selectedScriptIds)[0];
        const script = scripts.find(s => s.id === scriptId);
        if (script) {
            onEdit(script);
            setSelectionMode(false);
            setSelectedScriptIds(new Set());
        }
    }

    const handleCardClick = (script: Script, e: React.MouseEvent) => {
        if (selectionMode) {
            toggleSelection(script.id, e);
        } else {
            onEdit(script);
        }
    };
    
    const handleOpenShareModal = (script: Script, e: React.MouseEvent) => {
        e.stopPropagation();
        setScriptToShare(script);
        setIsShareModalOpen(true);
    };

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col relative">
            {scriptToShare && <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} script={scriptToShare} />}
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl sm:text-3xl font-bold">Mon Espace</h1>
                    <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                        <button 
                            onClick={() => setViewMode('scripts')} 
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'scripts' ? 'bg-white dark:bg-gray-800 shadow text-brand-purple' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Scripts
                        </button>
                         <button 
                            onClick={() => setViewMode('series')} 
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'series' ? 'bg-white dark:bg-gray-800 shadow text-brand-purple' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Séries
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                     {viewMode === 'scripts' && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
                                    <button onClick={toggleSelectionMode} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                                        <CheckIcon className="h-5 w-5 mr-2 text-brand-purple"/>
                                        {selectionMode ? 'Quitter le mode sélection' : 'Gérer / Sélectionner'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <Button onClick={onCreateNew}>
                        <PlusIcon className="h-5 w-5 sm:mr-2"/>
                        <span className="hidden sm:inline">Créer</span>
                    </Button>
                </div>
            </div>

            {/* Selection Actions Toolbar */}
            {selectionMode && viewMode === 'scripts' && (
                 <div className="mb-6 bg-brand-purple/10 border border-brand-purple/20 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 animate-fade-in">
                    <span className="font-semibold text-brand-purple">{selectedScriptIds.size} sélectionné(s)</span>
                    <div className="flex space-x-2">
                        <button onClick={handleDeleteSelected} disabled={selectedScriptIds.size === 0} className="flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm">
                            <TrashIcon className="h-4 w-4 mr-1 sm:mr-2"/> Supprimer
                        </button>
                        <button onClick={handleShareSelected} disabled={selectedScriptIds.size === 0} className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm">
                            <ShareIcon className="h-4 w-4 mr-1 sm:mr-2"/> Partager (Email)
                        </button>
                        {selectedScriptIds.size === 1 && (
                            <button onClick={handleEditSelected} className="flex items-center px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition text-sm">
                                <PencilSquareIcon className="h-4 w-4 mr-1 sm:mr-2"/> Modifier
                            </button>
                        )}
                    </div>
                 </div>
            )}

            {/* CONTENT - SCRIPTS VIEW */}
            {viewMode === 'scripts' && (
                <>
                    {displayedScripts.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                            <p>Aucun script individuel. <br/> Les scripts créés via "Serial Prod" sont dans l'onglet Séries.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto">
                            {displayedScripts.map(script => (
                                <div 
                                    key={script.id} 
                                    onClick={(e) => handleCardClick(script, e)} 
                                    className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all group flex flex-col ${selectionMode && selectedScriptIds.has(script.id) ? 'ring-2 ring-brand-purple transform scale-95' : 'hover:-translate-y-1'}`}
                                >
                                    {!selectionMode && (
                                        <button
                                            onClick={(e) => handleOpenShareModal(script, e)}
                                            className="absolute top-2 right-2 z-20 p-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/80 dark:hover:bg-gray-900/80"
                                            title="Partager le script"
                                        >
                                            <ShareIcon className="h-4 w-4 text-gray-800 dark:text-gray-200" />
                                        </button>
                                    )}
                                    {selectionMode && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedScriptIds.has(script.id) ? 'bg-brand-purple border-brand-purple' : 'bg-white/50 border-gray-400'}`}>
                                                {selectedScriptIds.has(script.id) && <CheckIcon className="h-4 w-4 text-white" />}
                                            </div>
                                        </div>
                                    )}
                                    <div className="aspect-video bg-gradient-to-br from-brand-purple to-brand-blue rounded-md mb-4 flex items-center justify-center overflow-hidden relative">
                                    {script.generatedThumbnail ? (
                                        <img src={`data:image/png;base64,${script.generatedThumbnail}`} alt="Thumbnail" className="w-full h-full object-cover" />
                                    ) : (
                                        <h3 className="text-white font-bold text-lg p-2 text-center select-none">{script.title}</h3>
                                    )}
                                    </div>
                                    <p className="font-semibold truncate group-hover:text-brand-purple select-none">{script.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-auto pt-2 select-none">Créé le: {new Date(script.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* CONTENT - SERIES VIEW */}
            {viewMode === 'series' && (
                <>
                    {Object.keys(seriesGroups).length === 0 ? (
                        <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                            <p>Aucune série sauvegardée. <br/> Utilisez l'outil "Serial Prod" pour en créer une.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(seriesGroups).map(([seriesId, groupScripts]) => (
                                <div key={seriesId} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                 <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Série</span>
                                                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{groupScripts[0]?.seriesName || 'Série sans titre'}</h2>
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{groupScripts.length} Épisodes • Créée le {new Date(groupScripts[0]?.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button onClick={() => handleDeleteSeries(seriesId)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {groupScripts.map((script, idx) => (
                                            <div 
                                                key={script.id} 
                                                onClick={() => onEdit(script)}
                                                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-brand-purple cursor-pointer transition group"
                                            >
                                                <div className="flex-shrink-0 h-10 w-10 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center font-bold mr-3">
                                                    {idx + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate text-sm group-hover:text-brand-purple">{script.title}</p>
                                                    <p className="text-xs text-gray-500">{script.format}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Generator Screen
const GeneratorScreen: React.FC<{ 
    activeScript: Script | null, 
    onUpdateScript: (s: Script, navigate?: boolean) => void, 
    user: User, 
    onUpdateUser: (u: User) => void
}> = ({ activeScript, onUpdateScript, user, onUpdateUser }) => {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('Engaging');
    const [format, setFormat] = useState<'<60s' | '3-5min' | '8-15min'>('3-5min');
    const [isLoading, setIsLoading] = useState(false);

    // State for the manual section form
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newSectionContent, setNewSectionContent] = useState('');
    const [newSectionVisualNote, setNewSectionVisualNote] = useState('');
    const [newSectionTime, setNewSectionTime] = useState(30);
    const [newSectionRhythm, setNewSectionRhythm] = useState<'normal' | 'slow' | 'intense'>('normal');

    useEffect(() => {
      if (activeScript) {
        setTopic(activeScript.topic);
        setTone(activeScript.tone);
        setFormat(activeScript.format);
      }
    }, [activeScript]);


    const handleGenerate = async () => {
        if (!topic || user.generationsLeft <= 0) {
            alert(user.generationsLeft <= 0 ? "Vous n'avez plus de générations. Rechargez via la page Compte." : "Veuillez entrer un sujet.");
            return;
        }

        setIsLoading(true);
        const result = await geminiService.generateScript(topic, tone, format, user.youtubeUrl);
        setIsLoading(false);

        if (result) {
            const newScript: Script = {
                ...activeScript!,
                id: activeScript?.id || `script_${Date.now()}`,
                title: result.title || topic,
                topic,
                tone,
                format,
                sections: result.sections || [],
                createdAt: activeScript?.createdAt || new Date().toISOString(),
                youtubeDescription: result.youtubeDescription,
                srtFile: result.srtFile
            };
            onUpdateScript(newScript, true);
            onUpdateUser({ ...user, generationsLeft: user.generationsLeft - 1 });
        } else {
            alert("La génération du script a échoué. Veuillez réessayer.");
        }
    };

    const handleAddSection = () => {
        if (!activeScript) {
            alert("Veuillez d'abord générer ou sélectionner un script.");
            return;
        }

        if (!newSectionTitle || !newSectionContent) {
            alert("Le titre et le contenu de la section sont obligatoires.");
            return;
        }

        const newSection: ScriptSection = {
            id: `section_${Date.now()}`,
            title: newSectionTitle,
            content: newSectionContent,
            visualNote: newSectionVisualNote,
            estimatedTime: newSectionTime,
            rhythm: newSectionRhythm,
        };

        const updatedScript = {
            ...activeScript,
            sections: [...activeScript.sections, newSection],
        };

        onUpdateScript(updatedScript);

        // Reset form fields
        setNewSectionTitle('');
        setNewSectionContent('');
        setNewSectionVisualNote('');
        setNewSectionTime(30);
        setNewSectionRhythm('normal');
    };
    
    const handleSectionChange = (sectionId: string, field: keyof Omit<ScriptSection, 'id' | 'generatedImage'>, value: string | number) => {
        if (!activeScript) return;

        const updatedSections = activeScript.sections.map(section => {
            if (section.id === sectionId) {
                const updatedValue = field === 'estimatedTime' ? parseInt(String(value), 10) || 0 : value;
                return { ...section, [field]: updatedValue };
            }
            return section;
        });

        onUpdateScript({ ...activeScript, sections: updatedSections });
    };

    const handleDeleteSection = (sectionId: string) => {
        if (!activeScript) return;

        const updatedSections = activeScript.sections.filter(section => section.id !== sectionId);
        onUpdateScript({ ...activeScript, sections: updatedSections });
    };

    const handleSaveVersion = () => {
        if (!activeScript) return;

        const newVersion: ScriptVersion = {
            timestamp: new Date().toISOString(),
            sections: JSON.parse(JSON.stringify(activeScript.sections)), // Deep copy
            title: activeScript.title,
            youtubeDescription: activeScript.youtubeDescription,
            srtFile: activeScript.srtFile,
        };

        const updatedScript = {
            ...activeScript,
            versions: [...(activeScript.versions || []), newVersion],
        };
        onUpdateScript(updatedScript);
        alert("Version sauvegardée !");
    };

    const handleRestoreVersion = (version: ScriptVersion) => {
        if (!activeScript || !window.confirm("Restaurer cette version écrasera les modifications actuelles. Continuer ?")) return;

        const updatedScript = {
            ...activeScript,
            title: version.title,
            sections: version.sections,
            youtubeDescription: version.youtubeDescription,
            srtFile: version.srtFile,
        };
        onUpdateScript(updatedScript);
        alert("Version restaurée !");
    };
    
    if (!activeScript) return <div className="p-8 text-center">Sélectionnez ou créez un script pour commencer.</div>;

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
            {/* Left Sidebar */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col overflow-y-auto">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Configuration Créative</h2>
                    <div>
                        <label className="font-semibold text-sm">Sujet de la vidéo</label>
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Les secrets de l'algorithme YouTube" className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"/>
                    </div>
                    <div>
                        <label className="font-semibold text-sm">Ton</label>
                        <select value={tone} onChange={e => setTone(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                            <option>Humoristique</option>
                            <option>Sérieux</option>
                            <option>Énergique</option>
                            <option>Éducatif</option>
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold text-sm">Format</label>
                         <select value={format} onChange={e => setFormat(e.target.value as any)} className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                            <option value="<60s">Short / Reel (&lt;60s)</option>
                            <option value="3-5min">Vidéo courte (3-5min)</option>
                            <option value="8-15min">Vidéo standard (8-15min)</option>
                        </select>
                    </div>
                     <Button onClick={handleGenerate} isLoading={isLoading}>Générer le Script</Button>
                </div>

                <hr className="border-gray-200 dark:border-gray-600 my-6" />
                
                {/* Version History */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Historique des versions</h3>
                     <Button onClick={handleSaveVersion} variant="secondary">Sauvegarder la version actuelle</Button>
                     <div className="space-y-2 max-h-40 overflow-y-auto">
                        {(activeScript.versions || []).slice().reverse().map(version => (
                            <div key={version.timestamp} className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center">
                                <span>{new Date(version.timestamp).toLocaleString()}</span>
                                <button onClick={() => handleRestoreVersion(version)} className="text-xs font-semibold text-brand-blue hover:underline">Restaurer</button>
                            </div>
                        ))}
                     </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-600 my-6" />

                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Ajouter une section manuellement</h3>
                    <div>
                        <label className="font-semibold text-sm">Titre</label>
                        <input type="text" value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} placeholder="Titre de la section" className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"/>
                    </div>
                     <div>
                        <label className="font-semibold text-sm">Contenu</label>
                        <textarea value={newSectionContent} onChange={e => setNewSectionContent(e.target.value)} placeholder="Contenu parlé..." rows={4} className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"/>
                    </div>
                     <div>
                        <label className="font-semibold text-sm">Note visuelle</label>
                        <input type="text" value={newSectionVisualNote} onChange={e => setNewSectionVisualNote(e.target.value)} placeholder="Description B-roll..." className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-semibold text-sm">Durée (sec)</label>
                            <input type="number" value={newSectionTime} onChange={e => setNewSectionTime(Number(e.target.value))} className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"/>
                        </div>
                        <div>
                            <label className="font-semibold text-sm">Rythme</label>
                            <select value={newSectionRhythm} onChange={e => setNewSectionRhythm(e.target.value as any)} className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                                <option value="normal">Normal</option>
                                <option value="slow">Lent</option>
                                <option value="intense">Intense</option>
                            </select>
                        </div>
                    </div>
                    <Button onClick={handleAddSection} variant="secondary" disabled={!activeScript}>
                        Ajouter la section
                    </Button>
                </div>
            </div>
            
            {/* Center Editor */}
            <div className="lg:col-span-9 bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col overflow-y-auto">
                <input 
                    type="text"
                    value={activeScript.title}
                    onChange={(e) => onUpdateScript({...activeScript, title: e.target.value})}
                    className="text-2xl font-bold mb-4 w-full bg-transparent focus:bg-gray-100 dark:focus:bg-gray-700 rounded-md p-2 -ml-2"
                />
                 {activeScript.sections.map((section) => (
                    <div key={section.id} className="mb-6 p-4 border rounded-lg border-gray-200 dark:border-gray-700 space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <input
                                type="text"
                                value={section.title}
                                onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                                className="text-xl font-bold bg-gray-100 dark:bg-gray-700 rounded-md p-2 w-full focus:ring-2 focus:ring-brand-purple focus:outline-none"
                                placeholder="Titre de la section"
                            />
                            <button onClick={() => handleDeleteSection(section.id)} className="ml-4 text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10" title="Supprimer la section">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Contenu</label>
                            <textarea
                                value={section.content}
                                onChange={(e) => handleSectionChange(section.id, 'content', e.target.value)}
                                rows={6}
                                className="w-full mt-1 bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-purple focus:outline-none"
                                placeholder="Contenu parlé..."
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Note visuelle</label>
                            <input
                                type="text"
                                value={section.visualNote}
                                onChange={(e) => handleSectionChange(section.id, 'visualNote', e.target.value)}
                                className="w-full mt-1 bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm italic focus:ring-2 focus:ring-brand-purple focus:outline-none"
                                placeholder="Description B-roll..."
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm pt-2">
                            <div>
                                <label className="font-semibold text-gray-500 dark:text-gray-400">Durée (sec)</label>
                                <input
                                    type="number"
                                    value={section.estimatedTime}
                                    onChange={(e) => handleSectionChange(section.id, 'estimatedTime', e.target.value)}
                                    className="w-24 mt-1 bg-gray-100 dark:bg-gray-700 rounded-md p-2 focus:ring-2 focus:ring-brand-purple focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-500 dark:text-gray-400">Rythme</label>
                                <select
                                    value={section.rhythm}
                                    onChange={(e) => handleSectionChange(section.id, 'rhythm', e.target.value as any)}
                                    className="w-32 mt-1 bg-gray-100 dark:bg-gray-700 rounded-md p-2 border-transparent focus:ring-2 focus:ring-brand-purple focus:outline-none"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="slow">Lent</option>
                                    <option value="intense">Intense</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const VideoGenerationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    script: Script;
}> = ({ isOpen, onClose, script }) => {
    const [apiKeyReady, setApiKeyReady] = useState(false);
    const [generationState, setGenerationState] = useState<{status: 'idle' | 'generating' | 'success' | 'error', message: string, url?: string}>({status: 'idle', message: ''});

    useEffect(() => {
        if (isOpen) {
            (async () => {
                const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
                setApiKeyReady(hasKey);
            })();
        } else {
            // Reset state on close
            setGenerationState({status: 'idle', message: ''});
        }
    }, [isOpen]);

    const handleSelectKey = async () => {
        await (window as any).aistudio?.openSelectKey();
        // Assume key selection is successful and trigger a re-check/re-render
        const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
        setApiKeyReady(hasKey);
    };

    const handleGenerate = async () => {
        const prompt = `A dynamic and engaging YouTube video about "${script.topic}", with the title "${script.title}".`;
        
        try {
            setGenerationState({ status: 'generating', message: 'Starting...' });
            const videoUrl = await geminiService.generateVideo(prompt, (message) => {
                setGenerationState(prev => ({ ...prev, message }));
            });

            if (videoUrl) {
                setGenerationState({ status: 'success', message: 'Video generated successfully!', url: videoUrl });
            } else {
                throw new Error("Video generation failed to return a URL.");
            }
        } catch (error: any) {
            let message = error.message;
            if (message.includes("Requested entity was not found")) {
                message = "API Key error. Please re-select your API key and ensure billing is enabled.";
                setApiKeyReady(false); // Force re-selection
            }
            setGenerationState({ status: 'error', message });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Génération Vidéo IA (PRO+)">
            <div className="space-y-4">
                {generationState.status === 'success' && generationState.url ? (
                    <div>
                        <p className="mb-4 text-green-600 dark:text-green-400">{generationState.message}</p>
                        <video controls src={generationState.url} className="w-full rounded-lg"></video>
                    </div>
                ) : generationState.status === 'generating' ? (
                     <div className="text-center p-8 space-y-4">
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-brand-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <p className="font-semibold text-lg">Génération en cours...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{generationState.message}</p>
                     </div>
                ) : (
                    <>
                        {!apiKeyReady ? (
                             <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg space-y-3">
                                <h4 className="font-bold">Action Requise</h4>
                                <p className="text-sm">Pour générer des vidéos avec le modèle Veo, vous devez sélectionner un projet avec la facturation activée.</p>
                                <p className="text-xs">Pour plus d'informations, consultez la <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">documentation sur la facturation</a>.</p>
                                <Button onClick={handleSelectKey}>Sélectionner une Clé API</Button>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <p>Prêt à transformer votre script en vidéo ?</p>
                                <Button onClick={handleGenerate}>Lancer la génération</Button>
                            </div>
                        )}
                        {generationState.status === 'error' && (
                             <p className="mt-4 text-red-600 dark:text-red-400 text-sm p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <strong>Erreur:</strong> {generationState.message}
                            </p>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

// Serial Prod Screen
const SerialProdScreen: React.FC<{ 
    user: User, 
    onUpdateUser: (u: User) => void, 
    onNavigateAccount: () => void, 
    onAddScript: (s: Script) => void,
    onNavigateToDashboard: () => void,
    scripts: Script[],
    onEditScript: (s: Script) => void
}> = ({ user, onUpdateUser, onNavigateAccount, onAddScript, onNavigateToDashboard, scripts, onEditScript }) => {
    const [concept, setConcept] = useState('');
    const [episodeCount, setEpisodeCount] = useState(5);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [suggestions, setSuggestions] = useState<EpisodeSuggestion[]>([]);
    const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [generationProgress, setGenerationProgress] = useState<SeriesGenerationProgress[]>([]);

    const handleGenerateSuggestions = async () => {
        if (!concept) return;
        setIsGeneratingSuggestions(true);
        const results = await geminiService.generateEpisodeSuggestions(concept, episodeCount);
        setSuggestions(results);
        setSelectedEpisodes(results.map((_, i) => i)); // Select all by default
        setIsGeneratingSuggestions(false);
        setStep(2);
    };

    const handleStartProduction = async () => {
        if(selectedEpisodes.length === 0) return;
        
        // Group Identifier
        const seriesId = `series_${Date.now()}`;

        // Initialize progress for selected episodes
        const initialProgress: SeriesGenerationProgress[] = selectedEpisodes.map(idx => ({
            episodeIndex: idx,
            status: 'waiting'
        }));
        setGenerationProgress(initialProgress);
        setStep(3);

        for (let i = 0; i < initialProgress.length; i++) {
            const progressItem = initialProgress[i];
            const episode = suggestions[progressItem.episodeIndex];
            
            updateProgress(progressItem.episodeIndex, 'generating_script');
            
            try {
                // Generate Real Script using AI
                const result = await geminiService.generateScript(episode.title, 'Engaging', '8-15min', user.channelName || 'General Audience');
                
                if (result && result.sections) {
                     const scriptId = `script_serial_${Date.now()}_${i}`;
                     const newScript: Script = {
                        id: scriptId,
                        title: result.title || episode.title,
                        topic: concept, // Use series concept as topic
                        tone: 'Engaging',
                        format: '8-15min',
                        sections: result.sections || [],
                        createdAt: new Date().toISOString(),
                        youtubeDescription: result.youtubeDescription,
                        srtFile: result.srtFile,
                        seriesId: seriesId,
                        seriesName: concept
                    };
                    onAddScript(newScript);
                    updateProgress(progressItem.episodeIndex, 'generating_video');
                    // Mock video generation time
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    updateProgress(progressItem.episodeIndex, 'complete', scriptId);
                } else {
                    updateProgress(progressItem.episodeIndex, 'error');
                }
            } catch (e) {
                console.error(e);
                updateProgress(progressItem.episodeIndex, 'error');
            }
        }
    };

    const updateProgress = (index: number, status: SeriesGenerationProgress['status'], scriptId?: string) => {
        setGenerationProgress(prev => prev.map(p => p.episodeIndex === index ? { ...p, status, scriptId } : p));
    };

    const toggleEpisodeSelection = (index: number) => {
        if (selectedEpisodes.includes(index)) {
            setSelectedEpisodes(selectedEpisodes.filter(i => i !== index));
        } else {
            setSelectedEpisodes([...selectedEpisodes, index]);
        }
    };

    const handleViewScript = (scriptId: string) => {
        const script = scripts.find(s => s.id === scriptId);
        if(script) {
            onEditScript(script);
        }
    }

    const handleDownloadAction = (scriptId: string, format: 'srt' | 'pdf') => {
        const script = scripts.find(s => s.id === scriptId);
        if(script) {
            downloadScript(script, format);
        }
    }

    if (!user.isProPlus) {
        return (
            <div className="h-full flex items-center justify-center p-8 text-center">
                <div className="max-w-md">
                    <div className="mb-6 inline-block p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                         <VideoIcon className="h-12 w-12 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Fonctionnalité PRO+</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Serial Prod permet de générer automatiquement des séries entières de vidéos à partir d'un simple concept.
                    </p>
                    <Button onClick={onNavigateAccount}>Débloquer avec PRO+</Button>
                </div>
            </div>
        );
    }

    const allComplete = generationProgress.length > 0 && generationProgress.every(p => p.status === 'complete' || p.status === 'error');

    return (
        <div className="p-4 sm:p-8 h-full overflow-y-auto max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 flex items-center"><VideoIcon className="h-8 w-8 mr-3 text-brand-purple"/> Serial Prod</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">De l'idée à la série complète, automatiquement.</p>

            {/* Stepper */}
            <div className="flex items-center mb-8 text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className={`flex items-center ${step >= 1 ? 'text-brand-purple' : ''}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 1 ? 'border-brand-purple bg-brand-purple text-white' : 'border-gray-300'}`}>1</span>
                    Concept
                </div>
                <div className="flex-grow h-0.5 bg-gray-300 mx-4"></div>
                <div className={`flex items-center ${step >= 2 ? 'text-brand-purple' : ''}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 2 ? 'border-brand-purple bg-brand-purple text-white' : 'border-gray-300'}`}>2</span>
                    Sélection
                </div>
                <div className="flex-grow h-0.5 bg-gray-300 mx-4"></div>
                <div className={`flex items-center ${step >= 3 ? 'text-brand-purple' : ''}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 3 ? 'border-brand-purple bg-brand-purple text-white' : 'border-gray-300'}`}>3</span>
                    Production
                </div>
            </div>

            {/* Step 1: Concept */}
            {step === 1 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm animate-fade-in">
                    <div className="mb-6">
                        <label className="block text-lg font-semibold mb-2">Quel est le concept de votre série ?</label>
                        <input 
                            type="text" 
                            value={concept} 
                            onChange={e => setConcept(e.target.value)} 
                            placeholder="Ex: Apprendre le développement web en 7 jours, La face cachée de l'Histoire..."
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-purple focus:outline-none text-lg"
                        />
                    </div>
                    <div className="mb-8">
                        <label className="block text-lg font-semibold mb-2">Nombre d'épisodes</label>
                        <input 
                            type="range" 
                            min="3" 
                            max="15" 
                            value={episodeCount} 
                            onChange={e => setEpisodeCount(Number(e.target.value))} 
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-brand-purple"
                        />
                        <div className="text-center mt-2 font-bold text-brand-purple text-xl">{episodeCount} épisodes</div>
                    </div>
                    <Button onClick={handleGenerateSuggestions} isLoading={isGeneratingSuggestions} className="w-full text-lg py-4">
                        Proposer des épisodes
                    </Button>
                </div>
            )}

            {/* Step 2: Selection */}
            {step === 2 && (
                <div className="animate-fade-in">
                    <div className="grid gap-4 mb-8">
                        {suggestions.map((episode, index) => (
                            <div 
                                key={index} 
                                onClick={() => toggleEpisodeSelection(index)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedEpisodes.includes(index) ? 'border-brand-purple bg-brand-purple/5' : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-300'}`}
                            >
                                <div className="flex items-start">
                                    <div className={`w-6 h-6 rounded-full border-2 mr-4 flex-shrink-0 flex items-center justify-center ${selectedEpisodes.includes(index) ? 'bg-brand-purple border-brand-purple' : 'border-gray-400'}`}>
                                        {selectedEpisodes.includes(index) && <CheckIcon className="h-4 w-4 text-white" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Épisode {index + 1}: {episode.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">{episode.summary}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex space-x-4">
                        <Button onClick={() => setStep(1)} variant="secondary">Retour</Button>
                        <Button onClick={handleStartProduction} className="flex-grow">Lancer la production ({selectedEpisodes.length} vidéos)</Button>
                    </div>
                </div>
            )}

            {/* Step 3: Production */}
            {step === 3 && (
                <div className="animate-fade-in space-y-6">
                    {generationProgress.map((progress) => {
                         const episode = suggestions[progress.episodeIndex];
                         let statusText = '';
                         let statusColor = 'text-gray-500';
                         let bgColor = 'bg-gray-100 dark:bg-gray-700';
                         
                         switch(progress.status) {
                             case 'waiting': statusText = 'En attente...'; break;
                             case 'generating_script': statusText = 'Écriture du script (IA)...'; statusColor = 'text-blue-500'; break;
                             case 'generating_video': statusText = 'Finalisation...'; statusColor = 'text-purple-500'; break;
                             case 'complete': statusText = 'Terminé'; statusColor = 'text-green-500'; bgColor = 'bg-green-50 dark:bg-green-900/20 border border-green-200'; break;
                             case 'error': statusText = 'Erreur'; statusColor = 'text-red-500'; break;
                         }

                         return (
                            <div key={progress.episodeIndex} className={`p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${bgColor}`}>
                                <div>
                                    <h4 className="font-bold text-lg">Épisode {progress.episodeIndex + 1}: {episode.title}</h4>
                                    <p className={`text-sm font-medium flex items-center ${statusColor}`}>
                                        {['generating_script', 'generating_video'].includes(progress.status) && (
                                             <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {statusText}
                                    </p>
                                </div>
                                {progress.status === 'complete' && progress.scriptId && (
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleViewScript(progress.scriptId!)} title="Voir le script" className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-brand-purple border border-gray-200 dark:border-gray-600 transition">
                                            <ArrowDownTrayIcon className="h-5 w-5 rotate-180 transform"/> {/* Reuse ArrowDown as Eye/Open icon or similar since we lack EyeIcon */}
                                        </button>
                                        <div className="relative group">
                                            <button className="flex items-center space-x-1 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 transition text-sm font-medium">
                                                <ArrowDownTrayIcon className="h-4 w-4"/>
                                                <span>Télécharger</span>
                                            </button>
                                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block z-10">
                                                <button onClick={() => handleDownloadAction(progress.scriptId!, 'srt')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Format .SRT</button>
                                                <button onClick={() => handleDownloadAction(progress.scriptId!, 'pdf')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Format .PDF</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                         );
                    })}
                     
                     {allComplete && (
                        <div className="text-center mt-8 animate-fade-in">
                            <p className="mb-4 text-green-600 dark:text-green-400 font-medium">Toute la série a été générée avec succès !</p>
                            <Button onClick={onNavigateToDashboard} className="text-lg px-8 py-4">
                                Sauvegarder ma série
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">Retrouvez-la dans l'onglet "Séries" du Dashboard</p>
                        </div>
                     )}
                     
                     {!allComplete && (
                        <div className="text-center mt-8">
                             <Button onClick={() => setStep(1)} variant="outline" disabled>Production en cours...</Button>
                        </div>
                     )}
                </div>
            )}
        </div>
    );
}


// Optimizer Screen
const OptimizerScreen: React.FC<{ activeScript: Script | null, onUpdateScript: (s: Script) => void, user: User, onNavigateAccount: () => void }> = ({ activeScript, onUpdateScript, user, onNavigateAccount }) => {
    const [currentSection, setCurrentSection] = useState<ScriptSection | null>(null);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [fontSize, setFontSize] = useState(16); // in pixels
    const [selectedVoice, setSelectedVoice] = useState('Kore');
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<'srt' | 'pdf'>('srt');
    
    const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
    const [rewritingSectionId, setRewritingSectionId] = useState<string | null>(null);

    // Pro+ States
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
    const [isRepurposing, setIsRepurposing] = useState(false);
    const [repurposedContent, setRepurposedContent] = useState<RepurposedContent | null>(null);
    const [activeProTab, setActiveProTab] = useState<'assistant' | 'repurpose' | 'integrations'>('assistant');
    
    // AI Chat Assistant States
    const [chatInstance, setChatInstance] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);


    const handleZoomIn = () => setFontSize(prev => Math.min(prev + 2, 32));
    const handleZoomOut = () => setFontSize(prev => Math.max(prev - 2, 12));
    
    useEffect(() => {
        if(activeScript && activeScript.sections.length > 0) {
            if (!currentSection || !activeScript.sections.some(s => s.id === currentSection.id)) {
                 setCurrentSection(activeScript.sections[0]);
            }
        } else {
            setCurrentSection(null);
        }
    }, [activeScript, currentSection]);
    
    // Initialize or re-initialize chat when activeScript changes
    useEffect(() => {
        if (activeScript && user.isProPlus) {
            const scriptContext = `Titre: ${activeScript.title}\nSujet: ${activeScript.topic}\nContenu: ${activeScript.sections.map(s => s.content).join('\n').substring(0, 2000)}...`;
            const chat = geminiService.startChatSession(scriptContext);
            setChatInstance(chat);
            setChatHistory([{
                role: 'model',
                content: "Bonjour ! Je suis votre assistant WySlider. Comment puis-je vous aider à brainstormer, répondre à vos questions ou améliorer votre script ?"
            }]);
        }
    }, [activeScript, user.isProPlus]);
    
     // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMessage.trim() || !chatInstance || isChatLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: currentMessage };
        setChatHistory(prev => [...prev, userMessage]);
        setCurrentMessage('');
        setIsChatLoading(true);

        const response = await geminiService.sendMessageToChat(chatInstance, currentMessage);
        
        const modelMessage: ChatMessage = { role: 'model', content: response };
        setChatHistory(prev => [...prev, modelMessage]);
        setIsChatLoading(false);
    };

    const handleGenerateImage = async () => {
        if (!currentSection || !activeScript) return;
        setIsLoadingImage(true);
        const imageB64 = await geminiService.generateImageForSection(currentSection.visualNote);
        setIsLoadingImage(false);
        if (imageB64) {
            const updatedSection = { ...currentSection, generatedImage: imageB64 };
            const updatedSections = activeScript.sections.map(s => 
                s.id === currentSection.id ? updatedSection : s
            );
            onUpdateScript({ ...activeScript, sections: updatedSections });
            setCurrentSection(updatedSection);
        }
    };

    const handleGenerateThumbnail = async () => {
        if (!user.isProPlus) {
            if(confirm("Générer une miniature est une fonctionnalité PRO+. Voulez-vous voir les offres ?")) onNavigateAccount();
            return;
        }
        if (!activeScript) return;
        setIsGeneratingThumbnail(true);
        const thumb = await geminiService.generateThumbnail(activeScript.title, activeScript.topic);
        if (thumb) {
            onUpdateScript({ ...activeScript, generatedThumbnail: thumb });
        }
        setIsGeneratingThumbnail(false);
    }

    const handleRepurpose = async () => {
        if (!user.isProPlus) {
            if(confirm("Le pack '1 script = 5 formats' est une fonctionnalité PRO+. Voulez-vous voir les offres ?")) onNavigateAccount();
            return;
        }
        if (!activeScript) return;
        setIsRepurposing(true);
        const fullScriptText = activeScript.sections.map(s => s.content).join(" ");
        const content = await geminiService.repurposeContent(fullScriptText);
        setRepurposedContent(content);
        setIsRepurposing(false);
    }
    
    const handleRewrite = async (sectionId: string, nuance: string) => {
        if (!activeScript) return;
        const section = activeScript.sections.find(s => s.id === sectionId);
        if (!section) return;

        setRewritingSectionId(sectionId);
        const rewrittenText = await geminiService.rewriteContent(section.content, nuance);
        
        const updatedSections = activeScript.sections.map(s => 
            s.id === sectionId ? { ...s, content: rewrittenText } : s
        );
        onUpdateScript({ ...activeScript, sections: updatedSections });
        setRewritingSectionId(null);
    }

    const playAudio = async (text: string) => {
        setIsPlayingAudio(true);
        try {
            const audioB64 = await geminiService.generateSpeech(text, selectedVoice);
            if (audioB64) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const binaryString = window.atob(audioB64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
                
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
                source.onended = () => setIsPlayingAudio(false);
            } else {
                setIsPlayingAudio(false);
            }
        } catch (e) {
            console.error("Audio playback error:", e);
            alert("Could not play audio. The generated data might be invalid.");
            setIsPlayingAudio(false);
        }
    }


    const handleVideoGen = () => {
        if (!user.isProPlus) {
            if(confirm("La génération vidéo complète est une fonctionnalité PRO+. Voir les offres ?")) onNavigateAccount();
        } else {
            setIsVideoModalOpen(true);
        }
    }

    const handleExport = () => {
        if (!activeScript) return;
        downloadScript(activeScript, exportFormat);
    };

    if (!activeScript) return <div className="p-8 text-center">Sélectionnez un script à optimiser.</div>;

    const totalTime = activeScript.sections.reduce((acc, section) => acc + section.estimatedTime, 0);

    const rhythmClasses = (rhythm: 'normal' | 'slow' | 'intense') => {
        switch (rhythm) {
            case 'intense': return 'bg-red-500 hover:bg-red-600';
            case 'slow': return 'bg-orange-500 hover:bg-orange-600';
            case 'normal':
            default: return 'bg-green-500 hover:bg-green-600';
        }
    };

    return (
        <div className="p-4 h-full flex flex-col">
             {activeScript && <VideoGenerationModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} script={activeScript} />}
             {activeScript && <TitleOptimizerModal isOpen={isTitleModalOpen} onClose={() => setIsTitleModalOpen(false)} script={activeScript} onUpdateTitle={(t) => onUpdateScript({...activeScript, title: t})}/>}
            
            <div className="flex justify-between items-center mb-4 flex-shrink-0 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold truncate">{activeScript.title}</h1>
                    <button onClick={() => setIsTitleModalOpen(true)} className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-brand-purple" title="Optimiser le titre">
                        <SparklesIcon className="h-5 w-5" />
                    </button>
                </div>
                 <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                        <button 
                            onClick={() => setExportFormat('srt')}
                            className={`px-3 py-2 text-sm font-medium transition ${exportFormat === 'srt' ? 'bg-brand-purple text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                        >
                            SRT
                        </button>
                        <button 
                            onClick={() => setExportFormat('pdf')}
                            className={`px-3 py-2 text-sm font-medium transition ${exportFormat === 'pdf' ? 'bg-brand-purple text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                        >
                            PDF
                        </button>
                    </div>
                    <Button onClick={handleExport} variant="outline" className="text-sm !py-2 !px-3">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Exporter
                    </Button>
                    <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-semibold border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    >
                        {['Kore', 'Puck', 'Charon', 'Zephyr', 'Fenrir'].map(voice => (
                            <option key={voice} value={voice}>{voice}</option>
                        ))}
                    </select>
                    <Button onClick={() => playAudio(currentSection?.content || '')} disabled={isPlayingAudio} className="!py-2 !px-3">
                        <PlayIcon className="h-5 w-5 mr-2" />
                        {isPlayingAudio ? 'Lecture...' : 'Lecture IA'}
                    </Button>
                </div>
            </div>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
                
                {/* Main Script Reader */}
                <div className="lg:col-span-6 flex flex-col bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm min-h-[500px] lg:min-h-0">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold truncate pr-4">{currentSection?.title}</h2>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                            <button onClick={handleZoomOut} disabled={fontSize <= 12} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50">
                                <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-gray-500 w-12 text-center">{Math.round(fontSize / 16 * 100)}%</span>
                            <button onClick={handleZoomIn} disabled={fontSize >= 32} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50">
                                <PlusIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Ligne de Temps du Rythme</h3>
                        <div className="flex w-full h-6 rounded-full overflow-hidden shadow-inner bg-gray-200 dark:bg-gray-700">
                            {totalTime > 0 && activeScript.sections.map(sec => (
                                <button
                                    key={sec.id}
                                    onClick={() => setCurrentSection(sec)}
                                    className={`h-full transition-all duration-300 ${rhythmClasses(sec.rhythm)} ${currentSection?.id === sec.id ? 'ring-2 ring-offset-2 ring-brand-purple ring-offset-white dark:ring-offset-gray-800' : ''}`}
                                    style={{ width: `${(sec.estimatedTime / totalTime) * 100}%` }}
                                    title={`${sec.title} (~${sec.estimatedTime}s)`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="overflow-y-auto mb-4 flex-grow prose dark:prose-invert max-w-none">
                      <p style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}>{currentSection?.content}</p>
                    </div>

                    {/* Rewriting Tools */}
                    {currentSection && (
                        <div className="flex space-x-2 mb-4 overflow-x-auto pb-1">
                            {['Plus Drôle', 'Plus Dramatique', 'Plus Court', 'Plus Simple'].map(nuance => (
                                <button 
                                    key={nuance}
                                    onClick={() => handleRewrite(currentSection.id, nuance)}
                                    disabled={!!rewritingSectionId}
                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs font-medium border border-gray-200 dark:border-gray-600 whitespace-nowrap"
                                >
                                    {rewritingSectionId === currentSection.id ? '...' : nuance}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex-shrink-0 flex overflow-x-auto pb-2 space-x-2">
                        {activeScript.sections.map((sec, i) => (
                           <button key={i} onClick={() => setCurrentSection(sec)} className={`flex-shrink-0 px-3 py-1 rounded-full text-sm whitespace-nowrap ${currentSection?.id === sec.id ? 'bg-brand-purple text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{sec.title}</button>
                        ))}
                    </div>
                </div>

                {/* Visuals Column */}
                <div className="lg:col-span-3 flex flex-col space-y-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-2">Notes de Montage & Visuels</h3>
                        <p className="text-sm italic text-gray-600 dark:text-gray-400 mb-4">{currentSection?.visualNote}</p>
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-4 overflow-hidden">
                            {isLoadingImage ? <div className="text-sm animate-pulse">Génération en cours...</div> : (
                                currentSection?.generatedImage ? 
                                <img src={`data:image/png;base64,${currentSection.generatedImage}`} alt="Generated visual" className="w-full h-full object-cover"/>
                                : <div className="text-center p-4"><PhotoIcon className="h-8 w-8 mx-auto text-gray-400 mb-2"/><p className="text-sm text-gray-500">Aucune image</p></div>
                            )}
                        </div>
                        <Button onClick={handleGenerateImage} isLoading={isLoadingImage} variant="secondary" className="w-full text-sm">
                            <PhotoIcon className="h-4 w-4 mr-2"/>
                            Générer visuel IA
                        </Button>
                    </div>
                    
                    {/* Thumbnail Generator (Pro+) */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-transparent relative overflow-hidden">
                        {!user.isProPlus && <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-bl-md">PRO+</div>}
                        <h3 className="font-semibold mb-2 flex items-center">Miniature YouTube</h3>
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-4 overflow-hidden">
                             {isGeneratingThumbnail ? <div className="text-sm animate-pulse">Création...</div> : (
                                activeScript.generatedThumbnail ? 
                                <img src={`data:image/png;base64,${activeScript.generatedThumbnail}`} alt="Generated Thumbnail" className="w-full h-full object-cover"/>
                                : <div className="text-center p-4"><PhotoIcon className="h-8 w-8 mx-auto text-gray-400 mb-2"/><p className="text-sm text-gray-500">Pas de miniature</p></div>
                            )}
                        </div>
                        <Button onClick={handleGenerateThumbnail} isLoading={isGeneratingThumbnail} variant="outline" className={`w-full text-sm ${!user.isProPlus ? 'opacity-60' : ''}`}>
                            <DiamondIcon className="h-4 w-4 mr-2"/>
                            Générer Miniature
                        </Button>
                    </div>
                </div>

                {/* PRO+ Tools Column */}
                <div className="lg:col-span-3 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border-2 border-amber-500/20">
                    <div className="bg-gradient-to-r from-amber-400/10 to-orange-500/10 p-3 border-b border-amber-500/20 flex justify-between items-center">
                         <h2 className="font-bold text-amber-600 dark:text-amber-500 flex items-center"><DiamondIcon className="h-5 w-5 mr-2"/>Outils PRO+</h2>
                         {!user.isProPlus && <button onClick={onNavigateAccount} className="text-xs bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600">Upgrade</button>}
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
                        <button onClick={() => setActiveProTab('assistant')} className={`flex-1 py-2 px-2 text-xs font-medium whitespace-nowrap ${activeProTab === 'assistant' ? 'text-brand-purple border-b-2 border-brand-purple bg-brand-purple/5' : 'text-gray-500'}`}>Assistant</button>
                        <button onClick={() => setActiveProTab('repurpose')} className={`flex-1 py-2 px-2 text-xs font-medium whitespace-nowrap ${activeProTab === 'repurpose' ? 'text-brand-purple border-b-2 border-brand-purple bg-brand-purple/5' : 'text-gray-500'}`}>Repurpose</button>
                        <button onClick={() => setActiveProTab('integrations')} className={`flex-1 py-2 px-2 text-xs font-medium whitespace-nowrap ${activeProTab === 'integrations' ? 'text-brand-purple border-b-2 border-brand-purple bg-brand-purple/5' : 'text-gray-500'}`}>Connect</button>
                    </div>

                    <div className="p-1 flex-grow flex flex-col overflow-hidden">
                        {activeProTab === 'assistant' && (
                            <div className="flex-grow flex flex-col h-full">
                                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-3 space-y-4">
                                    {chatHistory.map((msg, index) => (
                                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs lg:max-w-sm rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-brand-blue text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isChatLoading && (
                                         <div className="flex justify-start">
                                            <div className="max-w-xs lg:max-w-sm rounded-lg px-3 py-2 bg-gray-200 dark:bg-gray-700">
                                                 <div className="flex items-center space-x-1">
                                                    <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                                    <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                                    <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-pulse"></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={currentMessage}
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        placeholder="Posez une question..."
                                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none border-transparent"
                                        disabled={!user.isProPlus || isChatLoading}
                                    />
                                    <button type="submit" className="p-2 rounded-full bg-brand-purple text-white hover:bg-purple-700 transition disabled:opacity-50" disabled={!user.isProPlus || isChatLoading}>
                                        <PaperAirplaneIcon className="h-5 w-5"/>
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeProTab === 'repurpose' && (
                            <div className="space-y-4 p-3 overflow-y-auto">
                                <p className="text-xs text-gray-500">Transformez ce script en 5 formats instantanément.</p>
                                {repurposedContent ? (
                                    <div className="space-y-3">
                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                            <h5 className="font-bold text-xs uppercase text-gray-500 mb-1">TikTok / Reel</h5>
                                            <p className="text-xs line-clamp-3">{repurposedContent.tiktokScript}</p>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                            <h5 className="font-bold text-xs uppercase text-gray-500 mb-1">Tweet</h5>
                                            <p className="text-xs line-clamp-3">{repurposedContent.twitterThread[0]}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <RefreshIcon className="h-10 w-10 mx-auto mb-2 opacity-50"/>
                                        <p>Générez du contenu multi-plateforme.</p>
                                    </div>
                                )}
                                <Button onClick={handleRepurpose} isLoading={isRepurposing} className={`w-full ${!user.isProPlus ? 'opacity-60' : ''}`}>
                                    <RefreshIcon className="h-4 w-4 mr-2"/>
                                    Générer Pack
                                </Button>
                            </div>
                        )}

                         {activeProTab === 'integrations' && (
                            <div className="space-y-4 p-3 overflow-y-auto">
                                <p className="text-xs text-gray-500">Exportez vers vos outils de production préférés.</p>
                                <div className="space-y-2">
                                    <button className="w-full flex items-center p-2 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600">
                                        <div className="h-6 w-6 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-3">11</div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold">ElevenLabs</div>
                                            <div className="text-[10px] text-gray-500">Voix IA Ultra-Réalistes</div>
                                        </div>
                                    </button>
                                    <button className="w-full flex items-center p-2 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600">
                                        <div className="h-6 w-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-3">H</div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold">HeyGen</div>
                                            <div className="text-[10px] text-gray-500">Avatar Vidéo</div>
                                        </div>
                                    </button>
                                     <button className="w-full flex items-center p-2 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600">
                                        <div className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-3">D</div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold">Descript</div>
                                            <div className="text-[10px] text-gray-500">Montage Automatique</div>
                                        </div>
                                    </button>
                                </div>
                                <p className="text-[10px] text-center text-gray-400 mt-2 italic">Connectez vos clés API dans les paramètres pour activer l'export direct.</p>
                            </div>
                        )}
                    </div>
                    
                     <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                         <Button onClick={handleVideoGen} variant="secondary" className={`w-full text-sm ${!user.isProPlus ? 'opacity-60' : ''}`}>
                             <VideoIcon className="h-4 w-4 mr-2"/>
                             Générer Vidéo (Google Veo)
                         </Button>
                     </div>
                </div>

            </div>
        </div>
    );
};


export const Workspace: React.FC<{
    user: User;
    onUpdateUser: (u: User) => void;
    onNavigateAccount: () => void;
}> = ({ user, onUpdateUser, onNavigateAccount }) => {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(AppScreen.Dashboard);
  const [scripts, setScripts] = useState<Script[]>(() => {
    const saved = localStorage.getItem('wyslider_scripts');
    if (!saved) {
        return [];
    }
    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error("Failed to parse scripts from localStorage", error);
        localStorage.removeItem('wyslider_scripts');
        return [];
    }
  });
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('wyslider_scripts', JSON.stringify(scripts));
  }, [scripts]);

  const handleUpdateScript = useCallback((updatedScript: Script, navigate: boolean = false) => {
    setScripts(prev => {
        const exists = prev.some(s => s.id === updatedScript.id);
        if (exists) {
            return prev.map(s => s.id === updatedScript.id ? updatedScript : s);
        }
        return [...prev, updatedScript];
    });
    setActiveScript(updatedScript);
    if(navigate && activeScreen === AppScreen.Generator) {
        setActiveScreen(AppScreen.Optimizer);
    }
  }, [activeScreen]);

  const handleAddScript = useCallback((newScript: Script) => {
      setScripts(prev => [newScript, ...prev]);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.style.scrollBehavior = 'auto'; 
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.offsetWidth * activeScreen;
        scrollContainerRef.current.style.scrollBehavior = 'smooth';
    }
  }, [activeScreen]);

  const handleCreateNew = () => {
    const newScript: Script = {
      id: `script_${Date.now()}`,
      title: 'Nouveau Script Sans Titre',
      topic: '',
      tone: 'Engaging',
      format: '3-5min',
      sections: [],
      createdAt: new Date().toISOString(),
      versions: [],
    };
    setActiveScript(newScript);
    setActiveScreen(AppScreen.Generator);
  };

  const handleEditScript = (script: Script) => {
      setActiveScript(script);
      setActiveScreen(AppScreen.Optimizer);
  };

  const handleUpdateScripts = (newScripts: Script[]) => {
      setScripts(newScripts);
      if (activeScript && !newScripts.find(s => s.id === activeScript.id)) {
          setActiveScript(null);
      }
  }

  return (
    <div className="h-full flex flex-col">
       <nav className="flex-shrink-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
            <div className="container mx-auto px-4 sm:px-8 flex justify-center space-x-4 sm:space-x-8">
                <button onClick={() => setActiveScreen(AppScreen.Dashboard)} className={`py-3 px-1 font-semibold border-b-2 text-sm sm:text-base whitespace-nowrap ${activeScreen === AppScreen.Dashboard ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>Dashboard</button>
                <button onClick={() => setActiveScreen(AppScreen.Generator)} className={`py-3 px-1 font-semibold border-b-2 text-sm sm:text-base whitespace-nowrap ${activeScreen === AppScreen.Generator ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>Studio</button>
                <button onClick={() => setActiveScreen(AppScreen.Optimizer)} className={`py-3 px-1 font-semibold border-b-2 text-sm sm:text-base whitespace-nowrap ${activeScreen === AppScreen.Optimizer ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>Optimizer</button>
                <button onClick={() => setActiveScreen(AppScreen.SerialProd)} className={`py-3 px-1 font-semibold border-b-2 text-sm sm:text-base whitespace-nowrap ${activeScreen === AppScreen.SerialProd ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>Serial Prod</button>
                <button onClick={() => setActiveScreen(AppScreen.Growth)} className={`py-3 px-1 font-semibold border-b-2 text-sm sm:text-base whitespace-nowrap ${activeScreen === AppScreen.Growth ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>Growth</button>
                <button onClick={() => setActiveScreen(AppScreen.Business)} className={`py-3 px-1 font-semibold border-b-2 text-sm sm:text-base whitespace-nowrap ${activeScreen === AppScreen.Business ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>Business</button>
            </div>
        </nav>
        <div ref={scrollContainerRef} className="flex-grow overflow-x-hidden flex no-scrollbar">
            <div className="w-full flex-shrink-0 h-full overflow-y-auto">
                 <DashboardScreen scripts={scripts} onCreateNew={handleCreateNew} onEdit={handleEditScript} onUpdateScripts={handleUpdateScripts} />
            </div>
             <div className="w-full flex-shrink-0 h-full overflow-y-auto">
                 <GeneratorScreen activeScript={activeScript} onUpdateScript={handleUpdateScript} user={user} onUpdateUser={onUpdateUser} />
            </div>
             <div className="w-full flex-shrink-0 h-full overflow-y-auto">
                <OptimizerScreen activeScript={activeScript} onUpdateScript={handleUpdateScript} user={user} onNavigateAccount={onNavigateAccount} />
            </div>
            <div className="w-full flex-shrink-0 h-full overflow-y-auto">
                <SerialProdScreen 
                    user={user} 
                    onUpdateUser={onUpdateUser} 
                    onNavigateAccount={onNavigateAccount} 
                    onAddScript={handleAddScript} 
                    onNavigateToDashboard={() => setActiveScreen(AppScreen.Dashboard)}
                    scripts={scripts}
                    onEditScript={handleEditScript}
                />
            </div>
            <div className="w-full flex-shrink-0 h-full overflow-y-auto">
                <GrowthScreen scripts={scripts} user={user} />
            </div>
            <div className="w-full flex-shrink-0 h-full overflow-y-auto">
                <BusinessScreen user={user} />
            </div>
        </div>
    </div>
  );
};
