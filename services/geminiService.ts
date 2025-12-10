

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
        clean = clean.replace(/^```json/, "").replace(/```\s*$/, "");
    } else if (clean.startsWith("```")) {
         clean = clean.replace(/^```/, "").replace(/```\s*$/, "");
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
    platforms?: string,
    styleDNA?: string
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
  ${styleDNA ? `- **USER STYLE DNA (FORGE):** ${styleDNA}` : ''}

  Generate a full structured script in English.
  Ensure the response adheres to the JSON schema.
  `;

  try {
    const ai = getAi();
    
    const resultStream = await withRetry(async () => {
        return await ai.models.generateContentStream({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: `You are WySlider. You generate structured JSON scripts. Use English language for content.${styleDNA ? ` Important: Adapt your writing style to match this Style DNA: ${styleDNA}` : ''}`,
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
    Language: English.
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
    Language: English.
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

export const generateSocialPosts = async (scriptTitle: string, scriptContent: string, platforms: string) => {
    const prompt = `Based on this YouTube script, write promotional social media posts.
    Language: English.
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
                contents: `Analyze the following application metrics and provide a short, professional business status report. Data: ${metrics}`,
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
GLOBAL CONTEXT & ROLE:
You are WYS AI, the official intelligent assistant for the WySlider App (Version 2). 
Your role is to guide the user in creating professional YouTube content and navigating the app.
`;

export const startChatSession = (context: string): Chat => {
    const ai = getAi();
    return ai.chats.create({
        model: MODEL_NAME,
        config: {
            systemInstruction: `${APP_KNOWLEDGE_BASE}\n\nUSER CONTEXT (CURRENT SCRIPT):\n${context}`
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

export const generatePitch = async (targetName: string, description: string, objective: string): Promise<string> => {
    try {
        const ai = getAi();
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Write a cold email/message pitch (in English) to "${targetName}".
                Target Description: ${description}.
                My Objective: ${objective}.
                
                Keep it under 200 words, professional, persuasive, and use a structure that grabs attention.`,
                config: {}
            });
        });
        return response.text || "";
    } catch (error) {
        return "Error generating pitch.";
    }
};

export const extractStyleFromRef = async (ref: string) => {
     // Simulated analysis for now, but could use video/text processing if available
    return "High energy, fast pacing, retention-focused editing style.";
}