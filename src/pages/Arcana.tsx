import React from 'react';
import { motion } from 'motion/react';
import { AlchemyElement } from '../types';
import { Sparkles, Zap, Shield, Eye, Globe, Thermometer, Contrast, Leaf, Hourglass } from 'lucide-react';
import { REALITY_LAYERS, HIDDEN_LAWS, calculateRank, INITIAL_ELEMENTS } from '../constants';
import { AnimatePresence } from 'motion/react';
import { X, Info } from 'lucide-react';

interface ArcanaProps {
  onReset: () => void;
  elements: AlchemyElement[];
}

const LAYER_ICONS: Record<number, any> = {
  1: Shield,
  2: Zap,
  3: Sparkles,
  4: Eye,
  5: Globe,
};

const LAW_ICONS: Record<string, any> = {
  Thermometer,
  Contrast,
  Leaf,
  Hourglass,
};

export const Arcana: React.FC<ArcanaProps> = ({ onReset, elements }) => {
  const [selectedLaw, setSelectedLaw] = React.useState<any>(null);
  const [selectedLayer, setSelectedLayer] = React.useState<any>(null);
  const maxReality = Math.max(1, ...elements.map(e => e.realityLevel || 1));
  const totalElements = elements.length;

  const { currentRank, nextRank, progressToNext } = calculateRank(totalElements);
  const [showRankTooltip, setShowRankTooltip] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-8"
    >
      {/* Alchemist Rank Section */}
      <div className="parchment-card p-6 border-gold/40 bg-gold/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12">{currentRank.icon}</div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-gold/30 flex items-center justify-center bg-parchment shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gold/5" />
            <span className="text-5xl relative z-10 drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]">{currentRank.icon}</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Ваш Текущий Ранг</div>
            <h2 className="font-gothic text-3xl tracking-widest text-sepia">{currentRank.name}</h2>
            <p className="text-sm italic text-sepia/70">{currentRank.title}</p>
            
            <div className="mt-4 space-y-1 relative">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-sepia/50">
                <div className="flex items-center gap-1 cursor-help" onMouseEnter={() => setShowRankTooltip(true)} onMouseLeave={() => setShowRankTooltip(false)}>
                  <span>Прогресс Познания</span>
                  <Info size={10} />
                </div>
                <span>{totalElements} / {nextRank ? nextRank.min : '∞'}</span>
              </div>
              <div className="h-2 w-full bg-sepia/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  className="h-full bg-gold shadow-[0_0_10px_rgba(201,163,67,0.5)]"
                />
              </div>

              <AnimatePresence>
                {showRankTooltip && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-full left-0 mb-2 p-2 bg-ink text-[9px] text-white rounded shadow-xl z-50 w-48 border border-gold/20"
                  >
                    Ваш ранг алхимика растет по мере открытия новых элементов. Каждый новый ранг открывает доступ к более сложным трансмутациям.
                  </motion.div>
                )}
              </AnimatePresence>

              {nextRank && (
                <p className="text-[9px] text-sepia/40 italic mt-1">
                  До ранга "{nextRank.name}" осталось открыть {nextRank.min - totalElements} элементов
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reality Layers */}
        <div className="parchment-card p-6 space-y-6">
          <h3 className="font-gothic text-xl tracking-widest text-gold text-center uppercase">Слои Реальности</h3>
          <div className="space-y-4">
            {REALITY_LAYERS.map((layer) => {
              // Exclude initial elements from the count for the first layer
              const layerElements = elements.filter(e => 
                e.realityLevel === layer.level && 
                !INITIAL_ELEMENTS.some(ie => ie.id === e.id)
              ).length;
              
              // A layer is "unlocked" (active) if we have elements of that level
              // OR if we meet the unlock requirement for it to become "available"
              const isUnlocked = maxReality >= layer.level;
              
              // Check if it's "available" to be discovered (for the next layer)
              let isAvailable = isUnlocked;
              if (!isUnlocked && layer.level === maxReality + 1) {
                // Check specific unlock conditions from constants
                if (layer.level === 2) isAvailable = layerElements >= 0; // This is tricky because layerElements is for CURRENT layer.
                // Let's use a simpler logic: 
                // Layer 2 is available if we found 10 NEW elements of Layer 1.
                const prevLayerNewElements = elements.filter(e => 
                  e.realityLevel === layer.level - 1 && 
                  !INITIAL_ELEMENTS.some(ie => ie.id === e.id)
                ).length;

                if (layer.level === 2) isAvailable = prevLayerNewElements >= 10;
                if (layer.level === 3) isAvailable = prevLayerNewElements >= 15 && elements.some(e => e.essences?.includes('life'));
                if (layer.level === 4) isAvailable = prevLayerNewElements >= 25; // simplified
                if (layer.level === 5) isAvailable = prevLayerNewElements >= 50;
              }

              const LayerIcon = LAYER_ICONS[layer.level] || Shield;
              
              return (
                <div 
                  key={layer.level} 
                  onClick={() => setSelectedLayer(layer)}
                  className={`flex items-center gap-4 p-3 rounded border transition-all cursor-pointer hover:bg-sepia/10 ${isAvailable ? 'bg-sepia/5 border-gold/30' : 'opacity-30 border-sepia/10 grayscale'}`}
                >
                  <div className={`p-2 rounded-full ${isUnlocked ? 'bg-gold/20 text-gold' : isAvailable ? 'bg-gold/10 text-gold/50' : 'bg-sepia/10 text-sepia'}`}>
                    <LayerIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">{layer.name}</span>
                      <span className="text-[10px] opacity-50">{layerElements} новых</span>
                    </div>
                    <p className="text-[10px] italic opacity-70 line-clamp-1">{isAvailable ? layer.desc : 'Слой заблокирован'}</p>
                  </div>
                  <Info size={14} className="text-gold/40" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Hidden Laws */}
        <div className="parchment-card p-6 space-y-6">
          <h3 className="font-gothic text-xl tracking-widest text-gold text-center uppercase">Законы Мироздания</h3>
          <div className="space-y-4">
            {HIDDEN_LAWS.map((law) => {
              // Logic to "discover" laws based on elements
              const isDiscovered = (law.id === 'temp' && elements.some(e => (e.temperature || 0) > 500)) ||
                                  (law.id === 'opp' && elements.some(e => e.essences?.includes('void') && elements.some(e2 => e2.essences?.includes('creation')))) ||
                                  (law.id === 'life' && elements.some(e => e.essences?.includes('life'))) ||
                                  (law.id === 'time' && totalElements > 20);

              return (
                <div 
                  key={law.id} 
                  onClick={() => isDiscovered && setSelectedLaw(law)}
                  className={`flex items-center gap-4 p-3 rounded border transition-all ${isDiscovered ? 'bg-gold/5 border-gold/20 cursor-pointer hover:bg-gold/10' : 'opacity-20 border-sepia/10 blur-[1px]'}`}
                >
                  <div className="p-2 rounded-full bg-gold/10 text-gold">
                    {isDiscovered ? (
                      React.createElement(LAW_ICONS[law.icon] || Sparkles, { size: 20 })
                    ) : (
                      <span className="text-xl">?</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-sm block">{isDiscovered ? law.name : 'Тайный Закон'}</span>
                    <p className="text-[10px] italic opacity-70">{isDiscovered ? law.desc : 'Условия открытия неизвестны...'}</p>
                  </div>
                  {isDiscovered && <Info size={14} className="text-gold/40" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hidden Law Modal */}
      <AnimatePresence>
        {selectedLaw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md"
            onClick={() => setSelectedLaw(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="parchment-card max-w-md w-full p-8 relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedLaw(null)}
                className="absolute top-4 right-4 text-sepia/40 hover:text-sepia"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                  {React.createElement(LAW_ICONS[selectedLaw.icon] || Sparkles, { size: 40 })}
                </div>
                
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-1">Закон Мироздания</div>
                  <h2 className="font-gothic text-xl md:text-3xl tracking-widest text-sepia break-words leading-tight">
                    {selectedLaw.name}
                  </h2>
                </div>

                <div className="w-full h-px bg-sepia/10" />

                <p className="text-sepia italic leading-relaxed">
                  "{selectedLaw.desc}"
                </p>

                <div className="bg-gold/5 p-4 rounded border border-gold/20 text-left">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-gold mb-2 flex items-center gap-2">
                    <Sparkles size={12} />
                    Тайное Знание
                  </h4>
                  <p className="text-xs text-sepia/80 leading-relaxed">
                    {selectedLaw.detail}
                  </p>
                </div>

                <p className="text-[9px] text-sepia/40 uppercase tracking-widest">
                  Этот закон теперь влияет на ваши трансмутации
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reality Layer Modal */}
      <AnimatePresence>
        {selectedLayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md"
            onClick={() => setSelectedLayer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="parchment-card max-w-md w-full p-8 relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedLayer(null)}
                className="absolute top-4 right-4 text-sepia/40 hover:text-sepia"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 rounded-full bg-sepia/5 flex items-center justify-center text-gold border border-gold/20">
                  {React.createElement(LAYER_ICONS[selectedLayer.level] || Shield, { size: 40 })}
                </div>
                
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-1">Слой Реальности {selectedLayer.level}</div>
                  <h2 className="font-gothic text-3xl tracking-widest text-sepia uppercase">{selectedLayer.name}</h2>
                </div>

                <div className="w-full h-px bg-sepia/10" />

                <div className="space-y-4 text-left w-full">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-gold mb-1">Суть Слоя</h4>
                    <p className="text-sm text-sepia italic">{selectedLayer.desc}</p>
                  </div>
                  
                  <div className="bg-sepia/5 p-4 rounded border border-sepia/10">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-gold mb-2 flex items-center gap-2">
                      <Sparkles size={12} />
                      Законы Слоя
                    </h4>
                    <p className="text-xs text-sepia/80 leading-relaxed">
                      {selectedLayer.rules}
                    </p>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-gold mb-1">Как открыть</h4>
                    <p className="text-xs text-sepia/60 font-bold uppercase tracking-widest">
                      {selectedLayer.unlock}
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-sepia/10" />

                <p className="text-[9px] text-sepia/40 uppercase tracking-widest">
                  Познание слоев открывает путь к высшей алхимии
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="parchment-card p-8 text-center space-y-6">
        <h3 className="font-gothic text-xl tracking-widest text-gold uppercase">Опасные Манипуляции</h3>
        <div className="max-w-xs mx-auto space-y-4">
          <button 
            onClick={() => {
              onReset();
              window.location.reload();
            }}
            className="w-full py-3 border border-red-900/30 text-red-900 hover:bg-red-900/10 transition-all rounded font-bold uppercase tracking-widest text-xs"
          >
            Сбросить Вселенную
          </button>
          
          <button 
            onClick={() => {
              localStorage.removeItem('aihim_is_combining'); // Just in case we ever store it
              window.location.reload();
            }}
            className="w-full py-3 border border-gold/30 text-gold hover:bg-gold/10 transition-all rounded font-bold uppercase tracking-widest text-xs"
          >
            Перезагрузить Эфир (Fix Stuck)
          </button>

          <p className="text-[10px] opacity-50 italic">AIhim v1.1 - На базе Gemini AI. Мир помнит ваши ошибки.</p>
        </div>
      </div>
    </motion.div>
  );
};
