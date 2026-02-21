import { Player, GameState, Card, Rank, RANKS } from '../types';
import { CharacterProfile } from './characters';

interface BotDecision {
  action: 'play' | 'pass' | 'call_bluff';
  cards?: Card[];
  declaredRank?: Rank;
  thought?: string;
  emotion?: Player['emotionalState']['current'];
}

const getTraits = (profile?: CharacterProfile) => {
    if (!profile) return { bluffChance: 0.3, callChance: 0.3, mistakeChance: 0.1, iq: 100 }; // Default balanced

    const mood = profile.mood.toLowerCase();
    const iqStr = profile.iq.split('-')[0];
    const iq = parseInt(iqStr) || 100;

    // Base stats derived from IQ
    // Higher IQ = Lower mistake chance, better probability assessment
    const mistakeChance = Math.max(0.01, 0.2 - (iq - 100) * 0.002); 

    let bluffChance = 0.3;
    let callChance = 0.3;

    // Mood Modifiers
    if (mood.includes('aggressive') || mood.includes('bold') || mood.includes('obsessive') || mood.includes('intense')) {
        bluffChance += 0.3;
        callChance += 0.2;
    }
    if (mood.includes('conservative') || mood.includes('calm') || mood.includes('patient') || mood.includes('disciplined')) {
        bluffChance -= 0.1;
        callChance -= 0.1;
    }
    if (mood.includes('chaotic') || mood.includes('playful') || mood.includes('eccentric')) {
        bluffChance += 0.2;
        callChance += 0.1;
        // Chaos factor handled in logic
    }
    if (mood.includes('analytical') || mood.includes('calculated') || mood.includes('strategic')) {
        // Analytical bots bluff less randomly, but call more accurately
        callChance += 0.1;
    }

    return { bluffChance, callChance, mistakeChance, iq };
};

export function getBotAction(
  gameState: GameState,
  botPlayer: Player
): BotDecision {
  const { currentRank, lastPlay, pile, players } = gameState;
  const { bluffChance, callChance, mistakeChance, iq } = getTraits(botPlayer.profile);
  
  // 1. Decision: Call Bluff?
  if (lastPlay && lastPlay.playerId !== botPlayer.id) {
    const shouldCall = evaluateBluff(gameState, botPlayer, callChance, mistakeChance, iq);
    
    // Generate thought based on decision
    let thought = "";
    let emotion: Player['emotionalState']['current'] = 'neutral';
    
    if (shouldCall) {
        const thoughts = [
            "Too many cards... suspicious.",
            "I don't trust them.",
            "That's a lie!",
            "No way they have that many.",
            "I'm calling it.",
            "Smells like a bluff."
        ];
        thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        emotion = 'angry';
        return { action: 'call_bluff', thought, emotion };
    } else {
        // If we suspect but don't call
        if (Math.random() < 0.3) {
            const thoughts = [
                "Hmm... maybe next time.",
                "I'll let it slide.",
                "Suspicious, but risky.",
                "Are they lying? Hard to tell."
            ];
            thought = thoughts[Math.floor(Math.random() * thoughts.length)];
            emotion = 'anxious';
        }
    }
  }

  // 2. Decision: Play Cards
  let targetRank = currentRank;
  
  // If new round (no current rank), pick the best rank to start with
  if (!targetRank) {
    targetRank = pickBestStartingRank(botPlayer.hand);
  }

  // Check if we have the rank
  const matchingCards = botPlayer.hand.filter(c => c.rank === targetRank);
  const nonMatchingCards = botPlayer.hand.filter(c => c.rank !== targetRank);
  
  // Logic Flow
  
  // A. Truth Play
  if (matchingCards.length > 0) {
    // 90% chance to play truth if we have it
    // 10% chance to hold back (unless it's our last cards)
    if (Math.random() < 0.9 || botPlayer.hand.length <= 2) {
        // Advanced: Sneak a lie in?
        // If aggressive/chaotic and we have junk, maybe add 1 junk card
        if (bluffChance > 0.5 && nonMatchingCards.length > 0 && Math.random() < 0.3) {
            const junk = nonMatchingCards[0];
            const thoughts = [
                "Hehe, sneaking one in...",
                "They'll never know.",
                "Just a little lie.",
                "Mixing it up."
            ];
            return {
                action: 'play',
                cards: [...matchingCards, junk],
                declaredRank: targetRank,
                thought: thoughts[Math.floor(Math.random() * thoughts.length)],
                emotion: 'smug'
            };
        }

        const thoughts = [
            "Easy play.",
            "I have these.",
            "Truth is best.",
            "Playing it safe.",
            "No need to lie."
        ];
        return { 
            action: 'play', 
            cards: matchingCards, 
            declaredRank: targetRank,
            thought: thoughts[Math.floor(Math.random() * thoughts.length)],
            emotion: 'confident'
        };
    }
  }

  // B. Bluff Play (Lie)
  // If we don't have cards, or we chose to hold back
  
  // Probability of bluffing depends on:
  // 1. Pile size (larger pile = riskier)
  // 2. Hand size (need to get rid of cards)
  // 3. Personality (bluffChance)
  
  let currentBluffChance = bluffChance;
  if (pile.length > 10) currentBluffChance -= 0.3; // Too risky
  if (botPlayer.hand.length > 8) currentBluffChance += 0.2; // Desperate

  if (Math.random() < currentBluffChance) {
      // Pick 1-2 junk cards to lie with
      const countToPlay = Math.random() < 0.8 ? 1 : 2;
      const junkCards = pickJunkCards(botPlayer.hand, countToPlay);
      
      const thoughts = [
          "Hope they don't notice...",
          "Please don't call me.",
          "Gotta risk it.",
          "Poker face... poker face...",
          "This is a big bluff."
      ];

      return {
          action: 'play',
          cards: junkCards,
          declaredRank: targetRank,
          thought: thoughts[Math.floor(Math.random() * thoughts.length)],
          emotion: 'anxious'
      };
  }

  // C. Pass
  const thoughts = [
      "I'll sit this one out.",
      "Nothing to play.",
      "Pass.",
      "Not worth the risk.",
      "I'll wait."
  ];
  return { 
      action: 'pass',
      thought: thoughts[Math.floor(Math.random() * thoughts.length)],
      emotion: 'neutral'
  };
}

