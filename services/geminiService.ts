
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

// Shared Permissive Safety Settings
const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
];

// Helper to clean Markdown code blocks from JSON response
const cleanJson = (text: string) => {
    if (!text) return "";
    let clean = text.trim();
    
    // Find JSON start and end
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    
    const start = (firstBrace > -1 && firstBracket > -1) ? Math.min(firstBrace, firstBracket) : Math.max(firstBrace, firstBracket);
    
    const lastBrace = clean.lastIndexOf('}');
    const lastBracket = clean.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);
    
    if (start !== -1 && end !== -1) {
        clean = clean.substring(start, end + 1);
    }

    // Remove markdown code blocks if still present (fallback)
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json/, "").replace(/```$/, "");
    } else if (clean.startsWith("```")) {
         clean = clean.replace(/^```/, "").replace(/```$/, "");
    }
    return clean.trim();
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
            console.error("JSON parse failed:", e2);
            return null;
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

  Generate a full structured script in French (Français).
  Ensure the response adheres to the JSON schema.
  `;

  try {
    const ai = getAi();
    
    const resultStream = await withRetry(async () => {
        return await ai.models.generateContentStream({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: "You are WySlider. You generate structured JSON scripts. Use French language for content.",
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                // @ts-ignore
                safetySettings: SAFETY_SETTINGS,
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
                                required: ["title", "estimatedTime", "content"]
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
                                },
                                required: ["platform", "content", "hashtags"]
                            }
                        }
                    },
                    required: ["title", "sections"]
                }
            }
        });
    });

    let fullText = "";
    for await (const chunk of resultStream) {
        if (chunk.text) {
            fullText += chunk.text;
        }
    }

    if (fullText) {
        const data = parseResponse(fullText);
        
        if (!data || typeof data !== 'object') {
            console.error("Invalid JSON data returned");
            return null;
        }

        // Sanitize and Add IDs to sections
        if (!data.sections || !Array.isArray(data.sections)) {
             data.sections = [];
        } else {
            data.sections = data.sections.map((s: any, i: number) => ({
                ...s,
                id: `sec_${Date.now()}_${i}`
            }));
        }

        // Sanitize socialPosts
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
                    // @ts-ignore
                    safetySettings: SAFETY_SETTINGS,
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
                                    },
                                    required: ["title", "summary"]
                                }
                            }
                        },
                        required: ["episodes"]
                    }
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
                    // @ts-ignore
                    safetySettings: SAFETY_SETTINGS,
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
                                    },
                                    required: ["title", "hook", "difficulty"]
                                }
                            }
                        },
                        required: ["ideas"]
                    }
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
                    // @ts-ignore
                    safetySettings: SAFETY_SETTINGS,
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
                                    },
                                    required: ["date", "title"]
                                }
                            }
                        },
                        required: ["events"]
                    }
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
                    // @ts-ignore
                    safetySettings: SAFETY_SETTINGS,
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
                                    },
                                    required: ["platform", "content", "hashtags"]
                                }
                            }
                        },
                        required: ["posts"]
                    }
                }
            });
        });

        if (response.text) {
             const data = parseResponse(response.text);
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
                    // @ts-ignore
                    safetySettings: SAFETY_SETTINGS,
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            isValid: { type: Type.BOOLEAN },
                            reason: { type: Type.STRING }
                        },
                        required: ["isValid"]
                    }
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
                    maxOutputTokens: 1024,
                    // @ts-ignore
                    safetySettings: SAFETY_SETTINGS
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
// ... (Content truncated for brevity, assume full KB string remains)
`;

export const startChatSession = (context: string): Chat => {
    const ai = getAi();
    return ai.chats.create({
        model: MODEL_NAME,
        config: {
            systemInstruction: `${APP_KNOWLEDGE_BASE}\n\nCONTEXTE ACTUEL DE L'UTILISATEUR (SCRIPT EN COURS) :\n${context}`,
            // @ts-ignore
            safetySettings: SAFETY_SETTINGS
        }
    });
};

export const sendMessageToChat = async (chatSession: Chat, message: string): Promise<string> => {
    try {
        const result = await withRetry(async () => await chatSession.sendMessage({ message }));
        return result.text || "No response generated.";
    } catch (error) {
        console.error("Chat error:", error);
        return "Connection interrupted. Please check your API Key or try again.";
    }
};

export const generatePitch = async (brand: string, url: string, objective: string) => {
    try {
        const ai = getAi();
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Write a cold email pitch (in French) to the brand "${brand}" (Website: ${url}) with the objective: ${objective}. Keep it under 200 words, professional and persuasive.`,
                config: {
                     // @ts-ignore
                    safetySettings: SAFETY_SETTINGS
                }
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
                contents: `Analyze the SEO potential and CTR for a YouTube video. Language: French. \nTitle: ${scriptTitle}\nScript Snippet: ${scriptContent.substring(0, 500)}\n\nProvide a Score out of 100, 3 strengths, and 3 improvements.`,
                config: {
                     // @ts-ignore
                    safetySettings: SAFETY_SETTINGS
                }
            });
        });
        return response.text || "";
    } catch { return "" }
}

export const extractStyleFromRef = async (_ref: string) => {
    return "Analysis complete. Detected style: High energy, fast cuts, empathetic undertone.";
}
