'use client';

import { useState } from 'react';

interface PillRankingQuestionProps {
  question: string;
  items: string[];
  value: string[];
  onChange: (newOrder: string[]) => void;
  helpText?: string;
}

export default function PillRankingQuestion({
  question,
  items,
  value,
  onChange,
  helpText,
}: PillRankingQuestionProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  const handleClick = (item: string) => {
    const currentIndex = value.indexOf(item);
    
    if (currentIndex === -1) {
      // Item não está na lista selecionada, adiciona no final
      onChange([...value, item]);
    } else {
      // Item já está selecionado, remove
      const newValue = value.filter((v) => v !== item);
      onChange(newValue);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const draggedIndex = value.indexOf(draggedItem);
    if (draggedIndex === -1) return;
    
    const newValue = [...value];
    newValue.splice(draggedIndex, 1);
    newValue.splice(targetIndex, 0, draggedItem);
    
    onChange(newValue);
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const getPosition = (item: string) => {
    const index = value.indexOf(item);
    return index === -1 ? null : index + 1;
  };

  const isSelected = (item: string) => value.includes(item);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-medium text-gray-900 mb-2">{question}</p>
        {helpText && (
          <p className="text-sm text-gray-600 mb-4">{helpText}</p>
        )}
      </div>

      {/* Pills não selecionadas */}
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const selected = isSelected(item);
          
          if (selected) return null; // Não mostra aqui se já está selecionado
          
          return (
            <button
              key={item}
              type="button"
              onClick={() => handleClick(item)}
              className="px-4 py-2.5 rounded-full font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Pills selecionadas (draggable) */}
      {value.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-3">
            📌 Selecionados ({value.length}) — arrasta para reordenar:
          </p>
          <div className="flex flex-wrap gap-3">
            {value.map((item, index) => {
              const isDragging = draggedItem === item;
              const isDraggedOver = draggedOverIndex === index;

              return (
                <div
                  key={item}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    relative px-5 py-3 rounded-full font-medium transition-all cursor-grab active:cursor-grabbing
                    ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
                    ${isDraggedOver ? 'ring-4 ring-blue-400 scale-105 translate-y-0.5' : ''}
                    bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl
                  `}
                >
                  {/* Conteúdo principal com bolinha do número antes da mão */}
                  <span className="inline-flex items-center gap-2 select-none">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-800 text-xs font-bold shadow-sm">
                      {index + 1}
                    </span>
                    <span>✋</span>
                    <span>{item}</span>
                  </span>

                  {/* Cruz discreta no canto superior direito */}
                  <button
                    type="button"
                    onClick={() => handleClick(item)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500/80 text-white flex items-center justify-center text-xs font-bold shadow-sm hover:bg-blue-400 hover:scale-110 transition-transform"
                    title="Remover"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
