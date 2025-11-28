
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ChartBarIcon, RobotIcon, BoltIcon, RefreshIcon, KeyIcon, CheckIcon, XMarkIcon } from './icons';
import * as geminiService from '../services/geminiService';

interface AdminPageProps {
  onBack: () => void;
}

// Helper for Base64 encoding with Unicode support
function utf8_to_b64(str: string) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'stats' | 'selfgrow' | 'promos'>('stats');
    const [statsInsight, setStatsInsight] = useState('');
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    
    // Mock Data for Stats
    const mockMetrics = "Active Users: 1200, Retention Rate: 45%, Avg Scripts/User: 8, Churn Rate: 5%";
    
    // Self Growing State
    const [featureRequest, setFeatureRequest] = useState('');
    const [codeDiff, setCodeDiff] = useState('');
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);

    // GitHub Config State
    const [ghToken, setGhToken] = useState(localStorage.getItem('gh_token') || '');
    const [ghOwner, setGhOwner] = useState(localStorage.getItem('gh_owner') || '');
    const [ghRepo, setGhRepo] = useState(localStorage.getItem('gh_repo') || '');
    const [ghBranch, setGhBranch] = useState('main');
    const [isPushing, setIsPushing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (activeTab === 'stats' && !statsInsight) {
            fetchInsights();
        }
    }, [activeTab]);

    const saveGithubConfig = () => {
        localStorage.setItem('gh_token', ghToken);
        localStorage.setItem('gh_owner', ghOwner);
        localStorage.setItem('gh_repo', ghRepo);
        setConnectionStatus('idle'); // Reset status on save
        alert("Configuration GitHub sauvegardée localement.");
    };

    const testGithubConnection = async () => {
        if (!ghToken || !ghOwner || !ghRepo) {
            alert("Veuillez remplir tous les champs GitHub.");
            return;
        }
        setConnectionStatus('idle');
        try {
            const res = await fetch(`https://api.github.com/repos/${ghOwner}/${ghRepo}`, {
                headers: {
                    'Authorization': `token ${ghToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (res.ok) {
                setConnectionStatus('success');
            } else {
                setConnectionStatus('error');
                const err = await res.json();
                alert(`Erreur de connexion (${res.status}): ${err.message}`);
            }
        } catch (e) {
            setConnectionStatus('error');
            alert("Erreur réseau lors du test de connexion.");
        }
    };

    const fetchInsights = async () => {
        setIsLoadingInsight(true);
        const insight = await geminiService.generateAdminInsights(mockMetrics);
        setStatsInsight(insight);
        setIsLoadingInsight(false);
    }

    const handleGenerateCode = async () => {
        if(!featureRequest) return;
        setIsGeneratingCode(true);
        // In a real scenario, this would ask Gemini to read the file context and propose a diff
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const timestamp = new Date().toISOString();
        const dummyDiff = `### Auto-Generated Update [${timestamp}]
Feature Request: ${featureRequest}

Status: Code generated.
Action: Requires review before merging into 'components/'.

\`\`\`typescript
// Proposed change logic
function implementedFeature() {
   console.log("${featureRequest} applied.");
   return true;
}
\`\`\`
`;
        setCodeDiff(dummyDiff);
        setIsGeneratingCode(false);
    }

    const commitToGithub = async () => {
        if (!ghToken || !ghOwner || !ghRepo) {
            alert("Veuillez configurer les accès GitHub (Token, Owner, Repo) ci-dessous.");
            return;
        }

        setIsPushing(true);
        const path = "WYS_UPDATE_LOG.md"; // Target file
        const message = `WySlider Auto-Update: ${featureRequest.substring(0, 50)}...`;
        const content = utf8_to_b64(codeDiff);

        try {
            // 1. Get current SHA of the file (if it exists) to allow update
            let sha = "";
            try {
                const getRes = await fetch(`https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/${path}?ref=${ghBranch}`, {
                    headers: {
                        'Authorization': `token ${ghToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (getRes.ok) {
                    const data = await getRes.json();
                    sha = data.sha;
                }
            } catch (e) {
                // File doesn't exist yet, that's fine
            }

            // 2. PUT (Create or Update)
            const putRes = await fetch(`https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${ghToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    content: content,
                    branch: ghBranch,
                    sha: sha || undefined // Include SHA if we are updating
                })
            });

            if (putRes.ok) {
                alert(`SUCCESS: Code pushed to ${ghOwner}/${ghRepo}/${path}`);
                setCodeDiff('');
                setFeatureRequest('');
            } else {
                const errData = await putRes.json();
                alert(`ERROR: ${errData.message}`);
                console.error(errData);
            }
        } catch (error) {
            alert(`NETWORK ERROR: ${error}`);
        } finally {
            setIsPushing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-mono animate-fade-in">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-3xl font-bold text-red-500 tracking-wider">WYSLIDER_ADMIN_PANEL_v1.0</h1>
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
                            ADVANCED_STATS
                        </button>
                         <button 
                            onClick={() => setActiveTab('selfgrow')}
                            className={`w-full text-left p-3 rounded border ${activeTab === 'selfgrow' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                        >
                            <RobotIcon className="h-5 w-5 inline mr-2" />
                            AI_SELF_GROWING
                        </button>
                         <button 
                            onClick={() => setActiveTab('promos')}
                            className={`w-full text-left p-3 rounded border ${activeTab === 'promos' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                        >
                            <BoltIcon className="h-5 w-5 inline mr-2" />
                            PROMO_CODES
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="md:col-span-3 bg-gray-800 rounded-lg border border-gray-700 p-6 min-h-[500px]">
                        
                        {activeTab === 'stats' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-red-400 mb-4">> SYSTEM_METRICS</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                        <p className="text-gray-400 text-xs uppercase">Total Users</p>
                                        <p className="text-2xl font-bold">1,245</p>
                                    </div>
                                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                        <p className="text-gray-400 text-xs uppercase">Scripts Gen.</p>
                                        <p className="text-2xl font-bold">15,402</p>
                                    </div>
                                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                        <p className="text-gray-400 text-xs uppercase">Pro+ Conversion</p>
                                        <p className="text-2xl font-bold text-green-400">8.5%</p>
                                    </div>
                                     <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                        <p className="text-gray-400 text-xs uppercase">API Costs</p>
                                        <p className="text-2xl font-bold text-red-400">$142</p>
                                    </div>
                                </div>

                                <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-bold text-purple-400">AI_INSIGHTS_ENGINE</h3>
                                        <button onClick={fetchInsights} disabled={isLoadingInsight} className="text-xs text-gray-400 hover:text-white">
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
                                <h2 className="text-xl font-bold text-green-400 mb-4">> SELF_REPLICATING_PROTOCOL</h2>
                                
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

                                <p className="text-sm text-gray-400 mb-4">
                                    Analyze app behavior and generate updates.
                                </p>

                                <div className="bg-black p-4 rounded border border-gray-600 font-mono text-sm">
                                    <p className="text-green-500 mb-2">$ enter_feature_request:</p>
                                    <textarea 
                                        value={featureRequest}
                                        onChange={e => setFeatureRequest(e.target.value)}
                                        className="w-full bg-transparent text-white outline-none resize-none border-b border-gray-700 focus:border-green-500 h-24"
                                        placeholder="E.g., Update the prompt logic for the Series Generator..."
                                    />
                                </div>

                                <Button onClick={handleGenerateCode} isLoading={isGeneratingCode} className="w-full bg-green-600 hover:bg-green-700 text-white border-none">
                                    GENERATE_CODE_PATCH
                                </Button>

                                {codeDiff && (
                                    <div className="mt-6 animate-fade-in">
                                        <h3 className="text-sm font-bold text-gray-400 mb-2">PREVIEW DIFF:</h3>
                                        <div className="bg-gray-900 p-4 rounded border border-gray-600 overflow-x-auto">
                                            <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap">{codeDiff}</pre>
                                        </div>
                                        <div className="flex gap-4 mt-4">
                                            <Button onClick={commitToGithub} isLoading={isPushing} className="bg-red-600 hover:bg-red-700 text-white border-none flex-1">
                                                {isPushing ? 'PUSHING...' : 'COMMIT & PUSH TO GITHUB'}
                                            </Button>
                                            <Button onClick={() => setCodeDiff('')} variant="secondary" className="flex-1 bg-gray-700 text-white border-none">
                                                DISCARD
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2 text-center">Target: {ghOwner}/{ghRepo}/WYS_UPDATE_LOG.md</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'promos' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-blue-400 mb-4">> ACCESS_KEY_MANAGEMENT</h2>
                                
                                <div className="bg-gray-900 rounded border border-gray-600 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-800 text-gray-400">
                                            <tr>
                                                <th className="p-3">CODE</th>
                                                <th className="p-3">REWARD</th>
                                                <th className="p-3">STATUS</th>
                                                <th className="p-3">ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-700">
                                                <td className="p-3 font-mono">WySliderThinklessCreatemore2301</td>
                                                <td className="p-3">Pro+ / 100 Gens</td>
                                                <td className="p-3 text-green-400">ACTIVE</td>
                                                <td className="p-3"><button className="text-red-400 hover:underline">REVOKE</button></td>
                                            </tr>
                                            <tr className="border-b border-gray-700">
                                                <td className="p-3 font-mono">WELCOME_BETA</td>
                                                <td className="p-3">5 Gens</td>
                                                <td className="p-3 text-gray-500">EXPIRED</td>
                                                <td className="p-3"><button className="text-red-400 hover:underline">REVOKE</button></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="bg-gray-900 p-4 rounded border border-gray-600">
                                    <h3 className="text-sm font-bold text-gray-400 mb-3">CREATE NEW KEY</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input type="text" placeholder="CODE NAME" className="bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" />
                                        <input type="number" placeholder="CREDITS" className="bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" />
                                        <Button className="bg-blue-600 hover:bg-blue-700 border-none text-white h-full py-1">GENERATE</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
