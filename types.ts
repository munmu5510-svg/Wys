
export interface User {
  email: string;
  channelName: string;
  youtubeUrl: string;
  generationsLeft: number;
  isProPlus?: boolean;
  profilePicture?: string; // Base64 string
}

export interface ScriptSection {
  id: string;
  title: string;
  content: string;
  visualNote: string;
  estimatedTime: number; // in seconds
  rhythm: 'normal' | 'slow' | 'intense';
  generatedImage?: string; // base64 image data
}

export interface ScriptVersion {
  timestamp: string;
  title: string;
  sections: ScriptSection[];
  youtubeDescription?: string;
  srtFile?: string;
}

export interface Script {
  id: string;
  title: string;
  topic: string;
  tone: string;
  format: '<60s' | '3-5min' | '8-15min';
  sections: ScriptSection[];
  createdAt: string;
  youtubeDescription?: string;
  srtFile?: string;
  editorPdf?: string; // Represents a generated PDF
  generatedThumbnail?: string; // base64
  coachFeedback?: string;
  versions?: ScriptVersion[];
  seriesId?: string; // To group scripts into a series
  seriesName?: string; // The name of the series concept
}

export interface RepurposedContent {
  tiktokScript: string;
  twitterThread: string[];
  newsletterTeaser: string;
  linkedinPost: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface EpisodeSuggestion {
    title: string;
    summary: string;
}

export interface SeriesGenerationProgress {
    episodeIndex: number;
    status: 'waiting' | 'generating_script' | 'generating_video' | 'complete' | 'error';
    scriptId?: string;
}

export enum AppScreen {
  Dashboard,
  Generator,
  Optimizer,
  SerialProd
}

export enum AuthScreen {
  Login,
  SignUp,
}

export enum AccountSubPage {
  Profile,
  Premium, // Used for Pro+ now
  CorpUse,
  PostUse,
  Feedback
}
