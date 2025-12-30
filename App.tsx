
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { 
  Search, Loader2, Heart, Trash2, ChevronLeft, 
  Gamepad, History, ArrowRight, Coffee, 
  AlertTriangle, MonitorSmartphone, Sparkles, XCircle,
  Key
} from 'lucide-react';
import { searchGamesWithGemini, fetchGameFullData } from './services/geminiService';
import { getCoverByGameName } from './services/igdbService';
import { GameInfo, GameSearchResult } from './types';

type Language = 'pt-BR' | 'en-US';
type Tab = 'games' | 'favs';

const translations = {
  'pt-BR': {
    placeholder: "Ex: Sonic Mega Drive, Mario NES...",
    loading: "ACESSANDO BANCO DE DADOS...",
    loadingDetails: "CARREGANDO TRUQUES...",
    error: "Ocorreu um erro na busca. Verifique sua conexão.",
    noResults: "Nenhum jogo encontrado. Tente um nome mais simples como 'Sonic' ou 'Mario'.",
    modernErrorTitle: "Filtro Retro Ativo",
    modernErrorMessage: "Este app é focado em jogos clássicos até o ano 2002.",
    welcomeHeader: "RETRO CODEX",
    welcomeText: "Encontre dicas e cheats para os consoles que marcaram sua infância.",
    cheatsHeader: "CÓDIGOS E TRAPAÇAS",
    tipsHeader: "DICAS DE MESTRE",
    backToResults: "VOLTAR",
    favsEmpty: "Sua lista de favoritos está vazia.",
    favsTitle: "MEUS FAVORITOS",
    quickSearch: "Dicas:"
  },
  'en-US': {
    placeholder: "Ex: Sonic Genesis, Mario NES...",
    loading: "ACCESSING DATABASE...",
    loadingDetails: "LOADING TRICKS...",
    error: "Search error. Check your connection.",
    noResults: "No games found. Try a simpler name like 'Sonic' or 'Mario'.",
    modernErrorTitle: "Retro Filter Active",
    modernErrorMessage: "This app focuses on classic games up to 2002.",
    welcomeHeader: "RETRO CODEX",
    welcomeText: "Find tips and cheats for the consoles of your childhood.",
    cheatsHeader: "CHEATS & CODES",
    tipsHeader: "MASTER TIPS",
    backToResults: "BACK",
    favsEmpty: "Your favorites list is empty.",
    favsTitle: "MY FAVORITES",
    quickSearch: "Quick Tags:"
  }
};

