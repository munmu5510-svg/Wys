
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { Script, RepurposedContent, EpisodeSuggestion } from '../types';
import { APP_URL } from '../constants';

// IMPORTANT: This key is managed externally by the environment. Do not change this line.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

const scriptSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy, SEO-friendly title for the YouTube video." },
    youtubeDescription: { type: Type.STRING, description: "A full YouTube description for the video, including timestamps and relevant hashtags." },
    sections: {
      type: Type.ARRAY,
      description: "An array of script sections that make up the video.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique string identifier for the section, e.g., 'section_1'." },
          title: { type: Type.STRING, description: "The title of the section (e.g., 'Hook', 'Introduction', 'Main Point 1')." },
          content: { type: Type.STRING, description: "The spoken content for this section of the script." },
          visualNote: { type: Type.STRING, description: "A VERY detailed description of the visuals. Include specific B-roll ideas (e.g., 'Slow motion shot of coffee pouring'), on-screen text suggestions (e.g., 'Text overlay: 50% Increase'), and camera direction." },
          estimatedTime: { type: Type.INTEGER, description: "The estimated time in seconds this section will take to present." },
          rhythm: { type: Type.STRING, description: "The pacing or rhythm of this section. Can be 'normal', 'slow', or 'intense'." }
        },
        required: ['id', 'title', 'content', 'visualNote', 'estimatedTime', 'rhythm']
      }
    },
    srtFile: { type: Type.STRING, description: "The complete script in SRT (SubRip Subtitle) format for video captions." }
  },
  required: ['title', 'youtubeDescription', 'sections', 'srtFile']
};

const repurposedSchema = {
    type: Type.OBJECT,
    properties: {
        tiktokScript: { type: Type.STRING, description: "A 30-60 second rapid-fire script for TikTok/Reels based on the main content." },
        twitterThread: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A thread of 5-7 tweets summarizing the key points." },
        newsletterTeaser: { type: Type.STRING, description: "A short email teaser promoting the video." },
        linkedinPost: { type: Type.STRING, description: "A professional post suitable for LinkedIn about the video topic." }
    },
    required: ['tiktokScript', 'twitterThread', 'newsletterTeaser', 'linkedinPost']
};

const seriesSchema = {
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

const titleVariationsSchema = {
    type: Type.OBJECT,
    properties: {
        variations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3 optimized video titles."
        }
    }
}

const seoAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "A score from 0 to 100 indicating SEO strength." },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of actionable tips to improve SEO." },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Identified keywords in the script." }
    }
}


export const generateScript = async (topic: string, tone: string, format: string, channelInfo: string): Promise<Partial<Script> | null> => {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a complete YouTube script about "${topic}".
      The desired tone is ${tone}.
      The video format is ${format}.
      The script should be tailored for the audience of a YouTube channel described as: "${channelInfo}".
      
      Please provide all the required elements for the script as defined in the response schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: scriptSchema,
      }
    });
    
    const text = response.text.trim();
    return JSON.parse(text) as Partial<Script>;
  } catch (error) {
    console.error("Error generating script:", error);
    return null;
  }
};

export const analyzeSocialPost = async (postUrl: string): Promise<boolean> => {
  try {
    const response = await ai.models.generateContent({
        model,
        contents: `Analyze the following URL or link text. 
        Does it look like a valid URL for a social media post (like X/Twitter, LinkedIn, Facebook, Instagram, YouTube) that could contain a mention of 'WySlider'?
        We cannot browse the live web, so just verify if the format looks like a valid social media post link.
        Respond with only the single word 'YES' or 'NO'.
        
        URL: "${postUrl}"`
    });
    return response.text.trim().toUpperCase() === 'YES';
  } catch (error) {
    console.error("Error analyzing social post:", error);
    return false;
  }
};


export const generateFeedbackSuggestion = async (feedback: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Based on the following user feedback for our app WySlider, provide one actionable suggestion for improvement.
            Feedback: "${feedback}"
            Suggestion:`
        });
        return response.text;
    } catch (error) {
        console.error("Error generating feedback suggestion:", error);
        return "Could not generate a suggestion at this time.";
    }
}

export const generateImageForSection = async (visualNote: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Generate a visually compelling image representing this scene for a YouTube video: ${visualNote}` }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data; // This is the base64 encoded string
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};

