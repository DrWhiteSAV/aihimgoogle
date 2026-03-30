import React, { useState, useMemo } from 'react';
import { AlchemyElement, WorldPhase } from '../types';
import { ElementCard } from '../components/ElementCard';
import { ElementDetailsModal } from '../components/ElementDetailsModal';
import { VortexAnimation, MagicParticles, RareFlash } from '../components/Animations';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, Search, X, Info, Zap, Shield, Eye, Globe, Sun, Moon, AlertCircle, Thermometer, Contrast, Leaf, Hourglass } from 'lucide-react';
import { REALITY_LAYERS, HIDDEN_LAWS, calculateRank, translateEssence } from '../constants';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Hand, Grab } from 'lucide-react';

interface AtelierProps {
  elements: AlchemyElement[];
  onCombine: (a: AlchemyElement, b: AlchemyElement) => void;
  isCombining: boolean;
  setElements: React.Dispatch<React.SetStateAction<AlchemyElement[]>>;
  worldPhase: WorldPhase;
  phaseTimer: number;
  alchemyMessage: string | null;
  onClearMessage: () => void;
  onSelectElement: (element: AlchemyElement) => void;
  slotA: AlchemyElement | null;
  setSlotA: React.Dispatch<React.SetStateAction<AlchemyElement | null>>;
  slotB: AlchemyElement | null;
  setSlotB: React.Dispatch<React.SetStateAction<AlchemyElement | null>>;
  aihim: number;
  onOpenShop: () => void;
}

const LAYER_ICONS: Record<number, any> = {
  1: Shield,
  2: Zap,
  3: Sparkles,
  4: Eye,
  5: Globe,
};

const LAW_ICONS: Record<string, any> = {
  'Thermometer': Thermometer,
  'Contrast': Contrast,
  'Leaf': Leaf,
  'Hourglass': Hourglass,
};

