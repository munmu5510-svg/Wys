
export interface Placeholder {}

export interface User {
  id: string;
  email: string;
  channelName: string;
  youtubeUrl: string;
  niche: string;
  generationsLeft: number;
  profilePicture?: string;
  isPro?: boolean;
  apiKey?: string;
  storagePreference?: 'local';
  firebaseConfig?: string;
  lastSyncedAt?: string;
  theme?: 'dark' | 'light';
  styleDNA?: string; 
  fusionStructures?: FusionStructure[]; // Formerly customStrategies
}

export interface FusionStructure {
    id: string;
    name: string;
    description: string;
    instruction: string;
    sourceUrl?: string;
}

export interface SubTone {
    tone: string;
    color: string; // Hex code
}

export interface ScriptSection {
  number: number;
  title: string;
  content: string; // HTML/Markdown allowed for colored text
  rehook: string;
}

export interface VideoPrompt {
    segment: string; // e.g. "Hook (0:00-0:30)"
    description: string;
}

export interface SocialPost {
    platform: string;
    content: string;
    hashtags: string[];
    visualNote?: string;
}

export interface ScriptPlanning {
    topic: string;
    mainTone: string;
    subTones: SubTone[];
    duration: string;
    sectionCount: number;
    socialCount: number;
    videoPromptsCount: number;
}

export interface YouTubeScriptContent {
    title: string;
    description: string;
    hashtags: string[];
    hook: string;
    intro: string;
    sections: ScriptSection[];
    conclusion: string;
    cta: string;
}

export interface Script {
  id: string;
  // Metadata
  title: string; // Display title
  createdAt: string;
  isTemplate?: boolean;
  
  // Part 1: Planning
  planning?: ScriptPlanning;
  
  // Part 2: YouTube Script
  youtubeScript?: YouTubeScriptContent;
  
  // Part 3: Social Media
  socialPosts?: SocialPost[];
  
  // Part 4: Video Prompts
  videoPrompts?: VideoPrompt[];

  // Legacy/Fallback fields for backward compatibility
  topic?: string;
  niche?: string;
  goal?: string;
  needs?: string;
  strategy?: string;
}

export interface Series {
  id: string;
  title: string;
  episodeCount: number;
  niche: string;
  createdAt: string;
  isTemplate?: boolean;
  episodes: Script[];
}

// Changed from Enum to Union Type for stability
export type AppScreen = 'Dashboard' | 'Studio' | 'Growth' | 'SerialProd' | 'Account' | 'Admin';

export interface ViralIdea {
    id: string;
    title: string;
    hook: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    read: boolean;
    timestamp: string;
}

export type AuthScreen = 'Login' | 'SignUp';

export interface BrandPitch {
  id: string;
  targetName: string;
  description: string;
  objective: string;
  content: string;
  createdAt: string;
}
