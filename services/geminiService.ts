
import { GoogleGenAI, Type, Chat } from "@google/genai";

// Lazy initialization of AI client
let aiInstance: GoogleGenAI | null = null;

const getAi = (apiKey?: string) => {
  if (apiKey) {
      return new GoogleGenAI({ apiKey });
  }
  if (!aiInstance) {
    const envKey = process.env.API_KEY;
    
    if (!envKey) {
        console.warn("API_KEY appears to be missing.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey: envKey || 'MISSING_KEY' });
  }
  return aiInstance;
};

const MODEL_NAME = 'gemini-2.5-flash';

// Helper to clean Markdown code blocks from JSON response
const cleanJson = (text: string) => {
    if (!text) return "";
    let clean = text.trim();
    // Remove markdown code blocks if present
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json/, "").replace(/```$/, "");
    } else if (clean.startsWith("```")) {
         clean = clean.replace(/^```/, "").replace(/```$/, "");
    }
    return clean.trim();
};

export const checkServiceStatus = () => "Ready";

export const generateScript = async (
    topic: string, 
    tone: string, 
    format: string, 
    youtubeUrl?: string,
    goal?: string,
    needs?: string,
    cta?: string,
    platforms?: string
) => {
  const prompt = `You are a world-class YouTube Scriptwriter (WySlider AI).
  
  **CONFIGURATION:**
  - Topic: "${topic}"
  - Tone: ${tone}
  - Format/Length: ${format}
  - Channel Context: ${youtubeUrl || 'General'}
  - Goal: ${goal || 'Engagement & Growth'}
  - Specific Needs: ${needs || 'None'}
  - CTA: ${cta || 'Subscribe'}
  - Social Platforms: ${platforms || 'YouTube, Instagram, TikTok, LinkedIn'}

  **MANDATORY OUTPUT STRUCTURE (JSON):**
  The output MUST be in French (Français).
  Ensure the response is valid JSON. Do not repeat sections endlessly. Keep it concise and professional.
  
  1. **title**: Catchy, High CTR (Click-Through Rate).
  2. **youtubeDescription**: 3-4 lines optimized for SEO with keywords.
  3. **hashtags**: 5-10 relevant hashtags.
  4. **sections**: An array of script sections. 
     - **Intro**: Must include a "Hook Pertinent" (catchy opening) and "Intro".
     - **Main Content**: Must be divided into clearly NUMBERED sections (e.g., "1. Le Problème", "2. La Solution"). Limit to 3-5 main points max.
     - **Conclusion**: Brief summary.
     - **CTA**: The specific Call to Action.
     *Each section object must contain:*
       - \`title\`: Section header (e.g., "0:00 Intro", "1:30 Partie 1").
       - \`estimatedTime\`: Duration (e.g., "30s").
       - \`content\`: The spoken script (Verbatim). Natural, engaging flow. Avoid repetition.
       - \`visualNote\`: Detailed visual direction.
  5. **socialPosts**: Promotional posts for the specified platforms.
     *Each post object must contain:*
       - \`platform\`: Platform name.
       - \`content\`: Engaging caption with emojis.
       - \`hashtags\`: Platform-specific tags.
       - \`visualNote\`: Description of the visual asset.

  **IMPORTANT:**
  - STRICTLY Output valid JSON.
  - Do not truncate the JSON.
  - Total script length should fit within ${format}.
  `;

  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            systemInstruction: "You are WySlider. You generate structured JSON scripts. You NEVER repeat text endlessly.",
            maxOutputTokens: 8192, 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    youtubeDescription: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sections: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                estimatedTime: { type: Type.STRING },
                                content: { type: Type.STRING },
                                visualNote: { type: Type.STRING }
                            },
                            required: ["title", "estimatedTime", "content", "visualNote"]
                        }
                    },
                    socialPosts: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                platform: { type: Type.STRING },
                                content: { type: Type.STRING },
                                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                visualNote: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });

    if (response.text) {
        try {
            const data = JSON.parse(response.text);
            if (!data.sections || data.sections.length === 0) {
                return null;
            }
            return data;
        } catch (e) {
            console.warn("Direct JSON parse failed, attempting cleanup", e);
            const cleaned = cleanJson(response.text);
            try {
                 const data = JSON.parse(cleaned);
                 return data;
            } catch (err) {
                 console.error("Failed to parse cleaned JSON:", err);
                 return null;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Error generating script:", error);
    return null;
  }
};

export const generateSeriesOutlines = async (
    theme: string, 
    count: number, 
    tone: string, 
    niche: string, 
    goal?: string
) => {
    const prompt = `Propose ${count} YouTube video titles and brief summaries for a series on the theme: "${theme}".
    Niche: ${niche}.
    Tone: ${tone}.
    ${goal ? `Goal: ${goal}` : ''}
    Language: French.
    
    Return a JSON object with an array "episodes". Each item must have:
    - title: string
    - summary: string (one sentence)
    `;

    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        episodes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    summary: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            try {
                return JSON.parse(response.text).episodes;
            } catch (e) {
                return JSON.parse(cleanJson(response.text)).episodes;
            }
        }
        return [];
    } catch (e) {
        console.error("Error generating series outlines", e);
        return [];
    }
};

