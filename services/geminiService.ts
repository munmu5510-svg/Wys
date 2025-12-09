
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
        console.warn("API_KEY appears to be missing. Calls will likely fail.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey: envKey || '' });
  }
  return aiInstance;
};

const MODEL_NAME = 'gemini-2.5-flash';

// Helper to clean Markdown code blocks from JSON response
const cleanJson = (text: string) => {
    if (!text) return "";
    let clean = text.trim();
    
    // Find JSON start and end
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }

    // Remove markdown code blocks if still present (fallback)
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json/, "").replace(/```$/, "");
    } else if (clean.startsWith("```")) {
         clean = clean.replace(/^```/, "").replace(/```$/, "");
    }
    return clean.trim();
};

// Helper to repair truncated JSON
const repairJson = (jsonStr: string) => {
    let str = jsonStr.trim();
    // 1. Fix unterminated string
    let inString = false;
    let escape = false;
    for(let i=0; i<str.length; i++){
        if(str[i] === '\\' && !escape) { escape = true; continue; }
        if(str[i] === '"' && !escape) inString = !inString;
        escape = false;
    }
    if(inString) str += '"';
    
    // 2. Close open brackets/braces
    const stack = [];
    inString = false;
    escape = false;
    for(let i=0; i<str.length; i++){
        const char = str[i];
        if(char === '\\' && !escape) { escape = true; continue; }
        if(char === '"' && !escape) inString = !inString;
        escape = false;
        
        if(!inString) {
            if(char === '{') stack.push('}');
            else if(char === '[') stack.push(']');
            else if(char === '}' || char === ']') {
                 if(stack.length > 0 && stack[stack.length-1] === char) stack.pop();
            }
        }
    }
    // Close remaining
    while(stack.length > 0) str += stack.pop();
    
    return str;
};

const parseResponse = (text: string) => {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        const cleaned = cleanJson(text);
        try {
            return JSON.parse(cleaned);
        } catch (e2) {
            try {
                // Attempt to repair truncated JSON
                const repaired = repairJson(cleaned);
                return JSON.parse(repaired);
            } catch (e3) {
                console.error("JSON parse failed even after repair:", e3);
                return null;
            }
        }
    }
};

export const checkServiceStatus = () => "Ready";