const UniverseStatus = ({ elements, worldPhase, phaseTimer, aihim, onOpenShop }: { elements: AlchemyElement[], worldPhase: WorldPhase, phaseTimer: number, aihim: number, onOpenShop: () => void }) => {
  const maxReality = Math.max(1, ...elements.map(e => e.realityLevel || 1));
  const currentLayer = REALITY_LAYERS.find(l => l.level === maxReality) || REALITY_LAYERS[0];
  const LayerIcon = LAYER_ICONS[maxReality] || Shield;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full parchment-card p-2 md:p-3 bg-gold/5 border-ink/20 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 mb-4">
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-gold/20 rounded-full text-gold gold-glow">
            <LayerIcon size={14} className="md:w-[18px] md:h-[18px]" />
          </div>
          <div>
            <div className="text-[7px] md:text-[8px] uppercase tracking-widest text-gold font-bold">Слой Реальности</div>
            <div className="font-gothic text-xs md:text-sm tracking-widest">{currentLayer.name}</div>
          </div>
        </div>

        <div className="h-6 md:h-8 w-px bg-gold/20 hidden md:block" />

        <div className="flex items-center gap-2 md:gap-3">
          <div className={`p-1 md:p-1.5 rounded-full ${worldPhase === 'day' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
            {worldPhase === 'day' ? <Sun size={14} className="md:w-[16px] md:h-[16px]" /> : <Moon size={14} className="md:w-[16px] md:h-[16px]" />}
          </div>
          <div>
            <div className="text-[7px] md:text-[8px] uppercase tracking-widest text-sepia/50 font-bold">Фаза Мира</div>
            <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
              {worldPhase === 'day' ? 'День' : 'Ночь'}
              <span className="font-mono text-[10px] md:text-[12px] opacity-80 text-gold">({formatTime(phaseTimer)})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2 md:gap-3 bg-sepia/5 px-3 py-1.5 rounded-full border border-gold/20">
          <img src="https://i.ibb.co/5g4dfh7f/aihim.png" alt="AIhim" className="w-4 h-4 md:w-5 md:h-5 object-contain" />
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[8px] uppercase font-bold text-sepia/50 leading-none">Баланс AIhim</span>
            <span className="text-xs md:text-sm font-bold text-gold leading-none">{aihim}</span>
          </div>
        </div>
        
        <button 
          onClick={onOpenShop}
          className="flex items-center gap-2 px-3 py-1.5 bg-gold text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gold/80 transition-colors shadow-lg gold-glow"
        >
          <Plus size={12} />
          КУПИТЬ
        </button>
      </div>
    </div>
  );
};

const Slot = ({ id, element, onRemove, label, isCombining }: { 
  id: string, 
  element: AlchemyElement | null, 
  onRemove: () => void, 
  label: string,
  isCombining: boolean 
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col items-center gap-3">
      <div 
        ref={setNodeRef}
        onClick={() => !isCombining && element && onRemove()}
        className={`w-24 h-24 md:w-36 md:h-36 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 relative group overflow-hidden ${
          isOver ? 'border-gold bg-gold/20 scale-110 shadow-[0_0_30px_rgba(201,163,67,0.4)]' : 'border-ink/40 bg-parchment/40 shadow-lg'
        } ${!element ? 'border-dashed opacity-60' : 'opacity-100 cursor-pointer hover:border-ink/60 hover:bg-parchment/60'}`}
      >
        {element ? (
          <ElementCard element={element} compact className="w-full h-full border-none shadow-none pointer-events-none scale-90" />
        ) : (
          <div className="text-gold/40 flex flex-col items-center gap-2">
            <Plus size={32} className="animate-pulse" />
          </div>
        )}
        
        {element && !isCombining && (
          <div className="absolute top-2 right-2 bg-red-900/80 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
            <X size={14} />
          </div>
        )}

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-ink/40" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-ink/40" />
      </div>
      <div className="px-2 py-1 bg-parchment/60 backdrop-blur-sm rounded-full border border-ink/90 whitespace-nowrap min-w-fit">
        <span className="text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] font-black text-ink leading-none">{label}</span>
      </div>
    </div>
  );
};

export const Atelier: React.FC<AtelierProps> = ({ 
  elements, 
  onCombine, 
  isCombining, 
  setElements,
  worldPhase,
  phaseTimer,
  alchemyMessage,
  onClearMessage,
  onSelectElement,
  slotA,
  setSlotA,
  slotB,
  setSlotB,
  aihim,
  onOpenShop
}) => {
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCombining) {
        onClearMessage();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isCombining, onClearMessage]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeElement = useMemo(() => 
    elements.find(e => e && e.id === activeId), 
    [elements, activeId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredElements = useMemo(() => {
    if (!elements) return [];
    return elements.filter(e => e && e.name && e.name.toLowerCase().includes(search.toLowerCase()));
  }, [elements, search]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle dropping into slots
    if (over.id === 'slot-a') {
      const element = elements.find(e => e && e.id === active.id);
      if (element && slotB?.id !== element.id) setSlotA(element);
      return;
    }
    if (over.id === 'slot-b') {
      const element = elements.find(e => e && e.id === active.id);
      if (element && slotA?.id !== element.id) setSlotB(element);
      return;
    }

    // Handle sorting
    if (active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex(i => i && i.id === active.id);
        const newIndex = items.findIndex(i => i && i.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleCombineClick = () => {
    if (slotA && slotB) {
      onCombine(slotA, slotB);
      // We don't clear slots here anymore to allow user to see what they combined
      // or we can clear them if the user prefers. 
      // Let's keep them for now but maybe clear on success?
      // Actually, the user might want to try again.
      setSlotA(null);
      setSlotB(null);
    }
  };

  const handleUseElement = (element: AlchemyElement) => {
    if (!element) return;
    if (!slotA) {
      setSlotA(element);
    } else if (!slotB && slotA && slotA.id !== element.id) {
      setSlotB(element);
    } else if (slotA && slotB) {
      setSlotA(element);
    }
  };

  const { currentRank, nextRank, progressToNextRank, level, levelTarget, progressToNextLevel } = useMemo(() => {
    const validElementsCount = elements.filter(e => e !== null).length;
    const { currentRank, nextRank, progressToNextRank, level, levelTarget, progressToNextLevel } = calculateRank(validElementsCount);
    return { currentRank, nextRank, progressToNextRank, level, levelTarget, progressToNextLevel };
  }, [elements.length]);

  const [showProgressTooltip, setShowProgressTooltip] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Universe State (New) */}
        <UniverseStatus elements={elements} worldPhase={worldPhase} phaseTimer={phaseTimer} aihim={aihim} onOpenShop={onOpenShop} />

        {/* Rank & Level Display (New) */}
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

          <div className="h-px bg-sepia/10 w-full" />

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest">
              <span className="text-sepia/60">Прогресс Ранга</span>
              <span className="text-gold">До {nextRank?.name || 'Предела'}: {nextRank ? nextRank.min - elements.length : 0} элементов</span>
            </div>
            <div className="w-full h-1.5 bg-sepia/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextRank}%` }}
                className="h-full bg-gold shadow-[0_0_10px_rgba(201,163,67,0.5)]"
              />
            </div>
          </div>
        </div>

        {/* Inventory Section (Now Second) */}
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
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sepia/40" size={16} />
              <input
                type="text"
                placeholder="Поиск в архивах..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-sepia/20 focus:border-gold outline-none text-sm font-serif italic"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sepia/40 hover:text-sepia"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="parchment-card p-4 md:p-6 h-[400px] md:h-[550px] !overflow-y-auto custom-scrollbar bg-sepia/[0.02] shadow-inner relative z-10 touch-pan-y">
            <SortableContext 
              items={filteredElements.map(e => e.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pb-20">
                {filteredElements.map((element) => (
                  <ElementCard
                    key={element.id}
                    element={element}
                    compact
                    isDraggable
                    isSelected={slotA?.id === element.id || slotB?.id === element.id}
                    onClick={() => onSelectElement(element)}
                  />
                ))}
              </div>
            </SortableContext>
            {filteredElements.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sepia/40 italic font-serif">
                Ничего не найдено в свитках...
              </div>
            )}
          </div>
        </div>

        {/* Alchemy Table Section (Now Third) */}
        <div className="mt-2 flex flex-col items-center gap-2">
          <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-sepia/20 to-transparent opacity-50" />
          
          <div 
            className="relative flex flex-col items-center justify-center gap-2 md:gap-4 py-6 md:py-10 px-4 md:px-8 w-full max-w-4xl !overflow-visible bg-no-repeat bg-center bg-cover border-4 border-gold/20 rounded-[2rem] md:rounded-[3rem] aspect-[4/5] md:aspect-video transition-all duration-500 mx-auto"
            style={{ 
              backgroundImage: "url('https://i.ibb.co/Rp8DByFN/tableaihim.png')",
            }}
          >
            <div className="absolute inset-0 bg-ink/10 rounded-[2rem] md:rounded-[3rem] pointer-events-none" />
            
            <div className="absolute -top-4 md:-top-6 left-1/2 -translate-x-1/2 bg-parchment/60 backdrop-blur-sm px-4 md:px-12 py-2 md:py-4 border-2 border-ink/90 rounded-full text-[10px] md:text-sm uppercase tracking-[0.2em] md:tracking-[0.5em] font-black text-ink z-20 whitespace-nowrap flex items-center gap-2 md:gap-4">
              <VortexAnimation className="w-4 h-4 md:w-8 md:h-8" />
              СТОЛ ТРАНСМУТАЦИИ
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-12 xl:gap-20 w-full z-10 scale-[0.85] md:scale-100">
              <div className="flex items-center gap-2 sm:gap-6 md:gap-10 relative">
                <div className="absolute inset-0 bg-gold/10 blur-[100px] rounded-full -z-10" />
                
                <Slot 
                  id="slot-a" 
                  element={slotA} 
                  onRemove={() => setSlotA(null)} 
                  label="ПЕРВОМАТЕРИЯ"
                  isCombining={isCombining}
                />
                
                <div className="flex flex-col items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="text-gold/40 font-gothic text-3xl md:text-5xl select-none drop-shadow-[0_0_15px_rgba(201,163,67,0.3)]"
                  >
                    🜔
                  </motion.div>
                </div>

                <Slot 
                  id="slot-b" 
                  element={slotB} 
                  onRemove={() => setSlotB(null)} 
                  label="ВТОРИЧНЫЙ АГЕНТ"
                  isCombining={isCombining}
                />
              </div>

              <div className="flex flex-col items-center gap-3 md:gap-4 w-full max-w-[240px] sm:max-w-[280px] md:max-w-none">
                <div className="relative w-full flex justify-center">
                  {slotA && slotB && !isCombining && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -inset-10 bg-gold/30 blur-3xl rounded-full animate-pulse"
                    />
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(201, 163, 67, 0.8)" }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!slotA || !slotB || isCombining}
                    onClick={handleCombineClick}
                    className={`w-full md:w-auto px-6 md:px-10 py-3 md:py-5 rounded-2xl font-gothic text-lg md:text-3xl tracking-[0.2em] md:tracking-[0.4em] transition-all duration-500 relative overflow-hidden group min-w-0 md:min-w-[250px] border-2 backdrop-blur-sm ${
                      slotA && slotB && !isCombining
                        ? 'bg-gold/70 text-white border-ink/90 cursor-pointer' 
                        : 'bg-parchment/40 text-ink/40 border-ink/30 cursor-not-allowed'
                    }`}
                  >
                    <span className="relative z-10 font-black">СИНТЕЗ</span>
                    {slotA && slotB && !isCombining && (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      />
                    )}
                  </motion.button>
                </div>
                <div className="flex flex-col items-center gap-2 text-center px-4 py-3 bg-parchment/60 backdrop-blur-sm rounded-xl border border-ink/90">
                  <div className="flex items-center gap-2 text-ink">
                    <Zap size={16} className="animate-pulse text-gold" />
                    <p className="text-[14px] md:text-[16px] uppercase tracking-[0.1em] md:tracking-[0.2em] font-black">Ритуал Великого Делания</p>
                    <Zap size={16} className="animate-pulse text-gold" />
                  </div>
                  <p className="text-[12px] md:text-[14px] uppercase tracking-widest text-ink/60 font-medium italic">Соедините две сущности для рождения новой</p>
                </div>
              </div>
            </div>
            
            {/* Decorative Alchemical Symbols */}
            <div className="absolute bottom-6 left-6 text-gold/20 font-gothic text-5xl select-none drop-shadow-lg">🜁</div>
            <div className="absolute bottom-6 right-6 text-gold/20 font-gothic text-5xl select-none drop-shadow-lg">🜃</div>
            <div className="absolute top-6 left-6 text-gold/20 font-gothic text-5xl select-none drop-shadow-lg">🜂</div>
            <div className="absolute top-6 right-6 text-gold/20 font-gothic text-5xl select-none drop-shadow-lg">🜄</div>
          </div>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeElement ? (
            <div className="relative">
              <ElementCard 
                element={activeElement} 
                compact 
                className="w-32 h-32 shadow-2xl gold-glow border-gold/50 rotate-3" 
              />
              {(activeElement.stability ?? 100) < 80 ? (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg border border-white/20 whitespace-nowrap z-50">
                  Нестабильно!
                </div>
              ) : ((activeElement.targetTemperature || 0) - (activeElement.temperature || 0)) > 200 ? (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg border border-white/20 whitespace-nowrap z-50">
                  Слишком холодно!
                </div>
              ) : (
                <div className="absolute -top-4 -right-4 bg-gold text-white p-2 rounded-full shadow-lg border border-white/20 animate-bounce">
                  <Grab size={20} />
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals & Popups handled globally in App.tsx */}
    </div>
  );
};
