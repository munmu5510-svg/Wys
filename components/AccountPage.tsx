
import React, { useState, useRef } from 'react';
import { User, ViralIdea } from '../types';
import { Button } from './Button';
import { PRICING } from '../constants';
import { UserIcon, ShareIcon, DiamondIcon, PencilSquareIcon, SunIcon, MoonIcon, Squares2x2Icon, CheckIcon } from './icons';
import { MainLayout } from './MainLayout';

interface AccountPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToStudio?: () => void;
  onUseIdea?: (idea: ViralIdea) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ user, onUpdateUser, onBack, onNavigateToAdmin, isDarkMode, toggleTheme }) => {
    const [section, setSection] = useState<'account'|'templates'|'share'|'plan'|'feedback'>('account');
    const [promoCode, setPromoCode] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateUser({...user, profilePicture: reader.result as string});
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePromoCode = () => {
        if (promoCode === 'admin2301') onNavigateToAdmin();
        else if (promoCode === 'wys2301') {
            onUpdateUser({...user, generationsLeft: user.generationsLeft + 10});
            alert("10 Credits added.");
        } else alert("Invalid Code");
    };

    const renderContent = () => {
        switch(section) {
            case 'account':
                return (
                    <div className="space-y-6 pb-20">
                        <h2 className="text-2xl font-bold">My Account</h2>
                        <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                             <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                 <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-brand-purple relative">
                                    {user.profilePicture ? <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover"/> : <UserIcon className="h-10 w-10 text-gray-400"/>}
                                 </div>
                                 <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden"/>
                             </div>
                             <div className="flex-1">
                                 <div className="flex items-center space-x-2">
                                     <p className="font-bold text-lg break-all">{user.email}</p>
                                     {user.isPro && <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">PRO+</span>}
                                 </div>
                                 <p className="text-gray-500">{user.channelName}</p>
                             </div>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase text-gray-500">Channel Settings</label>
                            <input type="text" placeholder="Channel Name" className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-700" defaultValue={user.channelName} onChange={e => onUpdateUser({...user, channelName: e.target.value})}/>
                            <input type="text" placeholder="Niche" className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-700" defaultValue={user.niche} onChange={e => onUpdateUser({...user, niche: e.target.value})}/>
                        </div>

                        {toggleTheme && (
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button onClick={toggleTheme} variant="secondary" className="w-full flex justify-center items-center">
                                    {isDarkMode ? <><SunIcon className="h-5 w-5 mr-2"/> Switch to Light Mode</> : <><MoonIcon className="h-5 w-5 mr-2"/> Switch to Dark Mode</>}
                                </Button>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                             <h3 className="font-bold mb-2">Promo Code</h3>
                             <div className="flex space-x-2">
                                <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-300 dark:border-gray-700" placeholder="Enter code..."/>
                                <Button onClick={handlePromoCode} variant="secondary">Apply</Button>
                             </div>
                        </div>
                    </div>
                );
            case 'templates':
                return <div className="text-center py-10 text-gray-500">Shared Templates coming soon.</div>;
            case 'plan':
                return (
                    <div className="space-y-6 pb-20">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Subscription Plans</h2>
                            <div className="bg-brand-purple/10 border border-brand-purple px-4 py-2 rounded-full">
                                <span className="font-bold text-brand-purple text-sm">Credits: {user.generationsLeft}</span>
                            </div>
                        </div>
                        
                        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                             {/* Starter */}
                             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-500">Starter</h3>
                                <p className="text-3xl font-bold my-4">${PRICING.starter}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                                <ul className="space-y-3 mb-6 flex-1">
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-green-500 mr-2"/> 10 Scripts</li>
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-green-500 mr-2"/> Social Posts</li>
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-green-500 mr-2"/> Viral Idea Generator</li>
                                </ul>
                                <Button onClick={() => alert("Simulated Payment")} variant={user.isPro ? 'secondary' : 'primary'} className="w-full">
                                    {!user.isPro ? 'Upgrade' : 'Switch'}
                                </Button>
                            </div>

                            {/* Creator */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-brand-purple relative flex flex-col shadow-lg">
                                <div className="absolute top-0 right-0 bg-brand-purple text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">POPULAR</div>
                                <h3 className="text-xl font-bold text-brand-purple">Creator</h3>
                                <p className="text-3xl font-bold my-4">${PRICING.creator}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                                <ul className="space-y-3 mb-6 flex-1">
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-brand-purple mr-2"/> 30 Scripts</li>
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-brand-purple mr-2"/> Everything in Starter</li>
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-brand-purple mr-2"/> Serial Prod (5 Eps)</li>
                                </ul>
                                {user.isPro ? (
                                    <div className="w-full py-3 text-center font-bold text-green-500 bg-green-500/10 rounded-lg">Active Plan</div>
                                ) : (
                                    <Button onClick={() => alert("Simulated Payment")} className="w-full">Upgrade</Button>
                                )}
                            </div>

                             {/* Pro */}
                             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-500">Pro Authority</h3>
                                <p className="text-3xl font-bold my-4">${PRICING.pro}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                                <ul className="space-y-3 mb-6 flex-1">
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-green-500 mr-2"/> 50 Scripts</li>
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-green-500 mr-2"/> Everything in Creator</li>
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-green-500 mr-2"/> Serial Prod (20 Eps)</li>
                                    <li className="flex items-center text-sm"><CheckIcon className="h-4 w-4 text-green-500 mr-2"/> Priority Support</li>
                                </ul>
                                <Button onClick={() => alert("Simulated Payment")} variant="secondary" className="w-full">Upgrade</Button>
                            </div>
                        </div>
                    </div>
                );
            case 'feedback':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Feedback</h2>
                         <textarea 
                            value={feedbackMsg}
                            onChange={e => setFeedbackMsg(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-700 h-32" 
                            placeholder="Ideas..."
                         />
                         <Button onClick={() => { alert("Sent!"); setFeedbackMsg(''); }}>Send</Button>
                    </div>
                )
            default: return null;
        }
    };

    return (
        <MainLayout
            user={user} 
            onLogout={() => {}} 
            onNavigateToAccount={() => {}} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            activeTab="account"
            onTabChange={(t) => t === 'dashboard' && onBack()}
        >
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-row md:flex-col overflow-x-auto p-4 md:p-6 space-x-2 md:space-x-0 md:space-y-2">
                    <Button onClick={onBack} variant="outline" className="md:w-full mb-4">← Back</Button>
                    {[
                        {id: 'account', label: 'Account', icon: <UserIcon className="h-5 w-5"/>},
                        {id: 'templates', label: 'Templates', icon: <Squares2x2Icon className="h-5 w-5"/>},
                        {id: 'plan', label: 'Plans', icon: <DiamondIcon className="h-5 w-5"/>},
                        {id: 'feedback', label: 'Feedback', icon: <PencilSquareIcon className="h-5 w-5"/>},
                    ].map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setSection(item.id as any)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap ${section === item.id ? 'bg-brand-purple text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                    <div className="max-w-5xl mx-auto">{renderContent()}</div>
                </div>
            </div>
        </MainLayout>
    );
};
