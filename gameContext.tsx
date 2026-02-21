import React, { createContext, useContext } from 'react';
import { GameState, Player, Card, Rank } from '../types';

export interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export type GameAction =
  | { type: 'START_GAME'; payload: { difficulty: string; playerCount: number } }
  | { type: 'PLAY_CARDS'; payload: { playerId: string; cards: Card[]; declaredRank: Rank } }
  | { type: 'CALL_BLUFF'; payload: { callerId: string } }
  | { type: 'PASS_TURN'; payload: { playerId: string } } // If we allow passing
  | { type: 'NPC_MOVE'; payload: { playerId: string } } // Trigger NPC thinking/move
  | { type: 'RESOLVE_BLUFF'; payload: { success: boolean; liarId: string; callerId: string } }
  | { type: 'ACKNOWLEDGE_OUTCOME'; } // User clicks to proceed after a round end
  | { type: 'ADD_LOG'; payload: { text: string; type: any } };

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
