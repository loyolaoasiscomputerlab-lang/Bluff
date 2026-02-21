import { GameState, Player, Card, Rank, RANKS, GameLogEntry } from '../types';
import { createDeck, dealCards, sortHand } from '../utils/cards';

export type GameAction =
  | { type: 'START_GAME'; payload: { difficulty: string; playerCount: number; isTutorial?: boolean; selectedCharacters?: CharacterProfile[] } }
  | { type: 'START_PUZZLE'; payload: { puzzleId: string } }
  | { type: 'PLAY_CARDS'; payload: { playerId: string; cards: Card[]; declaredRank: Rank } }
  | { type: 'CALL_BLUFF'; payload: { callerId: string } }
  | { type: 'PASS_TURN'; payload: { playerId: string } }
  | { type: 'RESOLVE_BLUFF'; payload: { success: boolean; liarId: string; callerId: string; pile: Card[] } }
  | { type: 'NEW_ROUND'; payload: { starterId: string } }
  | { type: 'ADD_LOG'; payload: { text: string; type: GameLogEntry['type'] } }
  | { type: 'SET_USERNAME'; payload: { name: string } }
  | { type: 'COMPLETE_TUTORIAL'; }
  | { type: 'RETRY_PUZZLE'; }
  | { type: 'EXIT_TO_LOBBY'; }
  | { type: 'RESIGN_GAME'; }
  | { type: 'TOGGLE_MOBILE_MODE'; }
  | { type: 'SET_RATING'; payload: { rating: number } }
  | { type: 'ACKNOWLEDGE_REVEAL'; }
  | { type: 'UPDATE_BOT_EMOTION'; payload: { playerId: string; emotion: Player['emotionalState'] } };

const STORAGE_KEY = 'bluff_game_user';

const loadUser = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to load user', e);
    }
    return {
        name: 'Player',
        hasCompletedTutorial: false,
        rating: 1200,
        stats: { wins: 0, bluffs: 0, caught: 0 },
        settings: { mobileMode: false }
    };
};

const saveUser = (user: any) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
        console.error('Failed to save user', e);
    }
};

export const initialState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  pile: [],
  currentRank: null,
  lastPlay: null,
  consecutivePasses: 0,
  gameStatus: 'lobby',
  log: [],
  winner: null,
  difficulty: 'medium',
  isTutorial: false,
  user: loadUser(),
};

// ... (NPC_PERSONALITIES, NPC_NAMES) ...

import { PUZZLES } from '../utils/puzzles';
import { CHARACTERS, CharacterProfile } from '../utils/characters';

