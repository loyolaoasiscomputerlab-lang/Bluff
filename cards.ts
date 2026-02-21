import { Card, RANKS, SUITS, Rank } from '../types';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let idCounter = 0;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `card-${idCounter++}`,
        suit,
        rank,
      });
    }
  }
  return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function dealCards(deck: Card[], playerCount: number): Card[][] {
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  deck.forEach((card, index) => {
    hands[index % playerCount].push(card);
  });
  // Sort hands by rank for easier viewing
  hands.forEach(hand => sortHand(hand));
  return hands;
}

export function sortHand(hand: Card[]) {
  const rankOrder: Record<string, number> = {};
  RANKS.forEach((r, i) => rankOrder[r] = i);
  
  hand.sort((a, b) => {
    if (rankOrder[a.rank] !== rankOrder[b.rank]) {
      return rankOrder[a.rank] - rankOrder[b.rank];
    }
    return a.suit.localeCompare(b.suit);
  });
}

export function getRankValue(rank: Rank): number {
    return RANKS.indexOf(rank);
}
