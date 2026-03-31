import React, { useState, useMemo } from 'react';
import { AlchemyElement, Rarity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Hammer, Thermometer, Zap, Shield, ArrowUp, ArrowDown, Sparkles, AlertCircle, Search } from 'lucide-react';
import { RARITY_COLORS, STABILITY_TAP_COST, translateEssence, calculateRank } from '../constants';
import { ElementCard } from '../components/ElementCard';
import { RefreshCw } from 'lucide-react';

interface MaintenanceProps {
  elements: AlchemyElement[];
  setElements: React.Dispatch<React.SetStateAction<AlchemyElement[]>>;
  initialElementId?: string | null;
  onClearInitial?: () => void;
  aihim: number;
  setAihim: React.Dispatch<React.SetStateAction<number>>;
  onOpenShop: () => void;
  regenTimer: number;
}

export const Maintenance: React.FC<MaintenanceProps> = ({ 
  elements, 
  setElements, 
  initialElementId, 
  onClearInitial, 
  aihim, 
  setAihim,
  onOpenShop,
  regenTimer
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stability' | 'temperature'>('stability');
  const [selectedId, setSelectedId] = useState<string | null>(initialElementId || null);
  const [tapCount, setTapCount] = useState(0);
  const [tapAmount, setTapAmount] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low-stability' | 'extreme-temp'>('all');

  React.useEffect(() => {
    if (initialElementId) {
      setSelectedId(initialElementId);
      // Use setTimeout to defer the state update to the next tick,
      // avoiding the "Cannot update a component while rendering a different component" warning.
      setTimeout(() => {
        onClearInitial?.();
      }, 0);
    }
  }, [initialElementId, onClearInitial]);

  const filteredElements = useMemo(() => {
    return elements.filter(el => {
      if (!el) return false;
      
      const matchesSearch = 
        el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.rarity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.type.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'low-stability') {
        return (el.stability ?? 100) < 80;
      }

      if (filter === 'extreme-temp') {
        const tempDiff = Math.abs((el.targetTemperature || 0) - (el.temperature || 0));
        return tempDiff >= 200;
      }

      return true;
    });
  }, [elements, searchQuery, filter]);

  const selectedElement = useMemo(() => 
    elements.find(e => e && e.id === selectedId),
    [elements, selectedId]
  );

  const handleTap = (type: 'heat' | 'cool' | 'stability' = 'stability') => {
    if (!selectedElement || aihim < tapAmount) return;

    setAihim(prev => prev - tapAmount);

    if (type === 'stability') {
      const cost = STABILITY_TAP_COST[selectedElement.rarity] || 1;
      setTapCount(prev => {
        const next = prev + tapAmount;
        if (next >= cost) {
          const stabilityGain = Math.floor(next / cost);
          setElements(current => current.map(el => 
            (el && el.id === selectedElement.id) 
              ? { ...el, stability: Math.min(100, (el.stability ?? 100) + stabilityGain) }
              : el
          ));
          return next % cost;
        }
        return next;
      });
    } else if (type === 'heat') {
      setElements(current => current.map(el => 
        (el && el.id === selectedElement.id) 
          ? { ...el, temperature: Math.min(1000, (el.temperature ?? 0) + tapAmount) }
          : el
      ));
    } else if (type === 'cool') {
      setElements(current => current.map(el => 
        (el && el.id === selectedElement.id) 
          ? { ...el, temperature: Math.max(-273, (el.temperature ?? 0) - tapAmount) }
          : el
      ));
    }
  };

  const handleTempChange = (delta: number) => {
    if (!selectedElement) return;
    setElements(current => current.map(el => 
      (el && el.id === selectedElement.id) 
        ? { ...el, temperature: Math.max(-100, Math.min(1000, (el.temperature ?? 0) + delta)) }
        : el
    ));
  };

  const cost = selectedElement ? (STABILITY_TAP_COST[selectedElement.rarity] || 1) : 1;
  const progress = (tapCount / cost) * 100;

  const { currentRank, level, levelTarget, progressToNextRank, nextRank } = useMemo(() => {
    const validElementsCount = elements.filter(e => e !== null).length;
    return calculateRank(validElementsCount);
  }, [elements.length]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {/* Rank & Level Display */}
        <div className="parchment-card p-4 bg-sepia/5 border-gold/20 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-2xl border border-gold/30">
                {currentRank.icon}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gold tracking-widest">Ранг: {currentRank.name}</div>
                <div className="text-lg font-gothic tracking-widest">Уровень: {level}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[10px] uppercase font-bold text-sepia/60 tracking-widest">Элементов: {elements.length} / {levelTarget}</div>
              <div className="w-48 h-2 bg-sepia/10 rounded-full overflow-hidden border border-sepia/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(elements.length / levelTarget) * 100}%` }}
                  className="h-full bg-gold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AiHim Balance & Shop Block */}
        <div className="parchment-card p-6 bg-gold/5 border-gold/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 shadow-[0_0_20px_rgba(201,163,67,0.1)]">
              <Zap size={32} className="text-gold" />
            </div>
            <div className="flex flex-col">
              <div className="text-[10px] uppercase font-bold text-gold tracking-widest mb-1">Ваш Баланс Энергии</div>
              <div className="text-3xl font-gothic tracking-widest text-gold">{aihim.toLocaleString()} AiHim</div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-sepia/60 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin-slow" />
                  +100 через {regenTimer}с
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onOpenShop}
            className="w-full md:w-auto px-8 py-4 bg-gold text-ink font-bold uppercase tracking-widest rounded-xl hover:bg-gold-light transition-all shadow-[0_0_20px_rgba(201,163,67,0.3)] active:scale-95"
          >
            Пополнить Энергию
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Inventory Section (Now at the top) */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-gothic tracking-widest flex items-center gap-2">
                <Sparkles size={18} className="text-gold" />
                ДОСТУПНЫЕ ЭЛЕМЕНТЫ
                <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20 ml-2">
                  {elements.length}
                </span>
              </h2>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sepia/40" size={16} />
                <input
                  type="text"
                  placeholder="Поиск элементов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-sepia/20 focus:border-gold outline-none text-sm font-serif italic"
                />
              </div>
              
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2 py-1 rounded text-[8px] uppercase font-bold tracking-tighter transition-all border ${
                    filter === 'all' ? 'bg-gold text-white border-gold' : 'text-sepia/60 border-sepia/10 hover:border-sepia/30'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setFilter('low-stability')}
                  className={`px-2 py-1 rounded text-[8px] uppercase font-bold tracking-tighter transition-all border ${
                    filter === 'low-stability' ? 'bg-red-900 text-white border-red-900' : 'text-sepia/60 border-sepia/10 hover:border-sepia/30'
                  }`}
                >
                  Низкая стабильность
                </button>
                <button
                  onClick={() => setFilter('extreme-temp')}
                  className={`px-2 py-1 rounded text-[8px] uppercase font-bold tracking-tighter transition-all border ${
                    filter === 'extreme-temp' ? 'bg-blue-900 text-white border-blue-900' : 'text-sepia/60 border-sepia/10 hover:border-sepia/30'
                  }`}
                >
                  Критическая темп.
                </button>
              </div>
            </div>
          </div>

          <div className="parchment-card p-4 md:p-6 h-[300px] md:h-[400px] !overflow-y-auto custom-scrollbar bg-sepia/[0.02] shadow-inner relative z-10 touch-pan-y">
            {filteredElements.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pb-10">
                {filteredElements.map(el => (
                  <ElementCard 
                    key={el.id} 
                    element={el} 
                    compact 
                    isSelected={selectedId === el.id}
                    onClick={() => {
                      setSelectedId(el.id);
                      setTapCount(0);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-sepia/40 italic font-serif">
                Ничего не найдено в свитках...
              </div>
            )}
          </div>
        </div>

        {/* Forge Table Section (Now at the bottom) */}
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-sepia/20 to-transparent opacity-50" />
          
          <div 
            className="relative flex flex-col items-center justify-center gap-4 py-8 md:py-12 px-4 md:px-8 w-full max-w-4xl !overflow-visible bg-no-repeat bg-center bg-cover border-4 border-gold/20 rounded-[2rem] md:rounded-[3rem] aspect-[4/5] md:aspect-video transition-all duration-500 mx-auto shadow-2xl"
            style={{ 
              backgroundImage: "url('https://i.ibb.co/q3WTWZVr/kuznyaaihim.png')",
            }}
          >
            <div className="absolute inset-0 bg-ink/20 rounded-[2rem] md:rounded-[3rem] pointer-events-none" />
            
            <div className="absolute -top-4 md:-top-6 left-1/2 -translate-x-1/2 bg-parchment/60 backdrop-blur-sm px-6 md:px-12 py-2 md:py-4 border-2 border-ink/90 rounded-full text-[10px] md:text-sm uppercase tracking-[0.2em] md:tracking-[0.5em] font-black text-ink z-20 whitespace-nowrap flex items-center gap-2 md:gap-4">
              <Hammer className="w-4 h-4 md:w-8 md:h-8 text-gold" />
              КУЗНЕЧНЫЙ ГОРН
            </div>

            <div className="w-full z-10 flex flex-col items-center gap-6">
              <AnimatePresence mode="wait">
                {selectedElement ? (
                  <motion.div
                    key={selectedElement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center w-full max-w-2xl"
                  >
                    {/* Mode Switcher */}
                    <div className="flex bg-parchment/40 backdrop-blur-md p-1 rounded-full border border-gold/40 mb-8">
                      <button
                        onClick={() => setActiveSubTab('stability')}
                        className={`px-6 py-2 rounded-full text-xs uppercase font-bold tracking-widest transition-all ${
                          activeSubTab === 'stability' ? 'bg-gold text-white shadow-lg' : 'text-ink/60 hover:text-ink'
                        }`}
                      >
                        Стабильность
                      </button>
                      <button
                        onClick={() => setActiveSubTab('temperature')}
                        className={`px-6 py-2 rounded-full text-xs uppercase font-bold tracking-widest transition-all ${
                          activeSubTab === 'temperature' ? 'bg-gold text-white shadow-lg' : 'text-ink/60 hover:text-ink'
                        }`}
                      >
                        Температура
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full">
                      <div className="relative">
                        <div className="absolute -inset-4 bg-gold/20 blur-2xl rounded-full animate-pulse" />
                        <ElementCard element={selectedElement} className="relative z-10 scale-110 md:scale-125" />
                        
                        {/* Tap Amount Slider */}
                        <div className="mt-8 md:mt-12 bg-parchment/60 backdrop-blur-sm p-4 rounded-xl border border-ink/90 w-full">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase font-bold text-sepia/60 tracking-widest">Расход за тап</span>
                            <span className="text-xs font-bold text-gold">{tapAmount} AiHim</span>
                          </div>
                          <input 
                            type="range"
                            min="1"
                            max={Math.max(1, level)}
                            value={tapAmount}
                            onChange={(e) => setTapAmount(parseInt(e.target.value))}
                            className="w-full accent-gold cursor-pointer"
                          />
                          <div className="flex justify-between text-[8px] text-sepia/40 mt-1 uppercase font-bold">
                            <span>1</span>
                            <span>Макс: {level}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center md:items-start gap-6 w-full max-w-sm">
                        {activeSubTab === 'stability' ? (
                          <div className="w-full flex flex-col gap-4">
                            <div className="bg-parchment/60 backdrop-blur-sm p-4 rounded-xl border border-ink/90 text-center md:text-left">
                              <h3 className="font-gothic text-xl text-sepia mb-1">УКРЕПЛЕНИЕ</h3>
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] uppercase font-bold text-sepia/60 tracking-widest">
                                  Стабильность: {selectedElement.stability ?? 100}%
                                </p>
                                <p className="text-[9px] text-gold font-bold uppercase tracking-widest">
                                  1 цикл = +1% структуры
                                </p>
                              </div>
                            </div>

                            <div className="w-full bg-ink/20 h-6 rounded-full overflow-hidden border border-gold/40 relative">
                              <motion.div 
                                className="h-full bg-gold shadow-[0_0_15px_rgba(201,163,67,0.5)]"
                                animate={{ width: `${progress}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white uppercase tracking-widest drop-shadow-md">
                                {tapCount} / {cost} ЭНЕРГИИ
                              </div>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(201, 163, 67, 0.8)" }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleTap('stability')}
                              disabled={(selectedElement.stability ?? 100) >= 100 || aihim <= 0}
                              className={`w-full px-10 py-5 rounded-2xl font-gothic text-2xl md:text-3xl tracking-[0.2em] md:tracking-[0.4em] transition-all duration-500 relative overflow-hidden group border-2 backdrop-blur-sm flex items-center justify-center gap-4 ${
                                (selectedElement.stability ?? 100) < 100 && aihim > 0
                                  ? 'bg-gold/70 text-white border-ink/90 cursor-pointer' 
                                  : 'bg-parchment/40 text-ink/40 border-ink/30 cursor-not-allowed'
                              }`}
                            >
                              <Zap size={24} className={tapCount > 0 ? "animate-pulse text-white" : "text-white/60"} />
                              <span className="relative z-10 font-black">УКРЕПИТЬ</span>
                              {(selectedElement.stability ?? 100) < 100 && aihim > 0 && (
                                <motion.div 
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                  initial={{ x: '-100%' }}
                                  animate={{ x: '100%' }}
                                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                />
                              )}
                            </motion.button>
                          </div>
                        ) : (
                          <div className="w-full flex flex-col gap-4">
                            <div className="bg-parchment/60 backdrop-blur-sm p-4 rounded-xl border border-ink/90 text-center md:text-left">
                              <h3 className="font-gothic text-xl text-sepia mb-1">ТЕРМОКОНТРОЛЬ</h3>
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] uppercase font-bold text-sepia/60 tracking-widest">
                                  Текущая: {selectedElement.temperature ?? 0}°C
                                </p>
                                <p className="text-[10px] uppercase font-bold text-gold tracking-widest">
                                  Норма: {selectedElement.targetTemperature ?? 0}°C
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4 w-full">
                              <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(220, 38, 38, 0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTap('heat')}
                                disabled={aihim <= 0}
                                className={`flex-1 py-4 rounded-2xl font-gothic text-lg md:text-xl tracking-[0.2em] transition-all duration-500 border-2 backdrop-blur-sm flex flex-col items-center justify-center gap-1 ${
                                  aihim > 0
                                    ? 'bg-red-600/60 text-white border-ink/90 cursor-pointer' 
                                    : 'bg-parchment/40 text-ink/40 border-ink/30 cursor-not-allowed'
                                }`}
                              >
                                <ArrowUp size={20} />
                                <span className="font-black">НАГРЕВ</span>
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(37, 99, 235, 0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTap('cool')}
                                disabled={aihim <= 0}
                                className={`flex-1 py-4 rounded-2xl font-gothic text-lg md:text-xl tracking-[0.2em] transition-all duration-500 border-2 backdrop-blur-sm flex flex-col items-center justify-center gap-1 ${
                                  aihim > 0
                                    ? 'bg-blue-600/60 text-white border-ink/90 cursor-pointer' 
                                    : 'bg-parchment/40 text-ink/40 border-ink/30 cursor-not-allowed'
                                }`}
                              >
                                <ArrowDown size={20} />
                                <span className="font-black">ОХЛАД</span>
                              </motion.button>
                            </div>
                            
                            <div className="p-3 bg-parchment/40 backdrop-blur-sm rounded-lg border border-ink/40 flex items-start gap-2">
                              <AlertCircle size={14} className="text-gold shrink-0 mt-0.5" />
                              <p className="text-[8px] text-ink/70 leading-tight uppercase font-bold">
                                Синтез невозможен при разнице температур более 200°C.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-60">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gold/40 flex items-center justify-center mb-4">
                      <Sparkles size={40} className="text-gold/40 animate-pulse" />
                    </div>
                    <p className="font-gothic text-xl text-ink tracking-widest text-center">
                      ВЫБЕРИТЕ СУЩНОСТЬ <br /> ДЛЯ РАБОТЫ В ГОРНЕ
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2 text-center px-4 py-3 bg-parchment/60 backdrop-blur-sm rounded-xl border border-ink/90 z-10">
              <div className="flex items-center gap-2 text-ink">
                <Hammer size={16} className="animate-pulse text-gold" />
                <p className="text-[14px] md:text-[16px] uppercase tracking-[0.1em] md:tracking-[0.2em] font-black">
                  {activeSubTab === 'stability' ? 'Укрепление Структуры' : 'Термическая Настройка'}
                </p>
                <Hammer size={16} className="animate-pulse text-gold" />
              </div>
              <p className="text-[12px] md:text-[14px] uppercase tracking-widest text-ink/60 font-medium italic">
                {activeSubTab === 'stability' 
                  ? 'Восстановите целостность элемента для безопасного синтеза' 
                  : 'Поддерживайте идеальный баланс температур для Великого Делания'}
              </p>
            </div>

            {/* Decorative Alchemical Symbols */}
            <div className="absolute bottom-6 left-6 text-gold/20 font-gothic text-5xl select-none drop-shadow-lg">🜔</div>
            <div className="absolute bottom-6 right-6 text-gold/20 font-gothic text-5xl select-none drop-shadow-lg">🜂</div>
            <div className="absolute top-6 left-6 text-gold/20 font-gothic text-5xl select-none drop-shadow-lg">🜃</div>
            <div className="absolute top-6 right-6 text-gold/20 font-gothic text-5xl select-none drop-shadow-lg">🜁</div>
          </div>
        </div>
      </div>
    </div>
  );
};
