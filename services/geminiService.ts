
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
          visualNote: { type: Type.STRING, description: "A detailed description of the visuals (B-roll, on-screen text, graphics) for this section." },
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
