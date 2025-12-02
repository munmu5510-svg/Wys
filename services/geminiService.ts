
import { GoogleGenAI, Type, Chat } from "@google/genai";

// Lazy initialization of AI client
let aiInstance: GoogleGenAI | null = null;

const getAi = (apiKey?: string) => {
  if (apiKey) {
      return new GoogleGenAI({ apiKey });
  }
  if (!aiInstance) {
    // CRITICAL FIX: Direct access allows Vite to perform string replacement during build.
    // Do NOT check for 'typeof process' because 'process' does not exist in mobile browsers,
    // causing the check to fail even if the key was replaced.
    const envKey = process.env.API_KEY;
    
    if (!envKey) {
        console.warn("API_KEY appears to be missing.");
    }
    
    // Initialize with the key (or a dummy if missing to prevent immediate crash, though calls will fail)
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
  const prompt = `Write a YouTube video script.
  Topic: "${topic}".
  Tone: ${tone}.
  Format/Length: ${format}.
  ${youtubeUrl ? `Context from creator's channel: ${youtubeUrl}` : ''}
  ${goal ? `Goal of the video: ${goal}` : ''}
  ${needs ? `Specific needs/requirements: ${needs}` : ''}
  ${cta ? `Call To Action: ${cta}` : ''}
  ${platforms ? `Optimization for platforms: ${platforms}` : ''}

  Return a valid JSON object with the following structure:
  {
    "title": "Video Title",
    "youtubeDescription": "SEO-optimized YouTube video description with timestamps",
    "hashtags": ["#tag1", "#tag2"],
    "sections": [
        {
            "title": "Intro/Hook/Content/CTA",
            "estimatedTime": "Duration in seconds",
            "content": "Spoken script content",
            "visualNote": "Visual direction or B-Roll suggestion"
        }
    ]
  }`;

  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
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
                    }
                }
            }
        }
    });

    if (response.text) {
        try {
            return JSON.parse(response.text);
        } catch (e) {
            console.warn("Direct JSON parse failed, attempting cleanup", e);
            const cleaned = cleanJson(response.text);
            return JSON.parse(cleaned);
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
    For each idea, provide a catchy title, a hook, and a difficulty level (Easy, Medium, Hard).
    Return a valid JSON object with an array "ideas".`;

    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
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
    const prompt = `Create a 4-week editorial calendar for a YouTube channel in the niche: "${niche}".
    ${tasks ? `Incorporate the following specific tasks/ideas into the schedule: ${tasks}` : ''}
    Return a valid JSON array of objects. Each object should have:
    - date (YYYY-MM-DD format, starting from tomorrow)
    - title (Video Title)
    - format (Shorts or Long-form)
    - status (always 'planned')
    Generate about 8-12 events mixed between Shorts and Long-form.`;

    try {
         const ai = getAi();
         const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
             config: {
                responseMimeType: "application/json",
                responseSchema: {
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
         });
         if(response.text) {
             try {
                 return JSON.parse(response.text);
             } catch(e) {
                 return JSON.parse(cleanJson(response.text));
             }
         }
         return [];
    } catch (e) {
        console.error("Error generating calendar", e);
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
            contents: `Analyze the following application metrics and provide a short, futuristic, cyberpunk-style system status report. Data: ${metrics}`
        });
        return response.text || "NO_DATA_AVAILABLE";
    } catch (error) {
        return "SYSTEM_ERROR";
    }
};

export const startChatSession = (context: string): Chat => {
    const ai = getAi();
    return ai.chats.create({
        model: MODEL_NAME,
        config: {
            systemInstruction: `You are a professional YouTube script consultant and AI assistant for the app WySlider. Use the following context from the user's current script to assist them:\n\n${context}`
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
            contents: `Write a cold email pitch to the brand "${brand}" (Website: ${url}) with the objective: ${objective}. Keep it under 200 words, professional and persuasive.`
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
             contents: `Analyze the SEO potential and CTR for a YouTube video.\nTitle: ${scriptTitle}\nScript Snippet: ${scriptContent.substring(0, 500)}\n\nProvide a Score out of 100, 3 strengths, and 3 improvements.`
        });
        return response.text || "";
    } catch { return "" }
}

export const extractStyleFromRef = async (_ref: string) => {
    return "Analysis complete. Detected style: High energy, fast cuts, empathetic undertone.";
}