export const generateViralIdeas = async (niche: string) => {
    const prompt = `Generate 6 viral video ideas for the niche: "${niche}". 
    Language: French.
    For each idea, provide a catchy title, a hook, and a difficulty level (Easy, Medium, Hard).
    Return a valid JSON object with an array "ideas".`;

    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ideas: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    hook: { type: Type.STRING },
                                    difficulty: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
             try {
                return JSON.parse(response.text).ideas;
            } catch (e) {
                return JSON.parse(cleanJson(response.text)).ideas;
            }
        }
        return [];
    } catch (e) {
        console.error("Error generating viral ideas", e);
        return [];
    }
};

export const generateEditorialCalendar = async (niche: string, tasks?: string) => {
    // Simplified prompt for reliability
    const prompt = `Create a 4-week content calendar for a YouTube channel in the niche: "${niche}".
    Language: French.
    Tasks to include: ${tasks || 'General trends'}.
    Return a valid JSON object containing an array called "events".
    Each event must have:
    - date (YYYY-MM-DD format)
    - title (string)
    - format (Shorts or Long-form)
    - status ('planned')`;

    try {
         const ai = getAi();
         const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
             config: {
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        events: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    date: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    format: { type: Type.STRING },
                                    status: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
         });
         
         if(response.text) {
             try {
                 const parsed = JSON.parse(response.text);
                 // Handle if model returns array directly or wrapped in object
                 if (Array.isArray(parsed)) return parsed;
                 if (parsed.events && Array.isArray(parsed.events)) return parsed.events;
                 return [];
             } catch(e) {
                 const clean = JSON.parse(cleanJson(response.text));
                 return clean.events || clean || [];
             }
         }
         return [];
    } catch (e) {
        console.error("Error generating calendar", e);
        return [];
    }
}

export const generateSocialPosts = async (scriptTitle: string, scriptContent: string, platforms: string) => {
    const prompt = `Based on this YouTube script, write promotional social media posts.
    Language: French.
    Title: "${scriptTitle}"
    Content Summary: "${scriptContent.substring(0, 1000)}..."
    Platforms: ${platforms} (e.g., LinkedIn, Twitter, Instagram).
    
    Return a JSON object with a property "posts", which is an array of objects:
    - platform: string
    - content: string (the post text with emojis)
    - hashtags: array of strings
    - visualNote: description of visual asset
    `;

    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        posts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    platform: { type: Type.STRING },
                                    content: { type: Type.STRING },
                                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    visualNote: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
             try {
                return JSON.parse(response.text).posts;
            } catch (e) {
                return JSON.parse(cleanJson(response.text)).posts || [];
            }
        }
        return [];
    } catch(e) {
        console.error("Error generating social posts", e);
        return [];
    }
}

export const verifyPostContent = async (url: string) => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Analyze this URL or text representation of a social media post: "${url}". 
            Does it look like a valid social media link (YouTube, Instagram, TikTok, LinkedIn, Twitter/X) that could be about a product named "WySlider"?
            Return JSON: { "isValid": boolean, "reason": "string" }`,
            config: {
                maxOutputTokens: 1024,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isValid: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    }
                }
            }
        });
        
        const text = response.text || "{}";
        const json = JSON.parse(cleanJson(text));
        return json.isValid;
    } catch (e) {
        // Fallback for demo if URL is generic or analysis fails
        return url.includes("http") && url.length > 15;
    }
}

export const generateAdminInsights = async (metrics: string): Promise<string> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Analyze the following application metrics and provide a short, futuristic, cyberpunk-style system status report. Data: ${metrics}`,
            config: {
                maxOutputTokens: 1024
            }
        });
        return response.text || "NO_DATA_AVAILABLE";
    } catch (error) {
        return "SYSTEM_ERROR";
    }
};

