
import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { LogoIcon, CheckIcon, UserIcon, Squares2x2Icon, BriefcaseIcon } from './icons';

interface OnboardingPageProps {
  user: User;
  onComplete: (updatedData: Partial<User>) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onComplete }) => {
    const [step, setStep] = useState(1);
    const [channelName, setChannelName] = useState('');
    const [niche, setNiche] = useState('');
    const [status, setStatus] = useState<User['status']>('Just Me');
    const [isLoading, setIsLoading] = useState(false);

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleFinish();
    };

    const handleFinish = async () => {
        setIsLoading(true);
        // Simulation d'un traitement
        await new Promise(resolve => setTimeout(resolve, 800));
        onComplete({
            channelName: channelName || 'Ma Chaîne',
            niche: niche || 'Généraliste',
            status: status,
            onboardingCompleted: true
        });
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-sans flex flex-col items-center justify-center p-6">
            <div className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border dark:border-gray-800 overflow-hidden animate-fade-in">
                <div className="h-2 bg-gray-100 dark:bg-gray-800 w-full"><div className="h-full bg-brand-purple transition-all duration-700 ease-out" style={{ width: `${(step / 3) * 100}%` }}/></div>
                <div className="p-8 md:p-14">
                    <div className="flex justify-center mb-10"><LogoIcon className="h-12 w-auto" /></div>
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center"><h1 className="text-4xl font-black tracking-tighter mb-3">BIENVENUE, {user.name.split(' ')[0]} !</h1><p className="text-gray-500 font-medium">Commençons par configurer votre identité.</p></div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom de votre chaîne</label>
                                <input type="text" placeholder="Ex: Tech Explorer" value={channelName} onChange={e => setChannelName(e.target.value)} className="w-full px-5 py-5 rounded-2xl border-2 dark:border-gray-800 dark:bg-gray-950 focus:border-brand-purple outline-none transition font-bold"/>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center"><h1 className="text-4xl font-black tracking-tighter mb-3">VOTRE NICHE ?</h1><p className="text-gray-500 font-medium">Pour personnaliser vos futurs scripts.</p></div>
                            <div className="grid grid-cols-2 gap-3">
                                {['Tech', 'Lifestyle', 'Gaming', 'Business', 'Education', 'Shorts'].map(n => (
                                    <button key={n} onClick={() => setNiche(n)} className={`p-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${niche === n ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}>{n}</button>
                                ))}
                            </div>
                            <input type="text" placeholder="Autre niche..." value={niche} onChange={e => setNiche(e.target.value)} className="w-full px-5 py-5 rounded-2xl border-2 dark:border-gray-800 dark:bg-gray-950 focus:border-brand-purple outline-none transition font-bold"/>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center"><h1 className="text-4xl font-black tracking-tighter mb-3">VOTRE STATUT ?</h1><p className="text-gray-500 font-medium">Adapté à votre structure de travail.</p></div>
                            <div className="space-y-3">
                                {[
                                    { id: 'Just Me', label: 'Solo Creator', icon: <UserIcon className="h-5 w-5"/>, desc: 'Indépendant, gère tout seul.' },
                                    { id: 'Community', label: 'Team', icon: <Squares2x2Icon className="h-5 w-5"/>, desc: 'Petite équipe collaborative.' },
                                    { id: 'Enterprise', label: 'Enterprise', icon: <BriefcaseIcon className="h-5 w-5"/>, desc: 'Agence ou grande chaîne.' },
                                ].map(item => (
                                    <button key={item.id} onClick={() => setStatus(item.id as any)} className={`w-full p-5 rounded-3xl border-2 flex items-center space-x-5 transition-all ${status === item.id ? 'border-brand-purple bg-brand-purple/5' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'}`}>
                                        <div className={`p-4 rounded-2xl ${status === item.id ? 'bg-brand-purple text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>{item.icon}</div>
                                        <div className="text-left flex-1">
                                            <p className={`font-black text-sm uppercase tracking-tight ${status === item.id ? 'text-brand-purple' : ''}`}>{item.label}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.desc}</p>
                                        </div>
                                        {status === item.id && <CheckIcon className="h-5 w-5 text-brand-purple"/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-12 flex space-x-4">
                        {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1 font-black uppercase text-xs">Retour</Button>}
                        <Button onClick={handleNext} className="flex-1 py-5 text-lg font-black tracking-tighter" isLoading={isLoading} disabled={step === 2 && !niche}>{step === 3 ? 'TERMINER' : 'SUIVANT'}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
