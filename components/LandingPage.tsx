
import React from 'react';
import { LogoIcon, SparklesIcon, CheckIcon } from './icons';
import { Button } from './Button';

interface LandingPageProps {
    onNavigateToAuth: () => void;
}

const Section: React.FC<{id: string; className?: string; children: React.ReactNode}> = ({id, className = '', children}) => (
    <section id={id} className={`py-20 ${className}`}>
        <div className="container mx-auto px-6">
            {children}
        </div>
    </section>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const howItWorksSteps = [
      { title: 'Créez un compte gratuitement', description: 'Entrez votre adresse e-mail, le nom et le lien de votre chaîne YouTube.' },
      { title: 'Soumettez une idée de vidéo', description: 'Ex. “5 astuces pour booster sa productivité” ou “Les erreurs qui tuent votre chaîne”.' },
      { title: 'Laissez WySlider faire sa magie', description: 'En quelques secondes, obtenez un script clair, structuré, avec Hook, Main Content, CTA et même des suggestions visuelles.' },
      { title: 'Optimisez et exportez', description: 'Téléchargez votre script, vos notes de montage ou votre description YouTube avec timecodes.' },
  ];

  const betaBenefits = [
      'Vous obtenez un accès anticipé à toutes les fonctionnalités.',
      'Vous bénéficiez de 5 générations gratuites dès votre inscription.',
      'Vous influencez directement l’évolution du produit.',
      'Vous serez cité comme contributeur officiel lors du lancement public.',
  ];

  const pricingTiers = [
      { title: 'Freemium', description: '5 générations offertes pour tester l’IA.', featured: false },
      { title: 'Premium', description: '29 $/script → puis 19 $ pour 20 scripts après 2 paiements.', featured: true },
      { title: 'Offre Pro', description: '6 générations gratuites en partageant WySlider avec 2 créateurs par e-mail.', featured: false },
      { title: 'Offre Communautaire', description: 'Postez votre création WySlider sur les réseaux et obtenez 10 générations gratuites.', featured: false },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-transparent to-blue-900/50"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <main className="relative z-10">
            {/* Hero Section */}
            <section className="container mx-auto px-6 py-24 md:py-32 text-center">
                <div className="flex justify-center mb-8">
                    <LogoIcon className="h-16 w-auto" />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                    WySlider — Générateur de scripts YouTube professionnels, <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">boosté par l’IA</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                    Pensez moins, créez plus.
                </p>
                <div className="flex justify-center">
                     <Button onClick={onNavigateToAuth} className="text-xl !py-4 !px-10">
                        Rejoindre la bêta maintenant
                    </Button>
                </div>
            </section>

            {/* Pourquoi WySlider */}
            <Section id="why" className="bg-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Pourquoi WySlider ?</h2>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Créer des vidéos YouTube captivantes prend du temps : trouver l’idée, écrire, structurer, garder le rythme…
                        WySlider simplifie tout. En quelques clics, votre idée devient un script professionnel prêt à tourner, parfaitement adapté à votre ton et à votre audience.
                    </p>
                    <p className="mt-4 text-lg text-gray-300 leading-relaxed">
                        Notre IA comprend votre chaîne YouTube, analyse votre style et génère des scripts conçus pour maximiser la rétention et l’engagement.
                    </p>
                </div>
            </Section>

            {/* Comment ça marche */}
            <Section id="how-it-works">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Comment ça marche ?</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 max-w-7xl mx-auto">
                    {howItWorksSteps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue flex items-center justify-center text-2xl font-bold mb-4">{index + 1}</div>
                            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                            <p className="text-gray-400">{step.description}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Une IA qui vous comprend */}
            <Section id="ai-copilot" className="bg-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <SparklesIcon className="h-12 w-12 mx-auto text-brand-purple mb-4"/>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Une IA qui vous comprend</h2>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        WySlider ne se contente pas d’écrire. Il s’adapte à votre ton et à votre niche : énergique, inspirant, professionnel ou humoristique.
                    </p>
                    <p className="mt-4 text-lg text-gray-300 leading-relaxed">
                        Grâce à son Co-Pilot Contextuel, chaque section de votre script bénéficie de conseils ciblés : hooks percutants, transitions naturelles, et idées visuelles prêtes à filmer.
                    </p>
                </div>
            </Section>

            {/* Devenez bêta testeur */}
            <Section id="beta">
                <div className="text-center max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Devenez bêta testeur officiel</h2>
                    <p className="text-lg text-gray-300 mb-8">Nous lançons actuellement la version bêta de WySlider, et nous cherchons des créateurs motivés pour nous aider à perfectionner l’expérience.</p>
                    <div className="bg-white/10 rounded-lg p-8 inline-block text-left max-w-2xl mx-auto">
                        <h3 className="text-xl font-semibold mb-6 text-center">En rejoignant le programme bêta :</h3>
                        <ul className="space-y-4">
                            {betaBenefits.map((benefit, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckIcon className="h-6 w-6 text-brand-purple mr-3 flex-shrink-0 mt-1" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <p className="mt-8 text-lg text-gray-300">Rejoindre la bêta, c’est faire partie de la création d’un outil pensé pour les créateurs, par des créateurs.</p>
                    <div className="mt-8">
                        <Button onClick={onNavigateToAuth} className="text-xl !py-4 !px-10">
                            Rejoindre la bêta maintenant
                        </Button>
                    </div>
                </div>
            </Section>

            {/* Tarifs */}
            <Section id="pricing" className="bg-white/5">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Des tarifs simples et transparents</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto my-12">
                        {pricingTiers.map((tier, index) => (
                            <div key={index} className={`p-6 rounded-lg ${tier.featured ? 'border-2 border-brand-purple bg-brand-purple/10 shadow-lg' : 'border border-brand-purple/50'}`}>
                                <h3 className={`text-xl font-semibold ${tier.featured ? 'text-brand-purple' : ''}`}>{tier.title}</h3>
                                <p className="text-gray-400 mt-2">{tier.description}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-lg text-gray-300">Pas d’abonnement caché. Vous payez uniquement pour ce que vous créez.</p>
                </div>
            </Section>

             {/* Mission & Sécurité */}
             <Section id="mission">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 text-center">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Notre mission</h3>
                        <p className="text-gray-300 leading-relaxed">Chez WySlider, nous croyons que chaque idée mérite une belle mise en scène. Notre mission : donner à chaque créateur les outils professionnels pour raconter mieux, plus vite, et avec style.</p>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Sécurité & confidentialité</h3>
                        <p className="text-gray-300 leading-relaxed">Vos données et vos scripts vous appartiennent. WySlider stocke vos créations de façon sécurisée et ne partage rien sans votre accord.</p>
                    </div>
                </div>
             </Section>
            
            {/* Final CTA */}
            <Section id="join" className="bg-white/5">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Rejoignez la communauté WySlider</h2>
                    <p className="text-lg text-gray-300 mb-8">Des créateurs, des storytellers, des passionnés — tous réunis autour d’une même vision : penser moins, créer plus.</p>
                    <Button onClick={onNavigateToAuth} className="text-xl !py-4 !px-10">
                        Rejoindre la bêta maintenant
                    </Button>
                </div>
            </Section>
        </main>
    </div>
  );
};