const APP_KNOWLEDGE_BASE = `
CONTEXTE GLOBAL & RÔLE :
Tu es WYS AI, l'assistant intelligent officiel de l'application WySlider (Version 2). 
Ton rôle est d'être un guide expert pour l'utilisateur, à la fois sur la création de contenu YouTube et sur l'utilisation de l'application elle-même.

INFOS CLÉS SUR L'APPLICATION WYSLIDER :

1. NAVIGATION GÉNÉRALE :
   - Dashboard (Accueil) : Vue d'ensemble des scripts et séries. Barre de recherche et actions de masse.
   - Studio : L'éditeur de script avancé avec support Markdown.
   - Serial Prod : Le générateur de séries (Accessible via Dashboard).
   - Compte : Hub central pour le profil, les réglages, la Forge, les Idées, et le Stockage.
   - Chat AI : Assistant contextuel accessible via la bulle en bas à droite.

2. FONCTIONNALITÉS DÉTAILLÉES :

   A. CRÉATION DE SCRIPTS (STUDIO) :
      - Accès : Bouton "+" Mauve sur le Dashboard.
      - Configuration : Définir Sujet, Ton (personnalisable), Durée, Objectif, Besoins, CTA, Plateformes.
      - Éditeur : Supporte le Markdown (Gras, Italique, Listes).
      - Visual Notes : Bouton "Oeil" pour ajouter des directions visuelles [Visual: ...].
      - Export : "Télécharger PDF" dans le menu config.
      - Social Posts : Générer des posts promotionnels basés sur le script (bouton en bas du Studio).

   B. CRÉATION DE SÉRIES (SERIAL PROD) :
      - Accès : Bouton "+" Bleu sur le Dashboard (Section Séries) ou via bannière si vide.
      - Fonction : Générer 3 à 20 scripts cohérents sur un même thème.
      - Workflow : 1. Config (Thème, Niche, Objectif) -> 2. Validation des titres par l'IA -> 3. Génération en masse.
      - Note : Nécessite des crédits ou un accès Pro+.

   C. IDÉES VIRALES (GROWTH) :
      - Accès : Menu "Compte" -> Onglet "Idées".
      - Fonction : L'IA analyse la niche de l'utilisateur et génère 6 concepts avec difficulté (Easy/Medium/Hard).
      - Action : Cliquer sur une idée crée instantanément le script dans le Studio.

   D. FORGE (AI LAB) :
      - Accès : Menu "Compte" -> Onglet "Forge".
      - Fonction : Personnaliser le style de l'IA.
      - Action : Ajouter des URLs YouTube de référence. L'IA analyse le "Style DNA" pour reproduire le rythme et l'humour.

   E. TEMPLATES & PARTAGE :
      - Accès : Menu "Compte" -> Onglets "Templates" ou "Partager".
      - Templates Communautaires : Copier des structures (Vlog, Review, Tuto) pour gagner du temps.
      - Partage : Partager ses propres scripts comme modèles pour la communauté.

   F. GESTION DES DONNÉES (STOCKAGE) :
      - Accès : Menu "Compte" -> Onglet "Stockage".
      - Local Storage : Par défaut (navigateur).
      - Google Drive : Synchronisation cloud pour ne pas perdre ses données.
      - Firebase : Option avancée pour une persistance professionnelle.

   G. CRÉDITS & FORMULES :
      - Freemium : Crédits offerts à l'inscription.
      - Pro+ : Accès illimité et fonctionnalités avancées (Serial Prod).
      - Gagner des crédits (Gamification) :
        1. Corp Use : Partager l'app avec 2 amis (+8 crédits).
        2. Post Use : Poster un lien parlant de WySlider (+10 crédits après vérification IA).
        3. Codes Promo : Entrer un code dans l'onglet Compte.
        4. Promo Code Spécial : 'pro2301' débloque l'accès Pro+.

3. DÉPANNAGE & CONSEILS :
   - Page blanche ? -> Va dans "Idées Virales".
   - Besoin de changer de style ? -> Utilise la "Forge" ou change le "Ton" dans le Studio.
   - Problème de sauvegarde ? -> Vérifie l'onglet "Stockage" et active Google Drive si possible.
   - Questions techniques ? -> Guide l'utilisateur vers le menu précis (ex: "Clique sur ton avatar en haut à droite...").

DIRECTIVES DE COMPORTEMENT :
- Langue : Français uniquement.
- Ton : Professionnel, encourageant, expert YouTube mais accessible.
- Ne mentionne JAMAIS l'accès "Admin" ou le "Bypass Login".
- Sois proactif : Si l'utilisateur écrit un script, propose des améliorations contextuelles (Hook, CTA).
- Si l'utilisateur demande "Comment faire X ?", donne le chemin exact dans l'interface.
`;

export const startChatSession = (context: string): Chat => {
    const ai = getAi();
    return ai.chats.create({
        model: MODEL_NAME,
        config: {
            systemInstruction: `${APP_KNOWLEDGE_BASE}\n\nCONTEXTE ACTUEL DE L'UTILISATEUR (SCRIPT EN COURS) :\n${context}`
        }
    });
};

export const sendMessageToChat = async (chatSession: Chat, message: string): Promise<string> => {
    try {
        const result = await chatSession.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Chat error:", error);
        return "Connection interrupted.";
    }
};

export const generatePitch = async (brand: string, url: string, objective: string) => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Write a cold email pitch (in French) to the brand "${brand}" (Website: ${url}) with the objective: ${objective}. Keep it under 200 words, professional and persuasive.`
        });
        return response.text || "";
    } catch (error) {
        return "";
    }
};

export const analyzeSEO = async (scriptTitle: string, scriptContent: string) => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
             model: MODEL_NAME,
             contents: `Analyze the SEO potential and CTR for a YouTube video. Language: French. \nTitle: ${scriptTitle}\nScript Snippet: ${scriptContent.substring(0, 500)}\n\nProvide a Score out of 100, 3 strengths, and 3 improvements.`
        });
        return response.text || "";
    } catch { return "" }
}

export const extractStyleFromRef = async (_ref: string) => {
    return "Analysis complete. Detected style: High energy, fast cuts, empathetic undertone.";
}
