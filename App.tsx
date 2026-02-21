/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameProvider } from './store/GameProvider';
import { useGame } from './store/gameContext';
import { GameBoard } from './components/GameBoard';
import { Hand } from './components/Hand';
import { MainMenu } from './components/MainMenu';

const GameContainer = () => {
  const { state } = useGame();

  if (state.gameStatus === 'lobby') {
    return <MainMenu />;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden font-sans">
      <GameBoard />
      <Hand />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}
