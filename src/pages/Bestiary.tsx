import React, { useState } from 'react';
import { AlchemyElement, Rarity, ElementType } from '../types';
import { ElementCard } from '../components/ElementCard';
import { ElementDetailsModal } from '../components/ElementDetailsModal';
import { Search, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_ELEMENTS } from '../constants';

interface BestiaryProps {
  elements: AlchemyElement[];
  onDelete: (id: string) => void;
  onSelectElement: (element: AlchemyElement) => void;
}

export const Bestiary: React.FC<BestiaryProps> = ({ elements, onDelete, onSelectElement }) => {
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<ElementType | 'All'>('All');

  const [elementToDelete, setElementToDelete] = useState<string | null>(null);

  const filteredElements = elements.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesRarity = rarityFilter === 'All' || e.rarity === rarityFilter;
    const matchesType = typeFilter === 'All' || e.type === typeFilter;
    return matchesSearch && matchesRarity && matchesType;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between parchment-card p-6 bg-sepia/[0.02]">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sepia/40" size={18} />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-transparent border-b border-sepia/20 focus:border-gold outline-none text-base font-serif italic"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sepia/40 hover:text-sepia"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-center lg:justify-end">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-sepia/40 font-bold ml-1">Редкость</span>
            <select 
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value as any)}
              className="bg-parchment border border-sepia/20 rounded px-3 py-2 text-sm outline-none focus:border-gold min-w-[140px]"
            >
              <option value="All">Все редкости</option>
              <option value="Обычный">Обычный</option>
              <option value="Редкий">Редкий</option>
              <option value="Эпический">Эпический</option>
              <option value="Легендарный">Легендарный</option>
              <option value="Запретный">Запретный</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-sepia/40 font-bold ml-1">Тип</span>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-parchment border border-sepia/20 rounded px-3 py-2 text-sm outline-none focus:border-gold min-w-[140px]"
            >
              <option value="All">Все типы</option>
              <option value="Материя">Материя</option>
              <option value="Энергия">Энергия</option>
              <option value="Гибрид">Гибрид</option>
              <option value="Аномалия">Аномалия</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredElements.map((element) => (
          <div key={element.id} className="relative group">
            <ElementCard 
              element={element} 
              onClick={() => onSelectElement(element)}
              className="h-full"
            />
            {!INITIAL_ELEMENTS.some(ie => ie.id === element.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setElementToDelete(element.id);
                }}
                className="absolute top-2 right-2 p-2 bg-red-900/10 text-red-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/20 z-20"
                title="Удалить элемент"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredElements.length === 0 && (
        <div className="text-center py-32 opacity-40 italic font-serif text-xl">
          Сущности не найдены в древних свитках...
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {elementToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md"
            onClick={() => setElementToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="parchment-card max-w-sm w-full p-8 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-red-900/10 flex items-center justify-center text-red-900 mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="font-gothic text-xl text-sepia mb-2 uppercase tracking-widest">Удалить запись?</h3>
              <p className="text-sm text-sepia/60 mb-8 italic">
                Вы уверены, что хотите стереть знания об этом элементе из древних свитков?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setElementToDelete(null)}
                  className="flex-1 py-3 border border-sepia/20 text-sepia hover:bg-sepia/5 transition-all rounded font-bold uppercase tracking-widest text-[10px]"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    onDelete(elementToDelete);
                    setElementToDelete(null);
                  }}
                  className="flex-1 py-3 bg-red-900 text-white hover:bg-red-800 transition-all rounded font-bold uppercase tracking-widest text-[10px] shadow-lg"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ElementDetailsModal is now handled globally in App.tsx */}
    </motion.div>
  );
};