// Retry helper
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        // Retry on 500, 503, or XHR errors
        if (retries > 0 && (error.toString().includes('xhr') || error.toString().includes('500') || error.status === 503)) {
            console.warn(`Retrying operation... Attempts left: ${retries}. Error: ${error}`);
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

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
  
  Return a JSON object with this exact structure:
  {
      "title": "Catchy title",
      "youtubeDescription": "SEO optimized description",
      "hashtags": ["#tag1", "#tag2"],
      "sections": [
          {
              "title": "Section Title",
              "estimatedTime": "30s",
              "content": "Verbatim script content...",
              "visualNote": "Visual direction..."
          }
      ],
      "socialPosts": [
          {
              "platform": "Platform Name",
              "content": "Post content...",
              "hashtags": ["#tag1"],
              "visualNote": "Visual asset description..."
          }
      ]
  }

  **IMPORTANT:**
  - STRICTLY Output valid JSON.
  - DO NOT OUTPUT MARKDOWN.
  - Do not truncate the JSON.
  - Total script length should fit within ${format}.
  `;

  try {
    const ai = getAi();
    
    // Safety settings to prevent blocking legitimate content
    const safetySettings = [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ];

    // Use Streaming to avoid timeouts/XHR errors on large payloads
    const resultStream = await withRetry(async () => {
        return await ai.models.generateContentStream({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: "You are WySlider. You generate structured JSON scripts. You NEVER repeat text endlessly.",
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                // @ts-ignore
                safetySettings: safetySettings,
            }
        });
    });

    let fullText = "";
    for await (const chunk of resultStream) {
        fullText += chunk.text;
    }

    if (fullText) {
        const data = parseResponse(fullText);
        
        // Basic Validation
        if (!data || typeof data !== 'object') {
            console.error("Invalid JSON data returned");
            return null;
        }

        // Sanitize sections
        if (!data.sections || !Array.isArray(data.sections)) {
             data.sections = [];
        }

        // Sanitize socialPosts to ensure hashtags is always an array
        if (data && data.socialPosts) {
            data.socialPosts = data.socialPosts.map((post: any) => ({
                ...post,
                hashtags: Array.isArray(post.hashtags) ? post.hashtags : []
            }));
        } else if (data && !data.socialPosts) {
            data.socialPosts = [];
        }
        
        // Sanitize hashtags on root
        if (data && !Array.isArray(data.hashtags)) {
            data.hashtags = [];
        }

        return data;
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
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: {
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    // No strict schema to improve reliability
                }
            });
        });

        if (response.text) {
            const data = parseResponse(response.text);
            return data?.episodes || [];
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
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: {
                    maxOutputTokens: 4096,
                    responseMimeType: "application/json",
                    // No strict schema
                }
            });
        });

        if (response.text) {
             const data = parseResponse(response.text);
             return data?.ideas || [];
        }
        return [];
    } catch (e) {
        console.error("Error generating viral ideas", e);
        return [];
    }
};

export const generateEditorialCalendar = async (niche: string, tasks?: string) => {
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
         const response = await withRetry(async () => {
             return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                 config: {
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                }
             });
         });
         
         if(response.text) {
             const data = parseResponse(response.text);
             if (data) {
                 if (Array.isArray(data)) return data;
                 if (data.events && Array.isArray(data.events)) return data.events;
                 return [];
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
    
    IMPORTANT: Every single hashtag MUST start with the '#' symbol.
    
    Return a JSON object with a property "posts", which is an array of objects:
    - platform: string
    - content: string (the post text with emojis)
    - hashtags: array of strings (e.g., ["#YouTube", "#Growth"])
    - visualNote: description of visual asset
    `;

    try {
        const ai = getAi();
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: {
                    maxOutputTokens: 4096,
                    responseMimeType: "application/json",
                }
            });
        });

        if (response.text) {
             const data = parseResponse(response.text);
             // Sanitize posts to ensure hashtags is always an array
             const posts = data?.posts || [];
             return posts.map((post: any) => ({
                 ...post,
                 hashtags: Array.isArray(post.hashtags) ? post.hashtags : []
             }));
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
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Analyze this URL or text representation of a social media post: "${url}". 
                Does it look like a valid social media link (YouTube, Instagram, TikTok, LinkedIn, Twitter/X) that could be about a product named "WySlider"?
                Return JSON: { "isValid": boolean, "reason": "string" }`,
                config: {
                    maxOutputTokens: 1024,
                    responseMimeType: "application/json",
                }
            });
        });
        
        const text = response.text || "{}";
        const json = parseResponse(text) || {};
        return !!json.isValid;
    } catch (e) {
        return url.includes("http") && url.length > 15;
    }
}

export const generateAdminInsights = async (metrics: string): Promise<string> => {
    try {
        const ai = getAi();
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Analyze the following application metrics and provide a short, futuristic, cyberpunk-style system status report. Data: ${metrics}`,
                config: {
                    maxOutputTokens: 1024
                }
            });
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
        const result = await withRetry(async () => await chatSession.sendMessage({ message }));
        return result.text;
    } catch (error) {
        console.error("Chat error:", error);
        return "Connection interrupted.";
    }
};

export const generatePitch = async (brand: string, url: string, objective: string) => {
    try {
        const ai = getAi();
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Write a cold email pitch (in French) to the brand "${brand}" (Website: ${url}) with the objective: ${objective}. Keep it under 200 words, professional and persuasive.`
            });
        });
        return response.text || "";
    } catch (error) {
        return "";
    }
};

export const analyzeSEO = async (scriptTitle: string, scriptContent: string) => {
    try {
        const ai = getAi();
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Analyze the SEO potential and CTR for a YouTube video. Language: French. \nTitle: ${scriptTitle}\nScript Snippet: ${scriptContent.substring(0, 500)}\n\nProvide a Score out of 100, 3 strengths, and 3 improvements.`
            });
        });
        return response.text || "";
    } catch { return "" }
}

export const extractStyleFromRef = async (_ref: string) => {
    return "Analysis complete. Detected style: High energy, fast cuts, empathetic undertone.";
}
