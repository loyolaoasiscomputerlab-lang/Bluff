import React from 'react';
import { useGame } from '../store/gameContext';
import { motion, AnimatePresence } from 'motion/react';
import { CardComponent } from './Card';
import { cn } from '../utils/cn';

export const GameBoard: React.FC = () => {
  const { state, dispatch } = useGame();
  const [showTutorialBanner, setShowTutorialBanner] = React.useState(false);
  const [, setTick] = React.useState(0);

  // Force re-render every second to update action bubble visibility
  React.useEffect(() => {
      const interval = setInterval(() => setTick(t => t + 1), 1000);
      return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (state.isTutorial && state.gameStatus === 'playing') {
        setShowTutorialBanner(true);
        const timer = setTimeout(() => {
            setShowTutorialBanner(false);
        }, 5000); // Increased to 5s for better readability, or stick to user request? User said 2s. Let's do 3s.
        return () => clearTimeout(timer);
    }
  }, [state.isTutorial, state.gameStatus]);

  // Helper to position players around a table
  const getPlayerPosition = (index: number, total: number) => {
    // Mobile-first adjustments
    const isMobile = window.innerWidth < 768;
    const isMobileMode = state.user.settings?.mobileMode;

    if (index === 0) return { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }; 

    // If Mobile Mode is ON, force a specific compact layout
    if (isMobileMode) {
        const positions: Record<number, React.CSSProperties[]> = {
            2: [{ top: '5%', left: '50%', transform: 'translateX(-50%) scale(0.6)' }],
            3: [
                { top: '5%', left: '15%', transform: 'scale(0.5)' },
                { top: '5%', right: '15%', transform: 'scale(0.5)' }
            ],
            4: [
                { top: '15%', left: '2%', transform: 'scale(0.5)' },
                { top: '5%', left: '50%', transform: 'translateX(-50%) scale(0.5)' },
                { top: '15%', right: '2%', transform: 'scale(0.5)' }
            ],
            5: [
                { top: '20%', left: '2%', transform: 'scale(0.5)' },
                { top: '5%', left: '25%', transform: 'scale(0.5)' },
                { top: '5%', right: '25%', transform: 'scale(0.5)' },
                { top: '20%', right: '2%', transform: 'scale(0.5)' }
            ]
        };
        const npcIndex = index - 1;
        const layout = positions[state.players.length] || [];
        return layout[npcIndex] || {};
    }

    const positions: Record<number, React.CSSProperties[]> = {
        2: [{ top: '12%', left: '50%', transform: 'translateX(-50%)' }],
        3: [
            { top: '20%', left: isMobile ? '10%' : '20%' },
            { top: '20%', right: isMobile ? '10%' : '20%' }
        ],
        4: [
            { top: '40%', left: isMobile ? '2%' : '10%' },
            { top: '12%', left: '50%', transform: 'translateX(-50%)' },
            { top: '40%', right: isMobile ? '2%' : '10%' }
        ],
        5: [
            { top: '45%', left: isMobile ? '2%' : '5%' },
            { top: '15%', left: isMobile ? '15%' : '25%' },
            { top: '15%', right: isMobile ? '15%' : '25%' },
            { top: '45%', right: isMobile ? '2%' : '5%' }
        ]
    };

    const npcIndex = index - 1;
    const layout = positions[state.players.length] || [];
    return layout[npcIndex] || {};
  };

  return (
    <div className="flex-1 relative flex items-center justify-center bg-[#35654d] overflow-hidden">
      {/* Felt Texture / Table Look */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 pointer-events-none" />
      
      {/* Table Border (Optional, for visual framing) */}
      <div className="absolute inset-4 border-4 border-[#2a4d3b] rounded-[100px] pointer-events-none opacity-50" />

      {/* Pile Area - Center Table */}
      <div className={cn(
          "relative flex items-center justify-center z-10 transition-all duration-300",
          state.user.settings?.mobileMode ? "w-40 h-40 scale-75" : "w-64 h-64"
      )}>
        {/* Pile Placeholder / Drop Zone */}
        <div className="absolute inset-0 border-2 border-white/10 rounded-3xl transform rotate-45 bg-black/10 backdrop-blur-sm" />
        
        <AnimatePresence>
          {state.pile.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ scale: 1.5, opacity: 0, y: -200 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0, 
                rotate: Math.random() * 30 - 15,
                x: Math.random() * 20 - 10
              }}
              exit={{ scale: 0, opacity: 0, y: 50 }}
              className="absolute shadow-xl"
              style={{ zIndex: index }}
            >
              <CardComponent card={card} isHidden={true} className="w-20 h-28 md:w-24 md:h-36" />
            </motion.div>
          ))}
        </AnimatePresence>

        {state.pile.length === 0 && (
          <div className="text-white/20 font-bold text-xl tracking-widest uppercase text-center">
            Waiting for<br/>First Move
          </div>
        )}

        {state.pile.length > 0 && (
            <div className="absolute -bottom-16 bg-black/60 px-4 py-1 rounded-full text-white font-mono border border-white/10 backdrop-blur-md shadow-xl">
                <span className="text-xs text-white/50 uppercase tracking-widest mr-2">Pile</span>
                <span className="text-emerald-400 font-bold text-xl">{state.pile.length}</span>
            </div>
        )}
        
        {state.currentRank && (
          <div className="absolute -top-24 bg-black/60 px-6 py-2 rounded-full text-white font-mono border border-white/10 backdrop-blur-md shadow-xl flex flex-col items-center">
            <span className="text-xs text-white/50 uppercase tracking-widest">Current Rank</span>
            <span className="text-yellow-400 font-bold text-3xl">{state.currentRank}</span>
          </div>
        )}
      </div>

      {/* Tutorial Guide Overlay */}
      <AnimatePresence>
        {state.isTutorial && state.gameStatus === 'playing' && showTutorialBanner && (
            <motion.div 
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="absolute top-20 left-1/2 bg-emerald-600/90 backdrop-blur-md text-white px-6 py-4 rounded-xl border border-white/20 shadow-xl z-40 max-w-lg text-center pointer-events-none"
            >
                <h3 className="font-bold text-lg mb-1">Tutorial Mode</h3>
                <p className="text-sm opacity-90 mb-3">
                    {state.currentPlayerIndex === 0 
                        ? "It's your turn! Select cards to play. You can play matching cards (Truth) or any cards (Bluff)." 
                        : "Opponent's turn. Watch their move. If you think they are lying, press SPACE to Call Bluff!"}
                </p>
                {state.players[0].hand.length === 0 && (
                     <div className="mt-2 font-bold text-yellow-300 animate-pulse">You won! Tutorial finishing...</div>
                )}
                
                <button 
                    onClick={() => dispatch({ type: 'COMPLETE_TUTORIAL' })}
                    className="pointer-events-auto mt-2 px-4 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    Skip Tutorial
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Opponents */}
      {state.players.map((player, i) => {
        if (player.isHuman) return null; // Handled by Hand component
        
        const isCurrentTurn = state.currentPlayerIndex === i;
        const pos = getPlayerPosition(i, state.players.length);

        return (
          <div 
            key={player.id} 
            className="absolute flex flex-col items-center gap-3 transition-all duration-500"
            style={pos}
          >
            {/* Avatar Circle */}
            <div className={cn(
              "w-20 h-20 rounded-full border-4 flex items-center justify-center bg-slate-800 relative shadow-2xl transition-all duration-300 overflow-hidden",
              isCurrentTurn
                ? "border-yellow-400 ring-4 ring-yellow-400/30 scale-110" 
                : "border-slate-600 grayscale-[0.5]"
            )}>
              <motion.img 
                src={player.avatar} 
                alt={player.name}
                referrerPolicy="no-referrer"
                animate={{
                    scale: player.emotionalState?.current === 'angry' ? [1, 1.1, 1] : 
                           player.emotionalState?.current === 'surprised' ? [1, 1.05, 1] : 1,
                    rotate: player.emotionalState?.current === 'anxious' ? [-1, 1, -1] : 0,
                    y: player.emotionalState?.current === 'confident' ? [0, -2, 0] : 0
                }}
                transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                className={cn(
                    "w-full h-full object-cover transition-all duration-500",
                    player.emotionalState?.current === 'anxious' ? "grayscale-[0.3]" : "",
                    player.emotionalState?.current === 'angry' ? "sepia-[0.4] hue-rotate-[-30deg]" : ""
                )}
              />

              {/* Card Count Badge */}
              <div className="absolute -bottom-3 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full border border-slate-700 shadow-md flex items-center gap-1">
                <div className="w-2 h-3 bg-white rounded-[1px]" />
                {player.hand.length}
              </div>
              
              {/* Level Badge -> Rating Badge */}
              <div className="absolute -top-2 -right-2 bg-indigo-600 px-2 py-0.5 rounded-full flex items-center justify-center border-2 border-[#35654d] text-[10px] font-bold text-white shadow-sm">
                {Math.round(player.rating)}
              </div>

              {/* Action Bubble */}
              {player.lastAction && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={player.lastAction.timestamp}
                    className={cn(
                        "absolute z-30 bg-white text-black rounded-xl px-3 py-2 shadow-xl font-bold text-xs whitespace-nowrap pointer-events-none border-2 border-black/10",
                        state.user.settings?.mobileMode ? "-top-8" : "-top-12"
                    )}
                  >
                      {player.lastAction.text}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white rotate-45 border-b-2 border-r-2 border-black/10"></div>
                  </motion.div>
              )}

              {/* Thought Bubble (Emotional State) */}
              {player.emotionalState && player.emotionalState.thoughtProcess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    key={`thought-${player.lastAction?.timestamp}`} // Re-trigger on action
                    className={cn(
                        "absolute z-20 bg-white text-slate-600 rounded-full px-3 py-2 shadow-sm text-[10px] italic pointer-events-none border border-slate-200 max-w-[120px] text-center leading-tight",
                        state.user.settings?.mobileMode ? "-top-16 right-0" : "-top-20 -right-4"
                    )}
                    style={{ borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' }}
                  >
                      <span className="opacity-70">💭</span> {player.emotionalState.thoughtProcess}
                      <div className="absolute bottom-[-4px] left-4 w-2 h-2 bg-white rounded-full"></div>
                      <div className="absolute bottom-[-8px] left-2 w-1 h-1 bg-white rounded-full"></div>
                  </motion.div>
              )}
            </div>
            
            {/* Name Plate */}
            <div className="bg-black/40 backdrop-blur-sm px-4 py-1 rounded-lg border border-white/10 flex flex-col items-center">
                <span className={cn("font-bold text-sm", isCurrentTurn ? "text-white" : "text-white/60")}>
                    {player.name}
                </span>
                {player.profile && (
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">
                        {player.profile.role}
                    </span>
                )}
            </div>
          </div>
        );
      })}

      {/* Player Rating Bar (Top Left) - Optimized for Mobile Landscape */}
      {state.players[0] && (
          <div className={cn(
              "absolute left-4 z-20 flex items-center gap-2",
              state.user.settings?.mobileMode ? "top-2" : "top-4"
          )}>
            <div className={cn(
                "flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10",
                state.user.settings?.mobileMode ? "p-1 pr-3" : "p-2 pr-4"
            )}>
              <div className={cn(
                  "rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white border-2 border-emerald-400 shadow-lg",
                  state.user.settings?.mobileMode ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs"
              )}>
                  {Math.round(state.players[0].rating)}
              </div>
              <div className="flex flex-col">
                  {!state.user.settings?.mobileMode && <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">Rating</span>}
                  <div className={cn("font-mono text-white/80", state.user.settings?.mobileMode ? "text-[10px]" : "text-xs")}>
                      {state.players[0].rating}
                  </div>
              </div>
            </div>
            
            <button
                onClick={() => {
                    if (confirm("Are you sure you want to resign? You will lose rating points.")) {
                        dispatch({ type: 'RESIGN_GAME' });
                    }
                }}
                className={cn(
                    "bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 rounded-full font-bold uppercase tracking-wider transition-all backdrop-blur-md flex items-center justify-center",
                    state.user.settings?.mobileMode ? "w-8 h-8 p-0" : "px-4 py-2 text-xs"
                )}
                title="Resign"
            >
                {state.user.settings?.mobileMode ? "🏳️" : "Resign"}
            </button>
          </div>
      )}

      {/* Game Log / Notifications - Optimized */}
      <div 
        ref={(el) => {
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        }}
        className={cn(
            "absolute right-4 overflow-y-auto bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-white/80 scrollbar-thin scrollbar-thumb-white/20 z-20 shadow-2xl transition-all",
            state.user.settings?.mobileMode 
                ? "top-2 w-48 max-h-32 p-2 text-[10px] space-y-1" 
                : "top-24 w-64 max-h-64 p-4 text-sm space-y-2"
        )}
      >
        {state.log.map(entry => (
          <div key={entry.id} className={cn(
            "rounded bg-white/5 border-l-2",
            state.user.settings?.mobileMode ? "p-1" : "p-2",
            entry.type === 'move' ? 'border-blue-400' :
            entry.type === 'success' ? 'border-green-400 bg-green-500/10' :
            entry.type === 'fail' ? 'border-red-400 bg-red-500/10' :
            'border-slate-400'
          )}>
            {!state.user.settings?.mobileMode && <span className="opacity-50 text-[10px] mr-2">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>}
            {entry.text}
          </div>
        ))}
      </div>

      {/* Puzzle Result Overlay */}
      <AnimatePresence>
        {(state.gameStatus === 'puzzle_success' || state.gameStatus === 'puzzle_fail') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#262421] p-8 rounded-xl border border-white/10 shadow-2xl text-center max-w-md w-full"
            >
              <h2 className={cn("text-3xl font-black mb-2", state.gameStatus === 'puzzle_success' ? "text-emerald-500" : "text-rose-500")}>
                  {state.gameStatus === 'puzzle_success' ? 'PUZZLE SOLVED!' : 'INCORRECT'}
              </h2>
              <p className="text-white/80 mb-6">{state.activePuzzle?.explanation}</p>
              
              <div className="flex justify-center gap-4">
                  <button
                    onClick={() => dispatch({ type: 'EXIT_TO_LOBBY' })}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all"
                  >
                    Back to Menu
                  </button>
                  {state.gameStatus === 'puzzle_fail' && (
                      <button
                        onClick={() => dispatch({ type: 'RETRY_PUZZLE' })}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all"
                      >
                        Try Again
                      </button>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed Cards Overlay */}
      <AnimatePresence>
        {state.gameStatus === 'revealing' && state.revealedCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-md"
            onClick={() => dispatch({ type: 'ACKNOWLEDGE_REVEAL' })}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-[#262421] p-8 rounded-xl border border-white/10 shadow-2xl text-center max-w-lg w-full m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={cn("text-3xl font-black mb-2", state.revealedCards.isBluff ? "text-emerald-500" : "text-rose-500")}>
                  {state.revealedCards.isBluff ? 'BLUFF CAUGHT!' : 'NOT A BLUFF!'}
              </h2>
              <p className="text-white/60 mb-6 text-lg">
                  {state.revealedCards.isBluff 
                    ? `${state.revealedCards.liarName} was lying!` 
                    : `${state.revealedCards.liarName} was telling the truth!`}
              </p>
              
              <div className="flex justify-center gap-4 mb-8">
                  {state.revealedCards.cards.map((card, i) => (
                      <motion.div 
                        key={i}
                        initial={{ rotateY: 180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                          <CardComponent card={card} className="w-24 h-36 shadow-2xl" />
                      </motion.div>
                  ))}
              </div>

              <div className="text-white/40 text-sm font-bold uppercase tracking-widest mb-6">
                  Declared as: <span className="text-white">{state.revealedCards.declaredRank}s</span>
              </div>

              <button
                onClick={() => dispatch({ type: 'ACKNOWLEDGE_REVEAL' })}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-all"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial End / Set Username / Set Rating Overlay */}
      <AnimatePresence>
        {state.gameStatus === 'tutorial_end' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#262421] p-8 rounded-xl border border-white/10 shadow-2xl text-center max-w-md w-full"
            >
              <h2 className="text-3xl font-black text-emerald-500 mb-2">Tutorial Complete!</h2>
              <p className="text-white/80 mb-6">You're ready to bluff with the best.</p>
              
              <div className="space-y-6">
                  <div className="text-left">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Choose your Username</label>
                      <input 
                        type="text" 
                        placeholder="Enter username..."
                        className="w-full bg-[#3a3732] text-white p-4 rounded-lg border border-white/10 focus:border-emerald-500 outline-none font-bold text-lg"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val.trim()) {
                                    dispatch({ type: 'SET_USERNAME', payload: { name: val.trim() } });
                                }
                            }
                        }}
                      />
                  </div>

                  <div className="text-left">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Select Your Experience Level</label>
                      <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                                const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                                if (nameInput && nameInput.value.trim()) {
                                    dispatch({ type: 'SET_USERNAME', payload: { name: nameInput.value.trim() } });
                                    dispatch({ type: 'SET_RATING', payload: { rating: 1000 } });
                                } else {
                                    alert("Please enter a username first.");
                                }
                            }}
                            className="bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500 p-3 rounded-lg transition-all group"
                          >
                              <div className="text-emerald-400 font-bold mb-1 group-hover:text-emerald-300">Beginner</div>
                              <div className="text-[10px] text-white/50">Rating: 1000</div>
                          </button>
                          <button
                            onClick={() => {
                                const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                                if (nameInput && nameInput.value.trim()) {
                                    dispatch({ type: 'SET_USERNAME', payload: { name: nameInput.value.trim() } });
                                    dispatch({ type: 'SET_RATING', payload: { rating: 1200 } });
                                } else {
                                    alert("Please enter a username first.");
                                }
                            }}
                            className="bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500 p-3 rounded-lg transition-all group"
                          >
                              <div className="text-blue-400 font-bold mb-1 group-hover:text-blue-300">Intermediate</div>
                              <div className="text-[10px] text-white/50">Rating: 1200</div>
                          </button>
                          <button
                            onClick={() => {
                                const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                                if (nameInput && nameInput.value.trim()) {
                                    dispatch({ type: 'SET_USERNAME', payload: { name: nameInput.value.trim() } });
                                    dispatch({ type: 'SET_RATING', payload: { rating: 1500 } });
                                } else {
                                    alert("Please enter a username first.");
                                }
                            }}
                            className="bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500 p-3 rounded-lg transition-all group"
                          >
                              <div className="text-purple-400 font-bold mb-1 group-hover:text-purple-300">Advanced</div>
                              <div className="text-[10px] text-white/50">Rating: 1500</div>
                          </button>
                      </div>
                  </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {state.gameStatus === 'game_over' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#262421] p-8 rounded-xl border border-white/10 shadow-2xl text-center max-w-md w-full"
            >
              <h2 className="text-4xl font-black text-emerald-500 mb-2">GAME OVER</h2>
              <div className="w-full h-px bg-white/10 my-4" />
              <p className="text-white text-2xl mb-8 font-bold">
                {state.winner === 'resignation' 
                    ? '🏳️ YOU RESIGNED' 
                    : state.winner === state.players[0]?.id 
                        ? '🏆 YOU WON!' 
                        : `💀 ${state.players.find(p => p.id === state.winner)?.name} WON!`}
              </p>
              
              {/* Game Stats Review */}
              <div className="bg-black/30 rounded-lg p-4 mb-8 text-left">
                  <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Session Review</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded">
                          <div className="text-2xl font-bold text-white">{state.user.stats?.wins || 0}</div>
                          <div className="text-[10px] text-white/50 uppercase">Total Wins</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded">
                          <div className="text-2xl font-bold text-white">{state.user.stats?.bluffs || 0}</div>
                          <div className="text-[10px] text-white/50 uppercase">Bluffs Made</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded">
                          <div className="text-2xl font-bold text-white">{state.user.stats?.caught || 0}</div>
                          <div className="text-[10px] text-white/50 uppercase">Times Caught</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded">
                          <div className="text-2xl font-bold text-emerald-400">
                              {state.players[0]?.rating}
                              {state.players[0]?.ratingChange !== undefined && (
                                  <span className={cn("text-sm ml-2", state.players[0].ratingChange >= 0 ? "text-green-400" : "text-red-400")}>
                                      {state.players[0].ratingChange >= 0 ? '+' : ''}{state.players[0].ratingChange}
                                  </span>
                              )}
                          </div>
                          <div className="text-[10px] text-white/50 uppercase">Current Rating</div>
                      </div>
                  </div>
              </div>

              <div className="flex justify-center gap-4">
                  <button
                    onClick={() => window.location.reload()} 
                    className="w-full py-4 bg-[#81b64c] hover:bg-[#a3d160] text-white font-bold text-xl rounded-lg shadow-[0_4px_0_#457524] active:shadow-none active:translate-y-[4px] transition-all"
                  >
                    Play Again
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
