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
  const [searchQuery, setSearchQuery] = useState('');

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
    return elements.filter(el => 
      el && (
        el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.rarity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [elements, searchQuery]);

  const selectedElement = useMemo(() => 
    elements.find(e => e && e.id === selectedId),
    [elements, selectedId]
  );

  const handleTap = (type: 'heat' | 'cool' | 'stability' = 'stability') => {
    if (!selectedElement || aihim <= 0) return;

    setAihim(prev => prev - 1);

    if (type === 'stability') {
      const cost = STABILITY_TAP_COST[selectedElement.rarity] || 1;
      setTapCount(prev => {
        const next = prev + 1;
        if (next >= cost) {
          setElements(current => current.map(el => 
            (el && el.id === selectedElement.id) 
              ? { ...el, stability: Math.min(100, (el.stability ?? 100) + 1) }
              : el
          ));
          return 0;
        }
        return next;
      });
    } else if (type === 'heat') {
      setElements(current => current.map(el => 
        (el && el.id === selectedElement.id) 
          ? { ...el, temperature: Math.min(1000, (el.temperature ?? 0) + 1) }
          : el
      ));
    } else if (type === 'cool') {
      setElements(current => current.map(el => 
        (el && el.id === selectedElement.id) 
          ? { ...el, temperature: Math.max(-273, (el.temperature ?? 0) - 1) }
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

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-gothic tracking-widest flex items-center gap-2">
            <Hammer size={18} className="text-gold" />
            КУЗНЯ И СТАБИЛИЗАЦИЯ
          </h2>
          <p className="text-[10px] uppercase font-bold text-sepia/60 tracking-widest">
            Поддерживайте структуру ваших открытий
          </p>
        </div>

        <div className="flex bg-sepia/10 p-1 rounded-full border border-gold/20">
          <button
            onClick={() => setActiveSubTab('stability')}
            className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all ${
              activeSubTab === 'stability' ? 'bg-gold text-white shadow-lg' : 'text-sepia/60 hover:text-sepia'
            }`}
          >
            Стабильность
          </button>
          <button
            onClick={() => setActiveSubTab('temperature')}
            className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all ${
              activeSubTab === 'temperature' ? 'bg-gold text-white shadow-lg' : 'text-sepia/60 hover:text-sepia'
            }`}
          >
            Температура
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Element List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-sepia/60">Ваши Элементы</h2>
            <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
              {elements.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sepia/40" size={16} />
            <input
              type="text"
              placeholder="Поиск элементов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-sepia/5 border border-sepia/20 rounded-lg py-2 pl-10 pr-4 text-xs font-serif italic text-sepia focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          <div className="parchment-card p-4 h-[480px] md:h-[600px] overflow-y-auto custom-scrollbar !overflow-visible md:!overflow-y-auto">
            <div className="h-full overflow-y-auto custom-scrollbar pr-2">
              {filteredElements.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
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
                <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-40">
                  <Search size={32} className="mb-2" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">Ничего не найдено</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedElement ? (
              <motion.div
                key={selectedElement.id + activeSubTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="parchment-card p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 text-gold/20 font-gothic text-6xl select-none">
                  {activeSubTab === 'stability' ? '🜔' : '🜂'}
                </div>

                <ElementCard element={selectedElement} className="mb-8 scale-110" />

                <div className="w-full max-w-md flex flex-col items-center gap-6">
                  {activeSubTab === 'stability' ? (
                    <>
                      <div className="text-center">
                        <h3 className="font-gothic text-2xl text-sepia mb-1">УКРЕПЛЕНИЕ СТРУКТУРЫ</h3>
                        <p className="text-[10px] uppercase font-bold text-sepia/40 tracking-widest">
                          Текущая стабильность: {selectedElement.stability ?? 100}%
                        </p>
                        <p className="text-[9px] text-gold font-bold mt-1 uppercase tracking-widest">
                          1 цикл табов = +1% стабильности
                        </p>
                      </div>

                      <div className="w-full bg-sepia/10 h-4 rounded-full overflow-hidden border border-gold/20 relative">
                        <motion.div 
                          className="h-full bg-gold"
                          animate={{ width: `${progress}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-sepia uppercase tracking-tighter">
                          {tapCount} / {cost} ТАБОВ ДО +1%
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTap('stability')}
                        disabled={(selectedElement.stability ?? 100) >= 100 || aihim <= 0}
                        className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center gap-2 transition-all shadow-2xl ${
                          (selectedElement.stability ?? 100) >= 100 || aihim <= 0
                            ? 'border-sepia/10 bg-sepia/5 text-sepia/20 cursor-not-allowed'
                            : 'border-gold bg-gold/5 text-gold hover:bg-gold/10'
                        }`}
                      >
                        <Zap size={48} className={tapCount > 0 ? "animate-bounce" : ""} />
                        <span className="font-gothic text-xl tracking-widest">УКРЕПИТЬ</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gold/60">
                          <Zap size={10} />
                          <span>-1 AiHim</span>
                        </div>
                      </motion.button>

                      {(selectedElement.stability ?? 100) >= 100 && (
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest animate-pulse">
                          Структура идеально стабильна
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <h3 className="font-gothic text-2xl text-sepia mb-1">ТЕРМИЧЕСКИЙ КОНТРОЛЬ</h3>
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] uppercase font-bold text-sepia/40 tracking-widest">
                            Текущая температура: {selectedElement.temperature ?? 0}°C
                          </p>
                          <p className="text-[10px] uppercase font-bold text-gold tracking-widest">
                            Нормальная температура: {selectedElement.targetTemperature ?? 0}°C
                          </p>
                          <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-widest">
                            1 таб = +1°C нагрева
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-center gap-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTap('heat')}
                          disabled={aihim <= 0}
                          className={`w-36 h-36 rounded-full border-4 border-red-500 bg-red-500/5 text-red-500 flex flex-col items-center justify-center gap-2 transition-all shadow-2xl ${
                            aihim <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/10'
                          }`}
                        >
                          <ArrowUp size={36} />
                          <span className="font-gothic text-lg tracking-widest uppercase">Нагрев</span>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-red-500/60">
                            <Zap size={10} />
                            <span>-1 AiHim</span>
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTap('cool')}
                          disabled={aihim <= 0}
                          className={`w-36 h-36 rounded-full border-4 border-blue-500 bg-blue-500/5 text-blue-500 flex flex-col items-center justify-center gap-2 transition-all shadow-2xl ${
                            aihim <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500/10'
                          }`}
                        >
                          <ArrowDown size={36} />
                          <span className="font-gothic text-lg tracking-widest uppercase">Охлад</span>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500/60">
                            <Zap size={10} />
                            <span>-1 AiHim</span>
                          </div>
                        </motion.button>
                      </div>

                      <div className="mt-8 p-4 bg-sepia/5 rounded-lg border border-sepia/10 flex items-start gap-3 max-w-xs">
                        <AlertCircle size={16} className="text-gold shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-2">
                          <p className="text-[9px] text-sepia/70 leading-relaxed italic">
                            Элементы постоянно остывают. Поддерживайте температуру близкой к норме для сохранения стабильности.
                          </p>
                          <p className="text-[9px] text-red-500/80 font-bold uppercase tracking-widest leading-relaxed">
                            Внимание: Синтез невозможен, если температура элемента ниже нормы более чем на 200°C.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="parchment-card p-8 flex flex-col items-center justify-center min-h-[400px] border-dashed opacity-40">
                <Sparkles size={48} className="text-sepia/20 mb-4" />
                <p className="font-serif italic text-sepia/60">Выберите элемент из списка для обслуживания...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