// Simple Elo-like calculation
const calculateRatingChange = (playerRating: number, opponentRating: number, isWin: boolean) => {
    const K = 32; // K-factor
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const actualScore = isWin ? 1 : 0;
    return Math.round(K * (actualScore - expectedScore));
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  // Helper to save user state on changes
  const withSave = (newState: GameState) => {
      // Only save persistent user data, not game state
      if (newState.user !== state.user || newState.players[0]?.rating !== state.players[0]?.rating) {
          const userToSave = {
              ...newState.user,
              // If player 0 exists (game active), sync Rating back to user object
              ...(newState.players[0] ? {
                  rating: newState.players[0].rating
              } : {})
          };
          saveUser(userToSave);
          // Also update the user object in state to match
          return { ...newState, user: userToSave };
      }
      return newState;
  };

  switch (action.type) {
    case 'START_GAME': {
      const { difficulty, playerCount, selectedCharacters } = action.payload;
      const isTutorial = action.payload.isTutorial || false;
      
      const deck = createDeck();
      const hands = dealCards(deck, playerCount);
      
      // If no characters selected (e.g. tutorial), pick random ones
      let opponents = selectedCharacters || [];
      if (opponents.length < playerCount - 1) {
          const available = CHARACTERS.filter(c => !opponents.find(o => o.id === c.id));
          const needed = (playerCount - 1) - opponents.length;
          const randomPicks = available.sort(() => Math.random() - 0.5).slice(0, needed);
          opponents = [...opponents, ...randomPicks];
      }

      const players: Player[] = hands.map((hand, i) => {
        if (i === 0) {
            // Human
            return {
                id: 'player-human',
                name: state.user.name !== 'Player' ? state.user.name : 'You',
                isHuman: true,
                hand,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${state.user.name}&backgroundColor=ffdfbf`,
                rating: state.user.rating || 1200,
                status: 'idle',
            };
        } else {
            // NPC
            const profile = opponents[i - 1];
            // Estimate NPC rating based on IQ (100 IQ ~ 1200 rating, 160 IQ ~ 2000 rating)
            const iq = parseInt(profile.iq.split('-')[0]) || 100;
            const estimatedRating = 1000 + (iq - 80) * 15;

            return {
                id: `player-npc-${i}`,
                name: profile.name,
                isHuman: false,
                hand,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}&backgroundColor=e5e5e5`,
                rating: estimatedRating,
                profile: profile,
                status: 'idle',
            };
        }
      });

      return withSave({
        ...state, 
        players,
        gameStatus: 'playing',
        difficulty: difficulty as any,
        currentPlayerIndex: 0,
        isTutorial,
        activePuzzle: null, 
        log: [{
          id: `${Date.now()}-start`,
          text: isTutorial ? 'Tutorial Started! Follow the instructions.' : 'Game started! You go first.',
          type: 'info',
          timestamp: Date.now(),
        }],
      });
    }

    case 'START_PUZZLE': {
        const puzzle = PUZZLES.find(p => p.id === action.payload.puzzleId);
        if (!puzzle) return state;

        // Construct puzzle state
        const players: Player[] = [
            {
                id: 'player-human',
                name: 'You',
                isHuman: true,
                hand: puzzle.setup.playerHand,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${state.user.name}&backgroundColor=ffdfbf`,
                rating: state.user.rating || 1200,
                personality: 'balanced',
                status: 'playing'
            },
            {
                id: 'opponent',
                name: 'Trainer',
                isHuman: false,
                hand: Array(puzzle.setup.opponentHandCount).fill({ id: 'dummy', rank: 'A', suit: 'spades' }), // Dummy cards
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Trainer&backgroundColor=e5e5e5`,
                rating: 1500,
                personality: puzzle.setup.opponentType,
                status: 'idle'
            }
        ];

        return {
            ...state,
            players,
            currentPlayerIndex: 0, // Human always starts in puzzle (to react)
            pile: puzzle.setup.pile,
            currentRank: puzzle.setup.currentRank,
            lastPlay: puzzle.setup.lastPlay ? { ...puzzle.setup.lastPlay, declaredCount: puzzle.setup.lastPlay.cards.length } : null,
            gameStatus: 'playing',
            activePuzzle: puzzle,
            log: [{
                id: Date.now().toString(),
                text: `PUZZLE: ${puzzle.title} - ${puzzle.description}`,
                type: 'info',
                timestamp: Date.now()
            }]
        };
    }

    case 'EXIT_TO_LOBBY': {
        return {
            ...state,
            gameStatus: 'lobby',
            activePuzzle: null
        };
    }

    case 'RETRY_PUZZLE': {
        if (!state.activePuzzle) return state;
        // Re-trigger start puzzle logic
        return gameReducer(state, { type: 'START_PUZZLE', payload: { puzzleId: state.activePuzzle.id } });
    }
    
    // ... existing cases ...
    
    case 'SET_USERNAME': {
        return withSave({
            ...state,
            user: {
                ...state.user,
                name: action.payload.name,
                hasCompletedTutorial: true,
            },
            gameStatus: 'lobby', 
        });
    }
    
    case 'COMPLETE_TUTORIAL': {
        return withSave({
            ...state,
            gameStatus: 'tutorial_end',
            user: {
                ...state.user,
                hasCompletedTutorial: true
            }
        });
    }

    case 'RESIGN_GAME': {
        // Human resigns -> Automatic Loss
        const playerIndex = state.players.findIndex(p => p.isHuman);
        if (playerIndex === -1) return state;

        const player = state.players[playerIndex];
        const newPlayers = [...state.players];
        
        // Calculate Rating Loss
        // Treat as loss against average of opponents
        const opponents = newPlayers.filter(p => !p.isHuman);
        const avgOpponentRating = opponents.reduce((sum, p) => sum + p.rating, 0) / (opponents.length || 1);
        
        // Calculate loss (isWin = false)
        const ratingChange = calculateRatingChange(player.rating, avgOpponentRating, false);
        
        // Apply penalty (maybe slightly higher for resigning? For now standard loss)
        newPlayers[playerIndex] = {
            ...player,
            rating: Math.max(0, player.rating + ratingChange),
            ratingChange: ratingChange
        };

        // Opponents gain rating (optional, but fair)
        opponents.forEach(opp => {
            const oppIndex = newPlayers.findIndex(p => p.id === opp.id);
            const change = calculateRatingChange(opp.rating, player.rating, true);
            newPlayers[oppIndex] = {
                ...opp,
                rating: opp.rating + change,
                ratingChange: change
            };
        });

        return withSave({
            ...state,
            players: newPlayers,
            gameStatus: 'game_over',
            winner: 'resignation', // Special marker
            log: [{
                id: `${Date.now()}-resign`,
                text: `${player.name} resigned.`,
                type: 'fail',
                timestamp: Date.now(),
            }, ...state.log],
        });
    }

    case 'PLAY_CARDS': {
      const { playerId, cards, declaredRank } = action.payload;
      
      // Puzzle Check
      if (state.activePuzzle) {
          const solution = state.activePuzzle.solution;
          const isCorrect = solution.action === 'play' && 
                            solution.rank === declaredRank && 
                            (!solution.cards || cards.every(c => solution.cards?.includes(c.id)));
          
          if (isCorrect) {
              return { ...state, gameStatus: 'puzzle_success', log: [] };
          } else {
              return { ...state, gameStatus: 'puzzle_fail', log: [] };
          }
      }

      // Validate Turn
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return state;
      if (playerIndex !== state.currentPlayerIndex) {
          console.warn(`Player ${playerId} tried to play out of turn.`);
          return state;
      }

      const player = state.players[playerIndex];
      const newHand = player.hand.filter(c => !cards.some(played => played.id === c.id));
      
      // Update player status
      const newPlayers = [...state.players];
      newPlayers[playerIndex] = { 
          ...player, 
          hand: newHand, 
          status: 'playing',
          lastAction: {
              text: `Played ${cards.length} ${declaredRank}${cards.length > 1 ? 's' : ''}`,
              timestamp: Date.now()
          }
      };

      // Check Win Condition
      if (newHand.length === 0) {
        // Calculate Rating Changes
        const winner = newPlayers[playerIndex];
        const opponents = newPlayers.filter(p => p.id !== winner.id);
        const avgOpponentRating = opponents.reduce((sum, p) => sum + p.rating, 0) / opponents.length;
        
        // Winner gains rating
        const ratingChange = calculateRatingChange(winner.rating, avgOpponentRating, true);
        newPlayers[playerIndex] = {
            ...winner,
            rating: winner.rating + ratingChange,
            ratingChange: ratingChange
        };

        // Losers lose rating
        opponents.forEach(loser => {
            const loserIndex = newPlayers.findIndex(p => p.id === loser.id);
            const change = calculateRatingChange(loser.rating, winner.rating, false);
            newPlayers[loserIndex] = {
                ...loser,
                rating: Math.max(0, loser.rating + change), // Prevent negative rating
                ratingChange: change
            };
        });

        // If Tutorial and Human won (or lost, just end it)
        if (state.isTutorial) {
             return withSave({
                ...state,
                players: newPlayers,
                gameStatus: 'tutorial_end',
                winner: playerId,
                log: [],
             });
        }

        return withSave({
          ...state,
          players: newPlayers,
          gameStatus: 'game_over',
          winner: playerId,
          log: [{
            id: `${Date.now()}-win`,
            text: `${player.name} WINS THE GAME!`,
            type: 'win',
            timestamp: Date.now(),
          }, ...state.log],
        });
      }

      // Add to pile
      const newPile = [...state.pile, ...cards];

      // Log
      const logEntry: GameLogEntry = {
        id: `${Date.now()}-play`,
        text: `${player.name} played ${cards.length} card(s) as ${declaredRank}.`,
        type: 'move',
        timestamp: Date.now(),
      };

      // Next player
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

      return withSave({
        ...state,
        players: newPlayers,
        pile: newPile,
        currentRank: declaredRank, // The rank is now set/maintained
        lastPlay: {
          playerId,
          cards,
          declaredRank,
          declaredCount: cards.length,
        },
        consecutivePasses: 0,
        currentPlayerIndex: nextIndex,
        log: [logEntry, ...state.log],
      });
    }

    case 'RESOLVE_BLUFF': {
      const { success, liarId, callerId, pile } = action.payload;
      // success = Bluff was successfully called (Liar was lying)
      
      const loserId = success ? liarId : callerId;
      const winnerId = success ? callerId : liarId;
      const liarName = state.players.find(p => p.id === liarId)?.name || 'Unknown';
      const callerName = state.players.find(p => p.id === callerId)?.name || 'Unknown';

      const loserIndex = state.players.findIndex(p => p.id === loserId);
      const newPlayers = [...state.players];
      
      // Loser takes pile
      const loser = newPlayers[loserIndex];
      const newHand = [...loser.hand, ...pile];
      sortHand(newHand);
      newPlayers[loserIndex] = { ...loser, hand: newHand };

      // Log
      const logEntry: GameLogEntry = {
        id: `${Date.now()}-bluff-resolve`,
        text: success 
          ? `BLUFF CAUGHT! ${liarName} was lying!` 
          : `BLUFF FAILED! ${liarName} was telling the truth!`,
        type: success ? 'success' : 'fail',
        timestamp: Date.now(),
      };

      // Store revealed info but don't clear pile/reset round yet (wait for acknowledge)
      // Actually, we can process the state change (cards moved) but show the overlay
      // The pile is technically empty now in game logic, but we can show the "revealed" cards in the overlay.
      
      return withSave({
        ...state,
        players: newPlayers,
        pile: [], // Pile cleared to loser
        currentRank: null, // Round reset
        lastPlay: null,
        consecutivePasses: 0,
        currentPlayerIndex: state.players.findIndex(p => p.id === winnerId), // Winner starts
        log: [logEntry, ...state.log],
        gameStatus: 'revealing',
        revealedCards: {
            cards: state.lastPlay?.cards || [],
            declaredRank: state.lastPlay?.declaredRank || 'A',
            isBluff: success,
            liarName,
            callerName
        }
      });
    }

    case 'ACKNOWLEDGE_REVEAL': {
        return {
            ...state,
            gameStatus: 'playing',
            revealedCards: null
        };
    }

    case 'PASS_TURN': {
      const { playerId } = action.payload;
      
      // Validate Turn
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex !== state.currentPlayerIndex) return state;

      const player = state.players.find(p => p.id === playerId);
      
      // Update player action text
      const newPlayersList = [...state.players];
      newPlayersList[playerIndex] = {
          ...newPlayersList[playerIndex],
          lastAction: {
              text: 'Passed',
              timestamp: Date.now()
          }
      };
      
      const logEntry: GameLogEntry = {
        id: `${Date.now()}-pass`,
        text: `${player?.name} passed.`,
        type: 'info',
        timestamp: Date.now(),
      };

      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      const newConsecutivePasses = state.consecutivePasses + 1;

      // Check if everyone passed (except the last player who played)
      if (newConsecutivePasses >= state.players.length - 1 && state.lastPlay) {
        // Round End: Last player wins the round (pile discarded)
        const winnerId = state.lastPlay.playerId;
        const winnerIndex = state.players.findIndex(p => p.id === winnerId);
        
        // No XP for round win
        const winner = state.players[winnerIndex];
        const newPlayers = [...newPlayersList]; // Use the list with the "Passed" update

        return withSave({
          ...state,
          players: newPlayers,
          pile: [],
          currentRank: null,
          lastPlay: null,
          consecutivePasses: 0,
          currentPlayerIndex: winnerIndex, // Winner starts next round
          log: [{
            id: `${Date.now()}-round-end`,
            text: `Round Over! ${state.players[winnerIndex].name} wins the pile (discarded).`,
            type: 'success',
            timestamp: Date.now(),
          }, logEntry, ...state.log],
        });
      }

      return withSave({
        ...state,
        players: newPlayersList,
        currentPlayerIndex: nextIndex,
        consecutivePasses: newConsecutivePasses,
        log: [logEntry, ...state.log],
      });
    }

    case 'ADD_LOG': {
      return {
        ...state,
        log: [{
          id: Date.now().toString(),
          text: action.payload.text,
          type: action.payload.type,
          timestamp: Date.now(),
        }, ...state.log],
      };
    }
    
    // Call Bluff (no save needed, just state update)
    case 'CALL_BLUFF': {
        const callerIndex = state.players.findIndex(p => p.id === action.payload.callerId);
        const newPlayers = [...state.players];
        if (callerIndex !== -1) {
            newPlayers[callerIndex] = {
                ...newPlayers[callerIndex],
                lastAction: {
                    text: 'Called Bluff!',
                    timestamp: Date.now()
                }
            };
        }

        // Puzzle Check
        if (state.activePuzzle) {
            const isCorrect = state.activePuzzle.solution.action === 'call_bluff';
            if (isCorrect) {
                return { ...state, gameStatus: 'puzzle_success', log: [] };
            } else {
                return { ...state, gameStatus: 'puzzle_fail', log: [] };
            }
        }
        return { 
            ...state,
            players: newPlayers,
            bluffCalled: { callerId: action.payload.callerId }
        };
    }

    case 'TOGGLE_MOBILE_MODE': {
        return withSave({
            ...state,
            user: {
                ...state.user,
                settings: {
                    ...state.user.settings,
                    mobileMode: !state.user.settings?.mobileMode
                }
            }
        });
    }

    case 'SET_RATING': {
        return withSave({
            ...state,
            user: {
                ...state.user,
                rating: action.payload.rating,
                hasCompletedTutorial: true // Ensure tutorial is marked complete
            },
            gameStatus: 'lobby' // Return to lobby after setting rating
        });
    }

    case 'UPDATE_BOT_EMOTION': {
        const { playerId, emotion } = action.payload;
        const playerIndex = state.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return state;

        const newPlayers = [...state.players];
        newPlayers[playerIndex] = {
            ...newPlayers[playerIndex],
            emotionalState: emotion
        };

        return {
            ...state,
            players: newPlayers
        };
    }

    default:
      return state;
  }
}
