

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
}

export interface ScriptSection {
  id: string;
  title: string;
  estimatedTime: string;
  content: string;
  visualNote?: string;
}

export interface SocialPost {
    platform: string;
    content: string;
    hashtags: string[];
    visualNote?: string;
}

export interface Script {
  id: string;
  title: string;
  topic: string;
  tone: string;
  format: string;
  sections: ScriptSection[];
  createdAt: string;
  youtubeDescription?: string;
  hashtags?: string[];
  srtFile?: string;
  seriesId?: string;
  seriesName?: string;
  isTemplate?: boolean;
  niche?: string;
  thumbnailUrl?: string;
  goal?: string;
  needs?: string;
  cta?: string;
  socialPosts?: SocialPost[];
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

export interface ForgeItem {
    id: string;
    type: 'url' | 'file';
    value: string;
    name: string;
    styleDNA?: string;
}

// Changed from Enum to Union Type for stability
export type AppScreen = 'Dashboard' | 'Studio' | 'Growth' | 'SerialProd' | 'Account' | 'Admin';

export interface EpisodeSuggestion {
  title: string;
}

export interface ViralIdea {
    id: string;
    title: string;
    hook: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SeriesGenerationProgress {
  episodeIndex: number;
  status: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    read: boolean;
    timestamp: string;
}

// Changed from Enum to Union Type
export type AuthScreen = 'Login' | 'SignUp';

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  status: 'planned' | 'scripted' | 'filmed' | 'posted';
  format: string;
}

export interface BrandPitch {
  id: string;
  brandName: string;
  brandUrl: string;
  objective: string;
  content: string;
  createdAt: string;
}