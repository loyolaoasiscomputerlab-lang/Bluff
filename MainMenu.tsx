import React, { useState } from 'react';
import { useGame } from '../store/gameContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { Play, BookOpen, Settings, TrendingUp, Volume2, VolumeX, Mic, MicOff, Smartphone } from 'lucide-react';
import { setSoundVolume, setVoiceVolume, getSoundVolume, getVoiceVolume } from '../utils/audio';
import { CHARACTERS, CharacterProfile } from '../utils/characters';

type MenuTab = 'play' | 'learn' | 'growth' | 'settings';

export const MainMenu: React.FC = () => {
  const { state, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState<MenuTab>('play');
  const [difficulty, setDifficulty] = useState('medium');
  const [playerCount, setPlayerCount] = useState(4);
  const [selectedOpponents, setSelectedOpponents] = useState<CharacterProfile[]>([]);
  const [showCharSelect, setShowCharSelect] = useState(false);
  
  // Settings State
  const [soundVol, setSoundVol] = useState(getSoundVolume());
  const [voiceVol, setVoiceVol] = useState(getVoiceVolume());

  // Force Tutorial if not completed
  React.useEffect(() => {
      if (!state.user.hasCompletedTutorial) {
          // Auto-start tutorial
          dispatch({
              type: 'START_GAME',
              payload: { difficulty: 'easy', playerCount: 2, isTutorial: true },
          });
      }
  }, [state.user.hasCompletedTutorial, dispatch]);

  const handleStart = () => {
    dispatch({
      type: 'START_GAME',
      payload: { 
          difficulty, 
          playerCount,
          selectedCharacters: selectedOpponents.length > 0 ? selectedOpponents : undefined
      },
    });
  };

  const toggleOpponent = (char: CharacterProfile) => {
      if (selectedOpponents.find(c => c.id === char.id)) {
          setSelectedOpponents(prev => prev.filter(c => c.id !== char.id));
      } else {
          if (selectedOpponents.length < playerCount - 1) {
              setSelectedOpponents(prev => [...prev, char]);
          }
      }
  };

  const handleSoundChange = (val: number) => {
    setSoundVol(val);
    setSoundVolume(val);
  };

  const handleVoiceChange = (val: number) => {
    setVoiceVol(val);
    setVoiceVolume(val);
  };

  return (
    <div className="fixed inset-0 bg-[#312e2b] flex font-sans text-white z-50">
      {/* Sidebar (Chess.com style) - Optimized for Mobile Landscape */}
      <div className={cn(
          "bg-[#262421] flex flex-col border-r border-white/10 shrink-0 transition-all",
          state.user.settings?.mobileMode ? "w-16" : "w-20 md:w-64"
      )}>
        <div className={cn(
            "flex items-center gap-3 justify-center",
            state.user.settings?.mobileMode ? "p-2" : "p-4 md:p-6 md:justify-start"
        )}>
          <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center font-bold text-xl shrink-0">B</div>
          {!state.user.settings?.mobileMode && <span className="text-xl font-bold hidden md:block text-emerald-500">Bluff</span>}
        </div>
        
        <nav className="flex-1 px-2 space-y-1 mt-4">
          <NavItem 
            icon={<Play className="w-6 h-6" />} 
            label="Play" 
            active={activeTab === 'play'} 
            onClick={() => setActiveTab('play')} 
            compact={state.user.settings?.mobileMode}
          />
          <NavItem 
            icon={<BookOpen className="w-6 h-6" />} 
            label="Learn" 
            active={activeTab === 'learn'} 
            onClick={() => setActiveTab('learn')} 
            compact={state.user.settings?.mobileMode}
          />
          <NavItem 
            icon={<TrendingUp className="w-6 h-6" />} 
            label="Growth Rate" 
            active={activeTab === 'growth'} 
            onClick={() => setActiveTab('growth')} 
            compact={state.user.settings?.mobileMode}
          />
        </nav>

        <div className="p-2 md:p-4 border-t border-white/10">
          <NavItem 
            icon={<Settings className="w-6 h-6" />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            compact={state.user.settings?.mobileMode}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#302e2b]">
        <AnimatePresence mode="wait">
          
          {/* PLAY TAB */}
          {activeTab === 'play' && !showCharSelect && (
            <motion.div 
              key="play"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-4 md:p-8 overflow-y-auto flex items-center justify-center"
            >
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Graphic */}
                <div className="hidden md:flex flex-col items-center justify-center text-center space-y-6">
                   <motion.div 
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     className="relative w-64 h-64"
                   >
                     <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl" />
                     <img 
                       src="https://images.unsplash.com/photo-1605020420620-20c943cc4669?q=80&w=1000&auto=format&fit=crop" 
                       alt="Cards"
                       className="relative w-full h-full object-cover rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500"
                       referrerPolicy="no-referrer"
                     />
                   </motion.div>
                   <div>
                     <h1 className="text-4xl font-black mb-2">Play Bluff</h1>
                     <p className="text-white/60 text-lg">Challenge bots, master deception.</p>
                   </div>
                </div>

                {/* Right: Setup Panel */}
                <div className="bg-[#262421] rounded-xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-6 bg-[#211f1c] border-b border-white/5">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Play className="w-6 h-6 text-emerald-500 fill-current" />
                      New Game
                    </h2>
                  </div>

                  <div className="p-6 space-y-8 flex-1">
                    {/* Opponents */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Players</label>
                      <div className="flex bg-[#3a3732] rounded-lg p-1">
                        {[2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => {
                                setPlayerCount(n);
                                if (selectedOpponents.length > n - 1) {
                                    setSelectedOpponents(prev => prev.slice(0, n - 1));
                                }
                            }}
                            className={cn(
                              "flex-1 py-2 rounded-md text-sm font-bold transition-all",
                              playerCount === n
                                ? "bg-[#45423d] text-white shadow-sm"
                                : "text-white/40 hover:text-white/70"
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Character Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Opponents ({selectedOpponents.length}/{playerCount - 1})</label>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap gap-2">
                                {selectedOpponents.length === 0 && <span className="text-white/30 text-sm italic">Random opponents will be selected</span>}
                                {selectedOpponents.map(char => (
                                    <div key={char.id} className="bg-white/10 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                        <span>{char.name}</span>
                                        <button onClick={() => toggleOpponent(char)} className="hover:text-rose-500">×</button>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => setShowCharSelect(true)}
                                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-white/40 hover:bg-white/5 hover:text-white hover:border-white/40 transition-all font-bold text-sm"
                            >
                                + Select Specific Opponents
                            </button>
                        </div>
                    </div>
                  </div>

                  <div className="p-6 bg-[#211f1c] border-t border-white/5">
                    <button
                      onClick={handleStart}
                      className="w-full py-4 bg-[#81b64c] hover:bg-[#a3d160] text-white font-bold text-xl rounded-lg shadow-[0_4px_0_#457524] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-6 h-6 fill-current" />
                      Play Now
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Character Selection Overlay */}
          {showCharSelect && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-[#262421] z-20 p-6 flex flex-col"
              >
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Select Opponents ({selectedOpponents.length}/{playerCount - 1})</h2>
                      <button onClick={() => setShowCharSelect(false)} className="text-white/60 hover:text-white">Done</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/20">
                      {CHARACTERS.map(char => {
                          const isSelected = selectedOpponents.find(c => c.id === char.id);
                          const isFull = selectedOpponents.length >= playerCount - 1;
                          const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${char.name}&backgroundColor=e5e5e5`;
                          
                          return (
                              <button
                                key={char.id}
                                onClick={() => toggleOpponent(char)}
                                disabled={!isSelected && isFull}
                                className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center ${
                                    isSelected 
                                        ? 'bg-emerald-500/20 border-emerald-500' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                } ${!isSelected && isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                  <div className="flex items-center gap-3">
                                      <img src={avatarUrl} alt={char.name} className="w-10 h-10 rounded-full bg-slate-700" referrerPolicy="no-referrer" />
                                      <div>
                                          <div className="font-bold text-sm">{char.name}</div>
                                          <div className="text-xs text-white/50">{char.role} • IQ: {char.iq}</div>
                                      </div>
                                  </div>
                                  <div className="text-xs text-white/40 italic max-w-[150px] text-right truncate">
                                      {char.mood}
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </motion.div>
          )}

          {/* LEARN TAB */}
          {activeTab === 'learn' && (
            <motion.div 
              key="learn"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-8 overflow-y-auto"
            >
              <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-black text-white">How to Play Bluff</h1>
                
                <div className="space-y-6 text-white/80 text-lg leading-relaxed">
                  <section className="bg-[#262421] p-6 rounded-xl border border-white/10">
                    <h2 className="text-2xl font-bold text-emerald-400 mb-4">The Objective</h2>
                    <p>The goal is simple: <strong>Get rid of all your cards.</strong> The first player to empty their hand wins the game.</p>
                  </section>

                  <section className="bg-[#262421] p-6 rounded-xl border border-white/10">
                    <h2 className="text-2xl font-bold text-emerald-400 mb-4">Playing Cards</h2>
                    <p className="mb-4">Each round has a "Current Rank" (e.g., Kings, Aces, 7s). When it's your turn, you must play cards matching that rank.</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>You play cards <strong>face down</strong>.</li>
                      <li>You declare how many cards you are playing (e.g., "Two Kings").</li>
                      <li><strong>You can lie!</strong> You can play any cards you want, as long as you claim they match the rank.</li>
                    </ul>
                  </section>

                  <section className="bg-[#262421] p-6 rounded-xl border border-white/10">
                    <h2 className="text-2xl font-bold text-emerald-400 mb-4">Calling Bluff</h2>
                    <p className="mb-4">If you suspect an opponent is lying about the cards they played:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Press <strong>SPACE</strong> or click <strong>CALL BLUFF</strong>.</li>
                      <li>The played cards are revealed.</li>
                      <li><strong>If they lied:</strong> They pick up the entire pile.</li>
                      <li><strong>If they told the truth:</strong> YOU pick up the entire pile.</li>
                    </ul>
                    <p className="mt-4 text-yellow-400 font-bold">You can call bluff at any time before the next player moves!</p>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {/* GROWTH TAB */}
          {activeTab === 'growth' && (
            <motion.div 
              key="growth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-8 overflow-y-auto flex items-center justify-center"
            >
              <div className="text-center space-y-6">
                <TrendingUp className="w-24 h-24 text-emerald-500 mx-auto" />
                <h2 className="text-3xl font-bold">Your Growth Rate</h2>
                <p className="text-white/60 max-w-md mx-auto">
                  Track your bluffing efficiency and win rate over time. Play more games to generate data!
                </p>
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="bg-[#262421] p-6 rounded-xl border border-white/10">
                    <div className="text-4xl font-black text-white">0</div>
                    <div className="text-sm text-white/40 uppercase font-bold mt-2">Games Won</div>
                  </div>
                  <div className="bg-[#262421] p-6 rounded-xl border border-white/10">
                    <div className="text-4xl font-black text-emerald-400">0%</div>
                    <div className="text-sm text-white/40 uppercase font-bold mt-2">Bluff Success</div>
                  </div>
                  <div className="bg-[#262421] p-6 rounded-xl border border-white/10">
                    <div className="text-4xl font-black text-blue-400">Lvl 1</div>
                    <div className="text-sm text-white/40 uppercase font-bold mt-2">Current Rank</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-8 overflow-y-auto flex items-center justify-center"
            >
              <div className="max-w-md w-full bg-[#262421] p-8 rounded-xl border border-white/10 space-y-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Settings className="w-6 h-6 text-emerald-500" />
                  Settings
                </h2>

                <div className="space-y-6">
                  {/* Sound Volume */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold flex items-center gap-2">
                        {soundVol > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        Sound Effects
                      </label>
                      <span className="text-sm text-white/50">{Math.round(soundVol * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.1" 
                      value={soundVol}
                      onChange={(e) => handleSoundChange(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 h-2 bg-[#3a3732] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Voice Volume */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold flex items-center gap-2">
                        {voiceVol > 0 ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        NPC Voices
                      </label>
                      <span className="text-sm text-white/50">{Math.round(voiceVol * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.1" 
                      value={voiceVol}
                      onChange={(e) => handleVoiceChange(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 h-2 bg-[#3a3732] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Mobile Mode Toggle */}
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <label className="font-bold flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Mobile Landscape Mode
                      </label>
                      <button 
                        onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MODE' })}
                        className={cn(
                            "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                            state.user.settings?.mobileMode ? "bg-emerald-500" : "bg-white/10"
                        )}
                      >
                          <div className={cn(
                              "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                              state.user.settings?.mobileMode ? "translate-x-6" : "translate-x-0"
                          )} />
                      </button>
                    </div>
                    <p className="text-xs text-white/40">Optimizes layout for landscape play on smaller screens.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick, compact = false }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, compact?: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors justify-center",
      !compact && "md:justify-start",
      active ? "bg-[#3a3732] text-white" : "text-white/60 hover:bg-[#3a3732] hover:text-white"
    )}
    title={compact ? label : undefined}
  >
    {icon}
    {!compact && <span className="font-bold hidden md:block">{label}</span>}
  </button>
);
