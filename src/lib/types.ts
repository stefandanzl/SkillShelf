import PocketBase, { RecordService } from 'pocketbase';
export type { AuthModel, ClientResponseError } from 'pocketbase';

// ── Base ─────────────────────────────────────────────────────────────────────

interface BaseRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
}

// ── users (PocketBase auth collection, extended) ──────────────────────────────

export interface User extends BaseRecord {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
  name: string;
  avatar: string;        // filename — use pb.files.getURL() to get a URL
  role: 'student' | 'teacher' | 'other' | '';
  country: string;       // ISO 3166-1 alpha-2
  birthday: string;      // ISO date string
  admin: boolean;        // custom field added to users collection
}

// ── boxes ─────────────────────────────────────────────────────────────────────

export type BoxColor = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'teal';
export type LearnDirection = 'front_to_back' | 'back_to_front' | 'random';

export interface Box extends BaseRecord {
  name: string;
  owner: string;         // relation → users
  color: BoxColor;
  learn_direction: LearnDirection;
  tts_language: string;  // e.g. 'en-US', '' = auto

  // expanded relations (optional, present when expand is used)
  expand?: {
    owner?: User;
  };
}

// ── cards ─────────────────────────────────────────────────────────────────────

export interface Card extends BaseRecord {
  box: string;           // relation → boxes
  front: string;
  back: string;
  front_image: string;   // filename
  back_image: string;    // filename
  sort_order: number;

  expand?: {
    box?: Box;
    'card_progress_via_card'?: CardProgress[];
  };
}

// ── card_progress ─────────────────────────────────────────────────────────────

export interface CardProgress extends BaseRecord {
  user: string;          // relation → users
  card: string;          // relation → cards
  box: string;           // relation → boxes (denormalized)
  level: number;         // 1–7
  mastered: boolean;
  last_reviewed: string; // ISO date or ''
  next_review: string;   // ISO date or ''
  streak: number;

  expand?: {
    card?: Card;
    box?: Box;
  };
}

// ── study_sessions ────────────────────────────────────────────────────────────

export interface StudySession extends BaseRecord {
  user: string;
  box: string;
  started_at: string;
  ended_at: string;
  cards_reviewed: number;
  cards_correct: number;
  cards_wrong: number;

  expand?: {
    box?: Box;
  };
}

// ── TypedPocketBase ───────────────────────────────────────────────────────────

export interface TypedPocketBase extends PocketBase {
  collection(idOrName: 'users'): RecordService<User>;
  collection(idOrName: 'boxes'): RecordService<Box>;
  collection(idOrName: 'cards'): RecordService<Card>;
  collection(idOrName: 'card_progress'): RecordService<CardProgress>;
  collection(idOrName: 'study_sessions'): RecordService<StudySession>;
}
