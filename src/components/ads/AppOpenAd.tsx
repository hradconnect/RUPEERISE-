import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Crown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppOpenAdProps {
  onClose: () => void;
  autoCloseSeconds?: number;
}

const AppOpenAd: React.FC<AppOpenAdProps> = ({ onClose, autoCloseSeconds = 5 }) => {
  const [timeLeft, setTimeLeft] = useState(autoCloseSeconds);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSkip(true);
    }
  }, [timeLeft]);

  // Load GPT or AdMob script here if available
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script if necessary
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="absolute top-8 right-8 flex items-center gap-4">
        {!canSkip && (
          <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
            Transmission ends in {timeLeft}s
          </div>
        )}
        {canSkip && (
          <motion.button 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={onClose}
            className="flex items-center gap-3 px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-all border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95"
          >
            Enter Workspace <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      <div className="w-full max-w-[340px] aspect-[9/18] bg-[#050505] rounded-[3rem] border border-white/10 overflow-hidden relative shadow-2xl flex flex-col ring-1 ring-white/5">
        {/* App Open Mock Ad Content */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center relative">
          <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center mb-4 gold-glow relative group">
              <Crown className="w-8 h-8 text-primary relative z-10" />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <h1 className="text-lg font-black text-white italic tracking-widest">RUPEERISE</h1>
          </div>

          <div className="mt-12 w-full aspect-square bg-gradient-to-br from-zinc-900 to-black rounded-3xl border border-white/5 flex flex-col items-center justify-center p-6 shadow-inner relative group overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/tech/800/800')] opacity-20 bg-cover bg-center grayscale" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
             
             <div className="relative z-10 space-y-4">
                <div className="p-3 bg-emerald/10 rounded-xl border border-emerald/20 inline-block">
                   <Zap className="w-6 h-6 text-emerald fill-emerald" />
                </div>
                <h3 className="text-xl font-black text-white italic leading-tight">MAXIMIZE YOUR<br/>RESIDUE YIELD</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Upgrade to Elite Status v.2</p>
             </div>
          </div>

          <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="w-full h-14 mt-8 bg-primary text-primary-foreground font-black rounded-2xl text-base shadow-[0_10px_30px_rgba(212,175,55,0.2)]"
          >
            CLAIM MULTIPLIER
          </motion.button>
        </div>

        <div className="h-24 bg-white/5 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-zinc-500" />
             </div>
             <div className="text-left">
                <p className="text-[9px] text-white font-black uppercase tracking-[0.2em] italic">Open Ad Slot</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-1 h-1 rounded-full bg-emerald" />
                   <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Verified by AdMob</p>
                </div>
             </div>
          </div>
          <div className="flex gap-1.5">
             {[1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-800" />)}
             <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-2">
         <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.5em]">Network Protocol Encrypted</p>
         <div className="flex gap-1">
            {[1,2,3,4,5].map(i => <div key={i} className="w-3 h-[1px] bg-zinc-900" />)}
         </div>
      </div>
    </motion.div>
  );
};

export default AppOpenAd;
