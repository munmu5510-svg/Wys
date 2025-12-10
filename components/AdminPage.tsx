

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ChartBarIcon, RobotIcon, BellIcon, PencilSquareIcon, RefreshIcon } from './icons';
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
    const [activeTab, setActiveTab] = useState<'stats' | 'notifications' | 'feedbacks'>('stats');
    const [statsInsight, setStatsInsight] = useState('');
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    
    const [scriptCount, setScriptCount] = useState(0);
    const [userCount, setUserCount] = useState(1);
    
    const [notifMessage, setNotifMessage] = useState('');
    const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);

    useEffect(() => {
        const scripts = JSON.parse(localStorage.getItem('wyslider_scripts') || '[]');
        setScriptCount(scripts.length);
        
        const savedFeedbacks = JSON.parse(localStorage.getItem('wyslider_feedback_box') || '[]');
        setFeedbacks(savedFeedbacks);
    }, []);

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoadingInsight(true);
            const metrics = `Total Scripts: ${scriptCount}, Active Users: ${userCount}`;
            const insight = await geminiService.generateAdminInsights(metrics);
            setStatsInsight(insight);
            setIsLoadingInsight(false);
        }

        if (activeTab === 'stats' && !statsInsight) {
            fetchInsights();
        }
    }, [activeTab]);

    const handleSendNotification = () => {
        if (!notifMessage) return;
        localStorage.setItem('wyslider_admin_broadcast', JSON.stringify({
            message: notifMessage,
            timestamp: new Date().toISOString(),
            seen: false
        }));
        alert("Notification Broadcasted.");
        setNotifMessage('');
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
                <h1 className="text-lg font-bold text-gray-100 tracking-wide">WySlider Admin Console</h1>
                <Button onClick={onBack} variant="secondary" className="text-xs">Exit</Button>
            </header>

            <div className="flex h-[calc(100vh-64px)]">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`w-full text-left p-3 rounded text-sm font-medium transition ${activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <ChartBarIcon className="h-4 w-4 inline mr-3" />
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full text-left p-3 rounded text-sm font-medium transition ${activeTab === 'notifications' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <BellIcon className="h-4 w-4 inline mr-3" />
                        Notifications
                    </button>
                    <button 
                        onClick={() => setActiveTab('feedbacks')}
                        className={`w-full text-left p-3 rounded text-sm font-medium transition ${activeTab === 'feedbacks' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <PencilSquareIcon className="h-4 w-4 inline mr-3" />
                        Feedback ({feedbacks.length})
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'stats' && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-bold">System Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                                    <p className="text-gray-500 text-sm font-medium uppercase mb-1">Total Scripts Generated</p>
                                    <p className="text-4xl font-bold text-white">{scriptCount}</p>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                                    <p className="text-gray-500 text-sm font-medium uppercase mb-1">Active Users</p>
                                    <p className="text-4xl font-bold text-white">{userCount}</p>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                                    <p className="text-gray-500 text-sm font-medium uppercase mb-1">System Health</p>
                                    <p className="text-4xl font-bold text-green-400">Stable</p>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold flex items-center"><RobotIcon className="h-5 w-5 mr-2 text-indigo-400"/> AI Business Report</h3>
                                    <button onClick={() => setStatsInsight('')} disabled={isLoadingInsight} className="text-gray-500 hover:text-white">
                                        <RefreshIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="bg-black/50 p-4 rounded-lg text-sm text-gray-300 leading-relaxed font-mono">
                                    {isLoadingInsight ? "Generating report..." : statsInsight || "Click refresh to generate."}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6 max-w-2xl">
                            <h2 className="text-2xl font-bold">Global Broadcast</h2>
                            <p className="text-gray-400">Send push notifications to all active users.</p>
                            
                            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                                <textarea 
                                    value={notifMessage} 
                                    onChange={e => setNotifMessage(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-700 p-4 rounded-lg text-white text-sm h-32 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Enter your message..."
                                />
                                <div className="flex justify-end">
                                    <Button onClick={handleSendNotification} className="bg-indigo-600 hover:bg-indigo-700">Send Broadcast</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'feedbacks' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">User Feedback</h2>
                            <div className="space-y-4">
                                {feedbacks.length === 0 && <p className="text-gray-500">No feedback yet.</p>}
                                {feedbacks.slice().reverse().map(fb => (
                                    <div key={fb.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-indigo-400 text-sm">{fb.userEmail}</span>
                                            <span className="text-xs text-gray-500">{new Date(fb.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-gray-300">{fb.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};