
import React, { useState } from 'react';
import { User, AccountSubPage } from '../types';
import { Button } from './Button';
import { FEEDBACK_EMAIL, APP_URL, CORP_USE_REWARD, POST_USE_REWARD, INITIAL_FREE_GENERATIONS } from '../constants';
import * as geminiService from '../services/geminiService';
import { CheckIcon, DiamondIcon, VideoIcon, RobotIcon, PhotoIcon, RefreshIcon, SparklesIcon, PayPalIcon } from './icons';

interface AccountPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
}

const ProfileSection: React.FC<{ user: User, onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
    const [channelName, setChannelName] = useState(user.channelName);
    const [youtubeUrl, setYoutubeUrl] = useState(user.youtubeUrl);
    const [promoCode, setPromoCode] = useState('');
    
    const handleSave = () => {
        onUpdateUser({ ...user, channelName, youtubeUrl });
        alert("Profil mis à jour !");
    };

    const handleApplyCode = () => {
        if (promoCode === 'WySliderThinklessCreatemore2301') {
            onUpdateUser({ ...user, isProPlus: true, generationsLeft: user.generationsLeft + 100 });
            alert(`Code promo spécial activé ! Bienvenue dans WySlider PRO+. 100 générations ont été ajoutées à votre compte.`);
            setPromoCode('');
        } else {
            alert("Code invalide.");
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Profil Professionnel</h3>
            <div className="space-y-4">
                <input type="text" value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="Nom de chaîne" className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:outline-none"/>
                <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Lien YouTube" className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:outline-none"/>
                <Button onClick={handleSave}>Enregistrer les modifications</Button>
            </div>
            
            <hr className="border-gray-200 dark:border-gray-700 my-8" />
            
            <h3 className="text-lg font-semibold mb-2">Code Promotionnel</h3>
             <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Entrez un code..." className="flex-grow px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:outline-none"/>
                <Button onClick={handleApplyCode} variant="secondary">Appliquer</Button>
            </div>
        </div>
    );
};

const ProPlusSection: React.FC<{ user: User, onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handleSubscribe = () => {
        // In a real app, this connects to Stripe.
        // For this demo, we immediately upgrade the user state.
        const confirmUpgrade = window.confirm(`Confirmer l'abonnement WySlider PRO+ (${billingCycle === 'monthly' ? '$49/mois' : '$490/an'}) ?`);
        if (confirmUpgrade) {
            onUpdateUser({ ...user, isProPlus: true, generationsLeft: user.generationsLeft + 50 });
            alert("Bienvenue dans WySlider PRO+ !");
        }
    };

    const handleCancel = () => {
        const confirmCancel = window.confirm("Voulez-vous vraiment annuler votre abonnement PRO+ ?");
        if (confirmCancel) {
            onUpdateUser({ ...user, isProPlus: false });
        }
    }

    const PayPalButton = () => {
        const handlePayment = () => {
            if (window.confirm("Vous serez redirigé vers PayPal pour un paiement de 29$. Continuer ?")) {
                setTimeout(() => {
                    alert("Paiement réussi ! Vos crédits ont été ajoutés. (Simulation)");
                }, 500);
            }
        };

        return (
            <button
                onClick={handlePayment}
                className="w-full flex items-center justify-center px-6 py-3 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 bg-[#ffc439] hover:bg-[#f2b930]"
            >
                <span className="mr-2 text-[#003087]">Acheter avec</span>
                <PayPalIcon className="h-6" />
            </button>
        );
    };

    if (user.isProPlus) {
        return (
            <div className="text-center space-y-6">
                 <div className="inline-block p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <DiamondIcon className="h-16 w-16 text-amber-500" />
                </div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600">Membre WySlider PRO+</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">Vous bénéficiez de tous les avantages exclusifs.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                     <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-start space-x-3">
                        <VideoIcon className="h-6 w-6 text-brand-purple mt-1"/>
                        <div>
                            <h4 className="font-bold">Avatar & Vidéo IA</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Accès illimité à la création vidéo.</p>
                        </div>
                     </div>
                     <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-start space-x-3">
                        <RobotIcon className="h-6 w-6 text-brand-blue mt-1"/>
                        <div>
                             <h4 className="font-bold">IA Coach & Repurposing</h4>
                             <p className="text-sm text-gray-500 dark:text-gray-400">Optimisation et déclinaison automatique.</p>
                        </div>
                     </div>
                </div>

                <Button onClick={handleCancel} variant="outline" className="text-red-500 border-red-500 hover:bg-red-500/10">Gérer / Annuler l'abonnement</Button>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">WySlider <span className="text-amber-500">PRO+</span></h2>
                <p className="text-gray-600 dark:text-gray-400">L’offre ultime pour les créateurs ambitieux, freelances & infopreneurs.</p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex">
                    <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-md text-sm font-semibold transition ${billingCycle === 'monthly' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-purple' : 'text-gray-500'}`}
                    >
                        Mensuel
                    </button>
                    <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-md text-sm font-semibold transition ${billingCycle === 'yearly' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-purple' : 'text-gray-500'}`}
                    >
                        Annuel (-20%)
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Free Tier */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col opacity-75 md:scale-95">
                    <h3 className="text-xl font-bold mb-2">Freemium</h3>
                    <p className="text-3xl font-extrabold mb-4">0€</p>
                    <ul className="space-y-3 mb-8 flex-grow text-sm">
                        <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-2"/>5 générations offertes</li>
                        <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-2"/>Scripts simples</li>
                        <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-2"/>Export basique</li>
                    </ul>
                    <Button variant="outline" disabled>Plan Actuel</Button>
                </div>

                {/* PRO+ Tier */}
                <div className="border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-6 flex flex-col relative transform hover:-translate-y-1 transition duration-300 shadow-xl">
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">RECOMMANDÉ</div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">PRO+ <DiamondIcon className="h-5 w-5 text-amber-500"/></h3>
                    <p className="text-3xl font-extrabold mb-1">
                        {billingCycle === 'monthly' ? '$49' : '$490'}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                    </p>
                    {billingCycle === 'yearly' && <p className="text-xs text-green-600 font-semibold mb-4">2 mois offerts !</p>}
                    
                    <div className="space-y-4 mb-8 flex-grow text-sm">
                        <div className="flex items-start"><VideoIcon className="h-5 w-5 text-brand-purple mr-2 mt-0.5 flex-shrink-0"/><span><strong>Avatar Vidéo IA :</strong> Ton avatar parle avec ton script (Custom)</span></div>
                        <div className="flex items-start"><SparklesIcon className="h-5 w-5 text-brand-blue mr-2 mt-0.5 flex-shrink-0"/><span><strong>Clone Vocal :</strong> Voix réaliste multi-langues</span></div>
                        <div className="flex items-start"><PhotoIcon className="h-5 w-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0"/><span><strong>Miniature Auto :</strong> Générée à partir du sujet</span></div>
                        <div className="flex items-start"><RefreshIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"/><span><strong>Pack "1 script = 5 formats" :</strong> TikTok, Tweet, Newsletter...</span></div>
                        <div className="flex items-start"><RobotIcon className="h-5 w-5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0"/><span><strong>IA Coach :</strong> Analyse & conseils en temps réel</span></div>
                    </div>
                    <Button onClick={handleSubscribe} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-none text-white">
                        Passer à PRO+
                    </Button>
                    <p className="text-xs text-center mt-2 text-gray-500">Ou $7 / vidéo à l'unité</p>
                </div>

                 {/* Premium Tier */}
                 <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col md:scale-95 opacity-80">
                    <h3 className="text-xl font-bold mb-2">Premium</h3>
                    <p className="text-3xl font-extrabold mb-4">$29<span className="text-sm font-normal text-gray-500">/20 scripts</span></p>
                    <ul className="space-y-3 mb-8 flex-grow text-sm">
                        <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-2"/>Pack de crédits</li>
                        <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-2"/>Sans engagement</li>
                        <li className="flex items-center"><CheckIcon className="h-5 w-5 text-green-500 mr-2"/>Accès standard</li>
                    </ul>
                    <PayPalButton />
                </div>
            </div>
        </div>
    );
};

const CorpUseSection: React.FC<{ user: User, onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
    const [email1, setEmail1] = useState('');
    const [email2, setEmail2] = useState('');

    const handleSubmit = () => {
        if (email1 && email2) {
            alert(`Invitations envoyées à ${email1} et ${email2}. Vous recevrez vos générations lorsque vos amis s'inscriront.`);
            onUpdateUser({ ...user, generationsLeft: user.generationsLeft + CORP_USE_REWARD });
            setEmail1('');
            setEmail2('');
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">Offre Corp Use</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Obtenez {CORP_USE_REWARD} générations gratuites en invitant deux créateurs.</p>
            <div className="space-y-4">
                <input type="email" value={email1} onChange={e => setEmail1(e.target.value)} placeholder="Email de votre ami #1" className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:outline-none"/>
                <input type="email" value={email2} onChange={e => setEmail2(e.target.value)} placeholder="Email de votre ami #2" className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:outline-none"/>
                <Button onClick={handleSubmit}>Envoyer les invitations</Button>
            </div>
        </div>
    );
};

const PostUseSection: React.FC<{ user: User, onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
    const [postContent, setPostContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!postContent) return;
        setIsLoading(true);
        const isValid = await geminiService.analyzeSocialPost(postContent);
        setIsLoading(false);
        if (isValid) {
            onUpdateUser({ ...user, generationsLeft: user.generationsLeft + POST_USE_REWARD });
            alert(`Merci pour votre partage ! ${POST_USE_REWARD} générations ont été ajoutées à votre compte.`);
            setPostContent('');
        } else {
            alert("L'analyse IA n'a pas pu confirmer la validité de votre post.");
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">Offre Post Use</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Obtenez {POST_USE_REWARD} générations en partageant WySlider sur les réseaux sociaux.</p>
            <div className="space-y-4">
                <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Collez ici le contenu de votre post..." rows={5} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:outline-none"/>
                <Button onClick={handleSubmit} isLoading={isLoading}>Vérifier et réclamer</Button>
            </div>
        </div>
    );
};

const FeedbackSection: React.FC = () => {
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestion, setSuggestion] = useState('');

    const handleSubmit = async () => {
        if (!feedback) return;
        setIsLoading(true);
        const aiSuggestion = await geminiService.generateFeedbackSuggestion(feedback);
        setSuggestion(aiSuggestion);
        const mailtoLink = `mailto:${FEEDBACK_EMAIL}?subject=WySlider Feedback&body=${encodeURIComponent(feedback)}\n\n--- AI Suggestion ---\n${encodeURIComponent(aiSuggestion)}`;
        window.location.href = mailtoLink;
        setIsLoading(false);
        alert("Votre formulaire de feedback a été ouvert.");
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">Feedback & Améliorations</h3>
            <div className="space-y-4">
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Votre feedback..." rows={5} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:outline-none"/>
                <Button onClick={handleSubmit} isLoading={isLoading}>Envoyer le feedback</Button>
                {suggestion && <div className="mt-4 p-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg"><p className="font-semibold">Suggestion IA :</p><p>{suggestion}</p></div>}
            </div>
        </div>
    );
}

export const AccountPage: React.FC<AccountPageProps> = ({ user, onUpdateUser, onBack }) => {
    const [activePage, setActivePage] = useState<AccountSubPage>(AccountSubPage.Profile);

    const renderContent = () => {
        switch (activePage) {
            case AccountSubPage.Profile:
                return <ProfileSection user={user} onUpdateUser={onUpdateUser} />;
            case AccountSubPage.Premium:
                return <ProPlusSection user={user} onUpdateUser={onUpdateUser} />;
            case AccountSubPage.CorpUse:
                return <CorpUseSection user={user} onUpdateUser={onUpdateUser} />;
            case AccountSubPage.PostUse:
                return <PostUseSection user={user} onUpdateUser={onUpdateUser} />;
            case AccountSubPage.Feedback:
                return <FeedbackSection />;
            default:
                return <ProfileSection user={user} onUpdateUser={onUpdateUser} />;
        }
    };

    const menuItems = [
        { id: AccountSubPage.Profile, label: 'Profil' },
        { id: AccountSubPage.Premium, label: user.isProPlus ? 'Mon Abonnement PRO+' : 'Passer Premium / PRO+' },
        { id: AccountSubPage.CorpUse, label: 'Offre Corp Use' },
        { id: AccountSubPage.PostUse, label: 'Offre Post Use' },
        { id: AccountSubPage.Feedback, label: 'Feedback' },
    ];

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 h-full flex flex-col animate-fade-in">
            <Button onClick={onBack} variant="outline" className="self-start mb-6">← Retour</Button>
            <div className="flex flex-col md:flex-row flex-grow gap-8 min-h-0">
                <aside className="w-full md:w-1/4 flex-shrink-0">
                    <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto pb-2">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`text-left p-3 rounded-lg font-medium transition text-sm sm:text-base whitespace-nowrap ${activePage === item.id ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="w-full md:w-3/4 bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-2xl shadow-lg overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};
