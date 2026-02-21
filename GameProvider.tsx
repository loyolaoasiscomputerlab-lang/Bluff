import React, { useReducer, useEffect, useCallback } from 'react';
import { GameContext, GameAction } from './gameContext';
import { gameReducer, initialState } from './gameReducer';
import { getBotAction } from '../utils/botLogic';
import { Card, Rank } from '../types';
import { playSound, speak } from '../utils/audio';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const handleCallBluff = useCallback((callerId: string) => {
    if (!state.lastPlay) return;

    const { playerId: liarId, cards, declaredRank } = state.lastPlay;
    
    // Check if cards match declared rank
    const isBluffing = !cards.every(c => c.rank === declaredRank);
    
    // Dispatch resolution
    dispatch({
      type: 'RESOLVE_BLUFF',
      payload: {
        success: isBluffing,
        liarId,
        callerId,
        pile: state.pile,
      },
    });
  }, [state.lastPlay, state.pile]);

  // Audio Effects
  useEffect(() => {
    if (state.log.length === 0) return;
    const lastLog = state.log[0];
    
    // Play sound based on log type
    if (lastLog.type === 'move') playSound('play');
    if (lastLog.type === 'success') playSound('win');
    if (lastLog.type === 'fail') playSound('fail');
    if (lastLog.type === 'win') playSound('win');
    
    // NPC Voice Lines (Simple)
    if (lastLog.type === 'move' && lastLog.text.includes('Bot')) {
       // Maybe speak occasionally?
       if (Math.random() > 0.7) speak(lastLog.text, Math.random() > 0.5 ? 'male' : 'female');
    }
  }, [state.log]);

  // Handle Bluff Call (Human or Bot)
  useEffect(() => {
      if (state.bluffCalled) {
          // Add a small delay for dramatic effect?
          const timer = setTimeout(() => {
              handleCallBluff(state.bluffCalled!.callerId);
          }, 500);
          return () => clearTimeout(timer);
      }
  }, [state.bluffCalled, handleCallBluff]);

  // Bot Turn Logic
  useEffect(() => {
    if (state.gameStatus !== 'playing') return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer.isHuman) {
      // Bot Turn
      const timer = setTimeout(() => {
        const decision = getBotAction(state, currentPlayer);
        
        // Update Emotion/Thought first
        if (decision.thought || decision.emotion) {
            dispatch({
                type: 'UPDATE_BOT_EMOTION',
                payload: {
                    playerId: currentPlayer.id,
                    emotion: {
                        current: decision.emotion || 'neutral',
                        intensity: 0.8,
                        thoughtProcess: decision.thought
                    }
                }
            });
            
            // Speak the thought if it's significant
            if (decision.thought && Math.random() < 0.7) {
                // Determine gender based on avatar/name (simple heuristic or random)
                const gender = currentPlayer.name.match(/^(Queen|Marie|Ada|Katherine|Rosalind|Oprah|Serena|Cleopatra|Mother|Florence|Malala|Greta)/i) ? 'female' : 'male';
                speak(decision.thought, gender);
            }
        }

        // Delay action execution slightly to let the thought be read?
        // Or just execute immediately (thought lingers)
        
        if (decision.action === 'call_bluff') {
          handleCallBluff(currentPlayer.id);
        } else if (decision.action === 'play' && decision.cards && decision.declaredRank) {
          dispatch({
            type: 'PLAY_CARDS',
            payload: {
              playerId: currentPlayer.id,
              cards: decision.cards,
              declaredRank: decision.declaredRank,
            },
          });
        } else {
          dispatch({
            type: 'PASS_TURN',
            payload: { playerId: currentPlayer.id },
          });
        }
      }, 1500 + Math.random() * 1000); // Delay for "thinking"

      return () => clearTimeout(timer);
    }
  }, [state.currentPlayerIndex, state.gameStatus, state.lastPlay, handleCallBluff]); // Dependencies for Bot turn trigger

  // Wrap dispatch to handle complex thunks if needed, but for now direct dispatch is fine
  // We expose a custom dispatch that can handle 'CALL_BLUFF' logic if we wanted, 
  // but better to keep it pure.
  // Actually, the UI needs to call handleCallBluff for the human too.
  
  const customDispatch = (action: GameAction) => {
    if (action.type === 'CALL_BLUFF') {
      handleCallBluff(action.payload.callerId);
    } else {
      dispatch(action);
    }
  };

  return (
    <GameContext.Provider value={{ state, dispatch: customDispatch }}>
      {children}
    </GameContext.Provider>
  );
};
