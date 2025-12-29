
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from './components/Layout';
import { 
  Search, Loader2, BookOpen, Key, Heart, Trash2, ChevronLeft, 
  Gamepad, History, ArrowRight, ShieldCheck, Coffee, 
  AlertTriangle, MonitorSmartphone, Sparkles
} from 'lucide-react';
import { searchGamesWithGemini, fetchGameFullData } from './services/geminiService';
import { getCoverByGameName } from './services/igdbService';
import { GameInfo, GameSearchResult } from './types';

type Language = 'pt-BR' | 'en-US';
type Tab = 'games' | 'favs';

const translations = {
  'pt-BR': {
    placeholder: "Ex: Sonic Mega Drive, Mario NES...",
    loading: "BUSCANDO NOS CARTUCHOS...",
    loadingImages: "SOPRANDO A FITA...",
    loadingDetails: "CARREGANDO SEGREDOS...",
    error: "Erro de conexão. Verifique sua internet.",
    errorKey: "API_KEY não configurada.",
    noResults: "Nenhum clássico encontrado. Tente nomes como 'Alex Kidd' ou 'Sonic 2'.",
    modernErrorTitle: "Módulo Retro Ativo",
    modernErrorMessage: "ESTE DISPOSITIVO ACESSA APENAS DADOS DE JOGOS LANÇADOS ATÉ O ANO 2002.",
    welcomeHeader: "BIBLIOTECA RETRO",
    welcomeText: "Busque códigos e dicas para Master System, Mega Drive, NES, SNES e mais.",
    cheatsHeader: "CÓDIGOS E TRAPAÇAS",
    tipsHeader: "DICAS DE MESTRE",
    newSearch: "NOVA BUSCA",
    backToResults: "VOLTAR",
    aboutTitle: "Sobre o Codex",
    aboutText: "O Retro Codex usa Inteligência Artificial para resgatar a memória dos games clássicos. Se o app te ajudou, considere apoiar!",
    aboutClose: "ENTENDI",
    favsEmpty: "Nenhum jogo favorito salvo.",
    favsTitle: "MEUS FAVORITOS",
    langLabel: "Idioma",
    supportText: "O app é gratuito. Me ajude a manter os servidores com um café!",
    errorDetails: "Não conseguimos decodificar os segredos deste título.",
    quickSearch: "Dicas Rápidas:"
  },
  'en-US': {
    placeholder: "Ex: Sonic Genesis, Mario NES...",
    loading: "SEARCHING CARTRIDGES...",
    loadingImages: "BLOWING THE TAPE...",
    loadingDetails: "DECRYPTING SECRETS...",
    error: "Connection error. Check your internet.",
    errorKey: "API Key missing.",
    noResults: "No classics found. Try names like 'Alex Kidd' or 'Sonic 2'.",
    modernErrorTitle: "Retro Module Active",
    modernErrorMessage: "THIS DEVICE ONLY ACCESSES GAMES RELEASED UP TO 2002.",
    welcomeHeader: "RETRO LIBRARY",
    welcomeText: "Search for Master System, Mega Drive, NES, SNES games and more.",
    cheatsHeader: "CHEATS & CODES",
    tipsHeader: "MASTER TIPS",
    newSearch: "NEW SEARCH",
    backToResults: "BACK",
    aboutTitle: "About Codex",
    aboutText: "Retro Codex uses AI to rescue the memory of classic games. If the app helped you, consider supporting!",
    aboutClose: "GOT IT",
    favsEmpty: "No favorite games saved.",
    favsTitle: "MY FAVORITES",
    langLabel: "Language",
    supportText: "The app is free. Help me keep the servers running with a coffee!",
    errorDetails: "We couldn't decrypt the secrets for this title.",
    quickSearch: "Quick Tags:"
  }
};

