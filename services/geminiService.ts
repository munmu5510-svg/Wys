
import { GoogleGenAI, Type } from "@google/genai";

const getAi = (apiKey?: string) => {
  const key = (apiKey && apiKey.trim().length > 0) ? apiKey : process.env.API_KEY;
  return new GoogleGenAI({ apiKey: key || '' });
};

const MODEL_NAME = 'gemini-3-flash-preview';

const parseResponse = (text: string) => {
    try {
        let clean = text.trim();
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');
        if (firstBrace > -1 && lastBrace > -1) {
            clean = clean.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON parse failed", e);
        return null;
    }
};

const scriptSchema = {
    type: Type.OBJECT,
    properties: {
        planning: {
            type: Type.OBJECT,
            properties: {
                topic: {type: Type.STRING}, mainTone: {type: Type.STRING},
                subTones: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tone: {type: Type.STRING}, color: {type: Type.STRING} } } },
                duration: {type: Type.STRING}, sectionCount: {type: Type.NUMBER}, socialCount: {type: Type.NUMBER}, videoPromptsCount: {type: Type.NUMBER},
                channelName: {type: Type.STRING}, niche: {type: Type.STRING}
            }
        },
        youtubeScript: {
            type: Type.OBJECT,
            properties: {
                title: {type: Type.STRING}, description: {type: Type.STRING}, hashtags: {type: Type.ARRAY, items: {type: Type.STRING}},
                hook: {type: Type.STRING}, intro: {type: Type.STRING},
                sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { number: {type: Type.NUMBER}, title: {type: Type.STRING}, content: {type: Type.STRING}, rehook: {type: Type.STRING}, timestamp: {type: Type.STRING} } } },
                conclusion: {type: Type.STRING}, cta: {type: Type.STRING},
                blogArticle: {type: Type.STRING}
            }
        },
        socialPosts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { platform: {type: Type.STRING}, content: {type: Type.STRING}, hashtags: {type: Type.ARRAY, items: {type: Type.STRING}}, visualNote: {type: Type.STRING} } } },
        videoPrompts: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: { 
                    segment: {type: Type.STRING, description: "Must be one of: Introduction, Content, Conclusion, Outro"}, 
                    description: {type: Type.STRING} 
                } 
            } 
        }
    },
    required: ["planning", "youtubeScript", "socialPosts", "videoPrompts"]
};

export const generateScript = async (topic: string, tone: string, duration: string, context: any, apiKey?: string) => {
    const prompt = `You are WySlider, a professional YouTube production AI. Create a full high-retention production package for:
    Channel Name: ${context.channelName}
    Sujet: ${topic}
    Niche: ${context.niche}
    Buts (Objectifs): ${context.goal}
    Besoins Spécifiques: ${context.requirements}
    Durée: ${duration}
    Plateformes: ${context.platforms}
    Ton: ${tone}
    
    CRITICAL INSTRUCTIONS:
    1. Include estimated Timestamps for each section based on ${duration}.
    2. Visual Prompts must explicitly cover: Introduction, Content, Conclusion, and Outro.
    3. Generate a high-quality "blogArticle" based on the script.
    4. Structure the script with engaging HOOKS and visual cues. Include HTML colored spans for emphasis. Return JSON matching schema.`;
    
    const ai = getAi(apiKey);
    const resp = await ai.models.generateContent({ 
        model: MODEL_NAME, 
        contents: prompt, 
        config: { responseMimeType: "application/json", responseSchema: scriptSchema } 
    });
    return parseResponse(resp.text || "{}");
};

export const generateSeries = async (topic: string, count: number, tone: string, duration: string, context: any, apiKey?: string) => {
    const prompt = `Create a cohesive YouTube series of ${count} video production packages based on the core topic: "${topic}". 
    The episodes should follow a logical narrative arc.
    Channel: ${context.channelName}, Niche: ${context.niche}, Buts: ${context.goal}, Durée par épisode: ${duration}.
    Return a JSON object containing an "episodes" array of script packages. Include Blog Articles and Timestamps for each.`;
    
    const ai = getAi(apiKey);
    const resp = await ai.models.generateContent({ 
        model: MODEL_NAME, 
        contents: prompt, 
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    episodes: { type: Type.ARRAY, items: scriptSchema }
                },
                required: ["episodes"]
            }
        } 
    });
    return parseResponse(resp.text || "{}")?.episodes || [];
};

export const generatePitch = async (target: string, desc: string, obj: string, apiKey?: string) => {
    const ai = getAi(apiKey);
    const resp = await ai.models.generateContent({ 
        model: MODEL_NAME, 
        contents: `Create a professional cold email/marketing pitch for ${target}. Offer context: ${desc}. Main objective: ${obj}. Focus on high conversion.` 
    });
    return resp.text || "";
};

export const generateViralIdeas = async (niche: string, apiKey?: string) => {
    const ai = getAi(apiKey);
    const resp = await ai.models.generateContent({ 
        model: MODEL_NAME, 
        contents: `Generate 6 viral YouTube ideas for the niche: ${niche}.`, 
        config: { 
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
    return parseResponse(resp.text || "{}")?.ideas || [];
};

export const generateAdminInsights = async (metrics: string) => {
    const ai = getAi();
    const resp = await ai.models.generateContent({ model: MODEL_NAME, contents: `Perform an admin analysis on these system metrics: ${metrics}` });
    return resp.text || "";
};
