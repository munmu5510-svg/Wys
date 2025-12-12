
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = (apiKey?: string) => {
  if (apiKey) {
      return new GoogleGenAI({ apiKey });
  }
  if (!aiInstance) {
    const envKey = process.env.API_KEY;
    if (!envKey) console.warn("API_KEY missing.");
    aiInstance = new GoogleGenAI({ apiKey: envKey || '' });
  }
  return aiInstance;
};

const MODEL_NAME = 'gemini-2.5-flash';

// Clean JSON helper
const cleanJson = (text: string) => {
    if (!text) return "";
    let clean = text.trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace > -1 && lastBrace > -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
};

const parseResponse = (text: string) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        try {
            return JSON.parse(cleanJson(text));
        } catch (e2) {
            console.error("JSON parse failed", e2);
            // Attempt to recover truncated JSON if possible (simple cases)
            if (typeof text === 'string' && text.trim().startsWith('{')) {
                 console.warn("Attempting to recover truncated JSON...");
                 // This is a naive attempt, better to fail gracefully than crash
            }
            return null;
        }
    }
};

async function withRetry<T>(fn: () => Promise<T>, retries = 1, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && (error.status === 503 || error.status === 500 || error.message?.includes('timeout'))) {
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

export const STRATEGIES: { [key: string]: string } = {
    'Standard': "Follow standard high-retention structure."
};

// --- FUSION FORGE LOGIC ---
export const analyzeFusionStructure = async (url: string): Promise<{ name: string; instruction: string; description: string }> => {
    const prompt = `Analyze the typical video structure of this YouTube URL (simulated analysis based on URL pattern): "${url}".
    Extract the "Fusion Structure" - the narrative architecture.
    
    Return JSON:
    {
        "name": "Short catchy name (e.g. 'The Beast Pacing')",
        "description": "1 sentence summary.",
        "instruction": "Detailed structural rules for a scriptwriter (Hook, Pacing, Content Blocks, Re-hooks)."
    }`;

    try {
        const ai = getAi();
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    maxOutputTokens: 1024 
                }
            });
        });
        const data = parseResponse(response.text || "{}");
        return data || { 
            name: "Imported Structure", 
            description: "Structure from " + url, 
            instruction: "Follow standard high-retention structure." 
        };
    } catch (e) {
        return { name: "Custom Import", description: "Analysis failed", instruction: "Standard professional structure." };
    }
};

// --- MAIN GENERATION ---
export const generateScript = async (
    topic: string, 
    tone: string, 
    format: string, 
    fusionInstruction: string,
    context: { niche: string; goal: string; needs: string; cta: string; platforms: string }
) => {
  
  const prompt = `You are WySlider V2, the ultimate YouTube Architect.
  
  **TASK:** Create a complete 4-part production package for a video.
  **TOPIC:** ${topic}
  **TONE:** ${tone}
  **FORMAT:** ${format}
  **NICHE:** ${context.niche}
  **GOAL:** ${context.goal}
  **NEEDS:** ${context.needs}
  **CTA:** ${context.cta}
  **PLATFORMS:** ${context.platforms}

  **FUSION STRUCTURE (NARRATIVE RULES):**
  ${fusionInstruction}

  **OUTPUT REQUIREMENTS (JSON):**
  
  **PART 1: PLANNING**
  - Define Main Tone and 3 distinct Sub-Tones (e.g., "Urgent", "Empathetic", "Analytical"). Assign a HEX color to each sub-tone.
  
  **PART 2: YOUTUBE SCRIPT**
  - Title, Description, Hashtags.
  - Hook & Intro.
  - Body: Divide into sections. **CRITICAL: Each section must end with a "Re-hook"** to maintain retention.
  - **Formatting**: In the 'content' of sections, wrap key sentences in <span> tags with specific classes based on sub-tones. (Since we return JSON, just use plain text with markup like <span style="color: #HEX">text</span>).
  
  **PART 3: SOCIAL MEDIA**
  - Generate posts for requested platforms. Goal: Provoke action.
  
  **PART 4: VIDEO PROMPTS**
  - Visual prompts for AI Video Generators (Runway/Sora) or editors. Cover Hook to CTA.

  Return strictly valid JSON matching the schema.
  `;

  const ai = getAi();
    
  const resultStream = await withRetry(async () => {
        return await ai.models.generateContentStream({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                // Schema definitions help structure the complex response
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        planning: {
                            type: Type.OBJECT,
                            properties: {
                                topic: {type: Type.STRING},
                                mainTone: {type: Type.STRING},
                                subTones: {
                                    type: Type.ARRAY, 
                                    items: { type: Type.OBJECT, properties: { tone: {type: Type.STRING}, color: {type: Type.STRING} } }
                                },
                                duration: {type: Type.STRING},
                                sectionCount: {type: Type.NUMBER},
                                socialCount: {type: Type.NUMBER},
                                videoPromptsCount: {type: Type.NUMBER}
                            }
                        },
                        youtubeScript: {
                            type: Type.OBJECT,
                            properties: {
                                title: {type: Type.STRING},
                                description: {type: Type.STRING},
                                hashtags: {type: Type.ARRAY, items: {type: Type.STRING}},
                                hook: {type: Type.STRING},
                                intro: {type: Type.STRING},
                                sections: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            number: {type: Type.NUMBER},
                                            title: {type: Type.STRING},
                                            content: {type: Type.STRING},
                                            rehook: {type: Type.STRING}
                                        }
                                    }
                                },
                                conclusion: {type: Type.STRING},
                                cta: {type: Type.STRING}
                            }
                        },
                        socialPosts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    platform: {type: Type.STRING},
                                    content: {type: Type.STRING},
                                    hashtags: {type: Type.ARRAY, items: {type: Type.STRING}},
                                    visualNote: {type: Type.STRING}
                                }
                            }
                        },
                        videoPrompts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    segment: {type: Type.STRING},
                                    description: {type: Type.STRING}
                                }
                            }
                        }
                    },
                    required: ["planning", "youtubeScript", "socialPosts", "videoPrompts"]
                }
            }
        });
    });

    let fullText = "";
    for await (const chunk of resultStream) {
        if (chunk.text) fullText += chunk.text;
    }

    return parseResponse(fullText);
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
                Keep it under 200 words, professional, persuasive.`,
            });
        });
        return response.text || "";
    } catch (error) {
        return "Error generating pitch.";
    }
};

// ... keep existing helpers (series, viral ideas) ...
export const generateViralIdeas = async (niche: string) => {
    // Same implementation as before, abbreviated for brevity
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate 6 viral video ideas for niche: ${niche}. Return JSON {ideas: [{title, hook, difficulty}]}`,
        config: { responseMimeType: "application/json" }
    });
    return parseResponse(response.text || "{}")?.ideas || [];
};

export const generateSeriesOutlines = async (theme: string, count: number, tone: string, niche: string, goal?: string) => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Propose ${count} YouTube video titles/summaries for series "${theme}" in niche ${niche}. Return JSON {episodes: [{title, summary}]}`,
        config: { responseMimeType: "application/json" }
    });
    return parseResponse(response.text || "{}")?.episodes || [];
};

export const generateAdminInsights = async (metrics: string) => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze metrics: ${metrics}. Short report.`
    });
    return response.text || "";
}
