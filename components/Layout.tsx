
import React from 'react';
import { Gamepad2, Info, Heart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onInfoClick?: () => void;
  activeTab: 'games' | 'favs';
  onTabChange: (tab: 'games' | 'favs') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onInfoClick, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-slate-900 shadow-2xl relative overflow-hidden">
      <header className="p-6 bg-slate-800 border-b-4 border-purple-600 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.5)]">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-retro text-xs leading-tight tracking-widest text-purple-400">
            RETRO<br/>CODEX
          </h1>
        </div>
        <button 
          onClick={onInfoClick}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Informações"
        >
          <Info className="w-6 h-6" />
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-24 p-4">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-800 border-t-4 border-purple-600 flex justify-around p-3 z-40">
        <button 
          onClick={() => onTabChange('games')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'games' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] font-retro">GAMES</span>
        </button>
        <button 
          onClick={() => onTabChange('favs')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'favs' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Heart className={`w-5 h-5 ${activeTab === 'favs' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-retro">FAVS</span>
        </button>
      </nav>
    </div>
  );
};
