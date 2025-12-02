
import React from 'react';
import { LogoIcon, CheckIcon, RocketLaunchIcon, SparklesIcon, ChartBarIcon, Squares2x2Icon, FacebookIcon, WhatsappIcon } from './icons';
import { Button } from './Button';
import { PRICING } from '../constants';

interface LandingPageProps {
    onNavigateToAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans animate-fade-in flex flex-col">
        {/* Splash/Hero */}
        <section className="min-h-[90vh] flex flex-col justify-center items-center relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pt-20 pb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-gray-900 to-blue-900/80"></div>
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                <LogoIcon className="h-20 md:h-32 w-auto mb-6 md:mb-8 mx-auto" />
                <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 leading-tight">
                    WySlider
                </h1>
                <p className="text-xl md:text-3xl font-light text-white mb-2">
                    Votre Générateur de scripts YouTube professionnels, boosté par l’IA
                </p>
                <p className="text-lg md:text-xl text-brand-purple font-semibold tracking-wide uppercase mb-8 md:mb-12">
                    Pensez moins, créez plus.
                </p>
                <Button onClick={onNavigateToAuth} className="text-lg md:text-xl px-12 py-5 shadow-2xl shadow-purple-500/50 rounded-full">
                    Rejoindre la bêta maintenant
                </Button>
            </div>
        </section>