const RETRO_GAME_POOL = [
  "Sonic", "Super Mario", "Alex Kidd", "Zelda", "Street Fighter", "Mortal Kombat",
  "Donkey Kong", "Mega Man", "Castlevania", "Metroid", "Pokemon", "Crash Bandicoot"
];

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchResults, setSearchResults] = useState<GameSearchResult[] | null>(null);
  const [gameData, setGameData] = useState<GameInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modernError, setModernError] = useState(false);
  const [lang, setLang] = useState<Language>('pt-BR');
  const [activeTab, setActiveTab] = useState<Tab>('games');
  const [favorites, setFavorites] = useState<GameInfo[]>([]);
  const [quickTags, setQuickTags] = useState<string[]>([]);

  const t = translations[lang];

  useEffect(() => {
    setQuickTags([...RETRO_GAME_POOL].sort(() => 0.5 - Math.random()).slice(0, 5));
    const saved = localStorage.getItem('retro-codex-favs-v2');
    if (saved) try { setFavorites(JSON.parse(saved)); } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('retro-codex-favs-v2', JSON.stringify(favorites));
  }, [favorites]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setModernError(false);
    setSearchResults(null);
    setGameData(null);
    
    try {
      const response = await searchGamesWithGemini(query, lang);
      
      if (response.isModernRequest) {
        setModernError(true);
      } else if (!response.games || response.games.length === 0) {
        setError(t.noResults);
      } else {
        setSearchResults(response.games);
        // Busca capas em background
        response.games.forEach(async (game, i) => {
          const cover = await getCoverByGameName(game.name);
          if (cover) {
            setSearchResults(prev => {
              if (!prev) return null;
              const next = [...prev];
              next[i] = { ...next[i], coverUrl: cover };
              return next;
            });
          }
        });
      }
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [lang, t]);

  const fetchDetails = async (game: GameSearchResult) => {
    setLoadingDetails(true);
    try {
      const details = await fetchGameFullData(game.name, game.platform, lang);
      if (details) setGameData({ ...game, ...details });
      else setError("Não foi possível carregar os detalhes.");
    } catch (e) {
      setError(t.error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const isFavorite = (g: any) => favorites.some(f => f.name === g.name && f.platform === g.platform);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'games' ? (
        <div className="space-y-6">
          {!gameData && (
            <>
              <form onSubmit={(e) => { e.preventDefault(); performSearch(searchQuery); }} className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 px-12 text-white focus:border-purple-500 outline-none transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 rounded-xl text-white">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {!searchResults && !loading && (
                <div className="flex flex-wrap gap-2 justify-center opacity-70">
                  <span className="text-[9px] font-retro text-slate-500 self-center">{t.quickSearch}</span>
                  {quickTags.map(tag => (
                    <button key={tag} onClick={() => { setSearchQuery(tag); performSearch(tag); }} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-[10px] text-slate-400">
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {loading && (
            <div className="py-20 flex flex-col items-center gap-4 text-purple-500">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-retro text-[10px] uppercase animate-pulse">{t.loading}</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-8 bg-red-500/10 border-2 border-red-500/20 rounded-3xl text-center space-y-4">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-400 font-bold text-sm">{error}</p>
              <button onClick={() => setError(null)} className="px-6 py-2 bg-red-500 text-white rounded-xl text-xs font-bold uppercase">OK</button>
            </div>
          )}

          {searchResults && !gameData && !loading && (
            <div className="grid gap-4">
              {searchResults.map((game, i) => (
                <button key={i} onClick={() => fetchDetails(game)} className="flex gap-4 p-4 bg-slate-800 border border-slate-700 rounded-2xl text-left hover:border-purple-500 transition-all active:scale-95 group">
                  <div className="w-20 h-24 bg-slate-900 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-700">
                    {game.coverUrl ? <img src={game.coverUrl} className="w-full h-full object-cover" /> : <Gamepad className="w-8 h-8 text-slate-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate group-hover:text-purple-400">{game.name}</h3>
                    <p className="text-purple-400 text-[10px] font-retro uppercase mb-2">{game.platform} • {game.year}</p>
                    <p className="text-slate-400 text-xs line-clamp-2 italic">"{game.briefDescription}"</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {gameData && !loadingDetails && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setGameData(null)} className="flex items-center gap-2 text-slate-400 font-retro text-[10px] mb-4">
                <ChevronLeft className="w-4 h-4" /> {t.backToResults}
              </button>
              
              <div className="bg-slate-800 rounded-[2.5rem] border-2 border-slate-700 overflow-hidden shadow-2xl relative">
                <div className="h-48 relative overflow-hidden bg-slate-900">
                   {gameData.coverUrl && <img src={gameData.coverUrl} className="w-full h-full object-cover opacity-30 blur-sm scale-110" />}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent" />
                   <div className="absolute bottom-6 left-6 right-6 flex items-end gap-6">
                      <div className="w-24 h-32 bg-slate-900 rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl shrink-0">
                        {gameData.coverUrl ? <img src={gameData.coverUrl} className="w-full h-full object-cover" /> : <Gamepad className="m-auto w-10 h-10 text-slate-700" />}
                      </div>
                      <div className="pb-2">
                        <h2 className="text-2xl font-black text-white leading-tight mb-2">{gameData.name}</h2>
                        <span className="px-3 py-1 bg-purple-600 rounded-lg text-[9px] font-retro text-white">{gameData.platform}</span>
                      </div>
                   </div>
                   <button onClick={() => {
                     if (isFavorite(gameData)) {
                       setFavorites(favorites.filter(f => f.name !== gameData.name));
                     } else {
                       setFavorites([...favorites, gameData]);
                     }
                   }} className={`absolute top-6 right-6 p-4 rounded-2xl border-2 transition-all ${isFavorite(gameData) ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-800/50 border-slate-600 text-slate-400'}`}>
                      <Heart className={`w-6 h-6 ${isFavorite(gameData) ? 'fill-current' : ''}`} />
                   </button>
                </div>

                <div className="p-8 space-y-8">
                  <p className="text-slate-300 italic text-center leading-relaxed">"{gameData.summary}"</p>
                  
                  <div className="space-y-4">
                    {/* Key component is imported above from lucide-react */}
                    <h3 className="font-retro text-[10px] text-yellow-500 flex items-center gap-2">
                      <Key className="w-4 h-4" /> {t.cheatsHeader}
                    </h3>
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 text-yellow-400 font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                      {gameData.cheats}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-retro text-[10px] text-green-500 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> {t.tipsHeader}
                    </h3>
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 text-slate-300 text-sm leading-relaxed italic">
                      {gameData.tips}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loadingDetails && (
            <div className="py-20 flex flex-col items-center gap-4 text-purple-500">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-retro text-[10px] uppercase animate-pulse">{t.loadingDetails}</p>
            </div>
          )}

          {!loading && !searchResults && !gameData && !error && (
            <div className="text-center py-20 space-y-6 opacity-50">
              <div className="w-24 h-24 bg-slate-800 border-2 border-slate-700 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                <History className="w-12 h-12 text-slate-600" />
              </div>
              <div className="space-y-2">
                <h2 className="font-retro text-[10px] text-purple-400 uppercase tracking-widest">{t.welcomeHeader}</h2>
                <p className="text-slate-500 text-xs italic max-w-[200px] mx-auto">{t.welcomeText}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="font-retro text-[12px] text-white flex items-center gap-3">
             <Heart className="w-6 h-6 text-pink-500 fill-current" /> {t.favsTitle}
          </h2>
          {favorites.length === 0 ? (
            <div className="py-32 text-center opacity-30 italic text-slate-500">{t.favsEmpty}</div>
          ) : (
            <div className="grid gap-4">
              {favorites.map((fav, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-800 border border-slate-700 rounded-2xl items-center group">
                   <div onClick={() => { setActiveTab('games'); setGameData(fav); }} className="w-16 h-20 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-700 cursor-pointer">
                      {fav.coverUrl ? <img src={fav.coverUrl} className="w-full h-full object-cover" /> : <Gamepad className="m-auto w-6 h-6 text-slate-700" />}
                   </div>
                   <div onClick={() => { setActiveTab('games'); setGameData(fav); }} className="flex-1 min-w-0 cursor-pointer">
                      <h3 className="text-white font-bold truncate group-hover:text-purple-400">{fav.name}</h3>
                      <p className="text-slate-500 text-[9px] font-retro uppercase">{fav.platform}</p>
                   </div>
                   <button onClick={() => setFavorites(favorites.filter(f => f.name !== fav.name))} className="p-3 text-slate-600 hover:text-red-500">
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
