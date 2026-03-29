import React from 'react';
import { AlchemyElement } from '../types';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ChronicleProps {
  history: Array<{
    elementA: AlchemyElement;
    elementB: AlchemyElement;
    result: AlchemyElement;
    timestamp: number;
    isNew: boolean;
  }>;
}

export const Chronicle: React.FC<ChronicleProps> = ({ history }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-4"
    >
      <h2 className="text-2xl mb-4">Хроника Трансмутаций</h2>
      <div className="space-y-4">
        {history.map((entry, i) => (
          <motion.div
            key={entry.timestamp + i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="parchment-card p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-sepia/60 w-12">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{entry.elementA.name}</span>
                <span className="text-sepia/30">+</span>
                <span className="text-sm font-bold">{entry.elementB.name}</span>
              </div>
            </div>

            <ArrowRight size={16} className="text-sepia/30" />

            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="text-right">
                <div className="text-sm font-gothic text-gold flex items-center gap-1 justify-end">
                  {entry.isNew && <Sparkles size={12} />}
                  {entry.result.name}
                </div>
                <div className="text-[10px] uppercase opacity-50">{entry.result.rarity}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-sepia/5 border border-sepia/10 flex items-center justify-center">
                 <div className="w-2 h-2 rounded-full bg-gold" />
              </div>
            </div>
          </motion.div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-20 opacity-40 italic">
            Эксперименты еще не записаны.
          </div>
        )}
      </div>
    </motion.div>
  );
};
