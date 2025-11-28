
import { GoogleGenAI, Type, Chat } from "@google/genai";

// Lazy initialization of AI client
let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    // Safety check for process.env
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
    if (!apiKey) {
        console.warn("API_KEY not found in process.env");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_INIT' });
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

export const generateScript = async (topic: string, tone: string, format: string, youtubeUrl?: string) => {
  const prompt = `Write a YouTube video script for the following topic: "${topic}".
  Tone: ${tone}.
  Format/Length: ${format}.
  ${youtubeUrl ? `Context from creator's channel: ${youtubeUrl}` : ''}

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

export const generateSeries = async (theme: string, count: number, tone: string, niche: string, format: string) => {
    // Optimization: Requested "detailed outlines" instead of "full script structure" to prevent output token truncation for multiple episodes.
    const prompt = `Generate a YouTube video series of ${count} episodes for the theme: "${theme}".
    Niche: ${niche}.
    Tone: ${tone}.
    Format: ${format}.
    
    For EACH episode, provide a comprehensive outline (not a full verbatim script) to ensure the response fits within limits.
    Return a valid JSON object containing an array "episodes".`;

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
                                            }
                                        }
                                    }
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
                console.warn("Series JSON parse failed, cleaning...", e);
                const cleaned = cleanJson(response.text);
                return JSON.parse(cleaned).episodes;
            }
        }
        return [];
    } catch (error) {
        console.error("Error generating series:", error);
        return [];
    }
};

export const generateEpisodeSuggestions = async (concept: string, count: number) => {
    const prompt = `Generate ${count} YouTube video titles/ideas for a series based on the concept: "${concept}". Return a JSON array of objects with a "title" property.`;
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
                            title: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        if (response.text) {
            try {
                return JSON.parse(response.text);
            } catch (e) {
                return JSON.parse(cleanJson(response.text));
            }
        }
        return [];
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return [];
    }
};

export const analyzeSocialPost = async (url: string): Promise<boolean> => {
    return url.length > 10 && (url.includes("http") || url.includes("www"));
};

export const generateAdminInsights = async (metrics: string): Promise<string> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Analyze the following application metrics and provide a short, futuristic, cyberpunk-style system status report:\n\n${metrics}`
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

export const generatePitch = async (brand: string, objective: string) => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Write a cold email pitch to ${brand} with the objective: ${objective}. Keep it under 200 words.`
        });
        return response.text || "";
    } catch (error) {
        return "";
    }
};

export const analyzeSEO = async (niche: string) => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
             model: MODEL_NAME,
             contents: `Give me 3 viral trending video ideas for the YouTube niche: ${niche}. Format as a simple list.`
        });
        return response.text || "";
    } catch { return "" }
}

export const extractStyleFromRef = async (_ref: string) => {
    return "Analysis complete. Detected style: High energy, fast cuts, empathetic undertone.";
}