export const generateSpeech = async (text: string, voice: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Read this script excerpt clearly: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

// --- PRO+ FEATURES ---

export const startChatSession = (scriptContext: string): Chat => {
    const chat = ai.chats.create({
        model,
        config: {
            systemInstruction: `You are a friendly and expert AI assistant for WySlider, a YouTube script generation tool. 
            Your purpose is to help users by: 
            1. Answering questions about WySlider's features. 
            2. Guiding them on how to use the tool effectively. 
            3. Brainstorming video ideas, titles, and script concepts. 
            4. Providing feedback on their scripts if they paste them. 
            Be concise, helpful, and encouraging. Always stay on topic related to YouTube content creation and the WySlider app.
            
            The user is currently working on the following script:
            ---
            ${scriptContext}
            ---
            Use this context to provide more relevant brainstorming ideas and feedback.
            `,
        },
    });
    return chat;
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<string> => {
    try {
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending chat message:", error);
        return "Désolé, une erreur s'est produite. Veuillez réessayer.";
    }
};

export const generateThumbnail = async (title: string, topic: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Create a high click-through rate YouTube thumbnail for a video titled "${title}" about "${topic}". The text on the thumbnail should be legible and punchy. High contrast, vibrant colors.` }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data; 
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating thumbnail:", error);
        return null;
    }
}

export const repurposeContent = async (scriptContent: string): Promise<RepurposedContent | null> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Repurpose the following YouTube script into 4 formats:
            1. A TikTok/Reel script (30-60s).
            2. A Twitter Thread (5-7 tweets).
            3. A Newsletter Teaser.
            4. A LinkedIn Post.
            
            Script: "${scriptContent.substring(0, 5000)}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: repurposedSchema,
            }
        });

        const text = response.text.trim();
        return JSON.parse(text) as RepurposedContent;
    } catch (error) {
        console.error("Error repurposing content:", error);
        return null;
    }
}

export const generateVideo = async (prompt: string, onProgress: (message: string) => void): Promise<string | null> => {
    const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    try {
        onProgress("Initializing video generation...");
        let operation = await videoAI.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        onProgress("AI is creating your video, this may take a few minutes...");

        while (!operation.done) {
            onProgress("Polling for result...");
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await videoAI.operations.getVideosOperation({ operation: operation });
        }

        onProgress("Video processing complete!");
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!downloadLink) {
            throw new Error("Video URI not found in response.");
        }
        
        const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        return videoUrl;

    } catch (error) {
        console.error("Error generating video:", error);
        onProgress(`Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`);
        return null;
    }
};

export const generateEpisodeSuggestions = async (concept: string, count: number): Promise<EpisodeSuggestion[]> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Based on the concept "${concept}", generate a coherent YouTube series outline with exactly ${count} episodes.
            For each episode, provide a catchy Title and a short Summary (2-3 sentences).
            The episodes should follow a logical progression (e.g., Beginner to Advanced, or Chronological).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: seriesSchema,
            }
        });

        const text = response.text.trim();
        const data = JSON.parse(text);
        return data.episodes || [];
    } catch (error) {
        console.error("Error generating episodes:", error);
        return [];
    }
};

export const generateTitleVariations = async (topic: string, currentTitle: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `For a YouTube video about "${topic}" (currently titled "${currentTitle}"), generate 3 alternative titles optimized for high Click-Through Rate (CTR).
            1. Viral/Clickbait style (but honest).
            2. SEO optimized (searchable keywords).
            3. Storytelling/Intriguing style.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: titleVariationsSchema,
            }
        });
        const text = response.text.trim();
        const data = JSON.parse(text);
        return data.variations || [];
    } catch (error) {
        console.error("Error generating titles:", error);
        return [];
    }
}

export const rewriteContent = async (content: string, nuance: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Rewrite the following script section text to be ${nuance}. Keep the core meaning but change the style/tone.
            
            Text: "${content}"
            
            Return only the rewritten text.`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error rewriting content:", error);
        return content;
    }
}

// --- NEW ECOSYSTEM FEATURES ---

export const analyzeSEO = async (title: string, description: string): Promise<{score: number, feedback: string[], keywords: string[]}> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Analyze the following YouTube title and description for SEO effectiveness. 
            Title: "${title}"
            Description: "${description}"
            
            Provide a score (0-100), a list of feedback tips, and identified keywords.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: seoAnalysisSchema,
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error analyzing SEO:", error);
        return { score: 50, feedback: ["Could not analyze at this time."], keywords: [] };
    }
}

export const generatePitchEmail = async (brandName: string, channelName: string, niche: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Write a professional, persuasive sponsorship pitch email to the brand "${brandName}" from a YouTube creator "${channelName}" in the "${niche}" niche.
            The tone should be confident but respectful. Highlight potential ROI for the brand. Keep it concise.
            
            Subject: [Catchy Subject]
            
            Body:
            [Email Body]`
        });
        return response.text;
    } catch (error) {
        console.error("Error generating pitch:", error);
        return "Could not generate pitch.";
    }
}

export const getTrendIdeas = async (niche: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Generate 5 viral video ideas for a YouTube channel in the "${niche}" niche, based on general current internet trends or evergreen high-performing formats.
            Return just the list of 5 ideas as bullet points.`
        });
        return response.text.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d\./.test(line)).map(l => l.replace(/^[-*0-9\.]+\s*/, ''));
    } catch (error) {
        console.error("Error generating trends:", error);
        return ["Trend generation unavailable."];
    }
}
