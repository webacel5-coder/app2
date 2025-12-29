
import React from 'react';
import { 
  Gamepad2, Heart, ChevronRight, 
  Trophy, Smartphone, Download, CheckCircle2, Coffee, Sparkles
} from 'lucide-react';

export const LandingPage: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => {
  const DONATION_URL = "https://recargapay.com.br/pagar/ajrR8Wp";

  const handleDonate = () => {
    window.open(DONATION_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-purple-600 rounded-lg">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-retro text-[10px] tracking-widest text-purple-400 uppercase">Retro Codex</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLaunch}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-full font-retro text-[8px] transition-all active:scale-95 shadow-[0_0_15px_rgba(147,51,234,0.4)]"
            >
              LANÇAR APP
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-8">
            <CheckCircle2 className="w-3 h-3" />
            <span>PROJETO GRATUITO E SEM ANÚNCIOS</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
            Reviva seus <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse">Melhores Dias.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            O Retro Codex é um projeto comunitário para preservar a história dos games. IA avançada para encontrar segredos de clássicos até o ano 2000.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onLaunch}
              className="w-full sm:w-auto px-10 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] active:scale-95"
            >
              Abrir Gratuitamente
              <ChevronRight className="w-6 h-6" />
            </button>
            <button 
              onClick={handleDonate}
              className="w-full sm:w-auto px-8 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all border border-slate-700"
            >
              Apoiar o Projeto
              <Heart className="w-5 h-5 text-pink-500 fill-current" />
            </button>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section id="donate" className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-yellow-500/30 rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.1)]">
            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <h2 className="font-retro text-xs text-yellow-500 mb-4 tracking-widest uppercase">Mantenha o Codex Vivo</h2>
                <h3 className="text-4xl font-bold mb-6 italic">Por que apoiar?</h3>
                <p className="text-slate-300 leading-relaxed mb-8">
                  O Retro Codex é mantido por fãs, para fãs. Cada consulta à nossa Inteligência Artificial (Gemini Pro) tem um custo real de processamento. 
                  <br/><br/>
                  Nós não queremos colocar barreiras ou anúncios. Queremos que você jogue e se divirta! Se este app foi útil para você, <strong>considere uma doação de R$ 9,90 ou qualquer valor</strong> que caiba no seu bolso.
                  <br/><br/>
                  Sua ajuda garante que os servidores continuem ligados e o conhecimento continue livre para todos!
                </p>
              </div>
              
              <div className="w-full md:w-80 bg-slate-800/50 p-8 rounded-[2rem] border border-slate-700 text-center flex flex-col items-center">
                <div className="mb-6 p-4 bg-yellow-500/10 rounded-full">
                  <Coffee className="w-12 h-12 text-yellow-500" />
                </div>
                <p className="text-white font-bold text-lg mb-2">Pague um Café</p>
                <p className="text-slate-400 text-sm mb-8 italic">Contribuição Voluntária</p>
                <button 
                  onClick={handleDonate}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                >
                  Apoiar Agora
                  <Heart className="w-5 h-5 fill-current" />
                </button>
                <p className="mt-4 text-[10px] text-slate-500 font-retro uppercase leading-relaxed">
                  Seguro via RecargaPay
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-500 mb-4">© 2026 Retro Codex. Preservando memórias de pixel.</p>
          <div className="flex justify-center gap-6 mb-8 text-slate-600">
             <Trophy className="w-5 h-5" />
             <Gamepad2 className="w-5 h-5" />
             <Heart className="w-5 h-5" />
          </div>
          <p className="text-[10px] text-slate-700 font-retro uppercase tracking-[0.2em]">Open Knowledge for Everyone</p>
        </div>
      </footer>
    </div>
  );
};