        {/* Why WySlider */}
        <section className="py-24 bg-gray-800">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-4xl font-bold mb-6">Pourquoi WySlider ?</h2>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        Créer des vidéos YouTube captivantes prend du temps : trouver l’idée, écrire, structurer, garder le rythme… 
                        WySlider simplifie tout. En quelques clics, votre idée devient un script professionnel prêt à tourner, 
                        parfaitement adapté à votre ton et à votre audience.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                     <div className="bg-gray-700/50 p-8 rounded-2xl">
                        <h3 className="text-2xl font-bold mb-4 flex items-center"><SparklesIcon className="h-6 w-6 mr-2 text-brand-purple"/> Une IA qui vous comprend</h3>
                        <p className="text-gray-400">WySlider ne se contente pas d’écrire. Il s’adapte à votre ton et à votre niche : énergique, inspirant, professionnel ou humoristique.</p>
                     </div>
                     <div className="bg-gray-700/50 p-8 rounded-2xl">
                        <h3 className="text-2xl font-bold mb-4 flex items-center"><RocketLaunchIcon className="h-6 w-6 mr-2 text-blue-500"/> Co-Pilot Contextuel</h3>
                        <p className="text-gray-400">Grâce à son Co-Pilot Contextuel, chaque section de votre script bénéficie de conseils ciblés : hooks percutants, transitions naturelles, et idées visuelles prêtes à filmer.</p>
                     </div>
                </div>
            </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-gray-900">
            <div className="container mx-auto px-6">
                <h2 className="text-4xl font-bold text-center mb-16">Comment ça marche ?</h2>
                <div className="grid md:grid-cols-4 gap-8">
                    {[
                        {step: "1", title: "Créez un compte", desc: "Entrez votre adresse e-mail, le nom et le lien de votre chaîne YouTube."},
                        {step: "2", title: "Soumettez une idée", desc: "Ex. “5 astuces pour booster sa productivité” ou “Les erreurs qui tuent votre chaîne”."},
                        {step: "3", title: "Magie WySlider", desc: "Obtenez un script clair, structuré, avec Hook, Main Content, CTA et suggestions visuelles."},
                        {step: "4", title: "Optimisez et exportez", desc: "Téléchargez votre script, vos notes de montage ou votre description YouTube."}
                    ].map((item, i) => (
                        <div key={i} className="text-center relative">
                            {/* Visual Badge Number */}
                            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-brand-purple to-brand-blue rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg shadow-purple-900/50">
                                {item.step}
                            </div>
                            
                            {/* Faint Background Number (Optional, kept for style but reduced opacity) */}
                            <div className="text-8xl font-bold text-gray-800/50 absolute top-4 left-1/2 -translate-x-1/2 -z-10 select-none">
                                {item.step}
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-400">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Community Templates */}
        <section className="py-24 bg-gray-800">
            <div className="container mx-auto px-6">
                <h2 className="text-4xl font-bold text-center mb-4 flex items-center justify-center"><Squares2x2Icon className="h-8 w-8 mr-3 text-pink-500"/> Templates de la Communauté</h2>
                <p className="text-center text-gray-400 mb-16">Découvrez ce que les autres créateurs utilisent.</p>
                
                <div className="grid md:grid-cols-4 gap-6">
                    {[
                        {title: "Le Vlog Storytelling", niche: "Lifestyle", user: "SarahVlogs"},
                        {title: "Review Tech Express", niche: "Tech", user: "GeekMasters"},
                        {title: "Tuto Cuisine ASMR", niche: "Food", user: "ChefLeo"},
                        {title: "Analyse Crypto Daily", niche: "Finance", user: "CryptoKing"}
                    ].map((t, i) => (
                        <div key={i} className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-pink-500 transition group cursor-pointer" onClick={onNavigateToAuth}>
                            <h3 className="font-bold text-lg mb-2 group-hover:text-pink-400 transition">{t.title}</h3>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span className="bg-gray-800 px-2 py-1 rounded">{t.niche}</span>
                                <span>@{t.user}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <Button variant="outline" onClick={onNavigateToAuth}>Voir plus de templates</Button>
                </div>
            </div>
        </section>

        {/* Beta CTA */}
        <section className="py-20 bg-gradient-to-r from-brand-purple to-brand-blue text-white">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold mb-6">Devenez bêta testeur officiel</h2>
                <div className="max-w-2xl mx-auto text-left bg-white/10 p-8 rounded-xl backdrop-blur-sm mb-8">
                    <ul className="space-y-3">
                        <li className="flex items-start"><CheckIcon className="h-6 w-6 mr-2 flex-shrink-0"/> Accès anticipé à toutes les fonctionnalités.</li>
                        <li className="flex items-start"><CheckIcon className="h-6 w-6 mr-2 flex-shrink-0"/> 6 générations gratuites dès votre inscription.</li>
                        <li className="flex items-start"><CheckIcon className="h-6 w-6 mr-2 flex-shrink-0"/> Influencez l’évolution du produit.</li>
                        <li className="flex items-start"><CheckIcon className="h-6 w-6 mr-2 flex-shrink-0"/> Cité comme contributeur officiel lors du lancement.</li>
                    </ul>
                </div>
                <Button onClick={onNavigateToAuth} className="bg-white text-brand-purple hover:bg-gray-100 font-bold px-8 py-4">
                    Rejoindre la bêta maintenant
                </Button>
            </div>
        </section>

        {/* Pricing */}
        <section className="py-24 bg-gray-900">
             <div className="container mx-auto px-6">
                <h2 className="text-4xl font-bold text-center mb-16">Des tarifs simples et transparents</h2>
                <div className="grid md:grid-cols-4 gap-6">
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-2">Freemium</h3>
                        <p className="text-3xl font-bold text-brand-purple mb-4">Gratuit</p>
                        <p className="text-sm text-gray-400">6 générations offertes pour tester l’IA.</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-2xl border border-brand-purple shadow-lg shadow-brand-purple/20 relative">
                        <div className="absolute top-0 right-0 bg-brand-purple text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAIRE</div>
                        <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
                        <p className="text-3xl font-bold text-brand-purple mb-4">$29<span className="text-sm text-gray-500">/script</span></p>
                        <p className="text-sm text-gray-400">Puis $19 pour 20 scripts après 2 paiements.</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-2">Offre Corp Use</h3>
                        <p className="text-3xl font-bold text-blue-400 mb-4">Gratuit</p>
                        <p className="text-sm text-gray-400">8 générations gratuites en partageant WySlider avec 2 créateurs.</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-2">Offre Post Use</h3>
                        <p className="text-3xl font-bold text-green-400 mb-4">Gratuit</p>
                        <p className="text-sm text-gray-400">Postez votre création et obtenez 10 générations gratuites.</p>
                    </div>
                </div>
                <p className="text-center text-gray-500 mt-8 italic">Pas d’abonnement caché. Vous payez uniquement pour ce que vous créez.</p>
             </div>
        </section>
        
        <footer className="py-12 bg-black border-t border-gray-800">
            <div className="container mx-auto px-6 text-center">
                <div className="mb-8">
                    <h4 className="text-xl font-bold mb-4">Rejoignez la communauté WySlider</h4>
                    <div className="flex justify-center space-x-6">
                        <a href="https://facebook.com/WySlider" target="_blank" className="text-gray-400 hover:text-blue-500 transition transform hover:scale-110">
                            <FacebookIcon className="h-8 w-8" />
                        </a>
                        <a href="https://whatsapp.com/channel/0029Vb6jpTK9WtC3oJokm72B" target="_blank" className="text-gray-400 hover:text-green-500 transition transform hover:scale-110">
                            <WhatsappIcon className="h-8 w-8" />
                        </a>
                    </div>
                </div>
                <div className="text-gray-600 text-sm">
                    &copy; 2024 WySlider. All rights reserved. <br/>
                    Sécurité & confidentialité : Vos données vous appartiennent.
                </div>
            </div>
        </footer>
    </div>
  );
};
