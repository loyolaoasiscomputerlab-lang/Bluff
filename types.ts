export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isJoker?: boolean; // Not using jokers for standard bluff usually, but good to have
}

import { CharacterProfile } from '../utils/characters';

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  hand: Card[];
  avatar: string;
  rating: number; // Elo-style rating
  ratingChange?: number; // For game over display
  profile?: CharacterProfile;
  status: 'idle' | 'thinking' | 'playing' | 'bluffing' | 'called_bluff' | 'caught' | 'safe';
  lastAction?: { text: string; timestamp: number };
  emotionalState?: {
    current: 'neutral' | 'anxious' | 'confident' | 'smug' | 'angry' | 'surprised';
    intensity: number; // 0-1
    thoughtProcess?: string; // Internal monologue text
  };
}

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  setup: {
    playerHand: Card[];
    opponentHandCount: number;
    opponentType: 'aggressive' | 'conservative' | 'balanced' | 'chaotic';
    pile: Card[];
    currentRank: Rank | null;
    lastPlay: {
      playerId: string;
      cards: Card[];
      declaredRank: Rank;
    } | null;
  };
  solution: {
    action: 'play' | 'call_bluff' | 'pass';
    cards?: string[]; // IDs of cards to play
    rank?: Rank;
  };
  explanation: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  pile: Card[];
  currentRank: Rank | null;
  lastPlay: {
    playerId: string;
    cards: Card[];
    declaredRank: Rank;
    declaredCount: number;
  } | null;
  consecutivePasses: number;
  gameStatus: 'lobby' | 'playing' | 'round_end' | 'game_over' | 'tutorial_end' | 'puzzle_success' | 'puzzle_fail';
  log: GameLogEntry[];
  winner: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  bluffCalled?: { callerId: string } | null;
  isTutorial: boolean;
  activePuzzle?: Puzzle | null;
  user: {
    name: string;
    hasCompletedTutorial: boolean;
    rating: number;
    stats?: {
        wins: number;
        bluffs: number;
        caught: number;
    };
    settings?: {
        mobileMode: boolean;
    };
  };
}

export interface GameLogEntry {
  id: string;
  text: string;
  type: 'info' | 'move' | 'bluff' | 'success' | 'fail' | 'win';
  timestamp: number;
}

export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
