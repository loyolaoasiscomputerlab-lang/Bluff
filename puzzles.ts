import { Puzzle, Card, Rank } from '../types';

const createCard = (rank: Rank, suit: any, id: string): Card => ({ id, rank, suit });

export const PUZZLES: Puzzle[] = [
  {
    id: 'puzzle-1',
    title: 'The Obvious Lie',
    description: 'Your opponent just played 3 Aces. They have been playing aggressively all game. You have 2 Aces in your hand.',
    setup: {
      playerHand: [
        createCard('A', 'hearts', 'p1-1'),
        createCard('A', 'spades', 'p1-2'),
        createCard('K', 'diamonds', 'p1-3')
      ],
      opponentHandCount: 4,
      opponentType: 'aggressive',
      pile: [
          createCard('A', 'clubs', 'pile-1'), 
          createCard('A', 'diamonds', 'pile-2'), 
          createCard('2', 'hearts', 'pile-3') // Hidden in pile
      ], 
      currentRank: 'A',
      lastPlay: {
        playerId: 'opponent',
        cards: [createCard('A', 'clubs', 'played-1'), createCard('A', 'diamonds', 'played-2'), createCard('2', 'hearts', 'played-3')],
        declaredRank: 'A'
      }
    },
    solution: {
      action: 'call_bluff'
    },
    explanation: "There are only 4 Aces in the deck. You have 2, and they played 3. It's mathematically impossible for them to be telling the truth!"
  },
  {
    id: 'puzzle-2',
    title: 'Safe Exit',
    description: 'You have one card left. The current rank is King. The opponent passed to you.',
    setup: {
      playerHand: [createCard('K', 'hearts', 'p2-1')],
      opponentHandCount: 5,
      opponentType: 'balanced',
      pile: [createCard('10', 'clubs', 'pile-1')],
      currentRank: 'K',
      lastPlay: null // Opponent passed
    },
    solution: {
      action: 'play',
      cards: ['p2-1'],
      rank: 'K'
    },
    explanation: "You have a matching card and it's your turn. Playing it guarantees you go out and win the round/game."
  }
];
