
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ChartBarIcon, RobotIcon, BoltIcon, RefreshIcon, KeyIcon, CheckIcon, XMarkIcon, BellIcon, PencilSquareIcon, FireIcon } from './icons';
import * as geminiService from '../services/geminiService';

interface AdminPageProps {
  onBack: () => void;
}

interface UserFeedback {
    id: string;
    userEmail: string;
    message: string;
    timestamp: string;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'stats' | 'selfgrow' | 'notifications' | 'feedbacks' | 'firebase'>('stats');
    const [statsInsight, setStatsInsight] = useState('');
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    
    // Real Stats Data
    const [scriptCount, setScriptCount] = useState(0);
    const [userCount, setUserCount] = useState(1); // At least 1 (admin)
    
    // Notifications State
    const [notifMessage, setNotifMessage] = useState('');
    
    // Self Growing State
    const [featureRequest, setFeatureRequest] = useState('');
    const [codeDiff, setCodeDiff] = useState('');
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);

    // Feedback State
    const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);

    // Firebase State
    const [fbConfig, setFbConfig] = useState('');
    const [fbStatus, setFbStatus] = useState<'local'|'connected'>('local');

    // GitHub Config State
    const [ghToken, setGhToken] = useState(localStorage.getItem('gh_token') || '');
    const [ghOwner, setGhOwner] = useState(localStorage.getItem('gh_owner') || '');
    const [ghRepo, setGhRepo] = useState(localStorage.getItem('gh_repo') || '');
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        // Fetch real data from LocalStorage
        const scripts = JSON.parse(localStorage.getItem('wyslider_scripts') || '[]');
        setScriptCount(scripts.length);
        
        // Fetch feedbacks
        const savedFeedbacks = JSON.parse(localStorage.getItem('wyslider_feedback_box') || '[]');
        setFeedbacks(savedFeedbacks);

        // Check Firebase config
        const fbData = localStorage.getItem('wyslider_firebase_config');
        if(fbData) {
            setFbConfig(fbData);
            setFbStatus('connected');
        }
    }, []);

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoadingInsight(true);
            const metrics = `Total Scripts: ${scriptCount}, Active Users: ${userCount}, Platform: Web`;
            const insight = await geminiService.generateAdminInsights(metrics);
            setStatsInsight(insight);
            setIsLoadingInsight(false);
        }

        if (activeTab === 'stats' && !statsInsight) {
            fetchInsights();
        }
    }, [activeTab, statsInsight, scriptCount, userCount]);

    const saveGithubConfig = () => {
        localStorage.setItem('gh_token', ghToken);
        localStorage.setItem('gh_owner', ghOwner);
        localStorage.setItem('gh_repo', ghRepo);
        setConnectionStatus('idle'); // Reset status on save
        alert("Configuration GitHub sauvegardée localement.");
    };

    const handleSendNotification = () => {
        if (!notifMessage) return;
        localStorage.setItem('wyslider_admin_broadcast', JSON.stringify({
            message: notifMessage,
            timestamp: new Date().toISOString(),
            seen: false
        }));
        alert("Notification envoyée à tous les utilisateurs (Simulé).");
        setNotifMessage('');
    }

    const testGithubConnection = async () => {
         setConnectionStatus('idle');
         if (!ghToken || !ghOwner || !ghRepo) return alert("Missing fields");
         try {
             const res = await fetch(`https://api.github.com/repos/${ghOwner}/${ghRepo}`, { headers: {'Authorization': `token ${ghToken}`} });
             setConnectionStatus(res.ok ? 'success' : 'error');
         } catch { setConnectionStatus('error'); }
    };

    const handleGenerateCode = async () => {
        if(!featureRequest) return;
        setIsGeneratingCode(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCodeDiff(`// Simulated Patch for: ${featureRequest}\nfunction update() { return true; }`);
        setIsGeneratingCode(false);
    }
    
    const saveFirebaseConfig = () => {
        if(!fbConfig.includes('apiKey') || !fbConfig.includes('projectId')) {
            alert("Configuration invalide. Assurez-vous de coller l'objet de configuration Firebase complet.");
            return;
        }
        localStorage.setItem('wyslider_firebase_config', fbConfig);
        setFbStatus('connected');
        alert("Configuration Firebase enregistrée. L'application va basculer en mode Cloud.");
        // Simulate reload trigger
        window.location.reload();
    }

    const resetFirebase = () => {
        if(window.confirm("Repasser en mode Local Storage ?")) {
            localStorage.removeItem('wyslider_firebase_config');
            setFbStatus('local');
            setFbConfig('');
            window.location.reload();
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-mono animate-fade-in">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-3xl font-bold text-red-500 tracking-wider">WYSLIDER_ADMIN_PANEL_v1.2</h1>
                    <Button onClick={onBack} variant="outline" className="border-gray-500 text-gray-400 hover:text-white">EXIT_SYSTEM</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="space-y-2">
                        <button 
                            onClick={() => setActiveTab('stats')}
                            className={`w-full text-left p-3 rounded border ${activeTab === 'stats' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                        >
                            <ChartBarIcon className="h-5 w-5 inline mr-2" />
                            LIVE_STATS
                        </button>
                         <button 
                            onClick={() => setActiveTab('selfgrow')}
                            className={`w-full text-left p-3 rounded border ${activeTab === 'selfgrow' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                        >
                            <RobotIcon className="h-5 w-5 inline mr-2" />
                            AI_SELF_GROWING
                        </button>
                         <button 
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full text-left p-3 rounded border ${activeTab === 'notifications' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                        >
                            <BellIcon className="h-5 w-5 inline mr-2" />
                            NOTIFICATIONS
                        </button>
                        <button 
                            onClick={() => setActiveTab('feedbacks')}
                            className={`w-full text-left p-3 rounded border ${activeTab === 'feedbacks' ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                        >
                            <PencilSquareIcon className="h-5 w-5 inline mr-2" />
                            FEEDBACKS ({feedbacks.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('firebase')}
                            className={`w-full text-left p-3 rounded border ${activeTab === 'firebase' ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                        >
                            <FireIcon className="h-5 w-5 inline mr-2" />
                            FIREBASE_CONFIG
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="md:col-span-3 bg-gray-800 rounded-lg border border-gray-700 p-6 min-h-[500px]">
                        
                        {activeTab === 'stats' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-red-400 mb-4">&gt; REAL_TIME_DATA</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                        <p className="text-gray-400 text-xs uppercase">Generated Scripts</p>
                                        <p className="text-2xl font-bold">{scriptCount}</p>
                                    </div>
                                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                        <p className="text-gray-400 text-xs uppercase">Active Session Users</p>
                                        <p className="text-2xl font-bold">{userCount}</p>
                                    </div>
                                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                        <p className="text-gray-400 text-xs uppercase">DB Mode</p>
                                        <p className={`text-2xl font-bold ${fbStatus === 'connected' ? 'text-orange-500' : 'text-blue-400'}`}>{fbStatus === 'connected' ? 'FIREBASE' : 'LOCAL'}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-bold text-purple-400">AI_INSIGHTS_ENGINE</h3>
                                        <button onClick={() => setStatsInsight('')} disabled={isLoadingInsight} className="text-xs text-gray-400 hover:text-white">
                                            <RefreshIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {isLoadingInsight ? "ANALYZING DATA STREAMS..." : statsInsight}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'selfgrow' && (
                             <div className="space-y-6">
                                <h2 className="text-xl font-bold text-green-400 mb-4">&gt; SELF_REPLICATING_PROTOCOL</h2>
                                
                                {/* GitHub Configuration Panel */}
                                <div className="bg-gray-900 p-4 rounded border border-gray-600 mb-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-gray-300 flex items-center"><KeyIcon className="h-4 w-4 mr-2"/> GITHUB_CONNECTION_UPLINK</h3>
                                        {connectionStatus === 'success' && <span className="text-xs text-green-500 flex items-center"><CheckIcon className="h-3 w-3 mr-1"/> LINK_ESTABLISHED</span>}
                                        {connectionStatus === 'error' && <span className="text-xs text-red-500 flex items-center"><XMarkIcon className="h-3 w-3 mr-1"/> LINK_BROKEN</span>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                        <input type="text" placeholder="GitHub Username (Owner)" value={ghOwner} onChange={e => setGhOwner(e.target.value)} className="bg-black border border-gray-700 p-2 rounded text-xs text-white"/>
                                        <input type="text" placeholder="Repository Name" value={ghRepo} onChange={e => setGhRepo(e.target.value)} className="bg-black border border-gray-700 p-2 rounded text-xs text-white"/>
                                        <input type="password" placeholder="Personal Access Token (Repo Scope)" value={ghToken} onChange={e => setGhToken(e.target.value)} className="bg-black border border-gray-700 p-2 rounded text-xs text-white md:col-span-2"/>
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                         <button onClick={testGithubConnection} className="text-xs text-blue-500 hover:text-blue-400 font-bold border border-blue-900 px-3 py-1 rounded">TEST SIGNAL</button>
                                         <button onClick={saveGithubConfig} className="text-xs text-green-500 hover:text-green-400 underline">SAVE CONFIG</button>
                                    </div>
                                </div>

                                <div className="bg-black p-4 rounded border border-gray-600 font-mono text-sm">
                                    <p className="text-green-500 mb-2">$ enter_feature_request:</p>
                                    <textarea 
                                        value={featureRequest}
                                        onChange={e => setFeatureRequest(e.target.value)}
                                        className="w-full bg-transparent text-white outline-none resize-none border-b border-gray-700 focus:border-green-500 h-24"
                                        placeholder="E.g., Update the prompt logic for the Series Generator..."
                                    />
                                </div>

                                <Button onClick={handleGenerateCode} isLoading={isGeneratingCode} className="w-full bg-green-600 hover:bg-green-700 text-white border-none mt-4">
                                    GENERATE_CODE_PATCH
                                </Button>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-blue-400 mb-4">&gt; GLOBAL_BROADCAST_SYSTEM</h2>
                                <p className="text-gray-400 text-sm">Send a pop-up notification to all currently active users.</p>
                                
                                <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                    <label className="text-xs font-bold text-blue-300 mb-2 block">MESSAGE CONTENT</label>
                                    <textarea 
                                        value={notifMessage} 
                                        onChange={e => setNotifMessage(e.target.value)}
                                        className="w-full bg-black border border-gray-700 p-3 rounded text-white text-sm h-32 mb-4 focus:border-blue-500 outline-none"
                                        placeholder="Type alert message here..."
                                    />
                                    <Button onClick={handleSendNotification} className="bg-blue-600 hover:bg-blue-700 border-none w-full">
                                        BROADCAST_NOW
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'feedbacks' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-purple-400 mb-4">&gt; INCOMING_TRANSMISSIONS</h2>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                    {feedbacks.length === 0 && <p className="text-gray-500 italic">No feedback signals received.</p>}
                                    {feedbacks.slice().reverse().map(fb => (
                                        <div key={fb.id} className="bg-gray-900 p-4 rounded border border-gray-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-purple-300 font-bold">{fb.userEmail}</span>
                                                <span className="text-[10px] text-gray-500">{new Date(fb.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{fb.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'firebase' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-orange-500 mb-4">&gt; CLOUD_DATABASE_UPLINK</h2>
                                
                                <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-3 py-1 rounded text-xs font-bold ${fbStatus === 'connected' ? 'bg-orange-500/20 text-orange-500' : 'bg-gray-700 text-gray-400'}`}>
                                            STATUS: {fbStatus === 'connected' ? 'CONNECTED' : 'LOCAL_MODE'}
                                        </span>
                                        {fbStatus === 'connected' && (
                                            <button onClick={resetFirebase} className="text-xs text-red-500 hover:text-red-400 underline">DISCONNECT (RESET)</button>
                                        )}
                                    </div>

                                    <label className="text-xs font-bold text-gray-400 mb-2 block">PASTE FIREBASE CONFIG OBJECT</label>
                                    <p className="text-[10px] text-gray-500 mb-2">e.g. const firebaseConfig = {"{ ... }"}</p>
                                    <textarea 
                                        value={fbConfig} 
                                        onChange={e => setFbConfig(e.target.value)}
                                        className="w-full bg-black border border-gray-700 p-3 rounded text-white text-xs font-mono h-40 mb-4 focus:border-orange-500 outline-none"
                                        placeholder="Paste config here..."
                                    />
                                    <Button onClick={saveFirebaseConfig} className="bg-orange-600 hover:bg-orange-700 border-none w-full">
                                        SAVE_AND_CONNECT
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};