function evaluateBluff(gameState: GameState, botPlayer: Player, callChance: number, mistakeChance: number, iq: number): boolean {
  const { lastPlay, pile, players } = gameState;
  if (!lastPlay) return false;

  const rank = lastPlay.declaredRank;
  const myCount = botPlayer.hand.filter(c => c.rank === rank).length;
  const declaredCount = lastPlay.declaredCount;
  
  // 1. Mathematical Certainty (The "Impossible" Check)
  // Total cards of a rank = 4.
  // If My Cards + Declared Cards > 4, they are 100% lying.
  if (myCount + declaredCount > 4) {
    return true;
  }

  // 2. Probability & Risk
  let suspicionScore = 0;
  
  // Base suspicion on quantity played
  if (declaredCount === 1) suspicionScore += 0.1;
  if (declaredCount === 2) suspicionScore += 0.3;
  if (declaredCount === 3) suspicionScore += 0.7; // Very bold
  if (declaredCount >= 4) suspicionScore += 0.95; // Extremely unlikely to have 4 unless they collected pile

  // Adjust based on what I hold
  if (myCount === 3) suspicionScore += 0.6;
  if (myCount === 2) suspicionScore += 0.3;
  if (myCount === 1) suspicionScore += 0.1;

  // Adjust based on pile size (Reward vs Risk)
  if (pile.length < 5) suspicionScore += 0.2; // Low risk to call
  if (pile.length > 15) suspicionScore -= 0.2; // High risk to call

  // Personality
  if (callChance > 0.5) suspicionScore += 0.2;
  if (callChance < 0.3) suspicionScore -= 0.2;

  // IQ modifier: High IQ bots calculate better
  if (iq > 140) {
      // They track pile size and probabilities better
      if (pile.length > 10) suspicionScore += 0.1; // Pot odds
  }

  // Random noise based on mistake chance
  if (Math.random() < mistakeChance) suspicionScore = Math.random();

  // Final Decision
  return Math.random() < suspicionScore;
}

function pickBestStartingRank(hand: Card[]): Rank {
  // Strategy:
  // 1. Play ranks we have multiples of (to clear hand fast)
  // 2. Play ranks we have singles of (to clear "junk" if we plan to lie? No, usually play truth first)
  
  const counts: Record<string, number> = {};
  hand.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
  
  // Sort by count descending
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  if (sorted.length > 0) {
    return sorted[0][0] as Rank;
  }
  
  // Fallback (shouldn't happen unless empty hand)
  return 'A'; 
}

function pickJunkCards(hand: Card[], count: number): Card[] {
  // Sort by count (singles first) then value?
  // For now just random or first available
  // Better: Pick cards that are NOT the current rank (obviously)
  
  // We already filtered for non-matching before calling this in some contexts, 
  // but let's be safe.
  
  // Actually, this function just picks 'count' cards from the hand to use as a lie.
  // We should prefer playing singles to get rid of them.
  
  const counts: Record<string, number> = {};
  hand.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
  
  // Sort hand by frequency (singles first)
  const sortedHand = [...hand].sort((a, b) => {
      return (counts[a.rank] || 0) - (counts[b.rank] || 0);
  });
  
  return sortedHand.slice(0, count);
}