const RETRO_GAME_POOL = [
  "Sonic the Hedgehog", "Super Mario World", "Alex Kidd in Miracle World", 
  "The Legend of Zelda", "Phantasy Star IV", "Street Fighter II",
  "Donkey Kong Country", "Mega Man X", "Metroid Fusion", "Castlevania: SotN", 
  "Pac-Man", "Tetris", "Final Fantasy VI", "Chrono Trigger", "Kirby's Dream Land", 
  "Contra", "Metal Slug", "Golden Axe", "Streets of Rage 2", "Mortal Kombat II", 
  "Double Dragon", "Crash Bandicoot", "Spyro the Dragon", "Resident Evil 2", 
  "Silent Hill", "Final Fight", "Wonder Boy", "Top Gear", "International Superstar Soccer Deluxe",
  "Comix Zone", "Shinobi III", "Earthworm Jim", "Aladdin", "Lion King", "R-Type",
  "Pokemon Yellow", "Star Fox", "F-Zero", "EarthBound", "Banjo-Kazooie",
  "Gran Turismo", "Tekken 3", "Tony Hawk's Pro Skater", "Driver", "Doom",
  "Quake", "Duke Nukem 3D", "Metal Gear Solid", "PaRappa the Rapper", "GoldenEye 007"
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
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('games');
  const [favorites, setFavorites] = useState<GameInfo[]>([]);
  
  const [dynamicQuickTags, setDynamicQuickTags] = useState<string[]>([]);

  const t = translations[lang];

  useEffect(() => {
    const shuffleTags = () => {
      const shuffled = [...RETRO_GAME_POOL].sort(() => 0.5 - Math.random());
      setDynamicQuickTags(shuffled.slice(0, 6));
    };
    shuffleTags();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('retro-codex-favs-final');
    if (saved) {
      try { setFavorites(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('retro-codex-favs-final', JSON.stringify(favorites));
  }, [favorites]);

  const performSearch = useCallback(async (query: string, currentLang: Language) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setModernError(false);
    setSearchResults(null);
    setGameData(null);
    
    try {
      const response = await searchGamesWithGemini(query, currentLang);
      
      if (response.isModernRequest) {
        setModernError(true);
        setLoading(false);
        return;
      }

      if (!response.games || response.games.length === 0) {
        setError(t.noResults);
        setLoading(false);
        return;
      }

      setSearchResults(response.games);

      // Busca capas individualmente para não travar a lista
      response.games.forEach(async (res, idx) => {
        try {
          const cover = await getCoverByGameName(res.name);
          if (cover) {
            setSearchResults(prev => {
              if (!prev) return prev;
              const newResults = [...prev];
              newResults[idx] = { ...newResults[idx], coverUrl: cover };
              return newResults;
            });
          }
        } catch (e) { /* silent fail for covers */ }
      });
      
    } catch (err: any) {
      console.error("Critical Search Failure:", err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error, t.noResults]);

  const fetchDetails = useCallback(async (game: GameSearchResult, currentLang: Language) => {
    setLoadingDetails(true);
    setError(null);
    try {
      const aiData = await fetchGameFullData(game.name, game.platform, currentLang);
      if (aiData) {
        setGameData({
          ...game,
          summary: aiData.summary,
          releaseDate: aiData.releaseDate,
          cheats: aiData.cheats,
          tips: aiData.tips
        } as GameInfo);
      } else {
        setError(t.errorDetails);
      }
    } catch (err: any) {
      console.error("Details Fetch Error:", err);
      setError(t.error);
    } finally {
      setLoadingDetails(false);
    }
  }, [t.error, t.errorDetails]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, lang);
  };

  const toggleFavorite = (game: GameInfo) => {
    const isFav = favorites.some(f => f.name === game.name && f.platform === game.platform);
    if (isFav) {
      setFavorites(favorites.filter(f => !(f.name === game.name && f.platform === game.platform)));
    } else {
      setFavorites([...favorites, game]);
    }
  };

  const isFavorite = (game: GameInfo) => favorites.some(f => f.name === game.name && f.platform === game.platform);

  return (
    <Layout onInfoClick={() => setIsInfoOpen(true)} activeTab={activeTab} onTabChange={setActiveTab}>
      {isInfoOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsInfoOpen(false)} />
          <div className="bg-slate-800 border-4 border-purple-600 rounded-[2rem] p-8 relative z-10 max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <ShieldCheck className="w-12 h-12 text-green-500 mb-6 mx-auto" />
            <h3 className="font-retro text-[10px] text-purple-400 text-center mb-4 uppercase">{t.aboutTitle}</h3>
            <p className="text-slate-300 text-sm text-center leading-relaxed mb-8">{t.aboutText}</p>
            <button 
              onClick={() => window.open('https://recargapay.com.br/pagar/ajrR8Wp', '_blank')}
              className="w-full py-4 bg-yellow-500 text-slate-950 font-retro text-[9px] rounded-2xl mb-4 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
            >
              <Coffee className="w-5 h-5" />
              APOIAR O CODEX
            </button>
            <button onClick={() => setIsInfoOpen(false)} className="w-full py-4 bg-purple-600 text-white font-retro text-[10px] rounded-2xl active:scale-95 transition-transform uppercase">{t.aboutClose}</button>
          </div>
        </div>
      )}

      {activeTab === 'games' ? (
        <>
          {!gameData && (
            <section className="mb-8 space-y-6">
              <div className="flex justify-center gap-2 bg-slate-800/50 p-1.5 rounded-full border border-slate-700 w-fit mx-auto shadow-2xl">
                <button onClick={() => setLang('pt-BR')} className={`px-5 py-2 rounded-full font-retro text-[8px] transition-all ${lang === 'pt-BR' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>PT-BR</button>
                <button onClick={() => setLang('en-US')} className={`px-5 py-2 rounded-full font-retro text-[8px] transition-all ${lang === 'en-US' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>EN-US</button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative group max-w-lg mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-[2rem] py-5 pl-14 pr-6 text-white focus:border-purple-500 outline-none transition-all shadow-2xl placeholder:text-slate-600 text-lg"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500 w-6 h-6 transition-colors" />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-purple-600 rounded-full text-white active:scale-90 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {!searchResults && !loading && (
                <div className="flex flex-wrap justify-center gap-2 px-4 opacity-60">
                  <span className="text-[10px] font-retro text-slate-500 mr-2 self-center">{t.quickSearch}</span>
                  {dynamicQuickTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => { setSearchQuery(tag); performSearch(tag, lang); }}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-[10px] text-slate-400 hover:text-purple-400 hover:border-purple-500 transition-all active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {(loading || loadingDetails) && (
            <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-700">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-purple-600 blur-3xl opacity-20 animate-pulse rounded-full" />
                <Loader2 className="w-20 h-20 text-purple-600 animate-spin relative z-10" />
              </div>
              <p className="font-retro text-[10px] text-purple-400 tracking-[0.4em] uppercase text-center animate-pulse">{loading ? t.loading : t.loadingDetails}</p>
            </div>
          )}

          {error && !loading && !loadingDetails && (
            <div className="bg-red-500/10 border-2 border-red-500/30 p-8 rounded-[2.5rem] text-center space-y-4 mb-8 animate-in zoom-in duration-300">
              <AlertTriangle className="w-14 h-14 text-red-500 mx-auto" />
              <p className="text-red-400 font-bold text-sm uppercase tracking-wide">{error}</p>
              <button onClick={() => setError(null)} className="px-12 py-4 bg-red-600 text-white font-retro text-[9px] rounded-2xl active:scale-95 transition-all shadow-xl uppercase">OK</button>
            </div>
          )}

          {modernError && (
             <div className="bg-slate-800 border-2 border-purple-600 p-10 rounded-[3rem] text-center space-y-6 animate-in slide-in-from-top-4 duration-500 shadow-2xl">
                <MonitorSmartphone className="w-14 h-14 text-purple-600 mx-auto animate-bounce" />
                <h3 className="font-retro text-xs text-purple-400 uppercase leading-relaxed">{t.modernErrorTitle}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{t.modernErrorMessage}</p>
                <button onClick={() => setModernError(false)} className="px-10 py-5 bg-purple-600 text-white font-retro text-[10px] rounded-2xl active:scale-95 transition-all w-full shadow-2xl">VOLTAR</button>
             </div>
          )}

          {!loading && !searchResults && !gameData && !error && !modernError && (
            <div className="text-center py-20 space-y-8 animate-in fade-in duration-1000">
               <div className="relative w-32 h-32 mx-auto rotate-6 group">
                  <div className="absolute inset-0 bg-purple-600/20 blur-2xl group-hover:bg-purple-600/40 transition-all rounded-full" />
                  <div className="w-full h-full bg-slate-800 border-2 border-slate-700 rounded-[2.5rem] flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform shadow-2xl">
                    <History className="w-16 h-16 text-slate-600 group-hover:text-purple-600 transition-colors" />
                  </div>
               </div>
               <div className="space-y-4">
                 <h2 className="font-retro text-[12px] text-purple-400 uppercase tracking-[0.4em] leading-relaxed px-8">{t.welcomeHeader}</h2>
                 <p className="text-slate-500 text-md italic px-12 leading-relaxed max-w-sm mx-auto opacity-80">{t.welcomeText}</p>
               </div>
            </div>
          )}

          {searchResults && !gameData && !loading && !loadingDetails && (
            <div className="grid gap-6 pb-24">
              {searchResults.map((result, idx) => (
                <button 
                  key={idx}
                  onClick={() => fetchDetails(result, lang)}
                  className="w-full text-left bg-slate-800 border-2 border-slate-700/50 hover:border-purple-600 p-4 rounded-[2.5rem] transition-all group flex items-center gap-6 shadow-2xl active:scale-[0.97] animate-in fade-in slide-in-from-bottom-3 duration-300"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="w-24 h-28 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shrink-0 overflow-hidden border border-slate-700/50 group-hover:border-purple-600/50 transition-colors shadow-inner">
                    {result.coverUrl ? (
                      <img src={result.coverUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <Gamepad className="w-10 h-10 text-slate-700 group-hover:text-purple-900 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-black text-white text-xl truncate group-hover:text-purple-400 mb-2 leading-tight uppercase tracking-tight">{result.name}</h4>
                    <div className="flex items-center gap-3 mb-3">
                       <span className="bg-purple-900/40 text-purple-400 text-[8px] font-retro px-3 py-1.5 rounded-xl uppercase tracking-tighter border border-purple-500/20">
                          {result.platform}
                       </span>
                       <span className="text-slate-500 text-xs font-black italic">
                          {result.year}
                       </span>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed opacity-70 italic">"{result.briefDescription}"</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {gameData && !loadingDetails && (
            <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-600">
              <button onClick={() => setGameData(null)} className="flex items-center gap-3 bg-slate-800 border-2 border-slate-700 px-8 py-4 rounded-full text-slate-300 active:scale-95 transition-all hover:bg-slate-700 shadow-2xl group">
                <ChevronLeft className="w-6 h-6 text-purple-600 group-hover:-translate-x-1 transition-transform" />
                <span className="font-retro text-[10px] uppercase tracking-[0.3em]">{t.backToResults}</span>
              </button>

              <div className="bg-slate-800 rounded-[3rem] border-2 border-slate-700 overflow-hidden shadow-2xl relative">
                {gameData.coverUrl && (
                  <div className="relative h-72 overflow-hidden">
                    <img src={gameData.coverUrl} className="w-full h-full object-cover opacity-20 blur-xl scale-125" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-slate-800/20 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 flex items-end gap-8">
                      <img src={gameData.coverUrl} className="w-40 h-56 object-cover rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-4 border-white/5 shrink-0 transform -rotate-2" />
                      <div className="flex-1 pb-4">
                         <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-3 drop-shadow-2xl leading-none">{gameData.name}</h2>
                         <div className="flex flex-wrap gap-3">
                           <span className="bg-purple-600 text-white text-[10px] font-retro px-4 py-2 rounded-2xl uppercase shadow-xl">{gameData.platform}</span>
                           <span className="bg-slate-900/80 backdrop-blur-xl text-slate-300 font-black px-4 py-2 rounded-2xl border border-white/5">{gameData.year}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-10 pt-8">
                  <div className="flex justify-end absolute top-6 right-6 z-10">
                    <button 
                      onClick={() => toggleFavorite(gameData)} 
                      className={`p-6 rounded-[2rem] border-2 transition-all active:scale-90 shadow-2xl ${isFavorite(gameData) ? 'bg-pink-600 border-pink-400 text-white shadow-pink-600/40' : 'bg-slate-700/80 backdrop-blur-xl border-slate-600 text-slate-400 hover:text-white'}`}
                    >
                      <Heart className={`w-8 h-8 ${isFavorite(gameData) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="space-y-8">
                     <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-700/50 relative">
                        <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-purple-600 opacity-50" />
                        <p className="text-slate-200 text-lg leading-relaxed italic text-center font-medium">
                           "{gameData.summary}"
                        </p>
                     </div>

                     <div className="bg-yellow-500/10 border-2 border-yellow-500/30 p-6 rounded-[2.5rem] flex items-center gap-6 cursor-pointer hover:bg-yellow-500/20 transition-all group" onClick={() => window.open('https://recargapay.com.br/pagar/ajrR8Wp', '_blank')}>
                        <div className="bg-yellow-500 p-5 rounded-3xl shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all">
                           <Coffee className="w-8 h-8 text-slate-950" />
                        </div>
                        <div className="flex-1">
                           <p className="text-[11px] text-yellow-500 font-retro leading-tight uppercase tracking-widest mb-1">PROJETO COMUNITÁRIO</p>
                           <p className="text-slate-400 text-sm font-semibold">{t.supportText}</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 px-4">
                  <div className="w-3 h-10 bg-yellow-500 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)]" />
                  <h3 className="font-retro text-[11px] text-yellow-500 uppercase tracking-[0.4em]">{t.cheatsHeader}</h3>
                </div>
                <div className="bg-slate-950 border-4 border-slate-800 rounded-[3rem] p-10 text-yellow-400/90 text-md font-mono whitespace-pre-wrap max-h-[600px] overflow-y-auto retro-scroll shadow-inner leading-relaxed">
                  {gameData.cheats || "NENHUM CÓDIGO ENCONTRADO."}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 px-4">
                  <div className="w-3 h-10 bg-green-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
                  <h3 className="font-retro text-[11px] text-green-500 uppercase tracking-[0.4em]">{t.tipsHeader}</h3>
                </div>
                <div className="bg-slate-800 border-4 border-slate-700 rounded-[3rem] p-10 text-slate-200 text-md italic max-h-[600px] overflow-y-auto retro-scroll shadow-inner leading-relaxed font-medium">
                  {gameData.tips || "NENHUMA DICA ESTRATÉGICA."}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-600 pb-24">
          <div className="flex items-center justify-between px-4">
             <h2 className="font-retro text-[14px] text-white uppercase tracking-tighter flex items-center gap-6">
               <div className="p-4 bg-pink-600/20 rounded-[1.5rem] shadow-inner">
                  <Heart className="w-8 h-8 text-pink-500 fill-current animate-pulse"/>
               </div>
               {t.favsTitle}
             </h2>
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-48 opacity-20 flex flex-col items-center gap-8">
               <div className="p-12 border-4 border-dashed border-slate-700 rounded-[4rem]">
                  <History className="w-20 h-20 text-slate-600" />
               </div>
               <p className="font-retro text-[11px] uppercase tracking-[0.5em]">{t.favsEmpty}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {favorites.map((fav, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-800 border-2 border-slate-700 rounded-[2.5rem] p-5 flex items-center gap-6 cursor-pointer hover:border-purple-600/50 transition-all active:scale-[0.98] shadow-2xl group" 
                  onClick={() => setGameData(fav)}
                >
                  <div className="w-24 h-28 bg-slate-900 rounded-[1.5rem] overflow-hidden border border-slate-700 shadow-2xl shrink-0">
                    {fav.coverUrl && <img src={fav.coverUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white text-xl truncate mb-3 leading-tight group-hover:text-purple-400 transition-colors uppercase tracking-tight">{fav.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-700 text-slate-300 text-[10px] font-retro px-4 py-2 rounded-2xl uppercase tracking-tighter border border-slate-600 shadow-sm">
                         {fav.platform}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setFavorites(favorites.filter(f => !(f.name === fav.name && f.platform === fav.platform))); 
                    }} 
                    className="p-5 text-slate-600 hover:text-red-500 transition-all active:scale-90"
                  >
                    <Trash2 className="w-8 h-8"/>
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
