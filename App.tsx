
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { 
  Search, Loader2, Heart, Trash2, ChevronLeft, 
  Gamepad, History, ArrowRight, Sparkles, XCircle,
  Key
} from 'lucide-react';
import { searchGamesWithGemini, fetchGameFullData } from './services/geminiService';
import { GameInfo, GameSearchResult } from './types';

type Language = 'pt-BR' | 'en-US';
type Tab = 'games' | 'favs';

const translations = {
  'pt-BR': {
    placeholder: "Ex: Sonic Mega Drive, Mario NES...",
    loading: "SINTONIZANDO FREQUÊNCIA...",
    loadingDetails: "LENDO MEMÓRIA ROM...",
    error: "Erro na conexão com o mainframe retro.",
    noResults: "Jogo não catalogado. Tente o nome exato.",
    modernErrorTitle: "Erro de Época",
    modernErrorMessage: "Este dispositivo só aceita jogos clássicos (pré-2002).",
    welcomeHeader: "RETRO CODEX",
    welcomeText: "A maior enciclopédia de trapaças e segredos clássicos.",
    cheatsHeader: "CÓDIGOS DE TRAPAÇA",
    tipsHeader: "DICAS TÉCNICAS",
    backToResults: "VOLTAR",
    favsEmpty: "Nenhum cartucho favorito guardado.",
    favsTitle: "MEUS CARTUCHOS",
    quickSearch: "Populares:"
  },
  'en-US': {
    placeholder: "Ex: Sonic Genesis, Mario NES...",
    loading: "TUNING FREQUENCY...",
    loadingDetails: "READING ROM MEMORY...",
    error: "Retro mainframe connection error.",
    noResults: "Game not cataloged. Try exact name.",
    modernErrorTitle: "Epoch Error",
    modernErrorMessage: "This device only accepts classic games (pre-2002).",
    welcomeHeader: "RETRO CODEX",
    welcomeText: "The largest encyclopedia of classic cheats and secrets.",
    cheatsHeader: "CHEAT CODES",
    tipsHeader: "TECHNICAL TIPS",
    backToResults: "BACK",
    favsEmpty: "No favorite cartridges saved.",
    favsTitle: "MY CARTRIDGES",
    quickSearch: "Trending:"
  }
};

