import React from 'react';
import { AlchemyElement, Rarity } from '../types';
import { RARITY_COLORS, translateEssence, STABILITY_DECAY_INTERVAL, TEMPERATURE_DECAY_INTERVAL, INITIAL_ELEMENTS } from '../constants';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Thermometer, Contrast, Leaf, Hourglass } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ElementCardProps {
  element: AlchemyElement;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  compact?: boolean;
  isDraggable?: boolean;
}

export const ElementCard: React.FC<ElementCardProps> = ({ 
  element, 
  onClick, 
  isSelected, 
  className, 
  compact,
  isDraggable
}) => {
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Initial elements don't decay
    if (INITIAL_ELEMENTS.some(ie => ie.id === element.id)) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      
      // Both stability and temperature share the same interval in constants.ts
      const intervalMs = (STABILITY_DECAY_INTERVAL[element.rarity] || 60) * 1000;
      const lastDecay = element.lastDecayAt || element.discoveredAt;
      const remaining = Math.max(0, Math.ceil((intervalMs - (now - lastDecay)) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [element.id, element.lastDecayAt, element.discoveredAt, element.rarity]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ${seconds % 60}s`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: element.id,
    disabled: !isDraggable 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        if (isDragging) return;
        onClick?.();
      }}
      className={cn(
        "parchment-card cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center text-center",
        isSelected && "ring-2 ring-gold gold-glow scale-105 z-10",
        RARITY_COLORS[element.rarity || 'Обычный'],
        compact ? "p-2 aspect-square" : "p-4 min-h-[120px] aspect-[3/4]",
        isDraggable && "touch-none",
        className
      )}
    >
      {compact && timeLeft !== null && (
        <div className="absolute top-0.5 left-0 right-0 flex flex-col items-center">
          <div className="text-[7px] font-mono text-ink/60 font-bold leading-none" title="Время до распада">
            {formatTime(timeLeft)}
          </div>
        </div>
      )}

      <div className={cn(
        "mb-1 flex items-center justify-center rounded-full border border-sepia/20 bg-white/30 shadow-inner", 
        compact ? "w-8 h-8 text-lg" : "w-16 h-16 text-4xl"
      )}>
        <span className="drop-shadow-[0_0_1px_rgba(0,0,0,0.5)]">{element.icon || '❓'}</span>
      </div>
      
      <h3 className={cn(
        "font-gothic tracking-widest uppercase leading-tight px-1", 
        compact ? "text-[7px]" : "text-[9px] md:text-xs"
      )}>
        {element.name || 'Неизвестно'}
      </h3>

      {compact && (
        <div className="absolute bottom-0.5 left-0 right-0 flex flex-col items-center">
          <div className="w-8 h-1 bg-sepia/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gold" 
              style={{ width: `${element.stability ?? 100}%` }}
            />
          </div>
        </div>
      )}
      
      {!compact && (
        <>
          <div className="mt-2 text-[8px] uppercase tracking-[0.2em] font-bold opacity-40">
            {element.rarity || 'Обычный'}
          </div>
          
          {/* Counters */}
          <div className="flex justify-between w-full mt-2 px-1 text-[12px] font-mono text-ink font-black">
            <div className="flex flex-col items-start gap-0.5">
              <span className={cn((element.temperature ?? 0) > 100 ? "text-red-600" : (element.temperature ?? 0) < 0 ? "text-blue-600" : "")}>
                {element.temperature ?? 0}°C
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span>
                {element.stability ?? 100}%
              </span>
            </div>
          </div>

          {timeLeft !== null && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] font-mono text-ink/60 font-bold uppercase tracking-widest">
              Цикл: {formatTime(timeLeft)}
            </div>
          )}

          {/* Stability Bar */}
          <div className="mt-1 w-full h-1 bg-sepia/10 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${element.stability ?? 100}%` }}
              className={cn(
                "h-full transition-colors duration-500",
                (element.stability ?? 100) < 30 ? "bg-red-500" : (element.stability ?? 100) < 70 ? "bg-orange-400" : "bg-gold"
              )}
            />
          </div>
        </>
      )}

      {/* Reality Level Indicator */}
      <div className="absolute top-1 right-1 flex gap-0.5">
        {Array.from({ length: element.realityLevel ?? 1 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-gold/60" />
        ))}
      </div>

      {/* Law Badges */}
      <div className="absolute top-1 left-1 flex flex-col gap-1 opacity-40">
        {(element.temperature ?? 0) > 500 && (
          <span title="Закон Температуры">
            <Thermometer size={8} className="text-gold" />
          </span>
        )}
        {element.essences?.some(e => ['void', 'creation'].includes(e)) && (
          <span title="Закон Противоположностей">
            <Contrast size={8} className="text-gold" />
          </span>
        )}
        {element.essences?.includes('life') && (
          <span title="Закон Жизни">
            <Leaf size={8} className="text-gold" />
          </span>
        )}
        {(element.complexity ?? 0) > 5 && (
          <span title="Закон Времени">
            <Hourglass size={8} className="text-gold" />
          </span>
        )}
      </div>

      {/* Essence Indicators */}
      {element.essences && element.essences.length > 0 && (
        <div className="absolute bottom-1 left-1 flex gap-1">
          {element.essences.slice(0, 3).map((ess, i) => (
            <div 
              key={i} 
              className={cn(
                "w-2 h-2 rounded-full flex items-center justify-center text-[5px] text-white font-bold",
                ess === 'life' && "bg-green-500",
                ess === 'death' && "bg-gray-800",
                ess === 'chaos' && "bg-purple-500",
                ess === 'order' && "bg-blue-500",
                ess === 'void' && "bg-black",
                ess === 'creation' && "bg-yellow-400",
                ess === 'destruction' && "bg-red-600"
              )} 
              title={translateEssence(ess)}
            >
              {ess[0].toUpperCase()}
            </div>
          ))}
        </div>
      )}
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-sepia/40" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-sepia/40" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-sepia/40" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-sepia/40" />
    </motion.div>
  );
};
