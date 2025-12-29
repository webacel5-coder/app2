
import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Capturar o evento de instalação (Chrome/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar após 3 segundos para não ser agressivo demais no primeiro segundo
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Para iOS, mostramos de qualquer forma se não for standalone
    if (ios && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 4000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const dismiss = () => {
    setShowPrompt(false);
    // Poderia salvar no localStorage para não mostrar novamente por X dias
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[200] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-slate-800 border-2 border-purple-500 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Efeito de brilho retro */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50" />
        
        <button 
          onClick={dismiss}
          className="absolute top-3 right-3 text-slate-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4 items-start">
          <div className="bg-purple-600 p-3 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.4)] shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-retro text-[10px] text-purple-400 mb-2 tracking-tighter uppercase">Novo Módulo Disponível</h4>
            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              {isIOS 
                ? "Instale o app: Toque em 'Compartilhar' e depois em 'Adicionar à Tela de Início'." 
                : "Instale o Retro Codex para acesso offline e tela cheia (como um app nativo)."}
            </p>
            
            {!isIOS ? (
              <button 
                onClick={handleInstall}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-retro text-[8px] rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Download className="w-3 h-3" />
                Instalar Agora
              </button>
            ) : (
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold italic">
                <Share className="w-4 h-4 text-purple-500" />
                <span>Menu de Opções</span>
                <PlusSquare className="w-4 h-4 text-purple-500" />
                <span>Adicionar</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
