import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../store/gameContext';
import { CardComponent } from './Card';
import { Card, Rank } from '../types';
import { motion, useDragControls, PanInfo } from 'motion/react';
import { cn } from '../utils/cn';

export const Hand: React.FC = () => {
  const { state, dispatch } = useGame();
  const player = state.players.find(p => p.isHuman);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const dragControls = useDragControls();
  const handRef = useRef<HTMLDivElement>(null);

  if (!player) return null;

  const toggleSelect = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId) 
        : [...prev, cardId]
    );
  };
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, card: Card) => {
      // Threshold to play: Dragged up by 150px
      if (info.offset.y < -150 && isMyTurn) {
          let cardsToPlayIds = selectedCards;
          if (!selectedCards.includes(card.id)) {
              cardsToPlayIds = [card.id];
          }
          
          const rankToPlay = state.currentRank || card.rank;
          
          const cardsToPlay = player.hand.filter(c => cardsToPlayIds.includes(c.id));
          
          if (cardsToPlay.length > 0) {
             dispatch({
                type: 'PLAY_CARDS',
                payload: {
                    playerId: player.id,
                    cards: cardsToPlay,
                    declaredRank: rankToPlay!
                }
             });
             setSelectedCards([]);
          }
      }
  };

  const isMyTurn = state.players[state.currentPlayerIndex]?.id === player.id;
  const canPlay = isMyTurn && selectedCards.length > 0;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canPlay) {
        const rankToPlay = state.currentRank || player.hand.find(c => selectedCards.includes(c.id))?.rank;
        if (rankToPlay) handlePlay(rankToPlay);
      }
      if (e.key === ' ' && state.lastPlay && state.lastPlay.playerId !== player.id) {
        e.preventDefault(); // Prevent scroll
        dispatch({ type: 'CALL_BLUFF', payload: { callerId: player.id } });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canPlay, selectedCards, state.currentRank, state.lastPlay]);

  const selectAllRank = (rank: Rank) => {
    const cardsOfRank = player.hand.filter(c => c.rank === rank).map(c => c.id);
    setSelectedCards(prev => {
        const allSelected = cardsOfRank.every(id => prev.includes(id));
        if (allSelected) {
            return prev.filter(id => !cardsOfRank.includes(id));
        }
        return [...new Set([...prev, ...cardsOfRank])];
    });
  };

  const handlePlay = (declaredRank: Rank) => {
    if (!canPlay) return;
    
    const cardsToPlay = player.hand.filter(c => selectedCards.includes(c.id));
    
    dispatch({
      type: 'PLAY_CARDS',
      payload: {
        playerId: player.id,
        cards: cardsToPlay,
        declaredRank: declaredRank,
      },
    });
    setSelectedCards([]);
  };

  // Group cards by rank for display
  const groupedHand: Record<string, Card[]> = {};
  player.hand.forEach(card => {
    if (!groupedHand[card.rank]) groupedHand[card.rank] = [];
    groupedHand[card.rank].push(card);
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        
        {/* Action Bar */}
        <div className={cn(
            "flex flex-col items-center w-full transition-all",
            state.user.settings?.mobileMode ? "gap-2" : "gap-4"
        )}>
          {isMyTurn && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                  "flex gap-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-full transition-all",
                  state.user.settings?.mobileMode 
                    ? "flex-row p-2 scale-90 origin-bottom items-center" 
                    : "flex-col md:flex-row p-4 w-full md:w-auto"
              )}
            >
              <div className="flex flex-col items-center w-full md:w-auto">
                {!state.user.settings?.mobileMode && <span className="text-white text-sm mb-2 font-medium">Declare Rank:</span>}
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-hide snap-x items-center">
                  {state.currentRank ? (
                     <div className="flex gap-2 w-full justify-center items-center">
                       <div className="text-white font-bold text-lg mr-2 bg-black/20 px-3 py-1 rounded-lg border border-white/10">
                           {state.currentRank}s
                       </div>
                       <button
                         onClick={() => handlePlay(state.currentRank!)}
                         disabled={!canPlay}
                         className={cn(
                             "bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-bold shadow-lg transition-all whitespace-nowrap flex items-center gap-2",
                             state.user.settings?.mobileMode ? "px-4 py-1 text-xs" : "px-6 py-2"
                         )}
                       >
                         Play {selectedCards.length > 0 ? `(${selectedCards.length})` : ''}
                       </button>
                     </div>
                  ) : (
                    <div className="flex gap-2">
                        {Object.keys(groupedHand).map(rank => (
                            <button
                                key={rank}
                                onClick={() => {
                                    if (selectedCards.length > 0) {
                                        handlePlay(rank as Rank);
                                    } else {
                                        selectAllRank(rank as Rank);
                                    }
                                }}
                                className={cn(
                                    "text-white rounded-lg font-bold shadow-md transition-all snap-center whitespace-nowrap border border-white/10",
                                    selectedCards.length > 0 ? "bg-indigo-600 hover:bg-indigo-500" : "bg-slate-700 hover:bg-slate-600",
                                    state.user.settings?.mobileMode ? "px-3 py-1 text-xs min-w-[2.5rem]" : "px-4 py-2 min-w-[3rem]"
                                )}
                            >
                                {selectedCards.length > 0 ? `As ${rank}` : `${rank}s`}
                            </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-px bg-white/20 mx-1 h-8 self-center" />
              
              <div className="flex items-center justify-center gap-2 w-full md:w-auto">
                 <button
                    onClick={() => dispatch({ type: 'PASS_TURN', payload: { playerId: player.id } })}
                    className={cn(
                        "bg-slate-600 hover:bg-slate-700 text-white rounded-full font-bold shadow-lg transition-all",
                        state.user.settings?.mobileMode ? "px-4 py-1 text-xs" : "px-6 py-2 w-full md:w-auto"
                    )}
                  >
                    Pass
                  </button>
              </div>
            </motion.div>
          )}

          {/* Call Bluff Button - Always visible if valid target exists */}
          {state.lastPlay && state.lastPlay.playerId !== player.id && (
             <motion.button
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => dispatch({ type: 'CALL_BLUFF', payload: { callerId: player.id } })}
               className={cn(
                   "bg-rose-600 hover:bg-rose-700 text-white rounded-full font-black shadow-xl transition-all animate-pulse border-4 border-rose-800",
                   state.user.settings?.mobileMode ? "px-6 py-2 text-sm" : "px-8 py-3 text-lg w-full md:w-auto"
               )}
             >
               CALL BLUFF!
             </motion.button>
          )}
        </div>

        {/* Cards */}
        <div 
            ref={handRef}
            className={cn(
                "flex transition-all duration-300 py-4 md:py-8 px-4 overflow-x-auto w-full justify-start md:justify-center min-h-[140px] md:min-h-[180px] scrollbar-hide",
                state.user.settings?.mobileMode ? "-space-x-6" : "-space-x-4 md:-space-x-8 hover:-space-x-2 md:hover:-space-x-4"
            )}
        >
          {player.hand.map((card, index) => (
            <motion.div
                key={card.id}
                drag={isMyTurn}
                dragConstraints={{ top: -300, bottom: 0, left: 0, right: 0 }}
                dragSnapToOrigin={true}
                onDragEnd={(e, info) => handleDragEnd(e, info, card)}
                style={{ zIndex: index }}
                className="flex-shrink-0"
            >
                <CardComponent
                  card={card}
                  isSelected={selectedCards.includes(card.id)}
                  onClick={() => toggleSelect(card.id)}
                  className={cn(
                      "hover:z-50 transition-all",
                      state.user.settings?.mobileMode ? "w-12 h-16" : "w-20 h-28 md:w-24 md:h-36"
                  )}
                />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
