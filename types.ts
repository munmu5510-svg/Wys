
export interface User {
  id: string;
  name: string;
  email: string;
  channelName: string;
  youtubeUrl: string;
  niche: string;
  status: 'Just Me' | 'Community' | 'Enterprise';
  generationsLeft: number;
  profilePicture?: string;
  isPro?: boolean;
  apiKey?: string;
  storagePreference?: 'local';
  theme?: 'dark' | 'light';
  fusionStructures?: FusionStructure[];
  onboardingCompleted?: boolean;
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
    color: string;
}

export interface ScriptSection {
  number: number;
  title: string;
  content: string;
  rehook: string;
  timestamp?: string;
}

export interface VideoPrompt {
    segment: 'Introduction' | 'Content' | 'Conclusion' | 'Outro';
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
    channelName?: string;
    niche?: string;
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
    blogArticle?: string;
}

export interface Script {
  id: string;
  title: string;
  createdAt: string;
  isPublic?: boolean;
  authorName?: string;
  planning?: ScriptPlanning;
  youtubeScript?: YouTubeScriptContent;
  socialPosts?: SocialPost[];
  videoPrompts?: VideoPrompt[];
}

export interface Series {
  id: string;
  title: string;
  episodes: Script[];
  createdAt: string;
}

export type AppScreen = 'Dashboard' | 'Studio' | 'Growth' | 'SerialProd' | 'Account' | 'Admin' | 'Onboarding';

export type AuthScreen = 'Login' | 'SignUp';

export interface BrandPitch {
  id: string;
  targetName: string;
  description: string;
  objective: string;
  content: string;
  createdAt: string;
}
