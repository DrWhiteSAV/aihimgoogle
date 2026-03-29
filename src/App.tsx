import React, { useState, useEffect } from 'react';
import { AlchemyElement, WorldPhase, CombinationResult } from './types';
import { INITIAL_ELEMENTS, calculateRank, HIDDEN_LAWS, REALITY_LAYERS, STABILITY_DECAY_INTERVAL, TEMPERATURE_DECAY_INTERVAL } from './constants';
import { Atelier } from './pages/Atelier';
import { Bestiary } from './pages/Bestiary';
import { Chronicle } from './pages/Chronicle';
import { Arcana } from './pages/Arcana';
import { Maintenance } from './pages/Maintenance';
import { ElementDetailsModal } from './components/ElementDetailsModal';
import { ElementCard } from './components/ElementCard';
import { VortexAnimation, MagicParticles, RareFlash } from './components/Animations';
import { motion, AnimatePresence } from 'motion/react';
import { Book, FlaskConical, History, Settings as SettingsIcon, Sparkles, X, Hammer, Thermometer } from 'lucide-react';
import { generateNewElement } from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [discoveredElements, setDiscoveredElements] = useState<AlchemyElement[]>(() => {
    const saved = localStorage.getItem('aihim_elements');
    if (!saved) return INITIAL_ELEMENTS;
    
    const parsed = JSON.parse(saved);
    // Migration: If elements are in English (e.g., name is "Water"), reset to INITIAL_ELEMENTS
    const isEnglish = parsed.some((e: any) => e.id === 'water' && e.name === 'Water');
    if (isEnglish) {
      localStorage.removeItem('aihim_elements');
      localStorage.removeItem('aihim_history');
      return INITIAL_ELEMENTS;
    }
    return parsed;
  });

  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('aihim_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'atelier' | 'bestiary' | 'chronicle' | 'arcana' | 'maintenance'>('atelier');
  const [isCombining, setIsCombining] = useState(false);
  const [combinationResult, setCombinationResult] = useState<AlchemyElement | null>(null);
  const [worldPhase, setWorldPhase] = useState<WorldPhase>('day');
  const [lastCombinationTime, setLastCombinationTime] = useState(0);
  const [alchemyMessage, setAlchemyMessage] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<AlchemyElement | null>(null);
  const [slotA, setSlotA] = useState<AlchemyElement | null>(null);
  const [slotB, setSlotB] = useState<AlchemyElement | null>(null);
  const [maintenanceElementId, setMaintenanceElementId] = useState<string | null>(null);
  const [cancelTimer, setCancelTimer] = useState(25);
  const [phaseTimer, setPhaseTimer] = useState(300);

  // Timer for combination
  useEffect(() => {
    let interval: any;
    if (isCombining) {
      setCancelTimer(25);
      interval = setInterval(() => {
        setCancelTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCombining]);

  // Stability & Temperature Update Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDiscoveredElements(current => {
        let hasChanged = false;
        const nextElements = current.map(el => {
          // Initial elements don't decay
          if (INITIAL_ELEMENTS.some(ie => ie.id === el.id)) return el;
          
          let updatedEl = { ...el };
          
          // Stability Decay
          const sIntervalMs = (STABILITY_DECAY_INTERVAL[el.rarity] || 60) * 1000;
          const lastSDecay = el.lastDecayAt || el.discoveredAt;
          
          if (now - lastSDecay >= sIntervalMs) {
            hasChanged = true;
            updatedEl = { 
              ...updatedEl, 
              stability: Math.max(0, (updatedEl.stability ?? 100) - 1),
              lastDecayAt: now 
            };
          }

          // Temperature Decay (Goes cold)
          const tIntervalMs = (TEMPERATURE_DECAY_INTERVAL[el.rarity] || 60) * 1000;
          const lastTDecay = el.lastTempDecayAt || el.discoveredAt;

          if (now - lastTDecay >= tIntervalMs) {
            hasChanged = true;
            updatedEl = {
              ...updatedEl,
              temperature: Math.max(-100, (updatedEl.temperature ?? 0) - 1),
              lastTempDecayAt: now
            };
          }
          
          return updatedEl;
        });
        return hasChanged ? nextElements : current;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Phase Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) {
          setWorldPhase(current => current === 'day' ? 'night' : 'day');
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('aihim_elements', JSON.stringify(discoveredElements));
  }, [discoveredElements]);

  useEffect(() => {
    localStorage.setItem('aihim_history', JSON.stringify(history));
  }, [history]);

  const handleCombine = async (elementA: AlchemyElement, elementB: AlchemyElement) => {
    const now = Date.now();
    if (now - lastCombinationTime < 3000) {
      setAlchemyMessage("Тигель ещё не остыл... Подождите несколько секунд.");
      return;
    }

    setIsCombining(true);
    setAlchemyMessage(null);
    setLastCombinationTime(now);

    try {
      const discoveredLaws = HIDDEN_LAWS.filter(law => {
        if (law.id === 'temp') return discoveredElements.some(e => (e.temperature || 0) > 500);
        if (law.id === 'opp') return discoveredElements.some(e => e.essences?.includes('void')) && discoveredElements.some(e => e.essences?.includes('creation'));
        if (law.id === 'life') return discoveredElements.some(e => e.essences?.includes('life'));
        if (law.id === 'time') return discoveredElements.length > 20;
        return false;
      });

      const existing = discoveredElements.find(e => 
        e.parents && (
          (e.parents[0] === elementA.id && e.parents[1] === elementB.id) ||
          (e.parents[0] === elementB.id && e.parents[1] === elementA.id)
        )
      );

      if (existing) {
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSelectedElement(existing);
        setHistory(prev => [{
          elementA,
          elementB,
          result: existing,
          timestamp: Date.now(),
          isNew: false
        }, ...prev.slice(0, 49)]);
        return;
      }

      const maxReality = Math.max(1, ...discoveredElements.map(e => e.realityLevel || 1));
      const currentLayer = REALITY_LAYERS.find(l => l.level === maxReality) || REALITY_LAYERS[0];
      
      // Calculate which layers are "available" for discovery
      const availableLayers = REALITY_LAYERS.filter(layer => {
        if (layer.level <= maxReality) return true;
        if (layer.level === maxReality + 1) {
          const prevLayerNewElements = discoveredElements.filter(e => 
            e.realityLevel === layer.level - 1 && 
            !INITIAL_ELEMENTS.some(ie => ie.id === e.id)
          ).length;
          
          if (layer.level === 2) return prevLayerNewElements >= 10;
          if (layer.level === 3) return prevLayerNewElements >= 15 && discoveredElements.some(e => e.essences?.includes('life'));
          if (layer.level === 4) return prevLayerNewElements >= 25;
          if (layer.level === 5) return prevLayerNewElements >= 50;
          return false;
        }
        return false;
      });

      const result = await generateNewElement(
        elementA, 
        elementB, 
        discoveredElements, 
        worldPhase, 
        discoveredLaws, 
        currentLayer,
        availableLayers
      );
      
      if (result.element) {
        // Day/Night Impact on Stability
        let stabilityBonus = 0;
        if (worldPhase === 'day') {
          if (result.element.essences?.includes('creation') || result.element.type === 'Энергия') {
            stabilityBonus = 10;
          }
        } else {
          if (result.element.essences?.includes('void') || result.element.essences?.includes('destruction')) {
            stabilityBonus = 10;
          }
        }
        
        const finalElement = {
          ...result.element,
          stability: Math.min(100, (result.element.stability || 100) + stabilityBonus),
          lastDecayAt: Date.now()
        };

        setDiscoveredElements(prev => [...prev, finalElement]);
        
        // Reveal sequence
        setCombinationResult(finalElement);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        setSelectedElement(finalElement);
        setHistory(prev => [{
          elementA,
          elementB,
          result: finalElement,
          timestamp: Date.now(),
          isNew: true
        }, ...prev.slice(0, 49)]);
        setCombinationResult(null);
      }

      if (result.message) {
        setAlchemyMessage(result.message);
      } else if (result.isAlmostGuessed) {
        setAlchemyMessage("Реакция была близка к успеху, но чего-то не хватило...");
      }

    } catch (error) {
      console.error("Alchemy failed:", error);
      setAlchemyMessage("Трансмутация прервана хаосом...");
    } finally {
      setIsCombining(false);
    }
  };

  const deleteElement = (id: string) => {
    if (INITIAL_ELEMENTS.some(e => e.id === id)) {
      alert("Первоначальные элементы нельзя удалить!");
      return;
    }
    setDiscoveredElements(prev => prev.filter(e => e.id !== id));
    setHistory(prev => prev.filter(h => h.result.id !== id));
  };

  const navItems = [
    { id: 'atelier', icon: FlaskConical, label: 'Стол' },
    { id: 'bestiary', icon: Book, label: 'Бестиарий' },
    { id: 'maintenance', icon: Hammer, label: 'Кузня' },
    { id: 'chronicle', icon: History, label: 'Хроника' },
    { id: 'arcana', icon: SettingsIcon, label: 'Арканы' },
  ];

  const renderNav = (isMobile: boolean) => (
    <nav className={isMobile 
      ? "fixed bottom-0 left-0 right-0 bg-parchment border-t border-sepia/20 flex justify-around py-2 z-50 md:hidden" 
      : "hidden md:flex gap-6 items-center"
    }>
      {navItems.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex flex-col items-center p-2 min-w-[60px] transition-all duration-300 ${
            activeTab === tab.id ? 'text-gold scale-110' : 'text-sepia/60 hover:text-sepia'
          }`}
        >
          <tab.icon size={isMobile ? 20 : 24} />
          <span className="text-[9px] uppercase font-bold mt-1 tracking-widest">{tab.label}</span>
          {!isMobile && activeTab === tab.id && (
            <motion.div layoutId="nav-underline" className="h-0.5 w-full bg-gold mt-1" />
          )}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto px-4 pb-24 md:pb-12 pt-6">
      {/* Header Navigation - Always Visible */}
      <header className={`flex flex-col md:flex-row items-center justify-between gap-4 relative z-[400] transition-all duration-300 ${
        activeTab === 'atelier' ? 'mb-0 pb-0 border-none' : 'mb-8 pb-4 border-b border-sepia/10'
      }`}>
        <div 
          className={`flex items-center gap-3 cursor-pointer group transition-all duration-300 ${
            activeTab === 'atelier' ? 'opacity-0 -translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'
          }`}
          onClick={() => setActiveTab('atelier')}
        >
          <motion.img 
            whileHover={{ rotate: 10, scale: 1.1 }}
            src="https://i.ibb.co/5g4dfh7f/aihim.png" 
            alt="Logo" 
            className="h-10 object-contain" 
          />
          <div className="flex flex-col">
            <span className="font-gothic text-xl text-gold leading-none">AIhim</span>
          </div>
        </div>
        
        <div className={activeTab === 'atelier' ? 'w-full flex justify-center' : ''}>
          {renderNav(false)}
        </div>
      </header>

      {/* Main Content Area (Pages) */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'atelier' && (
            <motion.div
              key="atelier-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Main Logo only on Atelier Page as requested */}
              <div className="flex flex-col items-center mb-12">
                <motion.img 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src="https://i.ibb.co/5g4dfh7f/aihim.png" 
                  alt="AIhim Grand Logo" 
                  className="h-32 md:h-48 object-contain mb-4 drop-shadow-2xl"
                />
                <h1 className="font-gothic text-4xl text-sepia tracking-widest">АТЕЛЬЕ</h1>
                <p className="text-sepia italic text-sm opacity-70 mt-2">Место, где рождается материя...</p>
              </div>

              <Atelier 
                elements={discoveredElements} 
                setElements={setDiscoveredElements}
                onCombine={handleCombine}
                isCombining={isCombining}
                worldPhase={worldPhase}
                phaseTimer={phaseTimer}
                alchemyMessage={alchemyMessage}
                onClearMessage={() => {
                  setAlchemyMessage(null);
                  setIsCombining(false);
                }}
                onSelectElement={setSelectedElement}
                slotA={slotA}
                setSlotA={setSlotA}
                slotB={slotB}
                setSlotB={setSlotB}
              />
            </motion.div>
          )}

          {activeTab === 'bestiary' && (
            <motion.div
              key="bestiary-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h1 className="font-gothic text-3xl text-sepia tracking-widest">БЕСТИАРИЙ</h1>
                <p className="text-sepia italic text-sm opacity-70">Собрание всех известных сущностей</p>
              </div>
              <Bestiary 
                elements={discoveredElements} 
                onDelete={deleteElement}
                onSelectElement={setSelectedElement}
              />
            </motion.div>
          )}

          {activeTab === 'maintenance' && (
            <motion.div
              key="maintenance-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Maintenance 
                elements={discoveredElements}
                setElements={setDiscoveredElements}
                initialElementId={maintenanceElementId}
                onClearInitial={() => setMaintenanceElementId(null)}
              />
            </motion.div>
          )}

          {activeTab === 'chronicle' && (
            <motion.div
              key="chronicle-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h1 className="font-gothic text-3xl text-sepia tracking-widest">ХРОНИКА</h1>
                <p className="text-sepia italic text-sm opacity-70">История ваших великих свершений</p>
              </div>
              <Chronicle 
                history={history} 
              />
            </motion.div>
          )}
          
          {activeTab === 'arcana' && (
            <motion.div
              key="arcana-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h1 className="font-gothic text-3xl text-sepia tracking-widest">АРКАНЫ</h1>
                <p className="text-sepia italic text-sm opacity-70">Тайные настройки мироздания</p>
              </div>
              <Arcana 
                elements={discoveredElements}
                onReset={() => {
                  setDiscoveredElements(INITIAL_ELEMENTS);
                  setHistory([]);
                  setIsCombining(false);
                  setAlchemyMessage(null);
                  localStorage.clear();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      {renderNav(true)}

      {/* Global Modals */}
      <AnimatePresence>
        {alchemyMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-sm parchment-card p-8 shadow-2xl gold-glow border-gold/40"
            >
              <button 
                onClick={() => setAlchemyMessage(null)}
                className="absolute top-4 right-4 text-sepia/40 hover:text-sepia transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                  <Sparkles size={32} />
                </div>
                <p className="text-lg font-serif italic text-sepia leading-relaxed">
                  {alchemyMessage}
                </p>
                <button
                  onClick={() => setAlchemyMessage(null)}
                  className="w-full bg-gold text-white py-3 rounded-full font-gothic tracking-widest shadow-lg"
                >
                  ПОНЯТНО
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isCombining && !alchemyMessage && (
          <motion.div 
            key="combining-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/80 backdrop-blur-xl p-4"
          >
            <div className="relative flex flex-col items-center w-full">
              {/* Enhanced Mixing Elements Animation */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                  {!combinationResult ? (
                    <div key="mixing-group" className="relative flex items-center justify-center">
                      <motion.div
                        key="mixing-a"
                        initial={{ x: -300, opacity: 0, scale: 0.8 }}
                        animate={{ 
                          x: [ -300, -150, 0 ],
                          scale: [ 0.8, 1.2, 0.5 ],
                          opacity: [ 0, 1, 0.5 ],
                          rotate: [ 0, 180, 360 ]
                        }}
                        transition={{ 
                          duration: 4, 
                          ease: "easeInOut",
                          repeat: Infinity
                        }}
                        className="absolute"
                      >
                        {slotA && <ElementCard element={slotA} compact className="w-40 h-40 gold-glow border-gold/50" />}
                      </motion.div>
                      
                      <motion.div
                        key="mixing-b"
                        initial={{ x: 300, opacity: 0, scale: 0.8 }}
                        animate={{ 
                          x: [ 300, 150, 0 ],
                          scale: [ 0.8, 1.2, 0.5 ],
                          opacity: [ 0, 1, 0.5 ],
                          rotate: [ 0, -180, -360 ]
                        }}
                        transition={{ 
                          duration: 4, 
                          ease: "easeInOut",
                          repeat: Infinity
                        }}
                        className="absolute"
                      >
                        {slotB && <ElementCard element={slotB} compact className="w-40 h-40 gold-glow border-gold/50" />}
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div
                      key="reveal-glow"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.8] }}
                      className={cn(
                        "absolute w-96 h-96 rounded-full blur-[100px] animate-pulse",
                        combinationResult.rarity === 'Обычный' && "bg-slate-400/50",
                        combinationResult.rarity === 'Редкий' && "bg-emerald-400/50",
                        combinationResult.rarity === 'Эпический' && "bg-sky-400/50",
                        combinationResult.rarity === 'Легендарный' && "bg-amber-400/50",
                        combinationResult.rarity === 'Мифический' && "bg-rose-400/50",
                        combinationResult.rarity === 'Божественный' && "bg-orange-400/50",
                        combinationResult.rarity === 'Вечный' && "bg-violet-400/50",
                        combinationResult.rarity === 'Космический' && "bg-pink-400/50",
                        combinationResult.rarity === 'Изначальный' && "bg-stone-600/50",
                        combinationResult.rarity === 'Трансцендентный' && "bg-gold/50"
                      )}
                    />
                  )}
                </AnimatePresence>
              </div>

              <VortexAnimation 
                className={cn(
                  "w-48 h-48 md:w-80 md:h-80 relative z-10 transition-colors duration-1000",
                  combinationResult?.rarity === 'Редкий' && "text-emerald-500",
                  combinationResult?.rarity === 'Эпический' && "text-sky-500",
                  combinationResult?.rarity === 'Легендарный' && "text-amber-500",
                  combinationResult?.rarity === 'Мифический' && "text-rose-500",
                  combinationResult?.rarity === 'Божественный' && "text-orange-500",
                  combinationResult?.rarity === 'Вечный' && "text-violet-500",
                  combinationResult?.rarity === 'Космический' && "text-pink-500",
                  combinationResult?.rarity === 'Изначальный' && "text-stone-500",
                  combinationResult?.rarity === 'Трансцендентный' && "text-gold"
                )} 
              />
              <MagicParticles />
              
              <div className="flex flex-col items-center gap-4 mt-12 relative z-10">
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-gothic text-2xl md:text-5xl text-gold tracking-[0.4em] md:tracking-[0.8em] text-center w-full px-2 drop-shadow-glow"
                >
                  {combinationResult ? "СУЩНОСТЬ ПРОЯВЛЕНА" : "ТРАНСМУТАЦИЯ..."}
                </motion.p>

                {combinationResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-gold/60 text-xs uppercase tracking-[0.3em] mb-1">Уровень редкости</span>
                    <span className={cn(
                      "text-xl md:text-3xl font-black uppercase tracking-[0.2em] drop-shadow-sm",
                      combinationResult.rarity === 'Обычный' && "text-slate-400",
                      combinationResult.rarity === 'Редкий' && "text-emerald-400",
                      combinationResult.rarity === 'Эпический' && "text-sky-400",
                      combinationResult.rarity === 'Легендарный' && "text-amber-400",
                      combinationResult.rarity === 'Мифический' && "text-rose-400",
                      combinationResult.rarity === 'Божественный' && "text-orange-400",
                      combinationResult.rarity === 'Вечный' && "text-violet-400",
                      combinationResult.rarity === 'Космический' && "text-pink-400",
                      combinationResult.rarity === 'Изначальный' && "text-stone-400",
                      combinationResult.rarity === 'Трансцендентный' && "text-gold"
                    )}>
                      {combinationResult.rarity}
                    </span>
                  </motion.div>
                )}
              </div>
              
              <div className="mt-8 text-gold/40 font-mono text-base tracking-widest relative z-10">
                ЭФИРНЫЙ СТАБИЛИЗАТОР: {cancelTimer}s
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => {
                  setIsCombining(false);
                  setAlchemyMessage(null);
                  setCombinationResult(null);
                }}
                className="mt-20 px-10 py-4 border-2 border-gold/20 text-gold/40 hover:text-gold hover:border-gold/60 transition-all rounded-full text-sm uppercase tracking-[0.3em] font-bold relative z-[1010] bg-ink/50"
              >
                Прервать Ритуал
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Removed newlyDiscovered popup as requested - opening DetailsModal directly */}
      </AnimatePresence>

      <ElementDetailsModal 
        element={selectedElement} 
        onClose={() => setSelectedElement(null)} 
        onMaintenance={(element) => {
          setMaintenanceElementId(element.id);
          setActiveTab('maintenance');
          setSelectedElement(null);
        }}
        onUse={(element) => {
          if (activeTab !== 'atelier') {
            setActiveTab('atelier');
          }
          
          if (!slotA) {
            setSlotA(element);
          } else if (!slotB && slotA.id !== element.id) {
            setSlotB(element);
          } else {
            // If both full or same as A, replace A
            setSlotA(element);
          }
          setSelectedElement(null);
        }}
      />

      {/* Footer / Stats */}
      <footer className="mt-8 pt-4 border-t border-sepia/10 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-sepia/60">
        <div>Открыто: {discoveredElements.length} элементов</div>
        <div className="flex items-center gap-1">
          <Sparkles size={12} className="text-gold" />
          <span>Ранг: {calculateRank(discoveredElements.length).currentRank.name}</span>
        </div>
      </footer>
    </div>
  );
}
