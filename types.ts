export enum JobStatus {
  PENDING = 'PENDING',
  APPLYING = 'APPLYING',
  APPLIED = 'APPLIED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  stipend: string;
  posted: string;
  status: JobStatus;
  link: string;
}

export interface BotConfig {
  keywords: string;
  location: string;
  remoteOnly: boolean;
  minStipend: number;
  email: string;
  resumeUploaded: boolean;
}

export interface BotLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface AnswerTemplate {
  question: string;
  answer: string;
}