const RETRO_GAME_POOL = ["Super Mario World", "Sonic 2", "Zelda Ocarina", "Doom", "Crash Bandicoot"];

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchResults, setSearchResults] = useState<GameSearchResult[] | null>(null);
  const [gameData, setGameData] = useState<GameInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('pt-BR');
  const [activeTab, setActiveTab] = useState<Tab>('games');
  const [favorites, setFavorites] = useState<GameInfo[]>([]);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const t = translations[lang];

  useEffect(() => {
    setQuickTags(RETRO_GAME_POOL);
    const saved = localStorage.getItem('retro-codex-favs-v3');
    if (saved) try { setFavorites(JSON.parse(saved)); } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('retro-codex-favs-v3', JSON.stringify(favorites));
  }, [favorites]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearchResults(null);
    setGameData(null);
    setImageErrors({});
    
    try {
      const response = await searchGamesWithGemini(query, lang);
      if (response.isModernRequest) {
        setError(t.modernErrorMessage);
      } else if (!response.games || response.games.length === 0) {
        setError(t.noResults);
      } else {
        setSearchResults(response.games);
      }
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [lang, t]);

  const fetchDetails = async (game: GameSearchResult) => {
    setLoadingDetails(true);
    setError(null);
    try {
      const details = await fetchGameFullData(game.name, game.platform, lang);
      if (details) {
        setGameData({ ...game, ...details });
      } else {
        setError("Erro ao ler dados do jogo.");
      }
    } catch (e) {
      setError(t.error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleImageError = (id: string | number) => {
    setImageErrors(prev => ({ ...prev, [id.toString()]: true }));
  };

  const isFavorite = (g: any) => favorites.some(f => f.name === g.name && f.platform === g.platform);

  // Componente de Cartucho para quando a imagem falha
  const CartridgePlaceholder = ({ name, platform }: { name: string, platform: string }) => (
    <div className="w-full h-full bg-slate-700 flex flex-col items-center justify-between p-2 relative overflow-hidden border-b-4 border-slate-900">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
      <div className="w-full h-1/2 bg-slate-800 rounded flex items-center justify-center p-1">
        <span className="text-[6px] font-retro text-slate-500 text-center leading-tight uppercase">{name}</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Gamepad className="w-4 h-4 text-slate-500" />
        <span className="text-[5px] font-retro text-purple-400 uppercase">{platform}</span>
      </div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'games' ? (
        <div className="space-y-6">
          {!gameData && !loadingDetails && (
            <div className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); performSearch(searchQuery); }} className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 px-12 text-white focus:border-purple-500 outline-none transition-all placeholder:text-slate-600"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 rounded-xl text-white">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {!searchResults && !loading && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickTags.map(tag => (
                    <button key={tag} onClick={() => { setSearchQuery(tag); performSearch(tag); }} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-[9px] font-retro text-slate-500 hover:text-purple-400 hover:border-purple-500 transition-all">
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(loading || loadingDetails) && (
            <div className="py-24 flex flex-col items-center gap-6 animate-pulse">
               <div className="w-24 h-24 bg-purple-900/20 rounded-full border-4 border-purple-600 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
               </div>
               <p className="font-retro text-[8px] text-purple-400 tracking-widest">{loading ? t.loading : t.loadingDetails}</p>
            </div>
          )}

          {error && !loading && !loadingDetails && (
            <div className="p-6 bg-red-950/30 border-2 border-red-500/20 rounded-3xl text-center space-y-4">
              <XCircle className="w-10 h-10 text-red-500 mx-auto" />
              <p className="text-red-400 font-bold text-xs">{error}</p>
              <button onClick={() => setError(null)} className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-retro uppercase">RESET</button>
            </div>
          )}

          {searchResults && !gameData && !loading && (
            <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4">
              {searchResults.map((game, i) => {
                const hasImageError = imageErrors[game.id.toString()] || !game.coverUrl;
                return (
                  <button key={i} onClick={() => fetchDetails(game)} className="flex gap-4 p-3 bg-slate-800 border-2 border-slate-700 rounded-2xl text-left hover:border-purple-500 transition-all group overflow-hidden">
                    <div className="w-20 h-24 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-700 relative">
                      {!hasImageError ? (
                        <img 
                          src={game.coverUrl} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={() => handleImageError(game.id)}
                        />
                      ) : (
                        <CartridgePlaceholder name={game.name} platform={game.platform} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h3 className="text-white font-bold text-base truncate group-hover:text-purple-400">{game.name}</h3>
                      <p className="text-purple-500 text-[8px] font-retro uppercase mb-2">{game.platform} • {game.year}</p>
                      <p className="text-slate-500 text-xs line-clamp-2 italic">"{game.briefDescription}"</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {gameData && !loadingDetails && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <button onClick={() => setGameData(null)} className="flex items-center gap-2 text-slate-500 font-retro text-[8px] hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t.backToResults}
              </button>
              
              <div className="bg-slate-800 rounded-[2rem] border-2 border-slate-700 overflow-hidden shadow-2xl">
                <div className="h-40 relative bg-slate-950 flex items-center justify-center">
                   {gameData.coverUrl && !imageErrors[`full-${gameData.id}`] ? (
                     <img 
                        src={gameData.coverUrl} 
                        className="w-full h-full object-cover opacity-20 blur-md scale-125" 
                        referrerPolicy="no-referrer"
                     />
                   ) : <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800" />}
                   
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-transparent to-transparent" />
                   
                   <div className="absolute -bottom-6 left-8 flex items-end gap-6">
                      <div className="w-24 h-32 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-600 shadow-2xl flex items-center justify-center">
                        {gameData.coverUrl && !imageErrors[`thumb-${gameData.id}`] ? (
                          <img 
                            src={gameData.coverUrl} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={() => setImageErrors(prev => ({...prev, [`thumb-${gameData.id}`]: true}))}
                          />
                        ) : (
                          <CartridgePlaceholder name={gameData.name} platform={gameData.platform} />
                        )}
                      </div>
                      <div className="pb-8">
                        <h2 className="text-xl font-black text-white leading-tight mb-1">{gameData.name}</h2>
                        <span className="text-purple-400 font-retro text-[8px] uppercase">{gameData.platform}</span>
                      </div>
                   </div>

                   <button onClick={() => {
                     if (isFavorite(gameData)) {
                       setFavorites(favorites.filter(f => f.name !== gameData.name));
                     } else {
                       setFavorites([...favorites, gameData]);
                     }
                   }} className={`absolute top-6 right-6 p-4 rounded-2xl border-2 transition-all ${isFavorite(gameData) ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-800/50 border-slate-600 text-slate-500'}`}>
                      <Heart className={`w-5 h-5 ${isFavorite(gameData) ? 'fill-current' : ''}`} />
                   </button>
                </div>

                <div className="px-8 pt-16 pb-8 space-y-8">
                  <p className="text-slate-400 italic text-sm text-center leading-relaxed">"{gameData.summary}"</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><Key className="w-4 h-4" /></div>
                      <h3 className="font-retro text-[9px] text-yellow-500 tracking-wider uppercase">{t.cheatsHeader}</h3>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 text-yellow-200 font-mono text-sm leading-relaxed max-h-60 overflow-y-auto retro-scroll">
                      {gameData.cheats}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Sparkles className="w-4 h-4" /></div>
                      <h3 className="font-retro text-[9px] text-green-500 tracking-wider uppercase">{t.tipsHeader}</h3>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 text-slate-300 text-sm italic leading-relaxed max-h-60 overflow-y-auto retro-scroll">
                      {gameData.tips}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !searchResults && !gameData && !error && (
            <div className="text-center py-20 space-y-4 opacity-40">
               <History className="w-16 h-16 text-slate-700 mx-auto" />
               <div className="space-y-1">
                  <h2 className="font-retro text-[10px] text-purple-600 uppercase tracking-widest">{t.welcomeHeader}</h2>
                  <p className="text-slate-500 text-[10px] italic">{t.welcomeText}</p>
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          <h2 className="font-retro text-[10px] text-white flex items-center gap-3 uppercase tracking-widest">
             <Heart className="w-4 h-4 text-pink-500 fill-current" /> {t.favsTitle}
          </h2>
          {favorites.length === 0 ? (
            <div className="py-32 text-center opacity-30 italic text-slate-500 text-sm">{t.favsEmpty}</div>
          ) : (
            <div className="grid gap-3">
              {favorites.map((fav, i) => (
                <div key={i} className="flex gap-4 p-3 bg-slate-800 border-2 border-slate-700 rounded-2xl items-center group">
                   <div onClick={() => { setActiveTab('games'); setGameData(fav); }} className="w-14 h-18 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-700 cursor-pointer flex items-center justify-center relative">
                      {fav.coverUrl && !imageErrors[`fav-${i}`] ? (
                        <img 
                          src={fav.coverUrl} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={() => handleImageError(`fav-${i}`)}
                        />
                      ) : (
                        <CartridgePlaceholder name={fav.name} platform={fav.platform} />
                      )}
                   </div>
                   <div onClick={() => { setActiveTab('games'); setGameData(fav); }} className="flex-1 min-w-0 cursor-pointer py-1">
                      <h3 className="text-white font-bold truncate group-hover:text-purple-400 text-sm">{fav.name}</h3>
                      <p className="text-slate-500 text-[7px] font-retro uppercase">{fav.platform}</p>
                   </div>
                   <button onClick={() => setFavorites(favorites.filter(f => f.name !== fav.name))} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
